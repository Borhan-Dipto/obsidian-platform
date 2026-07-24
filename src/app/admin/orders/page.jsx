import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../lib/adminAuth";
import OrdersManagementTable from "../../../components/admin/OrdersManagementTable";

export const dynamic = "force-dynamic";

async function getOrders() {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const orders = await db
    .collection("orders")
    .find({})
    .sort({
      createdAt: -1,
    })
    .toArray();

  return JSON.parse(
    JSON.stringify(orders)
  );
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳ 0";
  }

  return `৳ ${amount.toLocaleString("en-BD")}`;
}

function getOrderTotal(order) {
  const directTotal = Number(
    order.total ??
      order.grandTotal
  );

  if (Number.isFinite(directTotal)) {
    return directTotal;
  }

  const subtotal =
    Number(order.subtotal) || 0;

  const discount =
    Number(
      order.discountAmount ??
        order.discount ??
        order.couponDiscount ??
        order.coupon?.discountAmount ??
        order.appliedCoupon
          ?.discountAmount
    ) || 0;

  const deliveryCharge =
    Number(
      order.deliveryCharge ??
        order.shippingCharge ??
        order.deliveryFee
    ) || 0;

  return Math.max(
    subtotal -
      discount +
      deliveryCharge,
    0
  );
}

function getOrderStatus(order) {
  return String(
    order.status || "pending"
  ).toLowerCase();
}

function getPaymentMethod(order) {
  return (
    order.paymentMethod ||
    order.payment?.method ||
    order.paymentMethodName ||
    "Cash on Delivery"
  );
}

function getPaymentStatus(order) {
  const storedStatus =
    order.paymentStatus ||
    order.payment?.status ||
    order.transactionStatus;

  if (storedStatus) {
    return String(
      storedStatus
    ).toLowerCase();
  }

  const paymentMethod = String(
    getPaymentMethod(order)
  ).toLowerCase();

  if (
    paymentMethod.includes("cash") ||
    paymentMethod.includes("cod") ||
    paymentMethod.includes(
      "delivery"
    )
  ) {
    return "unpaid";
  }

  return "pending";
}

function getOrderDate(order) {
  if (!order.createdAt) {
    return null;
  }

  const date = new Date(
    order.createdAt
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function isSameCalendarDay(
  firstDate,
  secondDate
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function getTodayOrdersCount(
  orders
) {
  const now = new Date();

  return orders.filter(
    (order) => {
      const orderDate =
        getOrderDate(order);

      return orderDate
        ? isSameCalendarDay(
            orderDate,
            now
          )
        : false;
    }
  ).length;
}

function getPendingOrdersCount(
  orders
) {
  return orders.filter(
    (order) =>
      getOrderStatus(order) ===
      "pending"
  ).length;
}

function getActiveFulfilmentCount(
  orders
) {
  const activeStatuses =
    new Set([
      "confirmed",
      "processing",
      "packed",
      "shipped",
    ]);

  return orders.filter(
    (order) =>
      activeStatuses.has(
        getOrderStatus(order)
      )
  ).length;
}

function getDeliveredOrdersCount(
  orders
) {
  return orders.filter(
    (order) =>
      getOrderStatus(order) ===
      "delivered"
  ).length;
}

function getCancelledOrdersCount(
  orders
) {
  return orders.filter(
    (order) =>
      getOrderStatus(order) ===
      "cancelled"
  ).length;
}

function getPaidOrdersCount(orders) {
  const paidStatuses =
    new Set([
      "paid",
      "completed",
      "successful",
    ]);

  return orders.filter(
    (order) =>
      paidStatuses.has(
        getPaymentStatus(order)
      )
  ).length;
}

function getGrossOrderValue(
  orders
) {
  return orders.reduce(
    (total, order) =>
      total +
      getOrderTotal(order),
    0
  );
}

function getConfirmedRevenue(
  orders
) {
  const acceptedPaymentStatuses =
    new Set([
      "paid",
      "completed",
      "successful",
    ]);

  return orders.reduce(
    (total, order) => {
      const orderStatus =
        getOrderStatus(order);

      const paymentStatus =
        getPaymentStatus(order);

      const paymentMethod =
        String(
          getPaymentMethod(order)
        ).toLowerCase();

      const isCancelled =
        orderStatus === "cancelled";

      const isRefunded =
        paymentStatus ===
          "refunded" ||
        paymentStatus ===
          "failed" ||
        paymentStatus ===
          "cancelled";

      if (
        isCancelled ||
        isRefunded
      ) {
        return total;
      }

      const isPaid =
        acceptedPaymentStatuses.has(
          paymentStatus
        );

      const isDeliveredCashOrder =
        orderStatus ===
          "delivered" &&
        (paymentMethod.includes(
          "cash"
        ) ||
          paymentMethod.includes(
            "cod"
          ) ||
          paymentMethod.includes(
            "delivery"
          ));

      if (
        !isPaid &&
        !isDeliveredCashOrder
      ) {
        return total;
      }

      return (
        total +
        getOrderTotal(order)
      );
    },
    0
  );
}

function getAverageOrderValue(
  orders
) {
  const validOrders =
    orders.filter(
      (order) =>
        getOrderStatus(
          order
        ) !== "cancelled"
    );

  if (
    validOrders.length === 0
  ) {
    return 0;
  }

  const total =
    validOrders.reduce(
      (sum, order) =>
        sum +
        getOrderTotal(order),
      0
    );

  return (
    total /
    validOrders.length
  );
}

function getConversionRate(
  numerator,
  denominator
) {
  if (!denominator) {
    return 0;
  }

  return (
    (numerator /
      denominator) *
    100
  );
}

function formatPercentage(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0%";
  }

  return `${amount.toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  note,
  valueClassName = "",
}) {
  return (
    <article className="group bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.035]">
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
        {label}
      </p>

      <p
        className={`mt-4 break-words font-heading text-4xl font-light ${valueClassName}`}
      >
        {value}
      </p>

      {note ? (
        <p className="mt-3 text-xs leading-5 text-neutral-600">
          {note}
        </p>
      ) : null}
    </article>
  );
}

export default async function AdminOrdersPage() {
  await requireAdminPermission({
    orders: ["read"],
  });

  const [
    orders,
    canExportOrders,
  ] = await Promise.all([
    getOrders(),

    hasAdminPermission({
      orders: ["export"],
    }),
  ]);

  const totalOrders =
    orders.length;

  const todayOrdersCount =
    getTodayOrdersCount(
      orders
    );

  const pendingOrdersCount =
    getPendingOrdersCount(
      orders
    );

  const activeFulfilmentCount =
    getActiveFulfilmentCount(
      orders
    );

  const deliveredOrdersCount =
    getDeliveredOrdersCount(
      orders
    );

  const cancelledOrdersCount =
    getCancelledOrdersCount(
      orders
    );

  const paidOrdersCount =
    getPaidOrdersCount(
      orders
    );

  const grossOrderValue =
    getGrossOrderValue(
      orders
    );

  const confirmedRevenue =
    getConfirmedRevenue(
      orders
    );

  const averageOrderValue =
    getAverageOrderValue(
      orders
    );

  const deliveryRate =
    getConversionRate(
      deliveredOrdersCount,
      totalOrders
    );

  const cancellationRate =
    getConversionRate(
      cancelledOrdersCount,
      totalOrders
    );

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
                Admin / Orders
              </p>

              <h1 className="font-heading text-5xl font-light md:text-7xl">
                Orders
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
                Review customer orders,
                monitor fulfilment,
                verify payment, assign
                courier information and
                manage the complete order
                lifecycle from one
                operational workspace.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {totalOrders}{" "}
                {totalOrders === 1
                  ? "Order"
                  : "Orders"}
              </p>

              <Link
                href="/admin"
                className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <section className="border border-white/10 bg-white/[0.025] p-10 sm:p-14">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
              Order Management
            </p>

            <h2 className="font-heading text-4xl font-light sm:text-5xl">
              No orders yet
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400">
              New customer orders
              will appear here after
              checkout. Once orders
              are placed, you will be
              able to search, filter,
              review and manage them
              from this page.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.25em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                Return to Dashboard
              </Link>

              <Link
                href="/shop"
                target="_blank"
                className="inline-flex border border-white/10 px-6 py-3 text-xs uppercase tracking-[0.25em] text-neutral-400 transition duration-300 hover:border-white/30 hover:text-[#f1ece4]"
              >
                Open Store
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-8 overflow-hidden border border-white/10 bg-white/10">
              <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total Orders"
                  value={
                    totalOrders
                  }
                  note={`${todayOrdersCount} received today`}
                />

                <MetricCard
                  label="Pending Review"
                  value={
                    pendingOrdersCount
                  }
                  note="Orders awaiting initial action"
                  valueClassName="text-yellow-300"
                />

                <MetricCard
                  label="Active Fulfilment"
                  value={
                    activeFulfilmentCount
                  }
                  note="Confirmed through shipped"
                  valueClassName="text-cyan-300"
                />

                <MetricCard
                  label="Confirmed Revenue"
                  value={formatMoney(
                    confirmedRevenue
                  )}
                  note="Paid orders and delivered COD orders"
                  valueClassName="text-green-300"
                />
              </div>

              <div className="grid gap-px border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Gross Order Value"
                  value={formatMoney(
                    grossOrderValue
                  )}
                  note="Includes all orders before exclusions"
                />

                <MetricCard
                  label="Average Order Value"
                  value={formatMoney(
                    averageOrderValue
                  )}
                  note="Cancelled orders excluded"
                />

                <MetricCard
                  label="Delivered Orders"
                  value={
                    deliveredOrdersCount
                  }
                  note={`${formatPercentage(
                    deliveryRate
                  )} of all orders`}
                  valueClassName="text-green-300"
                />

                <MetricCard
                  label="Cancelled Orders"
                  value={
                    cancelledOrdersCount
                  }
                  note={`${formatPercentage(
                    cancellationRate
                  )} cancellation rate`}
                  valueClassName={
                    cancelledOrdersCount >
                    0
                      ? "text-red-300"
                      : ""
                  }
                />
              </div>
            </section>

            <section className="mb-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-[#0e0e0e] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                  Today
                </p>

                <p className="mt-3 font-heading text-3xl font-light">
                  {
                    todayOrdersCount
                  }
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  New orders received today
                </p>
              </div>

              <div className="bg-[#0e0e0e] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                  Paid
                </p>

                <p className="mt-3 font-heading text-3xl font-light text-green-300">
                  {
                    paidOrdersCount
                  }
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  Orders marked as paid
                </p>
              </div>

              <div className="bg-[#0e0e0e] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                  Delivered
                </p>

                <p className="mt-3 font-heading text-3xl font-light text-cyan-300">
                  {
                    deliveredOrdersCount
                  }
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  Successfully completed orders
                </p>
              </div>

              <div className="bg-[#0e0e0e] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                  Needs Attention
                </p>

                <p className="mt-3 font-heading text-3xl font-light text-yellow-300">
                  {pendingOrdersCount +
                    cancelledOrdersCount}
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  Pending and cancelled records
                </p>
              </div>
            </section>

            <OrdersManagementTable
              orders={orders}
              canExportOrders={
                canExportOrders
              }
            />
          </>
        )}
      </div>
    </main>
  );
}