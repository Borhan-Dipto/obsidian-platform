import Link from "next/link";
import { requireAdminAuth } from "../../lib/adminAuth";
import AdminLogoutButton from "../../components/admin/AdminLogoutButton";

async function getDashboardStats() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/stats", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error("Failed to load dashboard stats.");
    }

    return data;
  } catch (error) {
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
}

function getStatusClass(status) {
  if (status === "pending") return "text-yellow-400";
  if (status === "confirmed") return "text-blue-400";
  if (status === "packed") return "text-purple-400";
  if (status === "shipped") return "text-cyan-400";
  if (status === "delivered") return "text-green-400";
  if (status === "cancelled") return "text-red-400";
  return "text-neutral-400";
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

  const adminLinks = [
    {
      title: "Orders",
      href: "/admin/orders",
      description: "View, track, and update customer orders.",
    },
    {
      title: "Products",
      href: "/admin/products",
      description: "Manage products, prices, images, and stock.",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      description: "Update store details, contact, and business settings.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <header className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin Dashboard
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Obsidian Admin
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
              Manage products, orders, inventory, and store operations from one
              controlled workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              View Store
            </Link>

            <AdminLogoutButton />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-3">
          {adminLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-white/10 p-8 transition hover:bg-white/5"
            >
              <h2 className="font-heading text-4xl font-light">
                {item.title}
              </h2>

              <p className="mt-4 text-sm leading-7 text-neutral-400">
                {item.description}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-16 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h2 className="font-heading text-3xl font-light">
              Recent Orders
            </h2>

            <Link
              href="/admin/orders"
              className="text-xs uppercase tracking-[0.25em] text-neutral-500 transition hover:text-[#f1ece4]"
            >
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-neutral-400">No recent orders found.</div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order.orderId}`}
                className="grid gap-3 border-b border-white/10 p-6 text-sm text-neutral-300 transition last:border-b-0 hover:bg-white/5 md:grid-cols-4"
              >
                <span>{order.orderId}</span>
                <span>{order.customer?.fullName || "Unknown Customer"}</span>
                <span className={`capitalize ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
                <span className="md:text-right">৳ {order.total}</span>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}