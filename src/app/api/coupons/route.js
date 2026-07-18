import clientPromise from "../../../lib/mongodb";

const SUPPORTED_COUPON_TYPES = [
  "percentage",
  "fixed",
  "free_shipping",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCouponCode(value) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, "");
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

function normalizeInteger(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(0, Math.floor(amount));
}

function normalizeCouponType(value) {
  const type = normalizeText(value).toLowerCase();

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

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = normalizeText(
    value
  ).toLowerCase();

  if (
    normalizedValue === "false" ||
    normalizedValue === "inactive" ||
    normalizedValue === "0"
  ) {
    return false;
  }

  if (
    normalizedValue === "true" ||
    normalizedValue === "active" ||
    normalizedValue === "1"
  ) {
    return true;
  }

  return fallback;
}

function parseOptionalDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

async function findExistingCoupon(
  collection,
  couponCode
) {
  return collection.findOne({
    $or: [
      {
        code: couponCode,
      },
      {
        normalizedCode: couponCode,
      },
      {
        code: {
          $regex: `^${escapeRegex(
            couponCode
          )}$`,
          $options: "i",
        },
      },
    ],
  });
}

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const coupons = await db
      .collection("coupons")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    return Response.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error(
      "GET Coupons Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to fetch coupons.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const coupon = await request.json();

    const code = normalizeCouponCode(
      coupon.code
    );

    const name = normalizeText(coupon.name);

    const description = normalizeText(
      coupon.description
    );

    const type = normalizeCouponType(
      coupon.type || coupon.discountType
    );

    if (!code) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon code is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (code.length < 3) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon code must contain at least 3 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (code.length > 50) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon code cannot exceed 50 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !type ||
      !SUPPORTED_COUPON_TYPES.includes(type)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please select a valid coupon type.",
        },
        {
          status: 400,
        }
      );
    }

    const value =
      type === "free_shipping"
        ? 0
        : normalizeMoney(
            coupon.value ??
              coupon.discountValue ??
              coupon.amount
          );

    if (
      type !== "free_shipping" &&
      value <= 0
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Discount value must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      type === "percentage" &&
      value > 100
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Percentage discount cannot exceed 100%.",
        },
        {
          status: 400,
        }
      );
    }

    const minimumOrder = normalizeMoney(
      coupon.minimumOrder ??
        coupon.minimumSpend ??
        coupon.minOrderAmount
    );

    const maximumDiscount =
      type === "percentage"
        ? normalizeMoney(
            coupon.maximumDiscount ??
              coupon.maxDiscount
          )
        : 0;

    const usageLimit = normalizeInteger(
      coupon.usageLimit ??
        coupon.maxUses
    );

    const requestedUsageCount =
      normalizeInteger(
        coupon.usageCount ??
          coupon.usedCount
      );

    const startsAtValue =
      coupon.startsAt ??
      coupon.startDate ??
      null;

    const expiresAtValue =
      coupon.expiresAt ??
      coupon.expiryDate ??
      null;

    const startsAt = parseOptionalDate(
      startsAtValue
    );

    const expiresAt = parseOptionalDate(
      expiresAtValue
    );

    if (startsAtValue && !startsAt) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon start date is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (expiresAtValue && !expiresAt) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon expiry date is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startsAt &&
      expiresAt &&
      expiresAt <= startsAt
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon expiry date must be later than its start date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      usageLimit > 0 &&
      requestedUsageCount > usageLimit
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Coupon usage count cannot exceed its usage limit.",
        },
        {
          status: 400,
        }
      );
    }

    const active = normalizeBoolean(
      coupon.active ?? coupon.status,
      true
    );

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const couponsCollection =
      db.collection("coupons");

    const existingCoupon =
      await findExistingCoupon(
        couponsCollection,
        code
      );

    if (existingCoupon) {
      return Response.json(
        {
          success: false,
          message:
            "A coupon with this code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const now = new Date();

    const newCoupon = {
      code,
      normalizedCode: code,
      name,
      description,
      type,
      value,
      minimumOrder,
      maximumDiscount,
      startsAt,
      expiresAt,
      usageLimit,
      usageCount: requestedUsageCount,
      active,
      status: active
        ? "active"
        : "inactive",
      createdAt: now,
      updatedAt: now,
    };

    const result =
      await couponsCollection.insertOne(
        newCoupon
      );

    return Response.json(
      {
        success: true,
        message:
          "Coupon created successfully.",
        coupon: {
          ...newCoupon,
          _id: result.insertedId,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST Coupon Error:",
      error
    );

    if (error?.code === 11000) {
      return Response.json(
        {
          success: false,
          message:
            "A coupon with this code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        success: false,
        message:
          "Failed to create coupon.",
      },
      {
        status: 500,
      }
    );
  }
}