import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import WishlistButton from "../../components/product/WishlistButton";
import QuickViewButton from "../../components/product/QuickViewButton";
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

function createShopUrl({
  series = "All",
  q = "",
  color = "All",
  availability = "All",
  sort = "newest",
}) {
  const params = new URLSearchParams();

  if (series && series !== "All") {
    params.set("series", series);
  }

  if (q) {
    params.set("q", q);
  }

  if (color && color !== "All") {
    params.set("color", color);
  }

  if (availability && availability !== "All") {
    params.set("availability", availability);
  }

  if (sort && sort !== "newest") {
    params.set("sort", sort);
  }

  const query = params.toString();

  return query ? `/shop?${query}` : "/shop";
}

function getProductImage(product) {
  if (typeof product?.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  return "/images/collection-artifact.jpeg";
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;

  const selectedSeries = params?.series || "All";
  const searchQuery = String(params?.q || "").trim();
  const selectedColor = params?.color || "All";
  const selectedAvailability = params?.availability || "All";
  const selectedSort = params?.sort || "newest";

  const products = await getProducts();

  const seriesList = [
    "All",
    ...new Set(products.map((product) => product.series).filter(Boolean)),
  ];

  const colorList = [
    "All",
    ...new Set(products.map((product) => product.color).filter(Boolean)),
  ];

  let filteredProducts = products.filter((product) => {
    const stock = Number(product.stock) || 0;

    const matchesSeries =
      selectedSeries === "All" || product.series === selectedSeries;

    const matchesColor =
      selectedColor === "All" || product.color === selectedColor;

    const matchesAvailability =
      selectedAvailability === "All" ||
      (selectedAvailability === "in_stock" && stock > 0) ||
      (selectedAvailability === "out_of_stock" && stock <= 0);

    const searchableText = [
      product.name,
      product.series,
      product.color,
      product.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !searchQuery || searchableText.includes(searchQuery.toLowerCase());

    return (
      matchesSeries &&
      matchesColor &&
      matchesAvailability &&
      matchesSearch
    );
  });

  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (selectedSort === "price_low") {
      return Number(a.price || 0) - Number(b.price || 0);
    }

    if (selectedSort === "price_high") {
      return Number(b.price || 0) - Number(a.price || 0);
    }

    if (selectedSort === "name_az") {
      return String(a.name || "").localeCompare(String(b.name || ""));
    }

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

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
              Search, filter, and discover OBSIDIAN pieces built under pressure
              and finished with precision.
            </p>
          </div>

          <div className="mt-14 border-y border-black/10 py-6">
            <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search product, color, series..."
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-sm outline-none transition placeholder:text-neutral-500 focus:border-black"
              />

              <select
                name="series"
                defaultValue={selectedSeries}
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-xs uppercase tracking-[0.2em] outline-none transition focus:border-black"
              >
                {seriesList.map((series) => (
                  <option key={series} value={series}>
                    {series}
                  </option>
                ))}
              </select>

              <select
                name="color"
                defaultValue={selectedColor}
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-xs uppercase tracking-[0.2em] outline-none transition focus:border-black"
              >
                {colorList.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>

              <select
                name="sort"
                defaultValue={selectedSort}
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-xs uppercase tracking-[0.2em] outline-none transition focus:border-black"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price Low</option>
                <option value="price_high">Price High</option>
                <option value="name_az">Name A-Z</option>
              </select>

              <button
                type="submit"
                className="bg-[#0b0b0b] px-8 py-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Apply
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {filteredProducts.length} Products
              </p>

              <div className="flex flex-wrap gap-3">
                {["All", "in_stock", "out_of_stock"].map((availability) => (
                  <Link
                    key={availability}
                    href={createShopUrl({
                      series: selectedSeries,
                      q: searchQuery,
                      color: selectedColor,
                      availability,
                      sort: selectedSort,
                    })}
                    className={`border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
                      selectedAvailability === availability
                        ? "border-black bg-black text-[#f1ece4]"
                        : "border-black/20 text-neutral-600 hover:bg-black hover:text-[#f1ece4]"
                    }`}
                  >
                    {availability === "All"
                      ? "All"
                      : availability === "in_stock"
                        ? "In Stock"
                        : "Sold Out"}
                  </Link>
                ))}

                <Link
                  href="/wishlist"
                  className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.25em] text-neutral-600 transition hover:bg-black hover:text-[#f1ece4]"
                >
                  Wishlist
                </Link>

                <Link
                  href="/shop"
                  className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.25em] text-neutral-600 transition hover:bg-black hover:text-[#f1ece4]"
                >
                  Reset
                </Link>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-12 border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                No Results
              </p>

              <h2 className="mt-5 font-heading text-4xl font-light">
                No products found.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                Try adjusting your search, series, color, availability, or sort
                option.
              </p>

              <Link
                href="/shop"
                className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Reset Shop
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => {
                const stock = Number(product.stock) || 0;
                const productImage = getProductImage(product);

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                      <WishlistButton product={product} compact />

                      <Link
                        href={`/product/${product.id}`}
                        className="relative block h-full w-full"
                        aria-label={`View ${product.name}`}
                      >
                        <Image
                          src={productImage}
                          alt={product.name || "Obsidian product"}
                          fill
                          priority={index < 3}
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-1000 ease-out will-change-transform group-hover:scale-105"
                        />
                      </Link>

                      <QuickViewButton product={product} />

                      {stock <= 0 && (
                        <div className="absolute left-4 top-4 z-10 bg-[#0b0b0b] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f1ece4]">
                          Sold Out
                        </div>
                      )}

                      {stock > 0 && stock <= 5 && (
                        <div className="absolute left-4 top-4 z-10 border border-[#f1ece4]/20 bg-black/45 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
                          Only {stock} Left
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <p className="truncate text-xs uppercase tracking-[0.28em] text-neutral-500">
                            {product.series || "Obsidian"}
                          </p>

                          <Link href={`/product/${product.id}`}>
                            <h2 className="mt-3 font-heading text-3xl font-light leading-none transition duration-300 group-hover:opacity-65">
                              {product.name}
                            </h2>
                          </Link>
                        </div>

                        <p className="shrink-0 text-sm text-neutral-700">
                          ৳ {Number(product.price) || 0}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-5">
                        <p className="truncate text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {product.color || "Obsidian Black"}
                        </p>

                        <p className="shrink-0 text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {stock > 0 ? `${stock} In Stock` : "Out of Stock"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}