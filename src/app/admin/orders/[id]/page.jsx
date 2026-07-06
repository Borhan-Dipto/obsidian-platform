import Link from "next/link";
import clientPromise from "../../../../lib/mongodb";
import { requireAdminAuth } from "../../../../lib/adminAuth";
import OrderStatusUpdater from "../../../../components/admin/OrderStatusUpdater";

async function getOrder(id) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const order = await db.collection("orders").findOne({ orderId: id });

  if (!order) return null;

  return JSON.parse(JSON.stringify(order));
}

export default async function OrderDetailsPage({ params }) {
  await requireAdminAuth();

  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-[#f1ece4]">
        <div className="text-center">
          <p className="mb-6 text-neutral-400">Order not found.</p>

          <Link
            href="/admin/orders"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Orders / {order.orderId}
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Order Details
            </h1>
          </div>

          <Link
            href="/admin/orders"
            className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-6 font-heading text-3xl font-light">
              Customer
            </h2>

            <div className="space-y-5 text-sm">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Name
                </p>
                <p>{order.customer?.fullName || "N/A"}</p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Phone
                </p>
                <p>{order.customer?.phone || "N/A"}</p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Email
                </p>
                <p>{order.customer?.email || "N/A"}</p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Address
                </p>
                <p className="leading-7">{order.customer?.address || "N/A"}</p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Area
                </p>
                <p>{order.customer?.area || "N/A"}</p>
              </div>
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-6 font-heading text-3xl font-light">
              Order Summary
            </h2>

            <div className="space-y-5 text-sm">
              <div className="flex justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-neutral-500">Order ID</span>
                <span>{order.orderId}</span>
              </div>

              <div className="border-b border-white/10 pb-4">
                <OrderStatusUpdater
                  orderId={order.orderId}
                  currentStatus={order.status}
                />
              </div>

              <div className="flex justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-neutral-500">Subtotal</span>
                <span>৳ {order.subtotal || 0}</span>
              </div>

              <div className="flex justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-neutral-500">Delivery</span>
                <span>৳ {order.deliveryCharge || 0}</span>
              </div>

              <div className="flex justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-neutral-500">Total</span>
                <span>৳ {order.total || 0}</span>
              </div>

              <div className="flex justify-between gap-6 border-b border-white/10 pb-4">
                <span className="text-neutral-500">Items</span>
                <span>{order.items?.length || 0}</span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-neutral-500">Date</span>
                <span>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("en-GB")
                    : "N/A"}
                </span>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-10 border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6">
            <h2 className="font-heading text-3xl font-light">
              Ordered Products
            </h2>
          </div>

          {!order.items || order.items.length === 0 ? (
            <div className="p-6 text-neutral-400">No items found.</div>
          ) : (
            order.items.map((item) => (
              <div
                key={`${item.id}-${item.size || "no-size"}`}
                className="flex flex-col gap-6 border-b border-white/10 p-6 last:border-none md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-5">
                  <img
                    src={item.image}
                    className="h-24 w-24 border border-white/10 object-cover"
                    alt={item.name}
                  />

                  <div>
                    <h3 className="font-heading text-2xl font-light">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-sm text-neutral-500">
                      {item.series}
                    </p>

                    <p className="text-sm text-neutral-500">{item.color}</p>

                    {item.size ? (
                      <p className="text-sm text-neutral-500">
                        Size: {item.size}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="text-left text-sm md:text-right">
                  <p>Qty: {item.quantity}</p>
                  <p className="mt-2">৳ {item.price}</p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}