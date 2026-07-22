import Image from "next/image";
import Link from "next/link";
import clientPromise from "../../lib/mongodb";
import Reveal from "../ui/Reveal";

const DEFAULT_CONTENT = {
  eyebrow: "Collections",
  title: "Designed to endure.",
  description:
    "Explore the first OBSIDIAN fashion drops—oversized T-shirts, graphic essentials, and future-ready collection stories.",
  buttonText: "View All",
  buttonHref: "/collections",
  maximumItems: 6,
  source: "all",
  selectedCollectionIds: [],
  showDescription: true,
  showIndex: true,
  showFeaturedBadge: true,
  cardButtonText: "View Products",
  emptyStateTitle: "No collections yet.",
  emptyStateDescription:
    "Create an active collection from the Admin Panel. This section will update automatically.",
};

const FALLBACK_IMAGE =
  "/images/collection-artifact.jpeg";

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function mergeContent(base, incoming) {
  if (!isPlainObject(incoming)) {
    return { ...base };
  }

  return Object.entries(incoming).reduce(
    (result, [key, value]) => {
      if (
        isPlainObject(base[key]) &&
        isPlainObject(value)
      ) {
        result[key] = {
          ...base[key],
          ...value,
        };
      } else if (value !== undefined) {
        result[key] = value;
      }

      return result;
    },
    { ...base }
  );
}

function normalizeText(
  value,
  fallback = ""
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
}

function normalizePositiveInteger(
  value,
  fallback = 6
) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return fallback;
  }

  return Math.min(
    Math.floor(numericValue),
    24
  );
}

function normalizeCollectionIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      String(item || "").trim()
    )
    .filter(Boolean);
}

function getSafeImage(image) {
  return normalizeText(
    image,
    FALLBACK_IMAGE
  );
}

function getCollectionHref(collection) {
  const series = normalizeText(
    collection?.series
  );

  if (!series) {
    return "/shop";
  }

  return `/shop?series=${encodeURIComponent(
    series
  )}`;
}

function renderMultilineTitle(title) {
  const normalizedTitle = normalizeText(
    title,
    DEFAULT_CONTENT.title
  );

  const lines = normalizedTitle
    .split(/\n|<br\s*\/?>/i)
    .map((line) => line.trim())
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

function getGridClasses(itemCount) {
  if (itemCount === 1) {
    return "grid max-w-xl gap-7";
  }

  if (itemCount === 2) {
    return "grid gap-7 md:grid-cols-2";
  }

  return "grid gap-7 md:grid-cols-2 lg:grid-cols-3";
}

async function getCollections({
  maximumItems = 6,
  source = "all",
  selectedCollectionIds = [],
}) {
  try {
    const client = await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    const query = {
      isActive: true,
    };

    const useSelectedCollections =
      source === "selected" &&
      selectedCollectionIds.length > 0;

    if (useSelectedCollections) {
      query.$or = [
        {
          slug: {
            $in: selectedCollectionIds,
          },
        },
        {
          series: {
            $in: selectedCollectionIds,
          },
        },
      ];
    }

    const collections = await database
      .collection("collections")
      .find(query)
      .sort({
        displayOrder: 1,
        createdAt: -1,
        _id: -1,
      })
      .limit(maximumItems)
      .toArray();

    const serializedCollections =
      JSON.parse(
        JSON.stringify(collections)
      );

    if (useSelectedCollections) {
      const orderMap = new Map(
        selectedCollectionIds.map(
          (id, index) => [id, index]
        )
      );

      return serializedCollections.sort(
        (
          firstCollection,
          secondCollection
        ) => {
          const firstKey =
            firstCollection.slug ||
            firstCollection.series;

          const secondKey =
            secondCollection.slug ||
            secondCollection.series;

          const firstOrder =
            orderMap.get(firstKey) ??
            Number.MAX_SAFE_INTEGER;

          const secondOrder =
            orderMap.get(secondKey) ??
            Number.MAX_SAFE_INTEGER;

          return firstOrder - secondOrder;
        }
      );
    }

    return serializedCollections;
  } catch (error) {
    console.error(
      "Homepage collections loading error:",
      error
    );

    return [];
  }
}

export default async function Collections({
  section = null,
  content = null,
} = {}) {
  const sectionContent =
    content ||
    section?.content ||
    {};

  const cmsContent = mergeContent(
    DEFAULT_CONTENT,
    sectionContent
  );

  const maximumItems =
    normalizePositiveInteger(
      cmsContent.maximumItems ??
        cmsContent.maxItems,
      DEFAULT_CONTENT.maximumItems
    );

  const selectedCollectionIds =
    normalizeCollectionIds(
      cmsContent.selectedCollectionIds
    );

  const source =
    cmsContent.source === "selected" &&
    selectedCollectionIds.length > 0
      ? "selected"
      : "all";

  const collections =
    await getCollections({
      maximumItems,
      source,
      selectedCollectionIds,
    });

  const eyebrow = normalizeText(
    cmsContent.eyebrow,
    DEFAULT_CONTENT.eyebrow
  );

  const title = normalizeText(
    cmsContent.title ??
      cmsContent.heading,
    DEFAULT_CONTENT.title
  );

  const description = normalizeText(
    cmsContent.description,
    DEFAULT_CONTENT.description
  );

  const buttonText = normalizeText(
    cmsContent.buttonText ??
      cmsContent.ctaText,
    DEFAULT_CONTENT.buttonText
  );

  const buttonHref = normalizeText(
    cmsContent.buttonHref ??
      cmsContent.ctaHref,
    DEFAULT_CONTENT.buttonHref
  );

  const cardButtonText =
    normalizeText(
      cmsContent.cardButtonText,
      DEFAULT_CONTENT.cardButtonText
    );

  const emptyStateTitle =
    normalizeText(
      cmsContent.emptyStateTitle,
      DEFAULT_CONTENT.emptyStateTitle
    );

  const emptyStateDescription =
    normalizeText(
      cmsContent.emptyStateDescription,
      DEFAULT_CONTENT.emptyStateDescription
    );

  const showDescription =
    cmsContent.showDescription !== false;

  const showIndex =
    cmsContent.showIndex !== false;

  const showFeaturedBadge =
    cmsContent.showFeaturedBadge !== false;

  return (
    <section className="relative overflow-hidden bg-[#eee7dd] px-6 pb-32 pt-16 text-[#0b0b0b] lg:pb-40 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.018]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0b0b_1px,transparent_1px),linear-gradient(#0b0b0b_1px,transparent_1px)] bg-[size:104px_104px]" />
      </div>

      <div className="container-custom relative z-10">
        <Reveal>
          {eyebrow ? (
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-8 bg-[#b1844a]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-neutral-500">
                {eyebrow}
              </p>
            </div>
          ) : null}

          <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              {title ? (
                <h2 className="font-heading text-[4rem] font-light leading-[0.9] tracking-[-0.055em] text-[#0b0b0b] sm:text-[5.3rem] lg:text-[6.6rem]">
                  {renderMultilineTitle(
                    title
                  )}
                </h2>
              ) : null}

              {showDescription &&
              description ? (
                <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600">
                  {description}
                </p>
              ) : null}
            </div>

            {buttonText &&
            buttonHref ? (
              <Link
                href={buttonHref}
                className="group inline-flex w-fit items-center gap-4 border border-black/20 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-700 transition duration-300 hover:border-black hover:bg-black hover:text-[#f1ece4]"
              >
                {buttonText}

                <span className="transition duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ) : null}
          </div>
        </Reveal>

        {collections.length === 0 ? (
          <Reveal>
            <div className="border border-black/10 bg-[#f1ece4] p-8 md:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
                Collections
              </p>

              <h3 className="mt-5 font-heading text-4xl font-light">
                {emptyStateTitle}
              </h3>

              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
                {emptyStateDescription}
              </p>

              {buttonText &&
              buttonHref ? (
                <Link
                  href={buttonHref}
                  className="mt-8 inline-flex border border-black/20 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
                >
                  {buttonText}
                </Link>
              ) : null}
            </div>
          </Reveal>
        ) : (
          <div
            className={getGridClasses(
              collections.length
            )}
          >
            {collections.map(
              (collection, index) => {
                const collectionTitle =
                  normalizeText(
                    collection.title,
                    collection.series ||
                      "OBSIDIAN Collection"
                  );

                const collectionDescription =
                  normalizeText(
                    collection.description,
                    "Explore the latest OBSIDIAN collection."
                  );

                const collectionImage =
                  getSafeImage(
                    collection.coverImage
                  );

                const collectionHref =
                  getCollectionHref(
                    collection
                  );

                const collectionKey =
                  collection._id ||
                  collection.slug ||
                  collection.series ||
                  `collection-${index}`;

                return (
                  <Reveal
                    key={String(
                      collectionKey
                    )}
                    delay={Math.min(
                      index * 100,
                      500
                    )}
                  >
                    <Link
                      href={
                        collectionHref
                      }
                      className="group block h-full overflow-hidden border border-black/10 bg-[#f1ece4] transition duration-500 hover:-translate-y-2 hover:border-black/30 hover:shadow-2xl hover:shadow-black/10"
                      aria-label={`View ${collectionTitle}`}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                        <Image
                          src={
                            collectionImage
                          }
                          alt={
                            collectionTitle
                          }
                          fill
                          priority={index < 3}
                          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.055]"
                        />

                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,0.46),rgba(11,11,11,0.06)_58%,transparent)] opacity-75 transition duration-500 group-hover:opacity-45" />

                        {showIndex ? (
                          <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#f1ece4]/25 bg-black/35 font-heading text-lg text-[#f1ece4] backdrop-blur-sm">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </div>
                        ) : null}

                        {showFeaturedBadge &&
                        collection.isFeatured ? (
                          <div className="absolute right-5 top-5 border border-[#f1ece4]/20 bg-black/40 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4] backdrop-blur-md">
                            Featured
                          </div>
                        ) : null}
                      </div>

                      <div className="p-6 lg:p-7">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                          {normalizeText(
                            collection.series,
                            "OBSIDIAN Series"
                          )}
                        </p>

                        <h3 className="mt-4 font-heading text-3xl font-light leading-none tracking-[-0.035em] text-[#0b0b0b]">
                          {collectionTitle}
                        </h3>

                        {showDescription &&
                        collectionDescription ? (
                          <p className="mt-4 line-clamp-3 text-sm leading-7 text-neutral-600">
                            {
                              collectionDescription
                            }
                          </p>
                        ) : null}

                        <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                            {cardButtonText}
                          </p>

                          <span className="text-xl leading-none text-[#0b0b0b] transition duration-300 group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}