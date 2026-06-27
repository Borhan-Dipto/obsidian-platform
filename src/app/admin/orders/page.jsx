async function getOrders() {
  const res = await fetch("http://localhost:3000/api/orders", {
    cache: "no-store",
  });

  const data = await res.json();

  return data.orders || [];
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-14">
          <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Admin / Orders
          </p>

          <h1 className="font-heading text-5xl font-light">
            Orders
          </h1>
        </div>

        <div className="overflow-hidden border border-white/10">
          <div className="grid grid-cols-6 border-b border-white/10 bg-white/5 px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Phone</span>
            <span>Total</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {orders.map((order) => (
            <div
              key={order._id}
              className="grid grid-cols-6 border-b border-white/10 px-6 py-5 text-sm text-neutral-300"
            >
              <span>{order.orderId}</span>
              <span>{order.customer.fullName}</span>
              <span>{order.customer.phone}</span>
              <span>৳ {order.total}</span>
              <span className="text-yellow-400">
                {order.status}
              </span>
              <span>
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}