import { createHmac } from "node:crypto";

import clientPromise from "../../../../lib/mongodb";
import {
  enforcePublicRequestEnvelope,
} from "../../../../lib/publicApiSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;

const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_LOOKUP = 8;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const MAX_PHONE_LOOKUP_RESULTS = 10;
const MINIMUM_SECURITY_SECRET_LENGTH = 32;

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

      "X-Content-Type-Options":
        "nosniff",

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
    const value =
      JSON.parse(rawBody);

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return {
        ok: false,
        status: 400,
        message:
          "Invalid tracking request.",
      };
    }

    return {
      ok: true,
      value,
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

function getSecuritySecret() {
  const secret = normalizeText(
    process.env.PUBLIC_API_SECURITY_SECRET ||
      process.env.CUSTOMER_AUTH_SECRET ||
      process.env.BETTER_AUTH_SECRET
  );

  if (
    secret.length <
    MINIMUM_SECURITY_SECRET_LENGTH
  ) {
    throw new Error(
      "A public API security secret with at least 32 characters is required."
    );
  }

  return secret;
}

function hashRateLimitIdentifier(
  scope,
  identifier
) {
  return createHmac(
    "sha256",
    getSecuritySecret()
  )
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
          rateLimitIndexPromise = null;

          throw error;
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

  const update = {
    $inc: {
      attempts: 1,
    },

    $set: {
      updatedAt: now,
    },

    $setOnInsert: {
      scope,
      identifierHash,
      limit,

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
  };

  let document;

  try {
    document =
      await collection.findOneAndUpdate(
        {
          _id: bucketId,
        },
        update,
        {
          upsert: true,
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    document =
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
        },
        {
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );
  }

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
  lookupMode,
  lookupIdentifier
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
        `${lookupMode}:${lookupIdentifier}`,

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

function serializeOrderSummary(order) {
  return {
    orderId: normalizeText(
      order?.orderId
    ),

    status: normalizeText(
      order?.status,
      "pending"
    ).toLowerCase(),

    total: getOrderTotal(order),

    currency: normalizeText(
      order?.pricing?.currency ||
        order?.currency,
      "BDT"
    ),

    createdAt:
      order?.createdAt || null,
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

function getLookupMode(
  hasOrderId,
  hasPhone
) {
  if (hasOrderId && hasPhone) {
    return "tracking-id-and-phone";
  }

  if (hasOrderId) {
    return "tracking-id";
  }

  return "phone";
}

function getLookupIdentifier(
  orderId,
  phone
) {
  if (orderId && phone) {
    return `${orderId}:${phone}`;
  }

  return orderId || phone;
}

export async function POST(request) {
  try {
    const envelope =
      await enforcePublicRequestEnvelope(
        request,
        {
          action: "track-order",
          maxBodyBytes:
            MAX_REQUEST_BODY_BYTES,
          sameOrigin: true,
          requireJson: true,
        }
      );

    if (!envelope.success) {
      return envelope.response;
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

    const hasOrderId =
      Boolean(orderId);

    const hasPhone =
      Boolean(phone);

    if (!hasOrderId && !hasPhone) {
      return createResponse(
        {
          success: false,
          message:
            "Enter your Tracking ID or Order Phone Number.",
        },
        400
      );
    }

    if (
      hasPhone &&
      !isValidPhone(phone)
    ) {
      return createResponse(
        {
          success: false,
          message:
            "Enter a valid Order Phone Number.",
        },
        400
      );
    }

    const lookupMode =
      getLookupMode(
        hasOrderId,
        hasPhone
      );

    const lookupIdentifier =
      getLookupIdentifier(
        orderId,
        phone
      );

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
        lookupMode,
        lookupIdentifier
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

    if (lookupMode === "phone") {
      const matchingOrders =
        await ordersCollection
          .find(
            createPhoneQuery(phone)
          )
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(
            MAX_PHONE_LOOKUP_RESULTS
          )
          .toArray();

      if (matchingOrders.length === 0) {
        return createResponse(
          {
            success: false,
            message:
              "Order not found. Check the information and try again.",
          },
          404
        );
      }

      if (matchingOrders.length === 1) {
        return createResponse({
          success: true,
          mode: lookupMode,

          order:
            serializeDetailedOrder(
              matchingOrders[0]
            ),

          orders: [],
        });
      }

      return createResponse({
        success: true,
        mode: lookupMode,
        order: null,

        orders:
          matchingOrders.map(
            serializeOrderSummary
          ),
      });
    }

    const orderQuery =
      lookupMode ===
      "tracking-id-and-phone"
        ? {
            $and: [
              {
                orderId,
              },

              createPhoneQuery(phone),
            ],
          }
        : {
            orderId,
          };

    const order =
      await ordersCollection.findOne(
        orderQuery
      );

    if (!order) {
      return createResponse(
        {
          success: false,
          message:
            "Order not found. Check the information and try again.",
        },
        404
      );
    }

    return createResponse({
      success: true,
      mode: lookupMode,

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