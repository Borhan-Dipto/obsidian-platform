import Link from "next/link";
import DeleteProductButton from "../../../components/admin/DeleteProductButton";

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
          <div className="overflow-x-auto border border-white/10">
            <div className="min-w-[1050px]">
              <div className="grid grid-cols-7 border-b border-white/10 bg-white/5 px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500">
                <span>ID</span>
                <span>Name</span>
                <span>Series</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Color</span>
                <span>Actions</span>
              </div>

              {products.map((product) => (
                <div
                  key={product._id}
                  className="grid grid-cols-7 border-b border-white/10 px-6 py-5 text-sm text-neutral-300 last:border-b-0"
                >
                  <span>{product.id}</span>
                  <span>{product.name}</span>
                  <span>{product.series}</span>
                  <span>৳ {product.price}</span>

                  <span
                    className={
                      product.stock > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of Stock"}
                  </span>

                  <span>{product.color}</span>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="border border-blue-500 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500 hover:text-white"
                    >
                      Edit
                    </Link>

                    <DeleteProductButton
                      productId={product.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}