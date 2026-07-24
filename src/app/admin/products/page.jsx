import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../lib/adminAuth";
import ProductSearchTable from "../../../components/admin/ProductSearchTable";

async function getProducts() {
  const client = await clientPromise;
  const db = client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );

  const products = await db
    .collection("products")
    .find({})
    .sort({
      createdAt: -1,
    })
    .toArray();

  return JSON.parse(
    JSON.stringify(products)
  );
}

export default async function AdminProductsPage() {
  await requireAdminPermission({
    products: [
      "read_private",
    ],
  });

  const [
    products,
    canCreateProducts,
  ] = await Promise.all([
    getProducts(),

    hasAdminPermission({
      products: [
        "create",
      ],
    }),
  ]);

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
            {canCreateProducts ? (
              <Link
                href="/admin/products/new"
                className="bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
              >
                Add Product
              </Link>
            ) : null}

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
          <ProductSearchTable
            products={products}
          />
        )}
      </div>
    </main>
  );
}