import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";

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
    type === "fixed-amount" ||
    type === "amount"
  ) {
    return "fixed";
  }

  if (
    type === "free_shipping" ||
    type === "free-shipping" ||
    type === "free_delivery" ||
    type === "shipping"
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

function createCouponFilter(identifier) {
  const value = normalizeText(identifier);

  if (!value) {
    return null;
  }

  const filters = [
    {
      code: value.toUpperCase(),
    },
    {
      normalizedCode: value.toUpperCase(),
    },
    {
      code: {
        $regex: `^${escapeRegex(value)}$`,
        $options: "i",
      },
    },
  ];

  if (ObjectId.isValid(value)) {
    filters.unshift({
      _id: new ObjectId(value),
    });
  }

  return {
    $or: filters,
  };
}

async function getCouponCollection() {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  return db.collection("coupons");
}

async function resolveCouponId(context) {
  const params = await context.params;

  return normalizeText(params?.id);
}

async function findDuplicateCoupon(
  collection,
  code,
  currentCouponId
) {
  const duplicateFilter = {
    $or: [
      {
        code,
      },
      {
        normalizedCode: code,
      },
      {
        code: {
          $regex: `^${escapeRegex(code)}$`,
          $options: "i",
        },
      },
    ],
  };

  if (ObjectId.isValid(currentCouponId)) {
    duplicateFilter._id = {
      $ne: new ObjectId(currentCouponId),
    };
  }

  return collection.findOne(duplicateFilter);
}

export async function GET(request, context) {
  try {
    const id = await resolveCouponId(context);
    const couponFilter = createCouponFilter(id);

    if (!couponFilter) {
      return Response.json(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        {
          status: 400,
        }
      );
    }

    const couponsCollection =
      await getCouponCollection();

    const coupon =
      await couponsCollection.findOne(
        couponFilter
      );

    if (!coupon) {
      return Response.json(
        {
          success: false,
          message: "Coupon not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error(
      "GET Coupon Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to fetch coupon.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const id = await resolveCouponId(context);
    const couponFilter = createCouponFilter(id);

    if (!couponFilter) {
      return Response.json(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        {
          status: 400,
        }
      );
    }

    const couponsCollection =
      await getCouponCollection();

    const existingCoupon =
      await couponsCollection.findOne(
        couponFilter
      );

    if (!existingCoupon) {
      return Response.json(
        {
          success: false,
          message: "Coupon not found.",
        },
        {
          status: 404,
        }
      );
    }

    const coupon = await request.json();

    const isToggleOnly =
      Object.prototype.hasOwnProperty.call(
        coupon,
        "isActive"
      ) &&
      Object.keys(coupon).every((key) =>
        ["isActive", "active", "status"].includes(
          key
        )
      );

    if (isToggleOnly) {
      const active = normalizeBoolean(
        coupon.isActive ??
          coupon.active ??
          coupon.status,
        existingCoupon.active !== false
      );

      const now = new Date();

      await couponsCollection.updateOne(
        {
          _id: existingCoupon._id,
        },
        {
          $set: {
            active,
            isActive: active,
            status: active
              ? "active"
              : "inactive",
            updatedAt: now,
          },
        }
      );

      const updatedCoupon =
        await couponsCollection.findOne({
          _id: existingCoupon._id,
        });

      return Response.json({
        success: true,
        message: active
          ? "Coupon activated successfully."
          : "Coupon deactivated successfully.",
        coupon: updatedCoupon,
      });
    }

    const code = normalizeCouponCode(
      coupon.code ?? existingCoupon.code
    );

    const name = normalizeText(
      coupon.name ?? existingCoupon.name
    );

    const description = normalizeText(
      coupon.description ??
        existingCoupon.description
    );

    const type = normalizeCouponType(
      coupon.type ??
        coupon.discountType ??
        existingCoupon.type
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
              coupon.amount ??
              existingCoupon.value
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
        coupon.minOrderAmount ??
        existingCoupon.minimumOrder
    );

    const maximumDiscount =
      type === "percentage"
        ? normalizeMoney(
            coupon.maximumDiscount ??
              coupon.maxDiscount ??
              existingCoupon.maximumDiscount
          )
        : 0;

    const usageLimit = normalizeInteger(
      coupon.usageLimit ??
        coupon.maxUses ??
        existingCoupon.usageLimit
    );

    const usageCount = normalizeInteger(
      coupon.usageCount ??
        coupon.usedCount ??
        existingCoupon.usageCount
    );

    const startsAtValue =
      coupon.startsAt ??
      coupon.startDate ??
      existingCoupon.startsAt ??
      existingCoupon.startDate ??
      null;

    const expiresAtValue =
      coupon.expiresAt ??
      coupon.expiryDate ??
      existingCoupon.expiresAt ??
      existingCoupon.expiryDate ??
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
      usageCount > usageLimit
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
      coupon.isActive ??
        coupon.active ??
        coupon.status,
      existingCoupon.active ??
        existingCoupon.isActive ??
        true
    );

    const duplicateCoupon =
      await findDuplicateCoupon(
        couponsCollection,
        code,
        String(existingCoupon._id)
      );

    if (duplicateCoupon) {
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

    const updateData = {
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
      startDate: startsAt,
      expiryDate: expiresAt,
      usageLimit,
      usageCount,
      active,
      isActive: active,
      status: active
        ? "active"
        : "inactive",
      updatedAt: now,
    };

    await couponsCollection.updateOne(
      {
        _id: existingCoupon._id,
      },
      {
        $set: updateData,
      }
    );

    const updatedCoupon =
      await couponsCollection.findOne({
        _id: existingCoupon._id,
      });

    return Response.json({
      success: true,
      message:
        "Coupon updated successfully.",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error(
      "PATCH Coupon Error:",
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
          "Failed to update coupon.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request,
  context
) {
  try {
    const id = await resolveCouponId(context);
    const couponFilter = createCouponFilter(id);

    if (!couponFilter) {
      return Response.json(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        {
          status: 400,
        }
      );
    }

    const couponsCollection =
      await getCouponCollection();

    const existingCoupon =
      await couponsCollection.findOne(
        couponFilter
      );

    if (!existingCoupon) {
      return Response.json(
        {
          success: false,
          message: "Coupon not found.",
        },
        {
          status: 404,
        }
      );
    }

    await couponsCollection.deleteOne({
      _id: existingCoupon._id,
    });

    return Response.json({
      success: true,
      message:
        "Coupon deleted successfully.",
      deletedCoupon: {
        _id: existingCoupon._id,
        code: existingCoupon.code,
        name: existingCoupon.name,
      },
    });
  } catch (error) {
    console.error(
      "DELETE Coupon Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to delete coupon.",
      },
      {
        status: 500,
      }
    );
  }
}