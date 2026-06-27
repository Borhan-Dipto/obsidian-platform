import Link from "next/link";

export default function AdminPage() {
  const stats = [
    { label: "Total Orders", value: "0" },
    { label: "Products", value: "3" },
    { label: "Pending Orders", value: "0" },
    { label: "Revenue", value: "৳ 0" },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-16 flex items-center justify-between">
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
          {stats.map((item) => (
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
          <Link
            href="/admin/orders"
            className="border border-white/10 p-8 transition hover:bg-white/5"
          >
            <h2 className="font-heading text-4xl font-light">Orders</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              View and manage customer orders.
            </p>
          </Link>

          <Link
            href="/admin/products"
            className="border border-white/10 p-8 transition hover:bg-white/5"
          >
            <h2 className="font-heading text-4xl font-light">Products</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Manage products, prices, images, and stock.
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="border border-white/10 p-8 transition hover:bg-white/5"
          >
            <h2 className="font-heading text-4xl font-light">Settings</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Update WhatsApp number, brand details, and store settings.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}