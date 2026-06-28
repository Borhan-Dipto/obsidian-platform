import Link from "next/link";
import ProductSearchTable from "../../../components/admin/ProductSearchTable";

async function getProducts() {
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });

  const data = await res.json();
  return data.products || [];
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-14 flex items-center justify-between gap-6">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Products
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Products
            </h1>
          </div>

          <div className="flex gap-4">
            <Link
              href="/admin/products/new"
              className="bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
            >
              Add Product
            </Link>

            <Link
              href="/admin"
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="border border-white/10 p-8 text-neutral-400">
            No products found.
          </div>
        ) : (
          <ProductSearchTable products={products} />
        )}
      </div>
    </main>
  );
}