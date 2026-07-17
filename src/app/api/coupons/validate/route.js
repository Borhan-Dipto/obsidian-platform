import clientPromise from "../../../../lib/mongodb";

const DEFAULT_DELIVERY_CHARGES = {
  insideDhaka: 80,
  outsideDhaka: 130,
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCouponCode(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(amount * 100) / 100
  );
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function getCouponType(coupon) {
  const type = normalizeText(
    coupon.type || coupon.discountType
  ).toLowerCase();

  if (
    type === "percentage" ||
    type === "percent"
  ) {
    return "percentage";
  }

  if (
    type === "fixed" ||
    type === "fixed_amount" ||
    type === "amount"
  ) {
    return "fixed";
  }

  if (
    type === "free_shipping" ||
    type === "free_delivery"
  ) {
    return "free_shipping";
  }

  return "";
}

function isCouponActive(coupon) {
  if (coupon.active === false) {
    return false;
  }

  if (
    normalizeText(coupon.status).toLowerCase() ===
    "inactive"
  ) {
    return false;
  }

  return true;
}

function getCouponStartDate(coupon) {
  return coupon.startsAt || coupon.startDate || null;
}

function getCouponExpiryDate(coupon) {
  return coupon.expiresAt || coupon.expiryDate || null;
}

function getCouponMinimumOrder(coupon) {
  return normalizeMoney(
    coupon.minimumOrder ??
      coupon.minimumSpend ??
      coupon.minOrderAmount ??
      0
  );
}

function getCouponMaximumDiscount(coupon) {
  return normalizeMoney(
    coupon.maximumDiscount ??
      coupon.maxDiscount ??
      0
  );
}

function getCouponUsageLimit(coupon) {
  return Math.max(
    0,
    Math.floor(
      Number(
        coupon.usageLimit ??
          coupon.maxUses ??
          0
      ) || 0
    )
  );
}

function getCouponUsageCount(coupon) {
  return Math.max(
    0,
    Math.floor(
      Number(
        coupon.usageCount ??
          coupon.usedCount ??
          0
      ) || 0
    )
  );
}

function getCouponValue(coupon) {
  return normalizeMoney(
    coupon.value ??
      coupon.discountValue ??
      coupon.amount ??
      0
  );
}

async function getStoreSettings(db) {
  try {
    const settingsCollection =
      db.collection("settings");

    const settingsDocument =
      (await settingsCollection.findOne({
        key: "store-settings",
      })) ||
      (await settingsCollection.findOne({
        key: "store_settings",
      })) ||
      (await settingsCollection.findOne({
        key: "settings",
      })) ||
      (await settingsCollection.findOne({}));

    if (!settingsDocument) {
      return {
        delivery: DEFAULT_DELIVERY_CHARGES,
      };
    }

    const settings =
      settingsDocument.settings ||
      settingsDocument.value ||
      settingsDocument;

    return {
      ...settings,

      delivery: {
        insideDhaka: normalizeMoney(
          settings.delivery?.insideDhaka ??
            DEFAULT_DELIVERY_CHARGES.insideDhaka
        ),

        outsideDhaka: normalizeMoney(
          settings.delivery?.outsideDhaka ??
            DEFAULT_DELIVERY_CHARGES.outsideDhaka
        ),
      },
    };
  } catch (error) {
    console.error(
      "Coupon Settings Error:",
      error
    );

    return {
      delivery: DEFAULT_DELIVERY_CHARGES,
    };
  }
}

function calculateDeliveryCharge(
  deliveryArea,
  settings
) {
  if (deliveryArea === "outside_dhaka") {
    return normalizeMoney(
      settings.delivery?.outsideDhaka ??
        DEFAULT_DELIVERY_CHARGES.outsideDhaka
    );
  }

  return normalizeMoney(
    settings.delivery?.insideDhaka ??
      DEFAULT_DELIVERY_CHARGES.insideDhaka
  );
}

async function findCoupon(db, couponCode) {
  return db.collection("coupons").findOne({
    $or: [
      {
        code: couponCode,
      },
      {
        normalizedCode: couponCode,
      },
      {
        code: {
          $regex: `^${escapeRegex(couponCode)}$`,
          $options: "i",
        },
      },
    ],
  });
}

function validateAndCalculateCoupon({
  coupon,
  subtotal,
  deliveryCharge,
}) {
  if (!coupon) {
    return {
      valid: false,
      message: "Coupon code was not found.",
    };
  }

  if (!isCouponActive(coupon)) {
    return {
      valid: false,
      message:
        "This coupon is currently inactive.",
    };
  }

  const now = new Date();

  const startDateValue =
    getCouponStartDate(coupon);

  if (startDateValue) {
    const startDate = new Date(startDateValue);

    if (
      !Number.isNaN(startDate.getTime()) &&
      now < startDate
    ) {
      return {
        valid: false,
        message:
          "This coupon is not active yet.",
      };
    }
  }

  const expiryDateValue =
    getCouponExpiryDate(coupon);

  if (expiryDateValue) {
    const expiryDate = new Date(
      expiryDateValue
    );

    if (
      !Number.isNaN(expiryDate.getTime()) &&
      now > expiryDate
    ) {
      return {
        valid: false,
        message:
          "This coupon has expired.",
      };
    }
  }

  const usageLimit =
    getCouponUsageLimit(coupon);

  const usageCount =
    getCouponUsageCount(coupon);

  if (
    usageLimit > 0 &&
    usageCount >= usageLimit
  ) {
    return {
      valid: false,
      message:
        "This coupon has reached its usage limit.",
    };
  }

  const minimumOrder =
    getCouponMinimumOrder(coupon);

  if (subtotal < minimumOrder) {
    return {
      valid: false,
      message: `A minimum order of ৳${minimumOrder} is required for this coupon.`,
    };
  }

  const couponType = getCouponType(coupon);
  const couponValue = getCouponValue(coupon);
  const maximumDiscount =
    getCouponMaximumDiscount(coupon);

  let discountAmount = 0;

  if (couponType === "percentage") {
    if (
      couponValue <= 0 ||
      couponValue > 100
    ) {
      return {
        valid: false,
        message:
          "This coupon has an invalid discount value.",
      };
    }

    discountAmount =
      subtotal * (couponValue / 100);

    if (
      maximumDiscount > 0 &&
      discountAmount > maximumDiscount
    ) {
      discountAmount = maximumDiscount;
    }
  } else if (couponType === "fixed") {
    if (couponValue <= 0) {
      return {
        valid: false,
        message:
          "This coupon has an invalid discount value.",
      };
    }

    discountAmount = Math.min(
      couponValue,
      subtotal
    );
  } else if (
    couponType === "free_shipping"
  ) {
    discountAmount = deliveryCharge;
  } else {
    return {
      valid: false,
      message:
        "This coupon type is not supported.",
    };
  }

  discountAmount = normalizeMoney(
    Math.min(
      discountAmount,
      subtotal + deliveryCharge
    )
  );

  if (discountAmount <= 0) {
    return {
      valid: false,
      message:
        "This coupon cannot be applied to this order.",
    };
  }

  return {
    valid: true,
    couponType,
    couponValue,
    minimumOrder,
    maximumDiscount,
    discountAmount,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();

    const couponCode = normalizeCouponCode(
      body.couponCode || body.code
    );

    const subtotal = normalizeMoney(
      body.subtotal
    );

    const deliveryArea =
      body.deliveryArea === "outside_dhaka"
        ? "outside_dhaka"
        : "inside_dhaka";

    if (!couponCode) {
      return Response.json(
        {
          success: false,
          message:
            "Please enter a coupon code.",
        },
        {
          status: 400,
        }
      );
    }

    if (subtotal <= 0) {
      return Response.json(
        {
          success: false,
          message:
            "Your order subtotal is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const settings =
      await getStoreSettings(db);

    const deliveryCharge =
      calculateDeliveryCharge(
        deliveryArea,
        settings
      );

    const coupon = await findCoupon(
      db,
      couponCode
    );

    const result =
      validateAndCalculateCoupon({
        coupon,
        subtotal,
        deliveryCharge,
      });

    if (!result.valid) {
      return Response.json(
        {
          success: false,
          valid: false,
          message: result.message,
        },
        {
          status: 400,
        }
      );
    }

    const total = normalizeMoney(
      Math.max(
        0,
        subtotal +
          deliveryCharge -
          result.discountAmount
      )
    );

    return Response.json({
      success: true,
      valid: true,
      message: "Coupon applied successfully.",

      coupon: {
        code: normalizeCouponCode(
          coupon.code || couponCode
        ),
        type: result.couponType,
        value: result.couponValue,
      },

      pricing: {
        subtotal,
        deliveryCharge,
        discountAmount:
          result.discountAmount,
        total,
      },
    });
  } catch (error) {
    console.error(
      "Coupon Validation Error:",
      error
    );

    return Response.json(
      {
        success: false,
        valid: false,
        message:
          "Coupon could not be validated.",
      },
      {
        status: 500,
      }
    );
  }
}