import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORTED_COUPON_TYPES = new Set([
  "percentage",
  "fixed",
  "free_shipping",
]);

const MAX_REQUEST_SIZE = 100_000;
const MAX_MONEY_VALUE = 10_000_000;
const MAX_USAGE_LIMIT = 10_000_000;
const MAX_DISPLAY_ORDER = 10_000;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim();
}

function normalizeCouponCode(value) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeCouponType(value) {
  const type = normalizeText(
    value
  ).toLowerCase();

  if (
    ["percentage", "percent"].includes(type)
  ) {
    return "percentage";
  }

  if (
    [
      "fixed",
      "fixed_amount",
      "fixed-amount",
      "amount",
    ].includes(type)
  ) {
    return "fixed";
  }

  if (
    [
      "free_shipping",
      "free-shipping",
      "free_delivery",
      "shipping",
    ].includes(type)
  ) {
    return "free_shipping";
  }

  return "";
}

function normalizeBoolean(
  value,
  fallback = true
) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue =
    normalizeText(value).toLowerCase();

  if (
    [
      "false",
      "inactive",
      "0",
      "disabled",
      "no",
    ].includes(normalizedValue)
  ) {
    return false;
  }

  if (
    [
      "true",
      "active",
      "1",
      "enabled",
      "yes",
    ].includes(normalizedValue)
  ) {
    return true;
  }

  return fallback;
}

function normalizeUsageCount(coupon) {
  return Math.max(
    0,
    Math.floor(
      Number(
        coupon?.usageCount ??
          coupon?.usedCount ??
          0
      ) || 0
    )
  );
}

function parseMoney(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > MAX_MONEY_VALUE
  ) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return (
    Math.round(amount * 100) / 100
  );
}

function parseUsageLimit(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const amount = Number(value);

  if (
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount > MAX_USAGE_LIMIT
  ) {
    throw new Error(
      "Usage limit is invalid."
    );
  }

  return amount;
}

function parseDisplayOrder(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const displayOrder = Number(value);

  if (
    !Number.isInteger(displayOrder) ||
    displayOrder < 0 ||
    displayOrder > MAX_DISPLAY_ORDER
  ) {
    throw new Error(
      "Display order is invalid."
    );
  }

  return displayOrder;
}

function parseOptionalDate(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return date;
}

function escapeRegex(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function createCouponFilter(identifier) {
  const value = normalizeText(
    identifier
  );

  if (!value) {
    return null;
  }

  const normalizedCode =
    normalizeCouponCode(value);

  const filters = [
    {
      normalizedCode,
    },

    {
      code: normalizedCode,
    },

    {
      code: {
        $regex: `^${escapeRegex(
          value
        )}$`,
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

function createDuplicateCouponFilter(
  code,
  existingCouponId
) {
  return {
    _id: {
      $ne: existingCouponId,
    },

    $or: [
      {
        normalizedCode: code,
      },

      {
        code,
      },

      {
        code: {
          $regex: `^${escapeRegex(
            code
          )}$`,
          $options: "i",
        },
      },
    ],
  };
}

async function resolveCouponId(context) {
  const params = await context.params;

  return normalizeText(params?.id);
}

async function getDatabase() {
  const client = await clientPromise;

  if (
    !client ||
    typeof client.db !== "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  return client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );
}

function serializeCoupon(coupon) {
  if (!coupon) {
    return null;
  }

  const active =
    coupon.active !== false &&
    coupon.isActive !== false &&
    normalizeText(
      coupon.status
    ).toLowerCase() !== "inactive";

  const isPublic =
    coupon.isPublic === true;

  return {
    ...coupon,

    usageCount:
      normalizeUsageCount(coupon),

    active,
    isActive: active,

    status: active
      ? "active"
      : "inactive",

    startsAt:
      coupon.startsAt ||
      coupon.startDate ||
      null,

    expiresAt:
      coupon.expiresAt ||
      coupon.expiryDate ||
      null,

    isPublic,

    promoted:
      isPublic &&
      coupon.promoted === true,

    publicTitle:
      normalizeText(
        coupon.publicTitle
      ) ||
      normalizeText(coupon.name),

    publicDescription:
      normalizeText(
        coupon.publicDescription
      ) ||
      normalizeText(
        coupon.description
      ),

    displayOrder:
      Math.max(
        0,
        Math.floor(
          Number(
            coupon.displayOrder
          ) || 0
        )
      ),
  };
}

export async function GET(
  request,
  context
) {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Admin authentication required.",
        },
        401
      );
    }

    const id =
      await resolveCouponId(context);

    const filter =
      createCouponFilter(id);

    if (!filter) {
      return jsonResponse(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        400
      );
    }

    const database =
      await getDatabase();

    const coupon = await database
      .collection("coupons")
      .findOne(filter);

    if (!coupon) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon not found.",
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      coupon:
        serializeCoupon(coupon),
    });
  } catch (error) {
    console.error(
      "GET Coupon Error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Failed to fetch coupon.",
      },
      500
    );
  }
}

export async function PATCH(
  request,
  context
) {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Admin authentication required.",
        },
        401
      );
    }

    const id =
      await resolveCouponId(context);

    const filter =
      createCouponFilter(id);

    if (!filter) {
      return jsonResponse(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        400
      );
    }

    const contentLength = Number(
      request.headers.get(
        "content-length"
      ) || 0
    );

    if (
      Number.isFinite(
        contentLength
      ) &&
      contentLength > MAX_REQUEST_SIZE
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Request body is too large.",
        },
        413
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        400
      );
    }

    if (!isPlainObject(body)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        400
      );
    }

    const database =
      await getDatabase();

    const collection =
      database.collection(
        "coupons"
      );

    const existingCoupon =
      await collection.findOne(
        filter
      );

    if (!existingCoupon) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon not found.",
        },
        404
      );
    }

    const quickUpdateKeys =
      new Set([
        "active",
        "isActive",
        "status",
        "isPublic",
        "public",
        "promoted",
        "isPromoted",
        "displayOrder",
      ]);

    const bodyKeys =
      Object.keys(body);

    const isQuickUpdate =
      bodyKeys.length > 0 &&
      bodyKeys.every((key) =>
        quickUpdateKeys.has(key)
      );

    if (isQuickUpdate) {
      const active =
        normalizeBoolean(
          body.isActive ??
            body.active ??
            body.status,
          existingCoupon.active !==
            false
        );

      const isPublic =
        normalizeBoolean(
          body.isPublic ??
            body.public,
          existingCoupon.isPublic ===
            true
        );

      const promoted =
        isPublic &&
        normalizeBoolean(
          body.promoted ??
            body.isPromoted,
          existingCoupon.promoted ===
            true
        );

      let displayOrder;

      try {
        displayOrder =
          parseDisplayOrder(
            hasOwn(
              body,
              "displayOrder"
            )
              ? body.displayOrder
              : existingCoupon.displayOrder
          );
      } catch (error) {
        return jsonResponse(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      const now = new Date();

      const updateOperation = {
        $set: {
          active,
          isActive: active,

          status: active
            ? "active"
            : "inactive",

          isPublic,
          promoted,
          displayOrder,
          updatedAt: now,
        },
      };

      if (active) {
        updateOperation.$unset = {
          archivedAt: "",
        };
      }

      await collection.updateOne(
        {
          _id:
            existingCoupon._id,
        },
        updateOperation
      );

      const updatedCoupon =
        await collection.findOne({
          _id:
            existingCoupon._id,
        });

      return jsonResponse({
        success: true,
        message:
          "Coupon settings updated successfully.",

        coupon:
          serializeCoupon(
            updatedCoupon
          ),
      });
    }

    const code =
      normalizeCouponCode(
        body.code ??
          existingCoupon.code
      );

    const name = normalizeText(
      body.name ??
        existingCoupon.name
    );

    const description =
      normalizeText(
        body.description ??
          existingCoupon.description
      );

    const type =
      normalizeCouponType(
        body.type ??
          body.discountType ??
          existingCoupon.type
      );

    if (
      !/^[A-Z0-9][A-Z0-9._-]{2,49}$/.test(
        code
      )
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon code must be 3–50 characters and use only letters, numbers, dots, underscores or hyphens.",
        },
        400
      );
    }

    if (
      !name ||
      name.length > 120
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon name is required and cannot exceed 120 characters.",
        },
        400
      );
    }

    if (
      description.length > 1000
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon description cannot exceed 1000 characters.",
        },
        400
      );
    }

    if (
      !SUPPORTED_COUPON_TYPES.has(
        type
      )
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Please select a valid coupon type.",
        },
        400
      );
    }

    const isPublic =
      normalizeBoolean(
        body.isPublic ??
          body.public,
        existingCoupon.isPublic ===
          true
      );

    const promoted =
      isPublic &&
      normalizeBoolean(
        body.promoted ??
          body.isPromoted,
        existingCoupon.promoted ===
          true
      );

    const publicTitle =
      normalizeText(
        body.publicTitle ??
          body.publicName ??
          existingCoupon.publicTitle
      ) || name;

    const publicDescription =
      normalizeText(
        body.publicDescription ??
          existingCoupon.publicDescription
      ) || description;

    if (
      publicTitle.length > 120
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Public coupon title cannot exceed 120 characters.",
        },
        400
      );
    }

    if (
      publicDescription.length >
      500
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Public coupon description cannot exceed 500 characters.",
        },
        400
      );
    }

    let value;
    let minimumOrder;
    let maximumDiscount;
    let usageLimit;
    let startsAt;
    let expiresAt;
    let displayOrder;

    const rawStartsAt =
      hasOwn(body, "startsAt")
        ? body.startsAt
        : hasOwn(body, "startDate")
          ? body.startDate
          : existingCoupon.startsAt ??
            existingCoupon.startDate;

    const rawExpiresAt =
      hasOwn(body, "expiresAt")
        ? body.expiresAt
        : hasOwn(body, "expiryDate")
          ? body.expiryDate
          : existingCoupon.expiresAt ??
            existingCoupon.expiryDate;

    try {
      value =
        type === "free_shipping"
          ? 0
          : parseMoney(
              body.value ??
                body.discountValue ??
                body.amount ??
                existingCoupon.value,
              "Discount value"
            );

      minimumOrder =
        parseMoney(
          body.minimumOrder ??
            body.minimumSpend ??
            body.minOrderAmount ??
            existingCoupon.minimumOrder,
          "Minimum order"
        );

      maximumDiscount =
        type === "percentage"
          ? parseMoney(
              body.maximumDiscount ??
                body.maxDiscount ??
                existingCoupon.maximumDiscount,
              "Maximum discount"
            )
          : 0;

      usageLimit =
        parseUsageLimit(
          body.usageLimit ??
            body.maxUses ??
            existingCoupon.usageLimit
        );

      startsAt =
        parseOptionalDate(
          rawStartsAt,
          "Coupon start date"
        );

      expiresAt =
        parseOptionalDate(
          rawExpiresAt,
          "Coupon expiry date"
        );

      displayOrder =
        parseDisplayOrder(
          body.displayOrder ??
            existingCoupon.displayOrder
        );
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message:
            error.message,
        },
        400
      );
    }

    if (
      type !== "free_shipping" &&
      value <= 0
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Discount value must be greater than zero.",
        },
        400
      );
    }

    if (
      type === "percentage" &&
      value > 100
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Percentage discount cannot exceed 100%.",
        },
        400
      );
    }

    if (
      startsAt &&
      expiresAt &&
      expiresAt <= startsAt
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon expiry date must be later than its start date.",
        },
        400
      );
    }

    const usageCount =
      normalizeUsageCount(
        existingCoupon
      );

    if (
      usageLimit > 0 &&
      usageCount > usageLimit
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Usage limit cannot be lower than the current usage count.",
        },
        400
      );
    }

    const active =
      normalizeBoolean(
        body.isActive ??
          body.active ??
          body.status,
        existingCoupon.active !==
          false
      );

    const duplicateCoupon =
      await collection.findOne(
        createDuplicateCouponFilter(
          code,
          existingCoupon._id
        )
      );

    if (duplicateCoupon) {
      return jsonResponse(
        {
          success: false,
          message:
            "A coupon with this code already exists.",
        },
        409
      );
    }

    const now = new Date();

    const updateOperation = {
      $set: {
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
        usageCount,

        active,
        isActive: active,

        status: active
          ? "active"
          : "inactive",

        isPublic,
        promoted,
        publicTitle,
        publicDescription,
        displayOrder,

        updatedAt: now,
      },

      $unset: {
        startDate: "",
        expiryDate: "",
        usedCount: "",
        endsAt: "",
      },
    };

    if (active) {
      updateOperation.$unset.archivedAt =
        "";
    }

    await collection.updateOne(
      {
        _id: existingCoupon._id,
      },
      updateOperation
    );

    const updatedCoupon =
      await collection.findOne({
        _id: existingCoupon._id,
      });

    return jsonResponse({
      success: true,
      message:
        "Coupon updated successfully.",

      coupon:
        serializeCoupon(
          updatedCoupon
        ),
    });
  } catch (error) {
    console.error(
      "PATCH Coupon Error:",
      error
    );

    if (error?.code === 11000) {
      return jsonResponse(
        {
          success: false,
          message:
            "A coupon with this code already exists.",
        },
        409
      );
    }

    return jsonResponse(
      {
        success: false,
        message:
          "Failed to update coupon.",
      },
      500
    );
  }
}

export async function DELETE(
  request,
  context
) {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Admin authentication required.",
        },
        401
      );
    }

    const id =
      await resolveCouponId(context);

    const filter =
      createCouponFilter(id);

    if (!filter) {
      return jsonResponse(
        {
          success: false,
          message:
            "A valid coupon identifier is required.",
        },
        400
      );
    }

    const database =
      await getDatabase();

    const collection =
      database.collection(
        "coupons"
      );

    const existingCoupon =
      await collection.findOne(
        filter
      );

    if (!existingCoupon) {
      return jsonResponse(
        {
          success: false,
          message:
            "Coupon not found.",
        },
        404
      );
    }

    const couponCode =
      normalizeCouponCode(
        existingCoupon.code ||
          existingCoupon.normalizedCode
      );

    const usageCount =
      normalizeUsageCount(
        existingCoupon
      );

    const linkedOrderCount =
      couponCode
        ? await database
            .collection("orders")
            .countDocuments({
              "coupon.code":
                couponCode,
            })
        : 0;

    if (
      usageCount > 0 ||
      linkedOrderCount > 0
    ) {
      const now = new Date();

      await collection.updateOne(
        {
          _id:
            existingCoupon._id,
        },
        {
          $set: {
            active: false,
            isActive: false,
            status: "inactive",

            isPublic: false,
            promoted: false,

            archivedAt: now,
            updatedAt: now,
          },
        }
      );

      return jsonResponse({
        success: true,
        archived: true,
        deleted: false,

        message:
          "Used coupon was archived instead of permanently deleted.",
      });
    }

    await collection.deleteOne({
      _id: existingCoupon._id,
    });

    return jsonResponse({
      success: true,
      archived: false,
      deleted: true,

      message:
        "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE Coupon Error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Failed to delete coupon.",
      },
      500
    );
  }
}

export const PUT = PATCH;