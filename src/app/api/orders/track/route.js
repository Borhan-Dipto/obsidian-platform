import { createHash } from "node:crypto";

import clientPromise from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;

const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_LOOKUP = 8;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

const RATE_LIMIT_COLLECTION_NAME =
  "public_order_tracking_rate_limits";

let rateLimitIndexPromise = null;

function createResponse(
  data,
  status = 200,
  headers = {}
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      ...headers,
    },
  });
}

function normalizeText(
  value,
  fallback = ""
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return (
    value
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim() || fallback
  );
}

function normalizeOrderId(value) {
  return normalizeText(value)
    .toUpperCase()
    .slice(0, 120);
}

function normalizePhone(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\D/g, "")
    .slice(0, 20);
}

function getPhoneCandidates(value) {
  let digits = normalizePhone(value);

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  const candidates = new Set();

  if (digits) {
    candidates.add(digits);
  }

  if (
    digits.startsWith("880") &&
    digits.length === 13
  ) {
    candidates.add(
      `0${digits.slice(3)}`
    );

    candidates.add(
      digits.slice(3)
    );
  }

  if (
    digits.startsWith("0") &&
    digits.length === 11
  ) {
    candidates.add(
      `880${digits.slice(1)}`
    );

    candidates.add(
      digits.slice(1)
    );
  }

  if (
    digits.startsWith("1") &&
    digits.length === 10
  ) {
    candidates.add(`0${digits}`);
    candidates.add(`880${digits}`);
  }

  return [...candidates].filter(
    (candidate) =>
      candidate.length >= 10 &&
      candidate.length <= 13
  );
}

function isValidPhone(value) {
  return (
    getPhoneCandidates(value).length > 0
  );
}

function createFlexiblePhoneRegex(
  phone
) {
  const digits = normalizePhone(phone);

  const pattern = digits
    .split("")
    .join("\\D*");

  return new RegExp(
    `^\\D*${pattern}\\D*$`,
    "i"
  );
}

function createPhoneQuery(phone) {
  const candidates =
    getPhoneCandidates(phone);

  const phoneFields = [
    "customer.phone",
    "customer.phoneNumber",
    "customer.mobile",
    "customerPhone",
    "phone",
    "phoneNumber",
    "mobile",
  ];

  const queryOptions = [];

  for (const field of phoneFields) {
    for (const candidate of candidates) {
      queryOptions.push({
        [field]: {
          $regex:
            createFlexiblePhoneRegex(
              candidate
            ),
        },
      });
    }
  }

  return {
    $or: queryOptions,
  };
}

function getClientIp(request) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  return normalizeText(
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
      request.headers.get(
        "x-real-ip"
      ) ||
      "unknown",
    "unknown"
  ).slice(0, 120);
}

function isSameOriginRequest(request) {
  const originHeader =
    request.headers.get("origin");

  if (!originHeader) {
    return true;
  }

  try {
    return (
      new URL(request.url).origin ===
      new URL(originHeader).origin
    );
  } catch {
    return false;
  }
}

async function readTrackingBody(request) {
  const contentLength = Number(
    request.headers.get(
      "content-length"
    ) || 0
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength >
      MAX_REQUEST_BODY_BYTES
  ) {
    return {
      ok: false,
      status: 413,
      message:
        "Tracking request is too large.",
    };
  }

  const rawBody =
    await request.text();

  if (
    Buffer.byteLength(
      rawBody,
      "utf8"
    ) > MAX_REQUEST_BODY_BYTES
  ) {
    return {
      ok: false,
      status: 413,
      message:
        "Tracking request is too large.",
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(rawBody),
    };
  } catch {
    return {
      ok: false,
      status: 400,
      message:
        "Invalid tracking request.",
    };
  }
}

function hashRateLimitIdentifier(
  scope,
  identifier
) {
  return createHash("sha256")
    .update(
      `${scope}:${identifier}`
    )
    .digest("hex");
}

async function ensureRateLimitIndex(
  collection
) {
  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise =
      collection
        .createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "public_order_tracking_rate_limit_ttl",

            expireAfterSeconds: 0,
          }
        )
        .catch((error) => {
          console.error(
            "Public tracking rate-limit index error:",
            error
          );

          return null;
        });
  }

  await rateLimitIndexPromise;
}

async function consumeRateLimit(
  collection,
  {
    scope,
    identifier,
    limit,
    nowMs,
  }
) {
  const windowStartedAtMs =
    Math.floor(
      nowMs /
        RATE_LIMIT_WINDOW_MS
    ) * RATE_LIMIT_WINDOW_MS;

  const windowEndsAtMs =
    windowStartedAtMs +
    RATE_LIMIT_WINDOW_MS;

  const identifierHash =
    hashRateLimitIdentifier(
      scope,
      identifier
    );

  const bucketId =
    `public-order-tracking:${scope}:` +
    `${identifierHash}:` +
    `${windowStartedAtMs}`;

  const now = new Date(nowMs);

  const document =
    await collection.findOneAndUpdate(
      {
        _id: bucketId,
      },
      {
        $inc: {
          attempts: 1,
        },

        $set: {
          updatedAt: now,
        },

        $setOnInsert: {
          scope,

          windowStartedAt:
            new Date(
              windowStartedAtMs
            ),

          windowEndsAt:
            new Date(
              windowEndsAtMs
            ),

          expiresAt:
            new Date(
              windowEndsAtMs +
                RATE_LIMIT_WINDOW_MS
            ),

          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        includeResultMetadata: false,
      }
    );

  const attempts = Number(
    document?.attempts || 1
  );

  return {
    allowed:
      attempts <= limit,

    retryAfterSeconds:
      Math.max(
        1,
        Math.ceil(
          (windowEndsAtMs -
            nowMs) /
            1000
        )
      ),
  };
}

async function consumeTrackingLimits(
  collection,
  request,
  orderId,
  phone
) {
  const nowMs = Date.now();

  const ipLimit =
    await consumeRateLimit(
      collection,
      {
        scope: "ip",

        identifier:
          getClientIp(request),

        limit:
          MAX_ATTEMPTS_PER_IP,

        nowMs,
      }
    );

  if (!ipLimit.allowed) {
    return ipLimit;
  }

  return consumeRateLimit(
    collection,
    {
      scope: "lookup",

      identifier:
        `${orderId}:${phone}`,

      limit:
        MAX_ATTEMPTS_PER_LOOKUP,

      nowMs,
    }
  );
}

function maskPhone(value) {
  const phone = normalizePhone(value);

  if (!phone) {
    return "";
  }

  if (phone.length <= 4) {
    return phone;
  }

  return `${"*".repeat(
    Math.max(4, phone.length - 4)
  )}${phone.slice(-4)}`;
}

function getOrderTotal(order) {
  return (
    Number(
      order?.pricing?.total ??
        order?.total ??
        0
    ) || 0
  );
}

function getOrderSubtotal(order) {
  return (
    Number(
      order?.pricing?.subtotal ??
        order?.subtotal ??
        0
    ) || 0
  );
}

function getDeliveryCharge(order) {
  return (
    Number(
      order?.pricing
        ?.payableDeliveryCharge ??
        order?.deliveryCharge ??
        0
    ) || 0
  );
}

function getTotalDiscount(order) {
  return (
    Number(
      order?.pricing?.totalDiscount ??
        order?.discount ??
        0
    ) || 0
  );
}

function sanitizeStatusHistory(order) {
  if (
    !Array.isArray(
      order?.statusHistory
    )
  ) {
    return [];
  }

  return order.statusHistory.map(
    (entry) => ({
      status: normalizeText(
        entry?.status || entry?.to,
        "pending"
      ).toLowerCase(),

      changedAt:
        entry?.changedAt || null,
    })
  );
}

function sanitizeOrderItems(order) {
  if (!Array.isArray(order?.items)) {
    return [];
  }

  return order.items.map((item) => {
    const quantity =
      Number(item?.quantity) > 0
        ? Number(item.quantity)
        : 1;

    const price =
      Number(item?.price) || 0;

    return {
      id: normalizeText(
        item?.id ||
          item?.productId ||
          item?.slug
      ),

      name: normalizeText(
        item?.name,
        "OBSIDIAN Product"
      ),

      size: normalizeText(item?.size),

      quantity,

      price,

      lineTotal:
        Number(item?.lineTotal) ||
        price * quantity,

      image: normalizeText(
        item?.image ||
          item?.imageUrl
      ),
    };
  });
}

function serializeDetailedOrder(order) {
  return {
    orderId: normalizeText(
      order?.orderId
    ),

    status: normalizeText(
      order?.status,
      "pending"
    ).toLowerCase(),

    paymentStatus: normalizeText(
      order?.paymentStatus,
      "unpaid"
    ).toLowerCase(),

    paymentMethod: normalizeText(
      order?.paymentMethod
    ),

    paymentMethodLabel:
      normalizeText(
        order?.paymentMethodLabel
      ),

    customer: {
      fullName: normalizeText(
        order?.customer?.fullName
      ),

      phone: maskPhone(
        order?.customer?.phone ||
          order?.customer?.phoneNumber ||
          order?.customer?.mobile ||
          order?.customerPhone ||
          order?.phone
      ),

      deliveryArea: normalizeText(
        order?.customer
          ?.deliveryArea ||
          order?.deliveryArea
      ),
    },

    items: sanitizeOrderItems(order),

    pricing: {
      currency: normalizeText(
        order?.pricing?.currency,
        "BDT"
      ),

      subtotal:
        getOrderSubtotal(order),

      payableDeliveryCharge:
        getDeliveryCharge(order),

      totalDiscount:
        getTotalDiscount(order),

      total: getOrderTotal(order),
    },

    coupon: order?.coupon
      ? {
          code: normalizeText(
            order.coupon.code
          ),
        }
      : null,

    courier: {
      name: normalizeText(
        order?.courierName
      ),

      trackingNumber:
        normalizeText(
          order?.trackingNumber
        ),

      trackingUrl: normalizeText(
        order?.trackingUrl
      ),
    },

    estimatedDelivery:
      order?.estimatedDelivery || null,

    statusHistory:
      sanitizeStatusHistory(order),

    createdAt:
      order?.createdAt || null,

    updatedAt:
      order?.updatedAt || null,

    confirmedAt:
      order?.confirmedAt || null,

    processingAt:
      order?.processingAt || null,

    packedAt:
      order?.packedAt || null,

    shippedAt:
      order?.shippedAt || null,

    deliveredAt:
      order?.deliveredAt || null,

    cancelledAt:
      order?.cancelledAt || null,
  };
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

export async function POST(request) {
  try {
    if (!isSameOriginRequest(request)) {
      return createResponse(
        {
          success: false,
          message:
            "Tracking request was rejected.",
        },
        403
      );
    }

    const bodyResult =
      await readTrackingBody(request);

    if (!bodyResult.ok) {
      return createResponse(
        {
          success: false,
          message:
            bodyResult.message,
        },
        bodyResult.status
      );
    }

    const orderId =
      normalizeOrderId(
        bodyResult.value?.orderId
      );

    const phone =
      normalizePhone(
        bodyResult.value?.phone
      );

    if (!orderId || !phone) {
      return createResponse(
        {
          success: false,
          message:
            "Enter both your Tracking ID and the phone number used during checkout.",
        },
        400
      );
    }

    if (!isValidPhone(phone)) {
      return createResponse(
        {
          success: false,
          message:
            "Enter a valid Order Phone Number.",
        },
        400
      );
    }

    const database =
      await getDatabase();

    const rateLimitCollection =
      database.collection(
        RATE_LIMIT_COLLECTION_NAME
      );

    await ensureRateLimitIndex(
      rateLimitCollection
    );

    const rateLimit =
      await consumeTrackingLimits(
        rateLimitCollection,
        request,
        orderId,
        phone
      );

    if (!rateLimit.allowed) {
      return createResponse(
        {
          success: false,
          message:
            "Too many tracking attempts. Please try again later.",
        },
        429,
        {
          "Retry-After": String(
            rateLimit.retryAfterSeconds
          ),
        }
      );
    }

    const ordersCollection =
      database.collection("orders");

    const order =
      await ordersCollection.findOne({
        $and: [
          {
            orderId,
          },

          createPhoneQuery(phone),
        ],
      });

    if (!order) {
      return createResponse(
        {
          success: false,
          message:
            "Order not found. Check your Tracking ID and phone number.",
        },
        404
      );
    }

    return createResponse({
      success: true,
      mode: "tracking-id",

      order:
        serializeDetailedOrder(order),

      orders: [],
    });
  } catch (error) {
    console.error(
      "Public Order Tracking Error:",
      error
    );

    return createResponse(
      {
        success: false,
        message:
          "We could not track your order right now. Please try again.",
      },
      500
    );
  }
}
