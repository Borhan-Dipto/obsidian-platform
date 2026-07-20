import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import clientPromise from "../../lib/mongodb";
import { getCollectionsContent } from "../../lib/getCmsContent";

export const dynamic = "force-dynamic";

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
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.replace(/\s+/g, " ").trim();

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

function getCollectionImage(collection) {
  return normalizeText(
    collection?.coverImage,
    FALLBACK_IMAGE
  );
}

function getAbsoluteUrl(pathOrUrl) {
  const normalizedValue = normalizeText(pathOrUrl);

  if (!normalizedValue) {
    return `${SITE_URL}${FALLBACK_IMAGE}`;
  }

  try {
    return new URL(
      normalizedValue,
      `${SITE_URL}/`
    ).toString();
  } catch {
    return `${SITE_URL}${FALLBACK_IMAGE}`;
  }
}

function createCollectionShopPath(series) {
  return `/shop?series=${encodeURIComponent(series)}`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function renderMultilineTitle(title) {
  const lines = String(title || "")
    .split(/\n|<br\s*\/?>/i)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}

      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

async function getCollections() {
  try {
    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const collections = await db
      .collection("collections")
      .find({
        isActive: true,
      })
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .toArray();

    return JSON.parse(JSON.stringify(collections));
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

  const canonical = normalizeText(
    seo.canonical,
    "/collections"
  );

  const socialImage = normalizeText(
    seo.ogImage,
    FALLBACK_IMAGE
  );

  const allowIndexing = seo.index !== false;

  const keywords = normalizeText(seo.keywords)
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
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

  const breadcrumbHomeLabel = normalizeText(
    content.breadcrumbHomeLabel,
    DEFAULT_CONTENT.breadcrumbHomeLabel
  );

  const breadcrumbCurrentLabel = normalizeText(
    content.breadcrumbCurrentLabel,
    DEFAULT_CONTENT.breadcrumbCurrentLabel
  );

  const eyebrow = normalizeText(
    content.eyebrow,
    DEFAULT_CONTENT.eyebrow
  );

  const title = normalizeText(
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

  const showCollectionCount = normalizeBoolean(
    content.showCollectionCount,
    true
  );

  const collectionCountSingular = normalizeText(
    content.collectionCountSingular,
    DEFAULT_CONTENT.collectionCountSingular
  );

  const collectionCountPlural = normalizeText(
    content.collectionCountPlural,
    DEFAULT_CONTENT.collectionCountPlural
  );

  const showSeriesIndex = normalizeBoolean(
    content.showSeriesIndex,
    true
  );

  const showFeaturedBadge = normalizeBoolean(
    content.showFeaturedBadge,
    true
  );

  const showDescription = normalizeBoolean(
    content.showDescription,
    true
  );

  const seriesLabelPrefix = normalizeText(
    content.seriesLabelPrefix,
    DEFAULT_CONTENT.seriesLabelPrefix
  );

  const featuredBadgeText = normalizeText(
    content.featuredBadgeText,
    DEFAULT_CONTENT.featuredBadgeText
  );

  const cardHoverButtonText = normalizeText(
    content.cardHoverButtonText,
    DEFAULT_CONTENT.cardHoverButtonText
  );

  const cardFooterText = normalizeText(
    content.cardFooterText,
    DEFAULT_CONTENT.cardFooterText
  );

  const emptyStateEyebrow = normalizeText(
    content.emptyStateEyebrow,
    DEFAULT_CONTENT.emptyStateEyebrow
  );

  const emptyStateTitle = normalizeText(
    content.emptyStateTitle,
    DEFAULT_CONTENT.emptyStateTitle
  );

  const emptyStateDescription = normalizeText(
    content.emptyStateDescription,
    DEFAULT_CONTENT.emptyStateDescription
  );

  const emptyStateButtonText = normalizeText(
    content.emptyStateButtonText,
    DEFAULT_CONTENT.emptyStateButtonText
  );

  const emptyStateButtonHref = normalizeText(
    content.emptyStateButtonHref,
    DEFAULT_CONTENT.emptyStateButtonHref
  );

  const pageDescription = normalizeText(
    seo.description,
    DEFAULT_PAGE_DESCRIPTION
  );

  const canonicalPath = normalizeText(
    seo.canonical,
    "/collections"
  );

  const pageUrl = getAbsoluteUrl(canonicalPath);

  const collectionListItems = collections.map(
    (collection, index) => {
      const collectionTitle = normalizeText(
        collection.title,
        "OBSIDIAN Collection"
      );

      const series = normalizeText(
        collection.series,
        collectionTitle
      );

      const collectionDescription = normalizeText(
        collection.description,
        "Explore this premium OBSIDIAN collection."
      );

      const shopPath = createCollectionShopPath(series);
      const shopUrl = getAbsoluteUrl(shopPath);

      const imageUrl = getAbsoluteUrl(
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
          description: collectionDescription,
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
            numberOfItems: collectionListItems.length,
            itemListElement: collectionListItems,
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
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
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

      <section className="px-6 pb-28 pt-36 lg:px-10 lg:pb-36 lg:pt-40">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link
              href="/"
              className="transition hover:text-black"
            >
              {breadcrumbHomeLabel}
            </Link>

            <span aria-hidden="true">/</span>

            <span
              className="text-[#0b0b0b]"
              aria-current="page"
            >
              {breadcrumbCurrentLabel}
            </span>
          </nav>

          <div className="mb-14 border-b border-black/10 pb-10">
            {eyebrow ? (
              <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="max-w-5xl font-heading text-6xl font-light leading-none md:text-8xl">
                {renderMultilineTitle(title)}
              </h1>
            ) : null}

            {description ? (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
                {description}
              </p>
            ) : null}

            {showCollectionCount || metaLabel ? (
              <div className="mt-8 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                {showCollectionCount ? (
                  <span>
                    {collections.length}{" "}
                    {collections.length === 1
                      ? collectionCountSingular
                      : collectionCountPlural}
                  </span>
                ) : null}

                {showCollectionCount && metaLabel ? (
                  <span className="h-1 w-1 rounded-full bg-black/30" />
                ) : null}

                {metaLabel ? (
                  <span>{metaLabel}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {collections.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              {emptyStateEyebrow ? (
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                  {emptyStateEyebrow}
                </p>
              ) : null}

              {emptyStateTitle ? (
                <h2 className="mt-5 font-heading text-4xl font-light">
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
                  href={emptyStateButtonHref}
                  className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                >
                  {emptyStateButtonText}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {collections.map(
                (collection, index) => {
                  const collectionTitle =
                    normalizeText(
                      collection.title,
                      "OBSIDIAN Collection"
                    );

                  const series = normalizeText(
                    collection.series,
                    collectionTitle
                  );

                  const collectionDescription =
                    normalizeText(
                      collection.description,
                      "Explore this premium OBSIDIAN collection."
                    );

                  const image =
                    getCollectionImage(collection);

                  const shopPath =
                    createCollectionShopPath(series);

                  const seriesNumber = String(
                    index + 1
                  ).padStart(2, "0");

                  return (
                    <Link
                      key={String(
                        collection._id ||
                          `${series}-${index}`
                      )}
                      href={shopPath}
                      aria-label={`Explore ${collectionTitle}`}
                      className="group block overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                        <Image
                          src={image}
                          alt={`${collectionTitle} by ${SITE_NAME}`}
                          fill
                          priority={index < 3}
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-1000 ease-out will-change-transform group-hover:scale-105"
                        />

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

                        <div className="absolute left-5 top-5 flex flex-wrap items-center gap-3">
                          {showSeriesIndex ? (
                            <span className="border border-[#f1ece4]/20 bg-black/40 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
                              {seriesLabelPrefix}{" "}
                              {seriesNumber}
                            </span>
                          ) : null}

                          {showFeaturedBadge &&
                          collection.isFeatured ? (
                            <span className="border border-[#f1ece4]/20 bg-[#f1ece4]/90 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#0b0b0b] backdrop-blur-md">
                              {featuredBadgeText}
                            </span>
                          ) : null}
                        </div>

                        {cardHoverButtonText ? (
                          <div className="absolute inset-x-5 bottom-5 flex translate-y-2 items-center justify-between gap-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <span className="border border-[#f1ece4]/20 bg-black/45 px-4 py-3 text-[9px] uppercase tracking-[0.27em] text-[#f1ece4] backdrop-blur-md">
                              {cardHoverButtonText}
                            </span>

                            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f1ece4]/20 bg-black/45 text-[#f1ece4] backdrop-blur-md transition duration-300 group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="p-7">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <p className="truncate text-xs uppercase tracking-[0.25em] text-neutral-500">
                            {series}
                          </p>

                          {showSeriesIndex ? (
                            <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                              {seriesNumber}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="font-heading text-4xl font-light leading-none">
                          {collectionTitle}
                        </h2>

                        {showDescription &&
                        collectionDescription ? (
                          <p className="mt-5 line-clamp-3 text-sm leading-7 text-neutral-600">
                            {collectionDescription}
                          </p>
                        ) : null}

                        {cardFooterText ? (
                          <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                            <span className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                              {cardFooterText}
                            </span>

                            <span className="transition duration-300 group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}