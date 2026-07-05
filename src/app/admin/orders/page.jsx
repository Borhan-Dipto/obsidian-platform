import Link from "next/link";

async function getOrders() {
  const res = await fetch("http://localhost:3000/api/orders", {
    cache: "no-store",
  });

  const data = await res.json();

  return data.orders || [];
}

function getStatusClass(status) {
  if (status === "pending") return "text-yellow-400";
  if (status === "confirmed") return "text-blue-400";
  if (status === "processing") return "text-purple-400";
  if (status === "shipped") return "text-cyan-400";
  if (status === "delivered") return "text-green-400";
  if (status === "cancelled") return "text-red-400";
  return "text-neutral-400";
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Orders
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Orders
            </h1>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-10">
            <h2 className="font-heading text-4xl font-light">
              No orders yet.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              New customer orders will appear here after checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-white/10">
            <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_0.9fr_0.6fr] border-b border-white/10 bg-white/[0.04] px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500 lg:grid">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Phone</span>
              <span>Total</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Action</span>
            </div>

            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order.orderId}`}
                className="grid gap-4 border-b border-white/10 px-6 py-6 text-sm text-neutral-300 transition last:border-b-0 hover:bg-white/[0.04] lg:grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_0.9fr_0.6fr] lg:items-center"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Order ID
                  </p>
                  <p className="mt-1 lg:mt-0">{order.orderId}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Customer
                  </p>
                  <p className="mt-1 lg:mt-0">
                    {order.customer?.fullName || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Phone
                  </p>
                  <p className="mt-1 lg:mt-0">
                    {order.customer?.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Total
                  </p>
                  <p className="mt-1 lg:mt-0">৳ {order.total}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Status
                  </p>
                  <p className={`mt-1 capitalize lg:mt-0 ${getStatusClass(order.status)}`}>
                    {order.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 lg:hidden">
                    Date
                  </p>
                  <p className="mt-1 lg:mt-0">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <p className="text-left text-xs uppercase tracking-[0.25em] text-neutral-500 lg:text-right">
                  View →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}