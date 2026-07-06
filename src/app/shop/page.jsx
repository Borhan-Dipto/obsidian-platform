import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import clientPromise from "../../lib/mongodb";

async function getProducts() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const products = await db
    .collection("products")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(products));
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const selectedSeries = params?.series || "All";

  const products = await getProducts();

  const seriesList = [
    "All",
    ...new Set(products.map((product) => product.series).filter(Boolean)),
  ];

  const filteredProducts =
    selectedSeries === "All"
      ? products
      : products.filter((product) => product.series === selectedSeries);

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Shop
            </p>

            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              {selectedSeries === "All" ? (
                <>
                  Engineered
                  <br />
                  Essentials
                </>
              ) : (
                selectedSeries
              )}
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600">
              Every piece is built under pressure and finished with precision.
              Minimal forms. Maximum intention.
            </p>
          </div>

          <div className="mt-14 border-y border-black/10 py-5">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {filteredProducts.length} Products
              </p>

              <div className="flex flex-wrap gap-3">
                {seriesList.map((series) => (
                  <Link
                    key={series}
                    href={
                      series === "All"
                        ? "/shop"
                        : `/shop?series=${encodeURIComponent(series)}`
                    }
                    className={`border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
                      selectedSeries === series
                        ? "border-black bg-black text-[#f1ece4]"
                        : "border-black/20 text-neutral-600 hover:bg-black hover:text-[#f1ece4]"
                    }`}
                  >
                    {series}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-12 border border-black/10 bg-[#eee7dd] p-10">
              <p className="text-neutral-600">No products found.</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block border border-black/10 bg-[#eee7dd] transition duration-300 hover:-translate-y-1 hover:border-black/25"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                          {product.series}
                        </p>

                        <h2 className="mt-3 font-heading text-3xl font-light">
                          {product.name}
                        </h2>
                      </div>

                      <p className="shrink-0 text-sm text-neutral-700">
                        ৳ {product.price}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                        {product.color}
                      </p>

                      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                        {Number(product.stock) > 0
                          ? `${product.stock} In Stock`
                          : "Out of Stock"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}