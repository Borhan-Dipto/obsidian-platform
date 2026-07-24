import clientPromise from "../../../lib/mongodb";

import {
  requireAdminApiPermission,
} from "../../../lib/adminApiAuthorization";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const SUPPORTED_COUPON_TYPES =
  new Set([
    "percentage",
    "fixed",
    "free_shipping",
  ]);

const MAX_REQUEST_SIZE =
  100_000;

const MAX_MONEY_VALUE =
  10_000_000;

const MAX_USAGE_LIMIT =
  10_000_000;

const MAX_DISPLAY_ORDER =
  10_000;

const MAX_PUBLIC_COUPONS =
  24;

function jsonResponse(
  body,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function isPlainObject(
  value
) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .normalize("NFKC")
    .trim();
}

function normalizeCouponCode(
  value
) {
  return normalizeText(
    value
  )
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeCouponType(
  value
) {
  const type =
    normalizeText(
      value
    ).toLowerCase();

  if (
    [
      "percentage",
      "percent",
    ].includes(type)
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
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalizedValue =
    normalizeText(
      value
    ).toLowerCase();

  if (
    [
      "false",
      "inactive",
      "0",
      "disabled",
      "no",
    ].includes(
      normalizedValue
    )
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
    ].includes(
      normalizedValue
    )
  ) {
    return true;
  }

  return fallback;
}

function parseMoney(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount
    ) ||
    amount < 0 ||
    amount >
      MAX_MONEY_VALUE
  ) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return (
    Math.round(
      amount * 100
    ) / 100
  );
}

function parseUsageLimit(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const amount =
    Number(value);

  if (
    !Number.isInteger(
      amount
    ) ||
    amount < 0 ||
    amount >
      MAX_USAGE_LIMIT
  ) {
    throw new Error(
      "Usage limit is invalid."
    );
  }

  return amount;
}

function parseDisplayOrder(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const displayOrder =
    Number(value);

  if (
    !Number.isInteger(
      displayOrder
    ) ||
    displayOrder < 0 ||
    displayOrder >
      MAX_DISPLAY_ORDER
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
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return date;
}

function serializePublicCoupon(
  coupon
) {
  const publicTitle =
    normalizeText(
      coupon.publicTitle
    ) ||
    normalizeText(
      coupon.name
    ) ||
    normalizeText(
      coupon.code
    );

  const publicDescription =
    normalizeText(
      coupon.publicDescription
    ) ||
    normalizeText(
      coupon.description
    );

  return {
    code:
      normalizeText(
        coupon.code
      ),

    title:
      publicTitle,

    description:
      publicDescription,

    type:
      normalizeCouponType(
        coupon.type
      ),

    value:
      Number(
        coupon.value
      ) || 0,

    minimumOrder:
      Number(
        coupon.minimumOrder
      ) || 0,

    maximumDiscount:
      Number(
        coupon.maximumDiscount
      ) || 0,

    startsAt:
      coupon.startsAt ||
      null,

    expiresAt:
      coupon.expiresAt ||
      null,

    promoted:
      Boolean(
        coupon.promoted
      ),

    displayOrder:
      Number(
        coupon.displayOrder
      ) || 0,
  };
}

async function ensureCouponIndexes(
  collection
) {
  try {
    await collection.createIndex(
      {
        normalizedCode: 1,
      },
      {
        unique: true,

        name:
          "coupon_normalized_code_unique",

        partialFilterExpression: {
          normalizedCode: {
            $type:
              "string",
          },
        },
      }
    );

    await collection.createIndex(
      {
        createdAt: -1,
      },
      {
        name:
          "coupon_created_at",
      }
    );

    await collection.createIndex(
      {
        isPublic: 1,
        active: 1,
        promoted: -1,
        displayOrder: 1,
        expiresAt: 1,
      },
      {
        name:
          "coupon_public_visibility",
      }
    );
  } catch (error) {
    console.warn(
      "Coupon index warning:",
      error?.message ||
        error
    );
  }
}

async function getCouponsCollection() {
  const client =
    await clientPromise;

  if (
    !client ||
    typeof client.db !==
      "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  const database =
    client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

  const collection =
    database.collection(
      "coupons"
    );

  await ensureCouponIndexes(
    collection
  );

  return collection;
}

function isPublicRequest(
  request
) {
  const requestUrl =
    new URL(
      request.url
    );

  return (
    requestUrl.searchParams.get(
      "public"
    ) === "1"
  );
}

async function getPublicCoupons(
  collection
) {
  const now =
    new Date();

  const coupons =
    await collection
      .find({
        active: true,
        isPublic: true,

        $and: [
          {
            $or: [
              {
                startsAt:
                  null,
              },

              {
                startsAt: {
                  $lte:
                    now,
                },
              },
            ],
          },

          {
            $or: [
              {
                expiresAt:
                  null,
              },

              {
                expiresAt: {
                  $gt:
                    now,
                },
              },
            ],
          },

          {
            $expr: {
              $or: [
                {
                  $lte: [
                    {
                      $ifNull: [
                        "$usageLimit",
                        0,
                      ],
                    },

                    0,
                  ],
                },

                {
                  $lt: [
                    {
                      $ifNull: [
                        "$usageCount",
                        0,
                      ],
                    },

                    {
                      $ifNull: [
                        "$usageLimit",
                        0,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      })
      .sort({
        promoted: -1,
        displayOrder: 1,
        createdAt: -1,
      })
      .limit(
        MAX_PUBLIC_COUPONS
      )
      .toArray();

  return coupons.map(
    serializePublicCoupon
  );
}

export async function GET(
  request
) {
  try {
    if (
      isPublicRequest(
        request
      )
    ) {
      const collection =
        await getCouponsCollection();

      const coupons =
        await getPublicCoupons(
          collection
        );

      return jsonResponse({
        success: true,
        public: true,
        coupons,

        count:
          coupons.length,
      });
    }

    const authorization =
      await requireAdminApiPermission(
        request,
        {
          coupons: [
            "read",
          ],
        },
        {
          path:
            "/api/coupons",

          forbiddenMessage:
            "You do not have permission to view coupons.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const collection =
      await getCouponsCollection();

    const coupons =
      await collection
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

    return jsonResponse({
      success: true,
      public: false,
      coupons,
    });
  } catch (error) {
    console.error(
      "GET Coupons Error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Failed to fetch coupons.",
      },
      500
    );
  }
}

export async function POST(
  request
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          coupons: [
            "create",
          ],
        },
        {
          path:
            "/api/coupons",

          forbiddenMessage:
            "You do not have permission to create coupons.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const contentLength =
      Number(
        request.headers.get(
          "content-length"
        ) || 0
      );

    if (
      Number.isFinite(
        contentLength
      ) &&
      contentLength >
        MAX_REQUEST_SIZE
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
      body =
        await request.json();
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

    if (
      !isPlainObject(
        body
      )
    ) {
      return jsonResponse(
        {
          success: false,

          message:
            "Invalid request body.",
        },
        400
      );
    }

    const code =
      normalizeCouponCode(
        body.code
      );

    const name =
      normalizeText(
        body.name
      );

    const description =
      normalizeText(
        body.description
      );

    const type =
      normalizeCouponType(
        body.type ||
          body.discountType
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
      description.length >
      1000
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
        false
      );

    const promoted =
      isPublic &&
      normalizeBoolean(
        body.promoted ??
          body.isPromoted,
        false
      );

    const publicTitle =
      normalizeText(
        body.publicTitle ??
          body.publicName
      ) || name;

    const publicDescription =
      normalizeText(
        body.publicDescription
      ) || description;

    if (
      publicTitle.length >
      120
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

    try {
      value =
        type ===
        "free_shipping"
          ? 0
          : parseMoney(
              body.value ??
                body.discountValue ??
                body.amount,

              "Discount value"
            );

      minimumOrder =
        parseMoney(
          body.minimumOrder ??
            body.minimumSpend ??
            body.minOrderAmount,

          "Minimum order"
        );

      maximumDiscount =
        type ===
        "percentage"
          ? parseMoney(
              body.maximumDiscount ??
                body.maxDiscount,

              "Maximum discount"
            )
          : 0;

      usageLimit =
        parseUsageLimit(
          body.usageLimit ??
            body.maxUses
        );

      startsAt =
        parseOptionalDate(
          body.startsAt ??
            body.startDate,

          "Coupon start date"
        );

      expiresAt =
        parseOptionalDate(
          body.expiresAt ??
            body.expiryDate,

          "Coupon expiry date"
        );

      displayOrder =
        parseDisplayOrder(
          body.displayOrder
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
      type !==
        "free_shipping" &&
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
      type ===
        "percentage" &&
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
      expiresAt <=
        startsAt
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

    const active =
      normalizeBoolean(
        body.isActive ??
          body.active ??
          body.status,
        true
      );

    const collection =
      await getCouponsCollection();

    const existingCoupon =
      await collection.findOne({
        normalizedCode:
          code,
      });

    if (existingCoupon) {
      return jsonResponse(
        {
          success: false,

          message:
            "A coupon with this code already exists.",
        },
        409
      );
    }

    const now =
      new Date();

    const coupon = {
      code,
      normalizedCode:
        code,

      name,
      description,
      type,
      value,
      minimumOrder,
      maximumDiscount,
      startsAt,
      expiresAt,
      usageLimit,
      usageCount: 0,

      active,

      status:
        active
          ? "active"
          : "inactive",

      isPublic,
      promoted,
      publicTitle,
      publicDescription,
      displayOrder,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await collection.insertOne(
        coupon
      );

    return jsonResponse(
      {
        success: true,

        message:
          "Coupon created successfully.",

        coupon: {
          ...coupon,

          _id:
            result.insertedId,
        },
      },
      201
    );
  } catch (error) {
    console.error(
      "POST Coupon Error:",
      error
    );

    if (
      error?.code === 11000
    ) {
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
          "Failed to create coupon.",
      },
      500
    );
  }
}