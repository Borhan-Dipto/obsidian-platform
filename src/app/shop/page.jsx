import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import WishlistButton from "../../components/product/WishlistButton";
import QuickViewButton from "../../components/product/QuickViewButton";
import clientPromise from "../../lib/mongodb";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

const DEFAULT_DESCRIPTION =
  "Discover premium OBSIDIAN menswear and engineered essentials built under pressure and finished with precision.";

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function getSearchParam(value, fallback = "") {
  if (Array.isArray(value)) {
    return cleanText(value[0], fallback);
  }

  return cleanText(value, fallback);
}

function normalizeFilters(params = {}) {
  return {
    selectedSeries: getSearchParam(params?.series, "All"),
    searchQuery: getSearchParam(params?.q, ""),
    selectedColor: getSearchParam(params?.color, "All"),
    selectedAvailability: getSearchParam(
      params?.availability,
      "All"
    ),
    selectedSort: getSearchParam(params?.sort, "newest"),
  };
}

const getProducts = cache(async () => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const products = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Shop product lookup error:", error);
    return [];
  }
});

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
  return cleanText(product?.image, FALLBACK_IMAGE);
}

function getAbsoluteUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl, `${SITE_URL}/`).toString();
  } catch {
    return new URL(FALLBACK_IMAGE, `${SITE_URL}/`).toString();
  }
}

function createProductPath(productId) {
  return `/product/${encodeURIComponent(String(productId))}`;
}

function createMetadataDescription(value) {
  const description = cleanText(value, DEFAULT_DESCRIPTION);

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trim()}...`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function filterAndSortProducts(products, filters) {
  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
  } = filters;

  const normalizedSearchQuery = searchQuery.toLowerCase();

  const filteredProducts = products.filter((product) => {
    const stock = Number(product.stock) || 0;

    const matchesSeries =
      selectedSeries === "All" ||
      product.series === selectedSeries;

    const matchesColor =
      selectedColor === "All" ||
      product.color === selectedColor;

    const matchesAvailability =
      selectedAvailability === "All" ||
      (selectedAvailability === "in_stock" && stock > 0) ||
      (selectedAvailability === "out_of_stock" && stock <= 0);

    const searchableText = [
      product.name,
      product.series,
      product.color,
      product.description,
      product.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearchQuery ||
      searchableText.includes(normalizedSearchQuery);

    return (
      matchesSeries &&
      matchesColor &&
      matchesAvailability &&
      matchesSearch
    );
  });

  return [...filteredProducts].sort((a, b) => {
    if (selectedSort === "price_low") {
      return Number(a.price || 0) - Number(b.price || 0);
    }

    if (selectedSort === "price_high") {
      return Number(b.price || 0) - Number(a.price || 0);
    }

    if (selectedSort === "name_az") {
      return String(a.name || "").localeCompare(
        String(b.name || "")
      );
    }

    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });
}

function getSeoConfiguration(filters) {
  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
  } = filters;

  const hasSearchQuery = Boolean(searchQuery);

  const hasColorFilter = selectedColor !== "All";

  const hasAvailabilityFilter =
    selectedAvailability !== "All";

  const hasCustomSort = selectedSort !== "newest";

  const hasSeriesFilter = selectedSeries !== "All";

  const hasNonSeriesFilters =
    hasSearchQuery ||
    hasColorFilter ||
    hasAvailabilityFilter ||
    hasCustomSort;

  const shouldIndex = !hasNonSeriesFilters;

  const canonicalPath =
    hasSeriesFilter && !hasNonSeriesFilters
      ? createShopUrl({ series: selectedSeries })
      : "/shop";

  let title = "Shop";

  if (hasSearchQuery) {
    title = `Search Results for “${searchQuery}”`;
  } else if (hasSeriesFilter) {
    title = `${selectedSeries} Collection`;
  } else if (hasColorFilter) {
    title = `${selectedColor} Products`;
  }

  let description = DEFAULT_DESCRIPTION;

  if (hasSearchQuery) {
    description = `Browse OBSIDIAN products matching “${searchQuery}”. Explore premium menswear built with precision and purpose.`;
  } else if (hasSeriesFilter) {
    description = `Explore the ${selectedSeries} from OBSIDIAN—premium pieces shaped by pressure, precision, and quiet confidence.`;
  } else if (hasColorFilter) {
    description = `Explore ${selectedColor} OBSIDIAN pieces designed with structure, comfort, and precision.`;
  }

  return {
    title,
    description: createMetadataDescription(description),
    canonicalPath,
    shouldIndex,
  };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const filters = normalizeFilters(params);
  const products = await getProducts();
  const filteredProducts = filterAndSortProducts(
    products,
    filters
  );

  const {
    title,
    description,
    canonicalPath,
    shouldIndex,
  } = getSeoConfiguration(filters);

  const firstProduct = filteredProducts[0];

  const socialImage = firstProduct
    ? getProductImage(firstProduct)
    : FALLBACK_IMAGE;

  return {
    title,

    description,

    alternates: {
      canonical: canonicalPath,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: SITE_NAME,
      url: canonicalPath,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 1500,
          alt: firstProduct?.name
            ? `${firstProduct.name} by ${SITE_NAME}`
            : `${SITE_NAME} premium menswear`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [socialImage],
    },

    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const filters = normalizeFilters(params);

  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
  } = filters;

  const products = await getProducts();

  const seriesList = [
    "All",
    ...new Set(
      products
        .map((product) => cleanText(product.series))
        .filter(Boolean)
    ),
  ];

  const colorList = [
    "All",
    ...new Set(
      products
        .map((product) => cleanText(product.color))
        .filter(Boolean)
    ),
  ];

  const filteredProducts = filterAndSortProducts(
    products,
    filters
  );

  const {
    title: seoTitle,
    canonicalPath,
  } = getSeoConfiguration(filters);

  const canonicalUrl = getAbsoluteUrl(canonicalPath);

  const itemListElements = filteredProducts
    .filter((product) => product?.id)
    .slice(0, 100)
    .map((product, index) => {
      const productName = cleanText(
        product.name,
        "OBSIDIAN Product"
      );

      const productPath = createProductPath(product.id);
      const productUrl = getAbsoluteUrl(productPath);
      const productImage = getAbsoluteUrl(
        getProductImage(product)
      );

      const price = Number(product.price) || 0;
      const stock = Number(product.stock) || 0;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: productUrl,
        item: {
          "@type": "Product",
          "@id": `${productUrl}#product`,
          name: productName,
          url: productUrl,
          image: [productImage],
          sku: String(product.id),
          description: cleanText(
            product.description,
            `${productName} by ${SITE_NAME}.`
          ),
          brand: {
            "@type": "Brand",
            name: SITE_NAME,
          },
          category: cleanText(
            product.series,
            "OBSIDIAN"
          ),
          color: cleanText(
            product.color,
            "Obsidian Black"
          ),
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "BDT",
            price: price.toFixed(2),
            availability:
              stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition:
              "https://schema.org/NewCondition",
          },
        },
      };
    });

  const shopPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: `${seoTitle} | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
    mainEntity: {
      "@type": "ItemList",
      "@id": `${canonicalUrl}#product-list`,
      name:
        selectedSeries !== "All"
          ? `${selectedSeries} Products`
          : "OBSIDIAN Products",
      numberOfItems: filteredProducts.length,
      itemListOrder:
        "https://schema.org/ItemListOrderAscending",
      itemListElement: itemListElements,
    },
    inLanguage: "en-BD",
  };

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Shop",
      item: `${SITE_URL}/shop`,
    },
  ];

  if (selectedSeries !== "All") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: selectedSeries,
      item: getAbsoluteUrl(
        createShopUrl({ series: selectedSeries })
      ),
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  const activeFilterCount = [
    selectedSeries !== "All",
    Boolean(searchQuery),
    selectedColor !== "All",
    selectedAvailability !== "All",
    selectedSort !== "newest",
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(shopPageJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link
              href="/"
              className="transition hover:text-black"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <Link
              href="/shop"
              className={`transition hover:text-black ${
                selectedSeries === "All"
                  ? "text-[#0b0b0b]"
                  : ""
              }`}
              aria-current={
                selectedSeries === "All" ? "page" : undefined
              }
            >
              Shop
            </Link>

            {selectedSeries !== "All" && (
              <>
                <span aria-hidden="true">/</span>

                <span
                  className="max-w-[240px] truncate text-[#0b0b0b]"
                  aria-current="page"
                >
                  {selectedSeries}
                </span>
              </>
            )}
          </nav>

          <div className="max-w-4xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Shop
            </p>

            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              {searchQuery ? (
                <>
                  Search
                  <br />
                  Results
                </>
              ) : selectedSeries === "All" ? (
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
              {searchQuery
                ? `Showing OBSIDIAN pieces matching “${searchQuery}”.`
                : selectedSeries !== "All"
                  ? `Explore the ${selectedSeries}, built with pressure, precision, and purpose.`
                  : "Search, filter, and discover OBSIDIAN pieces built under pressure and finished with precision."}
            </p>

            {activeFilterCount > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <p className="mr-2 text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  Active Filters
                </p>

                {selectedSeries !== "All" && (
                  <span className="border border-black/15 bg-[#eee7dd] px-4 py-2 text-[10px] uppercase tracking-[0.23em]">
                    {selectedSeries}
                  </span>
                )}

                {searchQuery && (
                  <span className="border border-black/15 bg-[#eee7dd] px-4 py-2 text-[10px] uppercase tracking-[0.23em]">
                    Search: {searchQuery}
                  </span>
                )}

                {selectedColor !== "All" && (
                  <span className="border border-black/15 bg-[#eee7dd] px-4 py-2 text-[10px] uppercase tracking-[0.23em]">
                    {selectedColor}
                  </span>
                )}

                {selectedAvailability !== "All" && (
                  <span className="border border-black/15 bg-[#eee7dd] px-4 py-2 text-[10px] uppercase tracking-[0.23em]">
                    {selectedAvailability === "in_stock"
                      ? "In Stock"
                      : "Sold Out"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-14 border-y border-black/10 py-6">
            <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search product, color, series..."
                aria-label="Search products"
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-sm outline-none transition placeholder:text-neutral-500 focus:border-black"
              />

              <select
                name="series"
                defaultValue={selectedSeries}
                aria-label="Filter by series"
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
                aria-label="Filter by color"
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
                aria-label="Sort products"
                className="border border-black/15 bg-[#eee7dd] px-5 py-4 text-xs uppercase tracking-[0.2em] outline-none transition focus:border-black"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price Low</option>
                <option value="price_high">Price High</option>
                <option value="name_az">Name A–Z</option>
              </select>

              <button
                type="submit"
                className="bg-[#0b0b0b] px-8 py-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Apply
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <p
                className="text-xs uppercase tracking-[0.3em] text-neutral-500"
                aria-live="polite"
              >
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "Product"
                  : "Products"}
              </p>

              <div className="flex flex-wrap gap-3">
                {["All", "in_stock", "out_of_stock"].map(
                  (availability) => (
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
                  )
                )}

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
                Try adjusting your search, series, color,
                availability, or sorting option.
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

                const productImage =
                  getProductImage(product);

                const productPath = createProductPath(
                  product.id
                );

                const productName = cleanText(
                  product.name,
                  "OBSIDIAN Product"
                );

                const productPrice =
                  Number(product.price) || 0;

                return (
                  <article
                    key={String(product.id)}
                    className="group overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                      <WishlistButton
                        product={product}
                        compact
                      />

                      <Link
                        href={productPath}
                        className="relative block h-full w-full"
                        aria-label={`View ${productName}`}
                      >
                        <Image
                          src={productImage}
                          alt={`${productName} by ${SITE_NAME}`}
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
                            {cleanText(
                              product.series,
                              "OBSIDIAN"
                            )}
                          </p>

                          <Link href={productPath}>
                            <h2 className="mt-3 font-heading text-3xl font-light leading-none transition duration-300 group-hover:opacity-65">
                              {productName}
                            </h2>
                          </Link>
                        </div>

                        <p className="shrink-0 text-sm text-neutral-700">
                          ৳{" "}
                          {productPrice.toLocaleString(
                            "en-BD"
                          )}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-5">
                        <p className="truncate text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {cleanText(
                            product.color,
                            "Obsidian Black"
                          )}
                        </p>

                        <p className="shrink-0 text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {stock > 0
                            ? `${stock} In Stock`
                            : "Out of Stock"}
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