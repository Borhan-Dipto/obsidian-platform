import Link from "next/link";
import OrderStatusUpdater from "../../../../components/admin/OrderStatusUpdater";

async function getOrder(id) {
  const res = await fetch(`http://localhost:3000/api/orders/${id}`, {
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.success) return null;

  return data.order;
}

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        Order not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Orders / {order.orderId}
            </p>

            <h1 className="font-heading text-5xl">Order Details</h1>
          </div>

          <Link
            href="/admin/orders"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="border border-white/10 p-8">
            <h2 className="mb-6 text-xl">Customer</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-neutral-500">Name</p>
                <p>{order.customer.fullName}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-neutral-500">Phone</p>
                <p>{order.customer.phone}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-neutral-500">Email</p>
                <p>{order.customer.email}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-neutral-500">Address</p>
                <p>{order.customer.address}</p>
              </div>
            </div>
          </div>

          <div className="border border-white/10 p-8">
            <h2 className="mb-6 text-xl">Order Summary</h2>

            <div className="space-y-5">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span>{order.orderId}</span>
              </div>

              <OrderStatusUpdater
                orderId={order.orderId}
                currentStatus={order.status}
              />

              <div className="flex justify-between">
                <span>Total</span>
                <span>৳ {order.total}</span>
              </div>

              <div className="flex justify-between">
                <span>Items</span>
                <span>{order.items.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border border-white/10">
          <div className="border-b border-white/10 p-6">
            <h2 className="text-xl">Ordered Products</h2>
          </div>

          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-white/10 p-6 last:border-none"
            >
              <div className="flex items-center gap-5">
                <img
                  src={item.image}
                  className="h-20 w-20 object-cover"
                  alt={item.name}
                />

                <div>
                  <h3>{item.name}</h3>
                  <p className="text-sm text-neutral-500">{item.series}</p>
                  <p className="text-sm text-neutral-500">{item.color}</p>
                </div>
              </div>

              <div className="text-right">
                <p>Qty: {item.quantity}</p>
                <p className="mt-2">৳ {item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}