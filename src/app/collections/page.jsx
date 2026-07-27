import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Reveal from "../../components/ui/Reveal";
import {
  COLLECTIONS_COLLECTION_NAME,
  PRODUCTS_COLLECTION_NAME,
  getCatalogDatabase,
  getPublicProductQuery,
  normalizeSeriesKey,
  normalizeSeriesName,
} from "../../lib/catalog";
import { getCollectionsContent } from "../../lib/getCmsContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const DEFAULT_PAGE_DESCRIPTION =
  "Explore OBSIDIAN collections shaped around pressure, precision, minimal form, and quiet strength.";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

const DEFAULT_CONTENT = {
  breadcrumbHomeLabel: "Home",
  breadcrumbCurrentLabel: "Collections",

  eyebrow: "Collections",
  title: "All Collections",
  description:
    "Explore the core OBSIDIAN series—each shaped around pressure, precision, restraint, and quiet strength.",

  metaLabel: "Built Under Pressure",

  showCollectionCount: true,
  collectionCountSingular: "Collection",
  collectionCountPlural: "Collections",

  showSeriesIndex: true,
  showFeaturedBadge: true,
  showDescription: true,

  seriesLabelPrefix: "Series",
  featuredBadgeText: "Featured",
  cardHoverButtonText: "View Products",
  cardFooterText: "Explore Collection",

  emptyStateEyebrow: "Collections",
  emptyStateTitle: "No collections are available right now.",
  emptyStateDescription:
    "New OBSIDIAN collections are being prepared. Explore the current product selection while the next series takes shape.",
  emptyStateButtonText: "Explore Shop",
  emptyStateButtonHref: "/shop",
};

function normalizeText(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const normalizedValue = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedValue || fallback;
}

function normalizeMultilineText(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const normalizedValue = String(value)
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalizedValue || fallback;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function mergeContent(defaultContent, savedContent) {
  if (!isPlainObject(savedContent)) {
    return { ...defaultContent };
  }

  return {
    ...defaultContent,
    ...savedContent,
  };
}

function serializeData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeImageSource(value, fallback = FALLBACK_IMAGE) {
  const imageSource = normalizeText(value);

  if (!imageSource) {
    return fallback;
  }

  if (imageSource.startsWith("/")) {
    return imageSource;
  }

  try {
    const imageUrl = new URL(imageSource);

    if (
      imageUrl.protocol === "http:" ||
      imageUrl.protocol === "https:"
    ) {
      return imageUrl.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeLinkHref(value, fallback = "/") {
  const href = normalizeText(value);

  if (!href) {
    return fallback;
  }

  if (
    href.startsWith("/") ||
    href.startsWith("#")
  ) {
    return href;
  }

  try {
    const url = new URL(href);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return url.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function getCollectionImage(collection) {
  return normalizeImageSource(
    collection?.coverImage,
    FALLBACK_IMAGE
  );
}

function getAbsoluteUrl(pathOrUrl) {
  const normalizedValue = normalizeText(
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
      return `${SITE_URL}${FALLBACK_IMAGE}`;
    }

    return url.toString();
  } catch {
    return `${SITE_URL}${FALLBACK_IMAGE}`;
  }
}

function createCollectionShopPath(series) {
  return `/shop?series=${encodeURIComponent(
    normalizeSeriesName(series)
  )}`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(
    /</g,
    "\\u003c"
  );
}

function renderMultilineTitle(title) {
  const lines = String(title || "")
    .split(/\n|<br\s*\/?>/i)
    .map((line) =>
      line.replace(/\s+/g, " ").trim()
    )
    .filter(Boolean);

  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}

      {index < lines.length - 1 ? (
        <br />
      ) : null}
    </span>
  ));
}

function getCollectionIdentifier(
  collection,
  index
) {
  if (collection?._id) {
    return String(collection._id);
  }

  const seriesKey = normalizeSeriesKey(
    collection?.series
  );

  return (
    collection?.virtualId ||
    `${seriesKey || "collection"}-${index}`
  );
}

function getCollectionSortTimestamp(collection) {
  const date = new Date(
    collection?.createdAt ||
      collection?.updatedAt ||
      0
  );

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();
}

function sortCollections(collections) {
  return [...collections].sort(
    (first, second) => {
      const firstOrder = Number(
        first?.displayOrder || 0
      );

      const secondOrder = Number(
        second?.displayOrder || 0
      );

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      const timeDifference =
        getCollectionSortTimestamp(second) -
        getCollectionSortTimestamp(first);

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return normalizeText(
        first?.title
      ).localeCompare(
        normalizeText(second?.title)
      );
    }
  );
}

function createVirtualCollection(
  product,
  displayOrder
) {
  const series = normalizeSeriesName(
    product?.series
  );

  const productDescription = normalizeText(
    product?.description
  );

  return {
    virtualId: `product-series:${normalizeSeriesKey(
      series
    )}`,

    title: series,
    series,
    seriesKey: normalizeSeriesKey(series),

    description:
      productDescription ||
      `Explore the ${series}, shaped by pressure, precision, restraint, and quiet confidence.`,

    coverImage: normalizeImageSource(
      product?.image,
      FALLBACK_IMAGE
    ),

    displayOrder,
    isActive: true,
    isFeatured: false,
    isAutoGenerated: true,
    isVirtual: true,

    createdAt:
      product?.createdAt || new Date(0),
    updatedAt:
      product?.updatedAt ||
      product?.createdAt ||
      new Date(0),
  };
}

async function getCollections() {
  try {
    const database =
      await getCatalogDatabase();

    const [storedCollections, products] =
      await Promise.all([
        database
          .collection(
            COLLECTIONS_COLLECTION_NAME
          )
          .find({})
          .sort({
            displayOrder: 1,
            createdAt: -1,
          })
          .toArray(),

        database
          .collection(
            PRODUCTS_COLLECTION_NAME
          )
          .find(
            getPublicProductQuery({
              series: {
                $type: "string",
                $ne: "",
              },
            }),
            {
              projection: {
                id: 1,
                name: 1,
                series: 1,
                seriesKey: 1,
                image: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            }
          )
          .sort({
            createdAt: -1,
          })
          .toArray(),
      ]);

    /*
     * Every stored collection is recorded here,
     * including hidden collections. This prevents
     * a hidden series from being recreated publicly
     * by the product fallback below.
     */
    const knownSeriesKeys = new Set();

    for (const collection of storedCollections) {
      const seriesKey = normalizeSeriesKey(
        collection?.seriesKey ||
          collection?.series
      );

      if (seriesKey) {
        knownSeriesKeys.add(seriesKey);
      }
    }

    const publicCollections = [];
    const visibleSeriesKeys = new Set();

    for (const collection of storedCollections) {
      if (collection?.isActive === false) {
        continue;
      }

      const series = normalizeSeriesName(
        collection?.series ||
          collection?.title
      );

      const seriesKey = normalizeSeriesKey(
        collection?.seriesKey || series
      );

      if (
        !series ||
        !seriesKey ||
        visibleSeriesKeys.has(seriesKey)
      ) {
        continue;
      }

      visibleSeriesKeys.add(seriesKey);

      publicCollections.push({
        ...collection,
        series,
        seriesKey,
        coverImage: normalizeImageSource(
          collection?.coverImage,
          FALLBACK_IMAGE
        ),
        isActive: true,
        isFeatured:
          collection?.isFeatured === true,
      });
    }

    const highestDisplayOrder =
      publicCollections.reduce(
        (highestOrder, collection) => {
          const currentOrder = Number(
            collection?.displayOrder || 0
          );

          return Number.isFinite(currentOrder)
            ? Math.max(
                highestOrder,
                currentOrder
              )
            : highestOrder;
        },
        0
      );

    let fallbackOffset = 1;

    for (const product of products) {
      const series = normalizeSeriesName(
        product?.series
      );

      const seriesKey = normalizeSeriesKey(
        product?.seriesKey || series
      );

      if (
        !series ||
        !seriesKey ||
        knownSeriesKeys.has(seriesKey) ||
        visibleSeriesKeys.has(seriesKey)
      ) {
        continue;
      }

      const virtualCollection =
        createVirtualCollection(
          {
            ...product,
            series,
            seriesKey,
          },
          highestDisplayOrder +
            fallbackOffset
        );

      fallbackOffset += 1;
      knownSeriesKeys.add(seriesKey);
      visibleSeriesKeys.add(seriesKey);
      publicCollections.push(
        virtualCollection
      );
    }

    return serializeData(
      sortCollections(publicCollections)
    );
  } catch (error) {
    console.error(
      "Collections lookup error:",
      error
    );

    return [];
  }
}

export async function generateMetadata() {
  const collectionsContent =
    await getCollectionsContent();

  const seo = collectionsContent?.seo || {};

  const title = normalizeText(
    seo.title,
    "Collections"
  );

  const description = normalizeText(
    seo.description,
    DEFAULT_PAGE_DESCRIPTION
  );

  const canonicalPath = normalizeLinkHref(
    seo.canonical,
    "/collections"
  );

  const canonicalUrl =
    getAbsoluteUrl(canonicalPath);

  const socialImage = getAbsoluteUrl(
    normalizeImageSource(
      seo.ogImage,
      FALLBACK_IMAGE
    )
  );

  const allowIndexing =
    seo.index !== false;

  const keywords = normalizeText(
    seo.keywords
  )
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords:
      keywords.length > 0
        ? keywords
        : undefined,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,

      images: [
        {
          url: socialImage,
          width: 1200,
          height: 1500,
          alt: `${SITE_NAME} premium fashion collections`,
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
      index: allowIndexing,
      follow: allowIndexing,

      googleBot: {
        index: allowIndexing,
        follow: allowIndexing,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function CollectionsPage() {
  const [collections, collectionsDocument] =
    await Promise.all([
      getCollections(),
      getCollectionsContent(),
    ]);

  const content = mergeContent(
    DEFAULT_CONTENT,
    collectionsDocument?.content || {}
  );

  const seo = collectionsDocument?.seo || {};

  const breadcrumbHomeLabel =
    normalizeText(
      content.breadcrumbHomeLabel,
      DEFAULT_CONTENT.breadcrumbHomeLabel
    );

  const breadcrumbCurrentLabel =
    normalizeText(
      content.breadcrumbCurrentLabel,
      DEFAULT_CONTENT.breadcrumbCurrentLabel
    );

  const eyebrow = normalizeText(
    content.eyebrow,
    DEFAULT_CONTENT.eyebrow
  );

  const title = normalizeMultilineText(
    content.title,
    DEFAULT_CONTENT.title
  );

  const description = normalizeText(
    content.description,
    DEFAULT_CONTENT.description
  );

  const metaLabel = normalizeText(
    content.metaLabel,
    DEFAULT_CONTENT.metaLabel
  );

  const showCollectionCount =
    normalizeBoolean(
      content.showCollectionCount,
      true
    );

  const collectionCountSingular =
    normalizeText(
      content.collectionCountSingular,
      DEFAULT_CONTENT.collectionCountSingular
    );

  const collectionCountPlural =
    normalizeText(
      content.collectionCountPlural,
      DEFAULT_CONTENT.collectionCountPlural
    );

  const showSeriesIndex =
    normalizeBoolean(
      content.showSeriesIndex,
      true
    );

  const showFeaturedBadge =
    normalizeBoolean(
      content.showFeaturedBadge,
      true
    );

  const showDescription =
    normalizeBoolean(
      content.showDescription,
      true
    );

  const seriesLabelPrefix =
    normalizeText(
      content.seriesLabelPrefix,
      DEFAULT_CONTENT.seriesLabelPrefix
    );

  const featuredBadgeText =
    normalizeText(
      content.featuredBadgeText,
      DEFAULT_CONTENT.featuredBadgeText
    );

  const cardHoverButtonText =
    normalizeText(
      content.cardHoverButtonText,
      DEFAULT_CONTENT.cardHoverButtonText
    );

  const cardFooterText =
    normalizeText(
      content.cardFooterText,
      DEFAULT_CONTENT.cardFooterText
    );

  const emptyStateEyebrow =
    normalizeText(
      content.emptyStateEyebrow,
      DEFAULT_CONTENT.emptyStateEyebrow
    );

  const emptyStateTitle =
    normalizeText(
      content.emptyStateTitle,
      DEFAULT_CONTENT.emptyStateTitle
    );

  const emptyStateDescription =
    normalizeText(
      content.emptyStateDescription,
      DEFAULT_CONTENT.emptyStateDescription
    );

  const emptyStateButtonText =
    normalizeText(
      content.emptyStateButtonText,
      DEFAULT_CONTENT.emptyStateButtonText
    );

  const emptyStateButtonHref =
    normalizeLinkHref(
      content.emptyStateButtonHref,
      DEFAULT_CONTENT.emptyStateButtonHref
    );

  const pageDescription =
    normalizeText(
      seo.description,
      DEFAULT_PAGE_DESCRIPTION
    );

  const canonicalPath =
    normalizeLinkHref(
      seo.canonical,
      "/collections"
    );

  const pageUrl =
    getAbsoluteUrl(canonicalPath);

  const collectionListItems =
    collections.map(
      (collection, index) => {
        const collectionTitle =
          normalizeText(
            collection.title,
            "OBSIDIAN Collection"
          );

        const series =
          normalizeSeriesName(
            collection.series ||
              collectionTitle
          );

        const collectionDescription =
          normalizeText(
            collection.description,
            "Explore this premium OBSIDIAN collection."
          );

        const shopPath =
          createCollectionShopPath(series);

        const shopUrl =
          getAbsoluteUrl(shopPath);

        const imageUrl =
          getAbsoluteUrl(
            getCollectionImage(collection)
          );

        return {
          "@type": "ListItem",
          position: index + 1,
          name: collectionTitle,
          url: shopUrl,

          item: {
            "@type": "CollectionPage",
            "@id": `${shopUrl}#collection`,
            name: collectionTitle,
            description:
              collectionDescription,
            url: shopUrl,
            image: imageUrl,

            isPartOf: {
              "@id": `${SITE_URL}/#website`,
            },
          },
        };
      }
    );

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `Collections | ${SITE_NAME}`,
    description: pageDescription,

    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },

    about: {
      "@id": `${SITE_URL}/#organization`,
    },

    breadcrumb: {
      "@id": `${pageUrl}#breadcrumb`,
    },

    mainEntity:
      collectionListItems.length > 0
        ? {
            "@type": "ItemList",
            itemListOrder:
              "https://schema.org/ItemListOrderAscending",
            numberOfItems:
              collectionListItems.length,
            itemListElement:
              collectionListItems,
          }
        : undefined,

    inLanguage: "en-BD",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHomeLabel,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbCurrentLabel,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="obsidian-catalog-page min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            collectionPageJsonLd
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd
          ),
        }}
      />

      <Navbar />

      <section
        aria-labelledby="collections-page-title"
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
              {breadcrumbHomeLabel}
            </Link>

            <span aria-hidden="true">
              /
            </span>

            <span
              className="text-[#0b0b0b]"
              aria-current="page"
            >
              {breadcrumbCurrentLabel}
            </span>
          </Reveal>

          <Reveal
            as="header"
            variant="fade-up"
            delay={70}
            duration={900}
            className="mb-12 border-b border-black/10 pb-9 sm:mb-14 sm:pb-10"
          >
            {eyebrow ? (
              <p className="mb-5 text-[10px] uppercase tracking-[0.38em] text-neutral-500 sm:text-xs sm:tracking-[0.45em]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1
                id="collections-page-title"
                className="max-w-5xl font-heading text-5xl font-light leading-[0.95] sm:text-6xl md:text-8xl"
              >
                {renderMultilineTitle(title)}
              </h1>
            ) : null}

            {description ? (
              <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-700 sm:mt-8 sm:text-lg">
                {description}
              </p>
            ) : null}

            {showCollectionCount ||
            metaLabel ? (
              <div className="mt-7 flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.24em] text-neutral-500 sm:mt-8 sm:text-[10px] sm:tracking-[0.28em]">
                {showCollectionCount ? (
                  <span>
                    {collections.length}{" "}
                    {collections.length === 1
                      ? collectionCountSingular
                      : collectionCountPlural}
                  </span>
                ) : null}

                {showCollectionCount &&
                metaLabel ? (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-black/30"
                  />
                ) : null}

                {metaLabel ? (
                  <span>{metaLabel}</span>
                ) : null}
              </div>
            ) : null}
          </Reveal>

          {collections.length === 0 ? (
            <Reveal
              as="section"
              variant="scale"
              duration={850}
              className="border border-black/10 bg-[#eee7dd] p-8 sm:p-10 md:p-14"
            >
              {emptyStateEyebrow ? (
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                  {emptyStateEyebrow}
                </p>
              ) : null}

              {emptyStateTitle ? (
                <h2 className="mt-5 max-w-2xl font-heading text-4xl font-light leading-tight sm:text-5xl">
                  {emptyStateTitle}
                </h2>
              ) : null}

              {emptyStateDescription ? (
                <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                  {emptyStateDescription}
                </p>
              ) : null}

              {emptyStateButtonText &&
              emptyStateButtonHref ? (
                <Link
                  href={
                    emptyStateButtonHref
                  }
                  className="mt-9 inline-flex min-h-12 items-center justify-center border border-[#0b0b0b] px-7 py-3 text-center text-[10px] uppercase tracking-[0.26em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4] sm:mt-10 sm:px-8 sm:text-xs sm:tracking-[0.3em]"
                >
                  {emptyStateButtonText}
                </Link>
              ) : null}
            </Reveal>
          ) : (
            <ul className="grid list-none gap-7 p-0 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
              {collections.map(
                (collection, index) => {
                  const collectionTitle =
                    normalizeText(
                      collection.title,
                      "OBSIDIAN Collection"
                    );

                  const series =
                    normalizeSeriesName(
                      collection.series ||
                        collectionTitle
                    );

                  const collectionDescription =
                    normalizeText(
                      collection.description,
                      "Explore this premium OBSIDIAN collection."
                    );

                  const image =
                    getCollectionImage(
                      collection
                    );

                  const shopPath =
                    createCollectionShopPath(
                      series
                    );

                  const seriesNumber =
                    String(index + 1).padStart(
                      2,
                      "0"
                    );

                  return (
                    <Reveal
                      as="li"
                      key={getCollectionIdentifier(
                        collection,
                        index
                      )}
                      variant="fade-up"
                      delay={Math.min(index, 8) * 70}
                      duration={900}
                      className="min-w-0"
                    >
                      <Link
                        href={shopPath}
                        aria-label={`Explore ${collectionTitle}`}
                        className="obsidian-catalog-card group block h-full overflow-hidden border border-black/10 bg-[#eee7dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4]"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                          <Image
                            src={image}
                            alt={`${collectionTitle} by ${SITE_NAME}`}
                            fill
                            priority={index < 3}
                            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) 50vw, 33vw"
                            className="obsidian-catalog-media object-cover object-center"
                          />

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

                          <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center gap-2 sm:left-5 sm:right-5 sm:top-5 sm:gap-3">
                            {showSeriesIndex ? (
                              <span className="border border-[#f1ece4]/20 bg-black/45 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-[#f1ece4] backdrop-blur-md sm:px-4 sm:text-[9px] sm:tracking-[0.25em]">
                                {seriesLabelPrefix}{" "}
                                {seriesNumber}
                              </span>
                            ) : null}

                            {showFeaturedBadge &&
                            collection.isFeatured ? (
                              <span className="border border-[#f1ece4]/20 bg-[#f1ece4]/90 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-[#0b0b0b] backdrop-blur-md sm:px-4 sm:text-[9px] sm:tracking-[0.25em]">
                                {
                                  featuredBadgeText
                                }
                              </span>
                            ) : null}
                          </div>

                          {cardHoverButtonText ? (
                            <div className="absolute inset-x-4 bottom-4 flex translate-y-0 items-center justify-between gap-4 opacity-100 transition duration-500 sm:inset-x-5 sm:bottom-5 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                              <span className="border border-[#f1ece4]/20 bg-black/50 px-3 py-3 text-[8px] uppercase tracking-[0.23em] text-[#f1ece4] backdrop-blur-md sm:px-4 sm:text-[9px] sm:tracking-[0.27em]">
                                {
                                  cardHoverButtonText
                                }
                              </span>

                              <span
                                aria-hidden="true"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f1ece4]/20 bg-black/50 text-[#f1ece4] backdrop-blur-md transition duration-300 group-hover:translate-x-1 sm:h-11 sm:w-11"
                              >
                                →
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <div className="p-6 sm:p-7">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <p className="min-w-0 truncate text-[10px] uppercase tracking-[0.22em] text-neutral-500 sm:text-xs sm:tracking-[0.25em]">
                              {series}
                            </p>

                            {showSeriesIndex ? (
                              <span className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-neutral-400 sm:text-[10px] sm:tracking-[0.24em]">
                                {seriesNumber}
                              </span>
                            ) : null}
                          </div>

                          <h2 className="font-heading text-4xl font-light leading-none sm:text-[2.75rem]">
                            {collectionTitle}
                          </h2>

                          {showDescription &&
                          collectionDescription ? (
                            <p className="mt-5 line-clamp-3 text-sm leading-7 text-neutral-600">
                              {
                                collectionDescription
                              }
                            </p>
                          ) : null}

                          {cardFooterText ? (
                            <div className="mt-7 flex items-center justify-between gap-4 border-t border-black/10 pt-5">
                              <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 sm:text-xs sm:tracking-[0.28em]">
                                {
                                  cardFooterText
                                }
                              </span>

                              <span
                                aria-hidden="true"
                                className="shrink-0 transition duration-300 group-hover:translate-x-1"
                              >
                                →
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </Reveal>
                  );
                }
              )}
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
