import Link from "next/link";
import { requireAdminAuth } from "../../lib/adminAuth";

async function getDashboardStats() {
  const res = await fetch("http://localhost:3000/api/admin/stats", {
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.success) {
    return {
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        packedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalProducts: 0,
        lowStockProducts: 0,
      },
      recentOrders: [],
    };
  }

  return data;
}

export default async function AdminPage() {
  await requireAdminAuth();

  const { stats, recentOrders } = await getDashboardStats();

  const dashboardStats = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Products", value: stats.totalProducts },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Revenue", value: `৳ ${stats.totalRevenue}` },
    { label: "Confirmed", value: stats.confirmedOrders },
    { label: "Shipped", value: stats.shippedOrders },
    { label: "Delivered", value: stats.deliveredOrders },
    { label: "Low Stock", value: stats.lowStockProducts },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-16 flex items-center justify-between gap-6">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin Dashboard
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Obsidian Admin
            </h1>
          </div>

          <Link
            href="/"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            View Store
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {dashboardStats.map((item) => (
            <div key={item.label} className="border border-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {item.label}
              </p>

              <h2 className="mt-6 font-heading text-5xl font-light">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <Link href="/admin/orders" className="border border-white/10 p-8 transition hover:bg-white/5">
            <h2 className="font-heading text-4xl font-light">Orders</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              View and manage customer orders.
            </p>
          </Link>

          <Link href="/admin/products" className="border border-white/10 p-8 transition hover:bg-white/5">
            <h2 className="font-heading text-4xl font-light">Products</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Manage products, prices, images, and stock.
            </p>
          </Link>

          <Link href="/admin/settings" className="border border-white/10 p-8 transition hover:bg-white/5">
            <h2 className="font-heading text-4xl font-light">Settings</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Update WhatsApp number, brand details, and store settings.
            </p>
          </Link>
        </div>

        <div className="mt-16 border border-white/10">
          <div className="border-b border-white/10 p-6">
            <h2 className="font-heading text-3xl font-light">Recent Orders</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-neutral-400">No recent orders found.</div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order.orderId}`}
                className="grid grid-cols-4 border-b border-white/10 p-6 text-sm text-neutral-300 transition last:border-b-0 hover:bg-white/5"
              >
                <span>{order.orderId}</span>
                <span>{order.customer?.fullName}</span>
                <span className="capitalize text-yellow-400">{order.status}</span>
                <span className="text-right">৳ {order.total}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}