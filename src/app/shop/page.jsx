import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ShopFilters from "../../components/shop/ShopFilters";
import WishlistButton from "../../components/product/WishlistButton";
import QuickViewButton from "../../components/product/QuickViewButton";
import Reveal from "../../components/ui/Reveal";
import {
  PRODUCTS_COLLECTION_NAME,
  getCatalogDatabase,
  getPublicProductQuery,
  normalizeSeriesKey,
  normalizeSeriesName,
} from "../../lib/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

const DEFAULT_DESCRIPTION =
  "Discover premium OBSIDIAN menswear and engineered essentials built under pressure and finished with precision.";

const VALID_AVAILABILITY_FILTERS = new Set([
  "All",
  "in_stock",
  "out_of_stock",
]);

const VALID_SORT_OPTIONS = new Set([
  "newest",
  "price_low",
  "price_high",
  "name_az",
]);

function cleanText(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const cleanedValue = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedValue || fallback;
}

function normalizeComparableText(value) {
  return cleanText(value).toLocaleLowerCase("en");
}

function getSearchParam(value, fallback = "") {
  if (Array.isArray(value)) {
    return cleanText(value[0], fallback);
  }

  return cleanText(value, fallback);
}

function normalizePriceParam(value) {
  const rawValue = getSearchParam(value);

  if (!rawValue) {
    return "";
  }

  const price = Number(rawValue);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "";
  }

  return String(
    Math.round(price * 100) / 100
  );
}

function normalizeFilters(params = {}) {
  const selectedAvailability =
    getSearchParam(
      params?.availability,
      "All"
    );

  const selectedSort = getSearchParam(
    params?.sort,
    "newest"
  );

  let minimumPrice =
    normalizePriceParam(
      params?.minPrice
    );

  let maximumPrice =
    normalizePriceParam(
      params?.maxPrice
    );

  const minimumPriceNumber =
    minimumPrice === ""
      ? null
      : Number(minimumPrice);

  const maximumPriceNumber =
    maximumPrice === ""
      ? null
      : Number(maximumPrice);

  if (
    minimumPriceNumber !== null &&
    maximumPriceNumber !== null &&
    minimumPriceNumber >
      maximumPriceNumber
  ) {
    minimumPrice = String(
      maximumPriceNumber
    );

    maximumPrice = String(
      minimumPriceNumber
    );
  }

  return {
    selectedSeries: getSearchParam(
      params?.series,
      "All"
    ),

    searchQuery: getSearchParam(
      params?.q,
      ""
    ),

    selectedColor: getSearchParam(
      params?.color,
      "All"
    ),

    selectedAvailability:
      VALID_AVAILABILITY_FILTERS.has(
        selectedAvailability
      )
        ? selectedAvailability
        : "All",

    selectedSort:
      VALID_SORT_OPTIONS.has(
        selectedSort
      )
        ? selectedSort
        : "newest",

    minimumPrice,
    maximumPrice,
  };
}

function serializeData(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function getProductImage(product) {
  const image = cleanText(
    product?.image
  );

  if (!image) {
    return FALLBACK_IMAGE;
  }

  if (image.startsWith("/")) {
    return image;
  }

  try {
    const imageUrl = new URL(image);

    if (
      imageUrl.protocol === "http:" ||
      imageUrl.protocol === "https:"
    ) {
      return imageUrl.toString();
    }
  } catch {
    return FALLBACK_IMAGE;
  }

  return FALLBACK_IMAGE;
}

function getAbsoluteUrl(pathOrUrl) {
  const normalizedValue = cleanText(
    pathOrUrl,
    FALLBACK_IMAGE
  );

  try {
    const url = new URL(
      normalizedValue,
      `${SITE_URL}/`
    );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return new URL(
        FALLBACK_IMAGE,
        `${SITE_URL}/`
      ).toString();
    }

    return url.toString();
  } catch {
    return new URL(
      FALLBACK_IMAGE,
      `${SITE_URL}/`
    ).toString();
  }
}

function createProductPath(productId) {
  return `/product/${encodeURIComponent(
    String(productId)
  )}`;
}

function createMetadataDescription(value) {
  const description = cleanText(
    value,
    DEFAULT_DESCRIPTION
  );

  if (description.length <= 160) {
    return description;
  }

  return `${description
    .slice(0, 157)
    .trim()}...`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(
    /</g,
    "\\u003c"
  );
}

function createCanonicalOptions(
  products,
  field
) {
  const optionMap = new Map();

  for (const product of products) {
    const option =
      field === "series"
        ? normalizeSeriesName(
            product?.series
          )
        : cleanText(product?.[field]);

    const optionKey =
      normalizeComparableText(option);

    if (
      !option ||
      !optionKey ||
      optionMap.has(optionKey)
    ) {
      continue;
    }

    optionMap.set(
      optionKey,
      option
    );
  }

  return Array.from(
    optionMap.values()
  ).sort((first, second) =>
    first.localeCompare(second)
  );
}

function resolveFiltersAgainstCatalog(
  filters,
  products
) {
  const seriesOptions =
    createCanonicalOptions(
      products,
      "series"
    );

  const colorOptions =
    createCanonicalOptions(
      products,
      "color"
    );

  let selectedSeries =
    filters.selectedSeries;

  let selectedColor =
    filters.selectedColor;

  if (selectedSeries !== "All") {
    const selectedSeriesKey =
      normalizeSeriesKey(
        selectedSeries
      );

    const canonicalSeries =
      seriesOptions.find(
        (series) =>
          normalizeSeriesKey(series) ===
          selectedSeriesKey
      );

    if (canonicalSeries) {
      selectedSeries =
        canonicalSeries;
    }
  }

  if (selectedColor !== "All") {
    const selectedColorKey =
      normalizeComparableText(
        selectedColor
      );

    const canonicalColor =
      colorOptions.find(
        (color) =>
          normalizeComparableText(
            color
          ) === selectedColorKey
      );

    if (canonicalColor) {
      selectedColor =
        canonicalColor;
    }
  }

  return {
    filters: {
      ...filters,
      selectedSeries,
      selectedColor,
    },
    seriesOptions,
    colorOptions,
  };
}

const getProducts = cache(async () => {
  try {
    const database =
      await getCatalogDatabase();

    const products = await database
      .collection(
        PRODUCTS_COLLECTION_NAME
      )
      .find(
        getPublicProductQuery()
      )
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .toArray();

    return serializeData(
      products.filter((product) =>
        Boolean(cleanText(product?.id))
      )
    );
  } catch (error) {
    console.error(
      "Shop product lookup error:",
      error
    );

    return [];
  }
});

function createShopUrl({
  series = "All",
  q = "",
  color = "All",
  availability = "All",
  sort = "newest",
  minPrice = "",
  maxPrice = "",
}) {
  const params =
    new URLSearchParams();

  const normalizedSeries =
    cleanText(series, "All");

  const normalizedSearch =
    cleanText(q);

  const normalizedColor =
    cleanText(color, "All");

  const normalizedMinimumPrice =
    normalizePriceParam(minPrice);

  const normalizedMaximumPrice =
    normalizePriceParam(maxPrice);

  if (
    normalizedSeries &&
    normalizedSeries !== "All"
  ) {
    params.set(
      "series",
      normalizedSeries
    );
  }

  if (normalizedSearch) {
    params.set(
      "q",
      normalizedSearch
    );
  }

  if (
    normalizedColor &&
    normalizedColor !== "All"
  ) {
    params.set(
      "color",
      normalizedColor
    );
  }

  if (
    availability &&
    availability !== "All"
  ) {
    params.set(
      "availability",
      availability
    );
  }

  if (normalizedMinimumPrice) {
    params.set(
      "minPrice",
      normalizedMinimumPrice
    );
  }

  if (normalizedMaximumPrice) {
    params.set(
      "maxPrice",
      normalizedMaximumPrice
    );
  }

  if (
    sort &&
    sort !== "newest"
  ) {
    params.set("sort", sort);
  }

  const query = params.toString();

  return query
    ? `/shop?${query}`
    : "/shop";
}

function filterAndSortProducts(
  products,
  filters
) {
  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
    minimumPrice,
    maximumPrice,
  } = filters;

  const selectedSeriesKey =
    selectedSeries === "All"
      ? ""
      : normalizeSeriesKey(
          selectedSeries
        );

  const selectedColorKey =
    selectedColor === "All"
      ? ""
      : normalizeComparableText(
          selectedColor
        );

  const normalizedSearchQuery =
    normalizeComparableText(
      searchQuery
    );

  const minimumPriceNumber =
    minimumPrice === ""
      ? null
      : Number(minimumPrice);

  const maximumPriceNumber =
    maximumPrice === ""
      ? null
      : Number(maximumPrice);

  const filteredProducts =
    products.filter((product) => {
      const stock = Number(
        product?.stock || 0
      );

      const price = Number(
        product?.price || 0
      );

      const productSeriesKey =
        normalizeSeriesKey(
          product?.seriesKey ||
            product?.series
        );

      const productColorKey =
        normalizeComparableText(
          product?.color
        );

      const matchesSeries =
        !selectedSeriesKey ||
        productSeriesKey ===
          selectedSeriesKey;

      const matchesColor =
        !selectedColorKey ||
        productColorKey ===
          selectedColorKey;

      const matchesAvailability =
        selectedAvailability === "All" ||
        (selectedAvailability ===
          "in_stock" &&
          stock > 0) ||
        (selectedAvailability ===
          "out_of_stock" &&
          stock <= 0);

      const matchesMinimumPrice =
        minimumPriceNumber === null ||
        price >= minimumPriceNumber;

      const matchesMaximumPrice =
        maximumPriceNumber === null ||
        price <= maximumPriceNumber;

      const searchableText =
        normalizeComparableText(
          [
            product?.name,
            product?.series,
            product?.color,
            product?.description,
            product?.id,
          ]
            .filter(Boolean)
            .join(" ")
        );

      const matchesSearch =
        !normalizedSearchQuery ||
        searchableText.includes(
          normalizedSearchQuery
        );

      return (
        matchesSeries &&
        matchesColor &&
        matchesAvailability &&
        matchesMinimumPrice &&
        matchesMaximumPrice &&
        matchesSearch
      );
    });

  return [...filteredProducts].sort(
    (first, second) => {
      if (
        selectedSort === "price_low"
      ) {
        const priceDifference =
          Number(first?.price || 0) -
          Number(second?.price || 0);

        if (priceDifference !== 0) {
          return priceDifference;
        }
      }

      if (
        selectedSort === "price_high"
      ) {
        const priceDifference =
          Number(second?.price || 0) -
          Number(first?.price || 0);

        if (priceDifference !== 0) {
          return priceDifference;
        }
      }

      if (
        selectedSort === "name_az"
      ) {
        const nameDifference =
          cleanText(
            first?.name
          ).localeCompare(
            cleanText(second?.name)
          );

        if (nameDifference !== 0) {
          return nameDifference;
        }
      }

      const dateDifference =
        new Date(
          second?.createdAt || 0
        ).getTime() -
        new Date(
          first?.createdAt || 0
        ).getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return cleanText(
        first?.name
      ).localeCompare(
        cleanText(second?.name)
      );
    }
  );
}

function getPriceBounds(products) {
  const validPrices = products
    .map((product) =>
      Number(product?.price)
    )
    .filter(
      (price) =>
        Number.isFinite(price) &&
        price >= 0
    );

  if (validPrices.length === 0) {
    return {
      minimum: 0,
      maximum: 0,
    };
  }

  return {
    minimum: Math.min(
      ...validPrices
    ),
    maximum: Math.max(
      ...validPrices
    ),
  };
}

function getSeoConfiguration(filters) {
  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
    minimumPrice,
    maximumPrice,
  } = filters;

  const hasSearchQuery =
    Boolean(searchQuery);

  const hasColorFilter =
    selectedColor !== "All";

  const hasAvailabilityFilter =
    selectedAvailability !== "All";

  const hasCustomSort =
    selectedSort !== "newest";

  const hasMinimumPrice =
    Boolean(minimumPrice);

  const hasMaximumPrice =
    Boolean(maximumPrice);

  const hasPriceFilter =
    hasMinimumPrice ||
    hasMaximumPrice;

  const hasSeriesFilter =
    selectedSeries !== "All";

  const hasNonSeriesFilters =
    hasSearchQuery ||
    hasColorFilter ||
    hasAvailabilityFilter ||
    hasCustomSort ||
    hasPriceFilter;

  const shouldIndex =
    !hasNonSeriesFilters;

  const canonicalPath =
    hasSeriesFilter &&
    !hasNonSeriesFilters
      ? createShopUrl({
          series:
            selectedSeries,
        })
      : "/shop";

  let title = "Shop";

  if (hasSearchQuery) {
    title = `Search Results for “${searchQuery}”`;
  } else if (hasSeriesFilter) {
    title = `${selectedSeries} Collection`;
  } else if (hasColorFilter) {
    title = `${selectedColor} Products`;
  }

  let description =
    DEFAULT_DESCRIPTION;

  if (hasSearchQuery) {
    description = `Browse OBSIDIAN products matching “${searchQuery}”. Explore premium menswear built with precision and purpose.`;
  } else if (hasSeriesFilter) {
    description = `Explore the ${selectedSeries} from OBSIDIAN—premium pieces shaped by pressure, precision, and quiet confidence.`;
  } else if (hasColorFilter) {
    description = `Explore ${selectedColor} OBSIDIAN pieces designed with structure, comfort, and precision.`;
  } else if (hasPriceFilter) {
    description =
      "Explore OBSIDIAN products within your selected price range.";
  }

  return {
    title,
    description:
      createMetadataDescription(
        description
      ),
    canonicalPath,
    shouldIndex,
  };
}

export async function generateMetadata({
  searchParams,
}) {
  const params = await searchParams;

  const rawFilters =
    normalizeFilters(params);

  const products =
    await getProducts();

  const { filters } =
    resolveFiltersAgainstCatalog(
      rawFilters,
      products
    );

  const filteredProducts =
    filterAndSortProducts(
      products,
      filters
    );

  const {
    title,
    description,
    canonicalPath,
    shouldIndex,
  } = getSeoConfiguration(
    filters
  );

  const firstProduct =
    filteredProducts[0];

  const socialImage =
    getAbsoluteUrl(
      firstProduct
        ? getProductImage(
            firstProduct
          )
        : FALLBACK_IMAGE
    );

  const canonicalUrl =
    getAbsoluteUrl(
      canonicalPath
    );

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: SITE_NAME,
      url: canonicalUrl,
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

export default async function ShopPage({
  searchParams,
}) {
  const params = await searchParams;

  const rawFilters =
    normalizeFilters(params);

  const products =
    await getProducts();

  const {
    filters,
    seriesOptions,
    colorOptions,
  } =
    resolveFiltersAgainstCatalog(
      rawFilters,
      products
    );

  const {
    selectedSeries,
    searchQuery,
    selectedColor,
    selectedAvailability,
    selectedSort,
    minimumPrice,
    maximumPrice,
  } = filters;

  const filteredProducts =
    filterAndSortProducts(
      products,
      filters
    );

  const priceBounds =
    getPriceBounds(products);

  const {
    title: seoTitle,
    description:
      seoDescription,
    canonicalPath,
  } = getSeoConfiguration(
    filters
  );

  const canonicalUrl =
    getAbsoluteUrl(
      canonicalPath
    );

  const itemListElements =
    filteredProducts
      .slice(0, 100)
      .map(
        (product, index) => {
          const productName =
            cleanText(
              product?.name,
              "OBSIDIAN Product"
            );

          const productPath =
            createProductPath(
              product.id
            );

          const productUrl =
            getAbsoluteUrl(
              productPath
            );

          const productImage =
            getAbsoluteUrl(
              getProductImage(
                product
              )
            );

          const price = Number(
            product?.price || 0
          );

          const stock = Number(
            product?.stock || 0
          );

          return {
            "@type": "ListItem",
            position: index + 1,
            url: productUrl,

            item: {
              "@type": "Product",
              "@id": `${productUrl}#product`,
              name: productName,
              url: productUrl,
              image: [
                productImage,
              ],
              sku: String(
                product.id
              ),

              description:
                cleanText(
                  product?.description,
                  `${productName} by ${SITE_NAME}.`
                ),

              brand: {
                "@type": "Brand",
                name: SITE_NAME,
              },

              category:
                cleanText(
                  product?.series,
                  "OBSIDIAN"
                ),

              color: cleanText(
                product?.color,
                "Obsidian Black"
              ),

              offers: {
                "@type": "Offer",
                url: productUrl,
                priceCurrency: "BDT",
                price:
                  price.toFixed(2),

                availability:
                  stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",

                itemCondition:
                  "https://schema.org/NewCondition",
              },
            },
          };
        }
      );

  const shopPageJsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "CollectionPage",

    "@id":
      `${canonicalUrl}#webpage`,

    url: canonicalUrl,

    name:
      `${seoTitle} | ${SITE_NAME}`,

    description:
      seoDescription,

    isPartOf: {
      "@id":
        `${SITE_URL}/#website`,
    },

    about: {
      "@id":
        `${SITE_URL}/#organization`,
    },

    breadcrumb: {
      "@id":
        `${canonicalUrl}#breadcrumb`,
    },

    mainEntity: {
      "@type": "ItemList",
      "@id":
        `${canonicalUrl}#product-list`,

      name:
        selectedSeries !== "All"
          ? `${selectedSeries} Products`
          : "OBSIDIAN Products",

      numberOfItems:
        filteredProducts.length,

      itemListOrder:
        "https://schema.org/ItemListOrderAscending",

      itemListElement:
        itemListElements,
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

  if (
    selectedSeries !== "All"
  ) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: selectedSeries,

      item: getAbsoluteUrl(
        createShopUrl({
          series:
            selectedSeries,
        })
      ),
    });
  }

  const breadcrumbJsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    "@id":
      `${canonicalUrl}#breadcrumb`,

    itemListElement:
      breadcrumbItems,
  };

  let pageDescription =
    "Search, filter, and discover OBSIDIAN pieces built under pressure and finished with precision.";

  if (searchQuery) {
    pageDescription = `Showing OBSIDIAN pieces matching “${searchQuery}”.`;
  } else if (
    selectedSeries !== "All"
  ) {
    pageDescription = `Explore the ${selectedSeries}, built with pressure, precision, and purpose.`;
  }

  return (
    <main className="obsidian-catalog-page min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeJsonLd(
              shopPageJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeJsonLd(
              breadcrumbJsonLd
            ),
        }}
      />

      <Navbar />

      <section
        aria-labelledby="shop-page-title"
        className="px-4 pb-24 pt-32 sm:px-6 sm:pb-28 sm:pt-36 lg:px-10 lg:pb-36 lg:pt-40"
      >
        <div className="mx-auto max-w-[1440px]">
          <Reveal
            as="nav"
            aria-label="Breadcrumb"
            variant="fade-in"
            duration={700}
            className="mb-9 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-neutral-500 sm:mb-10 sm:tracking-[0.28em]"
          >
            <Link
              href="/"
              className="transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4]"
            >
              Home
            </Link>

            <span aria-hidden="true">
              /
            </span>

            <Link
              href="/shop"
              className={`transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4] ${
                selectedSeries === "All"
                  ? "text-[#0b0b0b]"
                  : ""
              }`}
              aria-current={
                selectedSeries === "All"
                  ? "page"
                  : undefined
              }
            >
              Shop
            </Link>

            {selectedSeries !==
            "All" ? (
              <>
                <span aria-hidden="true">
                  /
                </span>

                <span
                  className="max-w-[240px] truncate text-[#0b0b0b]"
                  aria-current="page"
                >
                  {selectedSeries}
                </span>
              </>
            ) : null}
          </Reveal>

          <Reveal
            as="header"
            variant="fade-up"
            delay={70}
            duration={900}
            className="max-w-4xl"
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.38em] text-neutral-500 sm:text-xs sm:tracking-[0.45em]">
              Shop
            </p>

            <h1
              id="shop-page-title"
              className="font-heading text-5xl font-light leading-[0.95] sm:text-6xl md:text-8xl"
            >
              {searchQuery ? (
                <>
                  Search
                  <br />
                  Results
                </>
              ) : selectedSeries ===
                "All" ? (
                <>
                  Engineered
                  <br />
                  Essentials
                </>
              ) : (
                selectedSeries
              )}
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-neutral-600 sm:mt-8 sm:text-lg">
              {pageDescription}
            </p>
          </Reveal>

          <Reveal
            variant="fade-up"
            delay={160}
            duration={850}
          >
            <ShopFilters
            initialFilters={{
              selectedSeries,
              searchQuery,
              selectedColor,
              selectedAvailability,
              selectedSort,
              minimumPrice,
              maximumPrice,
            }}
            seriesOptions={
              seriesOptions
            }
            colorOptions={
              colorOptions
            }
            resultCount={
              filteredProducts.length
            }
            totalProductCount={
              products.length
            }
              priceBounds={
                priceBounds
              }
            />
          </Reveal>

          {filteredProducts.length ===
          0 ? (
            <Reveal
              as="section"
              variant="scale"
              duration={850}
              className="mt-10 border border-black/10 bg-[#eee7dd] p-8 sm:mt-12 sm:p-10 md:p-14"
            >
              <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500 sm:text-xs sm:tracking-[0.35em]">
                No Results
              </p>

              <h2 className="mt-5 max-w-2xl font-heading text-4xl font-light leading-tight sm:text-5xl">
                No products match these filters.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                Adjust the search, series, color, availability, price range,
                or sorting option to explore more OBSIDIAN pieces.
              </p>

              <Link
                href="/shop"
                className="mt-9 inline-flex min-h-12 items-center justify-center border border-[#0b0b0b] px-7 py-3 text-center text-[10px] uppercase tracking-[0.26em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4] sm:mt-10 sm:px-8 sm:text-xs sm:tracking-[0.3em]"
              >
                Show All Products
              </Link>
            </Reveal>
          ) : (
            <Reveal
              as="section"
              aria-label="Product results"
              variant="fade-up"
              duration={850}
              className="mt-10 sm:mt-12"
            >
              <div className="grid gap-7 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(
                  (
                    product,
                    index
                  ) => {
                    const stock =
                      Number(
                        product?.stock ||
                          0
                      );

                    const productImage =
                      getProductImage(
                        product
                      );

                    const productPath =
                      createProductPath(
                        product.id
                      );

                    const productName =
                      cleanText(
                        product?.name,
                        "OBSIDIAN Product"
                      );

                    const productPrice =
                      Number(
                        product?.price ||
                          0
                      );

                    return (
                      <Reveal
                        as="article"
                        key={String(
                          product.id
                        )}
                        variant="fade-up"
                        delay={Math.min(index, 8) * 70}
                        duration={880}
                        className="obsidian-catalog-card group overflow-hidden border border-black/10 bg-[#eee7dd] focus-within:border-black/30"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                          <WishlistButton
                            product={
                              product
                            }
                            compact
                          />

                          <Link
                            href={
                              productPath
                            }
                            className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1ece4] focus-visible:ring-inset"
                            aria-label={`View ${productName}`}
                          >
                            <Image
                              src={
                                productImage
                              }
                              alt={`${productName} by ${SITE_NAME}`}
                              fill
                              priority={
                                index < 3
                              }
                              sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) 50vw, 33vw"
                              className="obsidian-catalog-media object-cover object-center"
                            />
                          </Link>

                          <QuickViewButton
                            product={
                              product
                            }
                          />

                          {stock <= 0 ? (
                            <div className="absolute left-4 top-4 z-10 bg-[#0b0b0b] px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] sm:text-[10px] sm:tracking-[0.28em]">
                              Sold Out
                            </div>
                          ) : null}

                          {stock > 0 &&
                          stock <= 5 ? (
                            <div className="absolute left-4 top-4 z-10 border border-[#f1ece4]/20 bg-black/50 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
                              Only {stock} Left
                            </div>
                          ) : null}

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-5 sm:gap-6">
                            <div className="min-w-0">
                              <p className="truncate text-[10px] uppercase tracking-[0.25em] text-neutral-500 sm:text-xs sm:tracking-[0.28em]">
                                {cleanText(
                                  product?.series,
                                  "OBSIDIAN"
                                )}
                              </p>

                              <Link
                                href={
                                  productPath
                                }
                                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#eee7dd]"
                              >
                                <h2 className="mt-3 font-heading text-3xl font-light leading-none transition duration-300 group-hover:opacity-65 sm:text-[2rem]">
                                  {
                                    productName
                                  }
                                </h2>
                              </Link>
                            </div>

                            <p className="shrink-0 text-sm text-neutral-700">
                              ৳{" "}
                              {productPrice.toLocaleString(
                                "en-BD",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>
                          </div>

                          <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-5">
                            <p className="min-w-0 truncate text-[10px] uppercase tracking-[0.22em] text-neutral-500 sm:text-xs sm:tracking-[0.25em]">
                              {cleanText(
                                product?.color,
                                "Obsidian Black"
                              )}
                            </p>

                            <p className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-neutral-500 sm:text-xs sm:tracking-[0.25em]">
                              {stock > 0
                                ? `${stock} In Stock`
                                : "Out of Stock"}
                            </p>
                          </div>
                        </div>
                      </Reveal>
                    );
                  }
                )}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
