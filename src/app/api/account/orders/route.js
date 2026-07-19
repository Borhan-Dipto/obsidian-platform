import clientPromise from "@/lib/mongodb";
import { requireCustomerAuth } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeNumber(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    id: normalizeText(item?.id),
    name: normalizeText(item?.name),
    series: normalizeText(item?.series),
    color: normalizeText(item?.color),
    size: normalizeText(item?.size),
    quantity: Math.max(
      1,
      Math.floor(normalizeNumber(item?.quantity) || 1)
    ),
    price: normalizeNumber(item?.price),
    image: normalizeText(item?.image),
  };
}

function serializeOrder(order) {
  const pricing = order?.pricing || {};

  const subtotal = normalizeNumber(
    pricing?.subtotal ?? order?.subtotal
  );

  const deliveryCharge = normalizeNumber(
    pricing?.deliveryPayable ??
      pricing?.deliveryCharge ??
      order?.deliveryCharge
  );

  const originalDeliveryCharge = normalizeNumber(
    pricing?.deliveryCharge ??
      order?.originalDeliveryCharge ??
      order?.deliveryCharge
  );

  const discount = normalizeNumber(
    pricing?.discount ?? order?.discount
  );

  const total = normalizeNumber(
    pricing?.total ?? order?.total
  );

  return {
    _id: order?._id?.toString?.() || "",
    id: normalizeText(
      order?.orderId || order?.id || order?._id
    ),
    orderId: normalizeText(
      order?.orderId || order?.id || order?._id
    ),

    status: normalizeText(
      order?.status || "pending"
    ).toLowerCase(),

    paymentStatus: normalizeText(
      order?.paymentStatus || "unpaid"
    ).toLowerCase(),

    paymentMethod: normalizeText(
      order?.paymentMethod || "cash_on_delivery"
    ).toLowerCase(),

    customer: {
      fullName: normalizeText(
        order?.customer?.fullName
      ),
      phone: normalizeText(order?.customer?.phone),
      email: normalizeEmail(order?.customer?.email),
      address: normalizeText(
        order?.customer?.address
      ),
      deliveryArea: normalizeText(
        order?.customer?.deliveryArea
      ),
      note: normalizeText(order?.customer?.note),
    },

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
          productDiscount: normalizeNumber(
            order.coupon.productDiscount
          ),
          deliveryDiscount: normalizeNumber(
            order.coupon.deliveryDiscount
          ),
          totalDiscount: normalizeNumber(
            order.coupon.totalDiscount
          ),
        }
      : null,

    statusHistory: Array.isArray(
      order?.statusHistory
    )
      ? order.statusHistory.map((entry) => ({
          status: normalizeText(
            entry?.status
          ).toLowerCase(),
          note: normalizeText(entry?.note),
          changedBy: normalizeText(
            entry?.changedBy
          ),
          createdAt: serializeDate(
            entry?.createdAt
          ),
        }))
      : [],

    createdAt: serializeDate(order?.createdAt),
    updatedAt: serializeDate(order?.updatedAt),
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
      summary.totalSpent += normalizeNumber(
        order?.pricing?.total ?? order?.total
      );
    }

    if (cancelledStatuses.has(status)) {
      summary.cancelledOrders += 1;
    }
  }

  summary.totalSpent = Math.round(
    summary.totalSpent
  );

  return summary;
}

export async function GET() {
  try {
    const customer = await requireCustomerAuth();

    const customerEmail = normalizeEmail(
      customer?.email ||
        customer?.emailNormalized
    );

    if (!customerEmail) {
      return Response.json(
        {
          success: false,
          message:
            "Your customer account does not have a valid email address.",
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

    const escapedEmail =
      escapeRegExp(customerEmail);

    const orders = await db
      .collection("orders")
      .find({
        "customer.email": {
          $regex: `^${escapedEmail}$`,
          $options: "i",
        },
      })
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
      }
    );
  }
}