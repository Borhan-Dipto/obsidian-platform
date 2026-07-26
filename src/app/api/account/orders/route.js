import clientPromise from "@/lib/mongodb";
import { requireCustomerAuth } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function serializeOrderItem(item) {
  return {
    id: normalizeText(
      item?.id ||
        item?.productId ||
        item?._id
    ),

    name: normalizeText(item?.name),

    series: normalizeText(item?.series),

    color: normalizeText(item?.color),

    size: normalizeText(item?.size),

    quantity: Math.max(
      1,
      Math.floor(
        normalizeNumber(item?.quantity) || 1
      )
    ),

    price: normalizeNumber(item?.price),

    lineTotal: normalizeNumber(
      item?.lineTotal ??
        Number(item?.price || 0) *
          Number(item?.quantity || 0)
    ),

    image: normalizeText(
      item?.image ||
        item?.imageUrl ||
        item?.thumbnail
    ),
  };
}

function serializeOrder(order) {
  const pricing = order?.pricing || {};

  const subtotal = normalizeNumber(
    pricing.subtotal ??
      order?.subtotal
  );

  const originalDeliveryCharge =
    normalizeNumber(
      pricing.originalDeliveryCharge ??
        pricing.deliveryCharge ??
        order?.originalDeliveryCharge ??
        order?.deliveryCharge
    );

  const payableDeliveryCharge =
    normalizeNumber(
      pricing.payableDeliveryCharge ??
        pricing.deliveryPayable ??
        order?.deliveryCharge
    );

  const productDiscount =
    normalizeNumber(
      pricing.productDiscount ??
        order?.productDiscount
    );

  const deliveryDiscount =
    normalizeNumber(
      pricing.deliveryDiscount ??
        order?.deliveryDiscount
    );

  const totalDiscount =
    normalizeNumber(
      pricing.totalDiscount ??
        pricing.discount ??
        order?.discount ??
        productDiscount +
          deliveryDiscount
    );

  const total = normalizeNumber(
    pricing.total ??
      order?.total
  );

  const orderId = normalizeText(
    order?.orderId ||
      order?.id ||
      order?._id
  );

  return {
    _id:
      order?._id?.toString?.() || "",

    id: orderId,
    orderId,

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

    paymentMethodLabel: normalizeText(
      order?.paymentMethodLabel
    ),

    deliveryArea: normalizeText(
      order?.deliveryArea ||
        order?.customer?.deliveryArea
    ),

    customer: {
      fullName: normalizeText(
        order?.customer?.fullName
      ),

      phone: normalizeText(
        order?.customer?.phone
      ),

      email: normalizeEmail(
        order?.customer?.email
      ),

      address: normalizeText(
        order?.customer?.address
      ),

      deliveryArea: normalizeText(
        order?.customer?.deliveryArea ||
          order?.deliveryArea
      ),

      note: normalizeText(
        order?.customer?.note
      ),
    },

    items: Array.isArray(order?.items)
      ? order.items.map(
          serializeOrderItem
        )
      : [],

    pricing: {
      currency: normalizeText(
        pricing.currency || "BDT"
      ),

      subtotal,
      originalDeliveryCharge,
      payableDeliveryCharge,
      deliveryCharge:
        payableDeliveryCharge,

      productDiscount,
      deliveryDiscount,
      totalDiscount,
      discount: totalDiscount,

      total,
    },

    subtotal,
    originalDeliveryCharge,

    deliveryCharge:
      payableDeliveryCharge,

    productDiscount,
    deliveryDiscount,

    discount: totalDiscount,
    total,

    coupon: order?.coupon
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

    statusHistory: Array.isArray(
      order?.statusHistory
    )
      ? order.statusHistory.map(
          (entry) => ({
            status: normalizeText(
              entry?.status
            ).toLowerCase(),

            note: normalizeText(
              entry?.note
            ),

            changedBy: normalizeText(
              entry?.changedBy
            ),

            createdAt: serializeDate(
              entry?.createdAt
            ),
          })
        )
      : [],

    createdAt: serializeDate(
      order?.createdAt
    ),

    updatedAt: serializeDate(
      order?.updatedAt
    ),
  };
}

function calculateOrderSummary(orders) {
  const summary = {
    totalOrders: orders.length,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalSpent: 0,
  };

  const activeStatuses = new Set([
    "pending",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
  ]);

  const completedStatuses = new Set([
    "completed",
    "delivered",
  ]);

  const cancelledStatuses = new Set([
    "cancelled",
    "canceled",
    "refunded",
    "returned",
  ]);

  for (const order of orders) {
    const status = normalizeText(
      order?.status
    ).toLowerCase();

    if (activeStatuses.has(status)) {
      summary.activeOrders += 1;
    }

    if (completedStatuses.has(status)) {
      summary.completedOrders += 1;

      summary.totalSpent +=
        normalizeNumber(
          order?.pricing?.total ??
            order?.total
        );
    }

    if (
      cancelledStatuses.has(status)
    ) {
      summary.cancelledOrders += 1;
    }
  }

  summary.totalSpent =
    Math.round(
      summary.totalSpent * 100
    ) / 100;

  return summary;
}

function createCustomerOrderFilter(
  customer
) {
  const accountId = normalizeText(
    customer?._id
  );

  const customerId = normalizeText(
    customer?.customerId
  );

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

  const ownershipFilter = {
    $or: ownershipFilters,
  };

  if (customer?.emailVerified === true) {
    return ownershipFilter;
  }

  return {
    $and: [
      ownershipFilter,
      {
        customerLinkSource: {
          $ne: "account_registration",
        },
      },
    ],
  };
}

async function ensureOrderIndexes(
  ordersCollection
) {
  try {
    await Promise.all([
      ordersCollection.createIndex(
        {
          customerId: 1,
          createdAt: -1,
        },
        {
          name:
            "account_orders_customer_id",

          partialFilterExpression: {
            customerId: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          customerAccountId: 1,
          createdAt: -1,
        },
        {
          name:
            "account_orders_customer_account",

          partialFilterExpression: {
            customerAccountId: {
              $type: "string",
            },
          },
        }
      ),
    ]);
  } catch (error) {
    console.warn(
      "Customer order index warning:",
      error?.message || error
    );
  }
}

export async function GET() {
  try {
    const customer =
      await requireCustomerAuth();

    const orderFilter =
      createCustomerOrderFilter(
        customer
      );

    if (!orderFilter) {
      return Response.json(
        {
          success: false,
          message:
            "Your customer account does not contain a valid order identity.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "private, no-store, max-age=0",
          },
        }
      );
    }

    const client =
      await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    const ordersCollection =
      database.collection("orders");

    await ensureOrderIndexes(
      ordersCollection
    );

    const orders =
      await ordersCollection
        .find(orderFilter)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .toArray();

    const serializedOrders =
      orders.map(serializeOrder);

    const summary =
      calculateOrderSummary(
        serializedOrders
      );

    return Response.json(
      {
        success: true,
        orders: serializedOrders,
        summary,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    if (
      error?.digest?.startsWith?.(
        "NEXT_REDIRECT"
      )
    ) {
      throw error;
    }

    console.error(
      "Customer Orders GET Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "We could not load your orders right now.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  }
}