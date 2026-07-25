import Image from "next/image";
import Link from "next/link";
import clientPromise from "../../../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../../lib/adminAuth";

async function getProduct(id) {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const product = await db
    .collection("products")
    .findOne({ id });

  if (!product) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(product)
  );
}

export default async function ProductDetailsPage({
  params,
}) {
  await requireAdminPermission({
    products: ["read_private"],
  });

  const { id } = await params;

  const [
    product,
    canUpdateProduct,
  ] = await Promise.all([
    getProduct(id),

    hasAdminPermission({
      products: ["update"],
    }),
  ]);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-[#f1ece4]">
        <div className="text-center">
          <p className="mb-6 text-neutral-400">
            Product not found.
          </p>

          <Link
            href="/admin/products"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/products"
            className="text-xs uppercase tracking-[0.35em] text-neutral-500 transition hover:text-white"
          >
            ← Back to Products
          </Link>

          {canUpdateProduct ? (
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="w-fit bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
            >
              Edit Product
            </Link>
          ) : (
            <span className="w-fit border border-white/10 bg-white/[0.025] px-5 py-3 text-xs uppercase tracking-[0.25em] text-neutral-600">
              Read Only
            </span>
          )}
        </div>

        <div className="grid gap-14 lg:grid-cols-2">
          <div className="overflow-hidden border border-white/10 bg-white/5">
            <Image
              src={product.image}
              alt={product.name}
              width={1200}
              height={1500}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-neutral-500">
              {product.series}
            </p>

            <h1 className="font-heading text-6xl font-light">
              {product.name}
            </h1>

            <p className="mt-6 text-4xl">
              ৳ {product.price}
            </p>

            <div className="mt-8 space-y-4 border-y border-white/10 py-8">
              <div className="flex items-center gap-4">
                <span className="w-24 text-neutral-500">
                  Product ID
                </span>

                <span>
                  {product.id}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-24 text-neutral-500">
                  Color
                </span>

                <span>
                  {product.color}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-24 text-neutral-500">
                  Stock
                </span>

                {Number(
                  product.stock
                ) > 0 ? (
                  <span className="text-green-400">
                    {product.stock} Available
                  </span>
                ) : (
                  <span className="text-red-400">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            <div className="mt-12">
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