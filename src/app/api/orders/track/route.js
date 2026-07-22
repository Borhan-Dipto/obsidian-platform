import clientPromise from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;

const MAX_ATTEMPTS_PER_WINDOW = 20;
const MAX_PHONE_RESULTS = 10;

const trackingAttempts =
  globalThis.__obsidianPublicTrackingAttempts ||
  new Map();

globalThis.__obsidianPublicTrackingAttempts =
  trackingAttempts;

function createResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
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

function getClientKey(request) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const ipAddress =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `public-order-tracking:${ipAddress}`;
}

function consumeTrackingAttempt(request) {
  const now = Date.now();
  const key = getClientKey(request);

  if (trackingAttempts.size > 5000) {
    for (const [
      attemptKey,
      attempt,
    ] of trackingAttempts.entries()) {
      if (
        now - attempt.startedAt >
        RATE_LIMIT_WINDOW_MS
      ) {
        trackingAttempts.delete(
          attemptKey
        );
      }
    }
  }

  const existingAttempt =
    trackingAttempts.get(key);

  if (
    !existingAttempt ||
    now - existingAttempt.startedAt >
      RATE_LIMIT_WINDOW_MS
  ) {
    trackingAttempts.set(key, {
      count: 1,
      startedAt: now,
    });

    return true;
  }

  if (
    existingAttempt.count >=
    MAX_ATTEMPTS_PER_WINDOW
  ) {
    return false;
  }

  trackingAttempts.set(key, {
    ...existingAttempt,
    count: existingAttempt.count + 1,
  });

  return true;
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

function serializePhoneOrder(order) {
  const items = Array.isArray(
    order?.items
  )
    ? order.items
    : [];

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

    itemCount: items.reduce(
      (total, item) =>
        total +
        Math.max(
          Number(item?.quantity) || 1,
          1
        ),
      0
    ),

    total: getOrderTotal(order),

    currency: normalizeText(
      order?.pricing?.currency,
      "BDT"
    ),

    estimatedDelivery:
      order?.estimatedDelivery || null,

    createdAt:
      order?.createdAt || null,

    updatedAt:
      order?.updatedAt || null,
  };
}

async function getOrdersCollection() {
  const client = await clientPromise;

  if (
    !client ||
    typeof client.db !== "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  return client
    .db(
      process.env.MONGODB_DB ||
        "obsidian"
    )
    .collection("orders");
}

export async function POST(request) {
  try {
    if (
      !consumeTrackingAttempt(request)
    ) {
      return createResponse(
        {
          success: false,
          message:
            "Too many tracking attempts. Please try again later.",
        },
        429
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createResponse(
        {
          success: false,
          message:
            "Invalid tracking request.",
        },
        400
      );
    }

    const orderId =
      normalizeOrderId(
        body?.orderId
      );

    const phone =
      normalizePhone(body?.phone);

    if (!orderId && !phone) {
      return createResponse(
        {
          success: false,
          message:
            "Enter your Tracking ID or Order Phone Number.",
        },
        400
      );
    }

    const ordersCollection =
      await getOrdersCollection();

    if (orderId) {
      const order =
        await ordersCollection.findOne({
          orderId,
        });

      if (!order) {
        return createResponse(
          {
            success: false,
            message:
              "Order not found. Check your Tracking ID.",
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

    const phoneQuery =
      createPhoneQuery(phone);

    const orders =
      await ordersCollection
        .find(phoneQuery)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(MAX_PHONE_RESULTS)
        .toArray();

    if (orders.length === 0) {
      return createResponse(
        {
          success: false,
          message:
            "No order was found for this phone number.",
        },
        404
      );
    }

    return createResponse({
      success: true,
      mode: "phone",
      order: null,
      orders: orders.map(
        serializePhoneOrder
      ),
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