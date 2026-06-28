import Link from "next/link";

async function getProduct(id) {
  const res = await fetch(`http://localhost:3000/api/products/${id}`, {
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.success) return null;

  return data.product;
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
        Product not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f1ece4] px-6 py-12">
      <div className="container-custom">

        <div className="mb-10">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.35em] text-neutral-500 hover:text-white"
          >
            ← Back to Shop
          </Link>
        </div>

        <div className="grid gap-14 lg:grid-cols-2">

          {/* Product Image */}

          <div className="overflow-hidden border border-white/10 bg-white/5">

            <img
              src={product.image}
              alt={product.name}
              className="w-full object-cover"
            />

          </div>

          {/* Product Info */}

          <div>

            <p className="mb-4 uppercase tracking-[0.35em] text-neutral-500 text-xs">
              {product.series}
            </p>

            <h1 className="font-heading text-6xl font-light">
              {product.name}
            </h1>

            <p className="mt-6 text-4xl">
              ৳ {product.price}
            </p>

            <div className="mt-8 flex items-center gap-4">

              <span className="text-neutral-500">
                Color
              </span>

              <span>
                {product.color}
              </span>

            </div>

            <div className="mt-4 flex items-center gap-4">

              <span className="text-neutral-500">
                Stock
              </span>

              {Number(product.stock) > 0 ? (
                <span className="text-green-400">
                  {product.stock} Available
                </span>
              ) : (
                <span className="text-red-400">
                  Out of Stock
                </span>
              )}

            </div>

            <div className="mt-10">

              <button
                className="w-full bg-[#f1ece4] py-5 uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
              >
                Add To Cart
              </button>

            </div>

            <div className="mt-12 border-t border-white/10 pt-8">

              <h2 className="mb-4 font-heading text-3xl">
                Description
              </h2>

              <p className="leading-8 text-neutral-400">
                {product.description}
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}