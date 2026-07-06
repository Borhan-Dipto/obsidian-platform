import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import ProductActions from "../../../components/product/ProductActions";
import RelatedProducts from "../../../components/product/RelatedProducts";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";

async function getProduct(id) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const product = await db.collection("products").findOne({ id });

  if (!product) return null;

  return JSON.parse(JSON.stringify(product));
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-32">
          <div className="text-center">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Product
            </p>

            <h1 className="font-heading text-5xl font-light">
              Product not found.
            </h1>

            <Link
              href="/shop"
              className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            >
              Back To Shop
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  const stock = Number(product.stock || 0);

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-32 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10">
            <Link
              href="/shop"
              className="text-xs uppercase tracking-[0.35em] text-neutral-500 transition hover:text-black"
            >
              ← Back to Shop
            </Link>
          </div>

          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="space-y-6">
              <div className="overflow-hidden border border-black/10 bg-[#eee7dd]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[4/5] w-full object-cover object-center transition duration-700 hover:scale-105"
                />
              </div>
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                {product.series || "Obsidian"}
              </p>

              <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
                {product.name}
              </h1>

              <p className="mt-8 text-3xl font-light">৳ {product.price}</p>

              <p className="mt-8 max-w-xl text-base leading-8 text-neutral-600">
                {product.description ||
                  "A refined essential built with pressure, precision, and purpose."}
              </p>

              <div className="mt-10 space-y-5 border-y border-black/10 py-7 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Color</span>
                  <span>{product.color || "Obsidian Black"}</span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Stock</span>

                  {stock > 0 ? (
                    <span>{stock} Available</span>
                  ) : (
                    <span className="text-red-700">Out of Stock</span>
                  )}
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Series</span>
                  <span>{product.series || "Artifact Series"}</span>
                </div>
              </div>

              <ProductActions product={product} />

              <div className="mt-10 grid gap-3 border-t border-black/10 pt-8 text-sm text-neutral-600 sm:grid-cols-2">
                <p>✓ Premium Cotton</p>
                <p>✓ Oversized Fit</p>
                <p>✓ Cash On Delivery</p>
                <p>✓ Easy Exchange</p>
                <p>✓ 2-5 Days Delivery</p>
              </div>

              <div className="mt-12 space-y-6 border-t border-black/10 pt-8">
                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Details
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    Premium everyday essential designed for structure, comfort,
                    and quiet confidence.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Delivery
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    Inside Bangladesh delivery available. Order confirmation will
                    be handled after checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RelatedProducts currentProductId={product.id} />

      <Footer />
    </main>
  );
}