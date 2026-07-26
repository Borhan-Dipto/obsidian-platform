import clientPromise from "@/lib/mongodb";
import { getCurrentCustomer } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

const DATABASE_NAME =
  process.env.MONGODB_DB || "obsidian";

const NO_STORE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, must-revalidate, max-age=0",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeNumber(value) {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return 0;
  }

  return parsedValue;
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

async function resolveMongoClient() {
  const importedValue = await clientPromise;

  if (
    importedValue &&
    typeof importedValue.db === "function"
  ) {
    return importedValue;
  }

  if (importedValue?.default) {
    const defaultValue =
      await importedValue.default;

    if (
      defaultValue &&
      typeof defaultValue.db === "function"
    ) {
      return defaultValue;
    }
  }

  if (importedValue?.client) {
    const clientValue =
      await importedValue.client;

    if (
      clientValue &&
      typeof clientValue.db === "function"
    ) {
      return clientValue;
    }
  }

  if (importedValue?.clientPromise) {
    const promisedClient =
      await importedValue.clientPromise;

    if (
      promisedClient &&
      typeof promisedClient.db === "function"
    ) {
      return promisedClient;
    }
  }

  console.error(
    "Customer order MongoDB client resolution failed:",
    {
      valueType: typeof importedValue,
      availableKeys:
        importedValue &&
        typeof importedValue === "object"
          ? Object.keys(importedValue)
          : [],
    }
  );

  throw new TypeError(
    "MongoDB connection did not return a valid MongoClient."
  );
}

async function getOrdersCollection() {
  const client = await resolveMongoClient();

  return client
    .db(DATABASE_NAME)
    .collection("orders");
}

function serializeOrderItem(item) {
  return {
    id: normalizeText(
      item?.id ||
        item?._id ||
        item?.productId
    ),

    name: normalizeText(
      item?.name ||
        item?.productName ||
        item?.title
    ),

    series: normalizeText(
      item?.series ||
        item?.collection ||
        item?.category
    ),

    color: normalizeText(
      item?.color ||
        item?.variant?.color
    ),

    size: normalizeText(
      item?.size ||
        item?.variant?.size
    ),

    quantity: Math.max(
      1,
      Math.floor(
        normalizeNumber(item?.quantity) || 1
      )
    ),

    price: normalizeNumber(
      item?.price ??
        item?.unitPrice ??
        item?.salePrice
    ),

    image: normalizeText(
      item?.image ||
        item?.imageUrl ||
        item?.thumbnail
    ),
  };
}

function serializeStatusHistory(order) {
  const history = Array.isArray(
    order?.statusHistory
  )
    ? order.statusHistory
    : [];

  return history
    .map((entry) => {
      const status = normalizeText(
        entry?.status ||
          entry?.to ||
          entry?.newStatus
      ).toLowerCase();

      return {
        from: normalizeText(
          entry?.from ||
            entry?.previousStatus
        ).toLowerCase(),

        to: normalizeText(
          entry?.to ||
            entry?.newStatus ||
            status
        ).toLowerCase(),

        status,

        note: normalizeText(
          entry?.note ||
            entry?.message ||
            entry?.description
        ),

        createdAt: serializeDate(
          entry?.changedAt ||
            entry?.createdAt ||
            entry?.updatedAt ||
            entry?.timestamp
        ),
      };
    })
    .filter((entry) => entry.status);
}

function serializeCourier(order) {
  const courier =
    order?.courier &&
    typeof order.courier === "object"
      ? order.courier
      : {};

  return {
    name: normalizeText(
      courier?.name ||
        courier?.courierName ||
        order?.courierName
    ),

    trackingNumber: normalizeText(
      courier?.trackingNumber ||
        courier?.consignmentId ||
        courier?.trackingId ||
        order?.trackingNumber
    ),

    trackingUrl: normalizeText(
      courier?.trackingUrl ||
        courier?.url ||
        order?.trackingUrl
    ),

    bookingDate: serializeDate(
      courier?.bookingDate ||
        courier?.bookedAt ||
        order?.courierBookingDate
    ),

    estimatedDelivery: serializeDate(
      courier?.estimatedDelivery ||
        courier?.estimatedDeliveryAt ||
        order?.estimatedDelivery
    ),

    deliveryNote: normalizeText(
      courier?.deliveryNote ||
        courier?.note ||
        order?.deliveryNote
    ),
  };
}

function serializeCustomer(order) {
  const customer =
    order?.customer &&
    typeof order.customer === "object"
      ? order.customer
      : {};

  return {
    fullName: normalizeText(
      customer?.fullName ||
        customer?.name ||
        order?.customerName
    ),

    phone: normalizeText(
      customer?.phone ||
        customer?.phoneNumber ||
        order?.customerPhone
    ),

    email: normalizeEmail(
      customer?.email ||
        order?.customerEmail
    ),

    address: normalizeText(
      customer?.address ||
        customer?.shippingAddress ||
        order?.deliveryAddress
    ),

    deliveryArea: normalizeText(
      customer?.deliveryArea ||
        customer?.area ||
        order?.deliveryArea
    ),

    note: normalizeText(
      customer?.note ||
        order?.customerNote ||
        order?.orderNote
    ),
  };
}

function serializeOrder(order) {
  const pricing =
    order?.pricing &&
    typeof order.pricing === "object"
      ? order.pricing
      : {};

  const subtotal = normalizeNumber(
    pricing?.subtotal ??
      order?.subtotal
  );

  const deliveryCharge = normalizeNumber(
    pricing?.deliveryPayable ??
      pricing?.deliveryCharge ??
      order?.deliveryPayable ??
      order?.deliveryCharge
  );

  const originalDeliveryCharge =
    normalizeNumber(
      pricing?.originalDeliveryCharge ??
        pricing?.deliveryCharge ??
        order?.originalDeliveryCharge ??
        order?.deliveryCharge
    );

  const discount = normalizeNumber(
    pricing?.discount ??
      pricing?.totalDiscount ??
      order?.discount ??
      order?.totalDiscount
  );

  const total = normalizeNumber(
    pricing?.total ??
      pricing?.grandTotal ??
      order?.total ??
      order?.grandTotal
  );

  const orderIdentifier = normalizeText(
    order?.orderId ||
      order?.id ||
      order?._id
  );

  return {
    _id:
      order?._id?.toString?.() ||
      normalizeText(order?._id),

    id: orderIdentifier,
    orderId: orderIdentifier,

    status: normalizeText(
      order?.status || "pending"
    ).toLowerCase(),

    paymentStatus: normalizeText(
      order?.paymentStatus || "unpaid"
    ).toLowerCase(),

    paymentMethod: normalizeText(
      order?.paymentMethod ||
        "cash_on_delivery"
    ).toLowerCase(),

    customer: serializeCustomer(order),

    items: Array.isArray(order?.items)
      ? order.items.map(serializeOrderItem)
      : [],

    pricing: {
      subtotal,
      deliveryCharge,
      originalDeliveryCharge,
      discount,
      total,
    },

    subtotal,
    deliveryCharge,
    originalDeliveryCharge,
    discount,
    total,

    coupon:
      order?.coupon &&
      typeof order.coupon === "object"
        ? {
            code: normalizeText(
              order.coupon.code
            ).toUpperCase(),

            type: normalizeText(
              order.coupon.type
            ).toLowerCase(),

            value: normalizeNumber(
              order.coupon.value
            ),

            productDiscount:
              normalizeNumber(
                order.coupon
                  .productDiscount
              ),

            deliveryDiscount:
              normalizeNumber(
                order.coupon
                  .deliveryDiscount
              ),

            totalDiscount:
              normalizeNumber(
                order.coupon
                  .totalDiscount
              ),
          }
        : null,

    courier: serializeCourier(order),

    transactionId: normalizeText(
      order?.transactionId ||
        order?.paymentTransactionId
    ),

    paymentReceivedAt: serializeDate(
      order?.paymentReceivedAt ||
        order?.paidAt
    ),

    cancellationReason: normalizeText(
      order?.cancellationReason ||
        order?.cancelReason
    ),

    statusHistory:
      serializeStatusHistory(order),

    confirmedAt: serializeDate(
      order?.confirmedAt
    ),

    processingAt: serializeDate(
      order?.processingAt
    ),

    packedAt: serializeDate(
      order?.packedAt
    ),

    shippedAt: serializeDate(
      order?.shippedAt
    ),

    deliveredAt: serializeDate(
      order?.deliveredAt
    ),

    cancelledAt: serializeDate(
      order?.cancelledAt
    ),

    createdAt: serializeDate(
      order?.createdAt
    ),

    updatedAt: serializeDate(
      order?.updatedAt
    ),
  };
}

function createJsonResponse(
  body,
  status = 200
) {
  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function createUnauthorizedResponse() {
  return createJsonResponse(
    {
      success: false,
      code: "UNAUTHORIZED",
      message:
        "Please sign in to view this order.",
    },
    401
  );
}

function createNotFoundResponse() {
  return createJsonResponse(
    {
      success: false,
      code: "ORDER_NOT_FOUND",
      message:
        "This order could not be found in your account.",
    },
    404
  );
}

function createOrderQuery(
  orderId,
  customer
) {
  const accountId = normalizeText(
    customer?._id
  );

  const customerId = normalizeText(
    customer?.customerId
  );

  const escapedOrderId =
    escapeRegExp(orderId);

  const ownershipFilters = [];

  if (customerId) {
    ownershipFilters.push(
      {
        customerId,
      },
      {
        "customer.customerId":
          customerId,
      }
    );
  }

  if (accountId) {
    ownershipFilters.push(
      {
        customerAccountId:
          accountId,
      },
      {
        "customer.accountId":
          accountId,
      }
    );
  }

  if (ownershipFilters.length === 0) {
    return null;
  }

  const query = {
    $and: [
      {
        $or: [
          {
            orderId,
          },
          {
            id: orderId,
          },
          {
            orderId: {
              $regex: `^${escapedOrderId}$`,
              $options: "i",
            },
          },
        ],
      },
      {
        $or: ownershipFilters,
      },
    ],
  };

  if (customer?.emailVerified !== true) {
    query.$and.push({
      customerLinkSource: {
        $ne: "account_registration",
      },
    });
  }

  return query;
}

export async function GET(
  request,
  context
) {
  try {
    const customer =
      await getCurrentCustomer();

    if (!customer) {
      return createUnauthorizedResponse();
    }

    const params = await context.params;

    const orderId = normalizeText(
      params?.id
    );

    if (!orderId) {
      return createJsonResponse(
        {
          success: false,
          code: "ORDER_ID_REQUIRED",
          message:
            "A valid order ID is required.",
        },
        400
      );
    }

    const orders =
      await getOrdersCollection();

    const orderQuery =
      createOrderQuery(
        orderId,
        customer
      );

    if (!orderQuery) {
      return createJsonResponse(
        {
          success: false,
          code: "INVALID_CUSTOMER_IDENTITY",
          message:
            "Your customer account does not contain a valid order identity.",
        },
        400
      );
    }

    const order = await orders.findOne(
      orderQuery
    );

    if (!order) {
      return createNotFoundResponse();
    }

    return createJsonResponse(
      {
        success: true,
        order: serializeOrder(order),
      },
      200
    );
  } catch (error) {
    console.error(
      "Customer Order Details GET Error:",
      error
    );

    return createJsonResponse(
      {
        success: false,
        code: "ORDER_DETAILS_ERROR",
        message:
          "We could not load this order right now.",
      },
      500
    );
  }
}