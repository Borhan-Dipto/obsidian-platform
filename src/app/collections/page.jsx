import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import clientPromise from "../../lib/mongodb";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const PAGE_DESCRIPTION =
  "Explore OBSIDIAN collections shaped around pressure, precision, minimal form, and quiet strength.";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Collections",

  description: PAGE_DESCRIPTION,

  alternates: {
    canonical: "/collections",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/collections",
    siteName: SITE_NAME,
    title: `Collections | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: FALLBACK_IMAGE,
        width: 1200,
        height: 1500,
        alt: "OBSIDIAN premium fashion collections",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Collections | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [FALLBACK_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function getCollectionImage(collection) {
  return cleanText(collection?.coverImage, FALLBACK_IMAGE);
}

function getAbsoluteUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl, `${SITE_URL}/`).toString();
  } catch {
    return new URL(FALLBACK_IMAGE, `${SITE_URL}/`).toString();
  }
}

function createCollectionShopPath(series) {
  return `/shop?series=${encodeURIComponent(series)}`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

async function getCollections() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

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
    console.error("Collections lookup error:", error);
    return [];
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  const collectionListItems = collections.map((collection, index) => {
    const title = cleanText(collection.title, "OBSIDIAN Collection");
    const series = cleanText(collection.series, title);
    const description = cleanText(
      collection.description,
      "Explore this premium OBSIDIAN collection."
    );

    const shopPath = createCollectionShopPath(series);
    const shopUrl = getAbsoluteUrl(shopPath);
    const imageUrl = getAbsoluteUrl(getCollectionImage(collection));

    return {
      "@type": "ListItem",
      position: index + 1,
      name: title,
      url: shopUrl,
      item: {
        "@type": "CollectionPage",
        "@id": `${shopUrl}#collection`,
        name: title,
        description,
        url: shopUrl,
        image: imageUrl,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
      },
    };
  });

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/collections#webpage`,
    url: `${SITE_URL}/collections`,
    name: `Collections | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    breadcrumb: {
      "@id": `${SITE_URL}/collections#breadcrumb`,
    },
    mainEntity:
      collectionListItems.length > 0
        ? {
            "@type": "ItemList",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: collectionListItems.length,
            itemListElement: collectionListItems,
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/collections#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: `${SITE_URL}/collections`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(collectionPageJsonLd),
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
            className="mb-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-[#0b0b0b]" aria-current="page">
              Collections
            </span>
          </nav>

          <div className="mb-14 border-b border-black/10 pb-10">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Collections
            </p>

            <h1 className="max-w-5xl font-heading text-6xl font-light leading-none md:text-8xl">
              All Collections
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
              Explore the core OBSIDIAN series—each shaped around pressure,
              precision, restraint, and quiet strength.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.28em] text-neutral-500">
              <span>
                {collections.length}{" "}
                {collections.length === 1 ? "Collection" : "Collections"}
              </span>

              <span className="h-1 w-1 rounded-full bg-black/30" />

              <span>Built Under Pressure</span>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                Collections
              </p>

              <h2 className="mt-5 font-heading text-4xl font-light">
                No collections are available right now.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                New OBSIDIAN collections are being prepared. Explore the current
                product selection while the next series takes shape.
              </p>

              <Link
                href="/shop"
                className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Explore Shop
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection, index) => {
                const title = cleanText(
                  collection.title,
                  "OBSIDIAN Collection"
                );

                const series = cleanText(collection.series, title);

                const description = cleanText(
                  collection.description,
                  "Explore this premium OBSIDIAN collection."
                );

                const image = getCollectionImage(collection);
                const shopPath = createCollectionShopPath(series);

                return (
                  <Link
                    key={String(collection._id || `${series}-${index}`)}
                    href={shopPath}
                    aria-label={`Explore ${title}`}
                    className="group block overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                      <Image
                        src={image}
                        alt={`${title} by ${SITE_NAME}`}
                        fill
                        priority={index < 3}
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-1000 ease-out will-change-transform group-hover:scale-105"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

                      <div className="absolute left-5 top-5 flex flex-wrap items-center gap-3">
                        <span className="border border-[#f1ece4]/20 bg-black/40 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
                          Series {String(index + 1).padStart(2, "0")}
                        </span>

                        {collection.isFeatured ? (
                          <span className="border border-[#f1ece4]/20 bg-[#f1ece4]/90 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#0b0b0b] backdrop-blur-md">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <div className="absolute inset-x-5 bottom-5 flex translate-y-2 items-center justify-between gap-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="border border-[#f1ece4]/20 bg-black/45 px-4 py-3 text-[9px] uppercase tracking-[0.27em] text-[#f1ece4] backdrop-blur-md">
                          View Products
                        </span>

                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f1ece4]/20 bg-black/45 text-[#f1ece4] backdrop-blur-md transition duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>

                    <div className="p-7">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <p className="truncate text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {series}
                        </p>

                        <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h2 className="font-heading text-4xl font-light leading-none">
                        {title}
                      </h2>

                      <p className="mt-5 line-clamp-3 text-sm leading-7 text-neutral-600">
                        {description}
                      </p>

                      <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                        <span className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                          Explore Collection
                        </span>

                        <span className="transition duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
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