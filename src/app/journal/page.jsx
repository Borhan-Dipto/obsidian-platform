import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getJournalContent } from "../../lib/getCmsContent";

export const dynamic = "force-dynamic";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const DEFAULT_PAGE_DESCRIPTION =
  "Explore stories from OBSIDIAN about pressure, resilience, craftsmanship, design, and the ideas behind each collection.";

const DEFAULT_SOCIAL_IMAGE = "/images/hero1.jpeg";

const DEFAULT_CONTENT = {
  eyebrow: "Journal",
  title: "Stories Of Pressure",
  description:
    "Reflections on design, resilience, craftsmanship, and the ideas that shape every OBSIDIAN collection.",

  posts: [
    {
      id: "meaning-of-obsidian",
      title: "The Meaning Of Obsidian",
      description:
        "A reflection on pressure, resilience, and the identity behind the OBSIDIAN brand.",
      category: "Brand Story",
      readingTime: "3 Min Read",
      href: "",
      order: 1,
      isActive: true,
    },
    {
      id: "artifact-series",
      title: "The Artifact Series",
      description:
        "How ancient visual language became the foundation of our first collection.",
      category: "Collection Notes",
      readingTime: "4 Min Read",
      href: "",
      order: 2,
      isActive: true,
    },
    {
      id: "built-under-pressure",
      title: "Built Under Pressure",
      description:
        "Why we believe character, design, and purpose are formed slowly.",
      category: "Philosophy",
      readingTime: "3 Min Read",
      href: "",
      order: 3,
      isActive: true,
    },
  ],

  emptyStateTitle: "No journal stories yet.",
  emptyStateDescription:
    "New stories about design, collections, and the OBSIDIAN philosophy will appear here.",

  ctaEyebrow: "Explore Obsidian",
  ctaTitle: "Discover The Pieces Behind The Stories",
  ctaDescription:
    "Explore garments shaped by restraint, structure, and quiet confidence.",
  ctaText: "Explore Shop",
  ctaHref: "/shop",
};

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeOrder(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
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
    return {
      ...defaultContent,
      posts: [...defaultContent.posts],
    };
  }

  return {
    ...defaultContent,
    ...savedContent,
    posts: Array.isArray(savedContent.posts)
      ? savedContent.posts
      : [...defaultContent.posts],
  };
}

function getVisiblePosts(posts = []) {
  if (!Array.isArray(posts)) {
    return [];
  }

  return [...posts]
    .filter((post) => post && post.isActive !== false)
    .sort(
      (firstPost, secondPost) =>
        normalizeOrder(firstPost.order) -
        normalizeOrder(secondPost.order)
    );
}

function renderMultilineTitle(title) {
  const lines = normalizeText(title)
    .split(/\n|<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function getAbsoluteUrl(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://")
  ) {
    return normalizedValue;
  }

  return `${SITE_URL}${
    normalizedValue.startsWith("/")
      ? normalizedValue
      : `/${normalizedValue}`
  }`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateMetadata() {
  const journalContent = await getJournalContent();
  const seo = journalContent?.seo || {};

  const title = normalizeText(
    seo.title,
    "Journal"
  );

  const description = normalizeText(
    seo.description,
    DEFAULT_PAGE_DESCRIPTION
  );

  const canonical = normalizeText(
    seo.canonical,
    "/journal"
  );

  const socialImage = normalizeText(
    seo.ogImage,
    DEFAULT_SOCIAL_IMAGE
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
          height: 630,
          alt: `${SITE_NAME} Journal`,
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

function JournalCard({ post, index }) {
  const title = normalizeText(
    post.title,
    `Journal Story ${index + 1}`
  );

  const description = normalizeText(
    post.description,
    "Explore a story from the OBSIDIAN journal."
  );

  const category = normalizeText(
    post.category,
    "Journal"
  );

  const readingTime = normalizeText(
    post.readingTime,
    "Read Story"
  );

  const href = normalizeText(post.href);

  const cardContent = (
    <>
      <div>
        <div className="flex items-center justify-between gap-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            {category}
          </p>

          <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h2 className="mt-8 font-heading text-4xl font-light leading-none">
          {title}
        </h2>

        <p className="mt-6 text-sm leading-7 text-neutral-600">
          {description}
        </p>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-black/10 pt-5">
        <p className="text-[10px] uppercase tracking-[0.27em] text-neutral-500">
          {readingTime}
        </p>

        <span
          aria-hidden="true"
          className="transition duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </div>
    </>
  );

  const cardClasses =
    "group flex min-h-[360px] flex-col justify-between border border-black/10 bg-[#eee7dd] p-8 transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10";

  if (href) {
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://");

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClasses}
          aria-label={`Read ${title}`}
        >
          {cardContent}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={cardClasses}
        aria-label={`Read ${title}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article className={cardClasses}>
      {cardContent}
    </article>
  );
}

export default async function JournalPage() {
  const journalDocument =
    await getJournalContent();

  const content = mergeContent(
    DEFAULT_CONTENT,
    journalDocument?.content || {}
  );

  const seo = journalDocument?.seo || {};

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

  const posts = getVisiblePosts(
    content.posts
  );

  const emptyStateTitle = normalizeText(
    content.emptyStateTitle,
    DEFAULT_CONTENT.emptyStateTitle
  );

  const emptyStateDescription = normalizeText(
    content.emptyStateDescription,
    DEFAULT_CONTENT.emptyStateDescription
  );

  const ctaEyebrow = normalizeText(
    content.ctaEyebrow,
    DEFAULT_CONTENT.ctaEyebrow
  );

  const ctaTitle = normalizeText(
    content.ctaTitle,
    DEFAULT_CONTENT.ctaTitle
  );

  const ctaDescription = normalizeText(
    content.ctaDescription,
    DEFAULT_CONTENT.ctaDescription
  );

  const ctaText = normalizeText(
    content.ctaText,
    DEFAULT_CONTENT.ctaText
  );

  const ctaHref = normalizeText(
    content.ctaHref,
    DEFAULT_CONTENT.ctaHref
  );

  const pageDescription = normalizeText(
    seo.description,
    DEFAULT_PAGE_DESCRIPTION
  );

  const canonicalPath = normalizeText(
    seo.canonical,
    "/journal"
  );

  const pageUrl = getAbsoluteUrl(
    canonicalPath
  );

  const socialImage = getAbsoluteUrl(
    normalizeText(
      seo.ogImage,
      DEFAULT_SOCIAL_IMAGE
    )
  );

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `Journal | ${SITE_NAME}`,
    description: pageDescription,

    primaryImageOfPage: socialImage
      ? {
          "@type": "ImageObject",
          url: socialImage,
        }
      : undefined,

    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },

    about: {
      "@id": `${SITE_URL}/#organization`,
    },

    breadcrumb: {
      "@id": `${pageUrl}#breadcrumb`,
    },

    mainEntity: {
      "@id": `${pageUrl}#journal-list`,
    },

    inLanguage: "en-BD",
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#journal-list`,
    name: `${SITE_NAME} Journal Stories`,
    numberOfItems: posts.length,
    itemListOrder:
      "https://schema.org/ItemListOrderAscending",

    itemListElement: posts.map(
      (post, index) => {
        const postHref = normalizeText(
          post.href
        );

        return {
          "@type": "ListItem",
          position: index + 1,

          item: {
            "@type": "CreativeWork",
            name: normalizeText(post.title),
            description: normalizeText(
              post.description
            ),
            genre: normalizeText(
              post.category,
              "Journal"
            ),
            url: postHref
              ? getAbsoluteUrl(postHref)
              : undefined,

            creator: {
              "@id": `${SITE_URL}/#organization`,
            },

            inLanguage: "en-BD",
          },
        };
      }
    ),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,

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
        name: "Journal",
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
            itemListJsonLd
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

      <section className="px-6 pt-36 pb-32 lg:px-10 lg:pt-40 lg:pb-40">
        <div className="container-custom">
          <nav
            aria-label="Breadcrumb"
            className="mb-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link
              href="/"
              className="transition hover:text-black"
            >
              Home
            </Link>

            <span aria-hidden="true">
              /
            </span>

            <span
              className="text-[#0b0b0b]"
              aria-current="page"
            >
              Journal
            </span>
          </nav>

          <div className="max-w-5xl">
            {eyebrow ? (
              <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
                {renderMultilineTitle(title)}
              </h1>
            ) : null}

            {description ? (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
                {description}
              </p>
            ) : null}
          </div>

          {posts.length > 0 ? (
            <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post, index) => (
                <JournalCard
                  key={
                    post.id ||
                    `${post.title}-${index}`
                  }
                  post={post}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-20 border border-black/10 bg-[#eee7dd] p-8 md:p-12">
              <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                Journal
              </p>

              <h2 className="mt-5 font-heading text-4xl font-light">
                {emptyStateTitle}
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-600">
                {emptyStateDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      {(ctaEyebrow ||
        ctaTitle ||
        ctaDescription ||
        (ctaText && ctaHref)) && (
        <section className="border-t border-black/10 bg-[#0b0b0b] px-6 py-24 text-[#f1ece4] lg:px-10">
          <div className="container-custom flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              {ctaEyebrow ? (
                <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  {ctaEyebrow}
                </p>
              ) : null}

              {ctaTitle ? (
                <h2 className="max-w-3xl font-heading text-5xl font-light leading-none md:text-6xl">
                  {renderMultilineTitle(
                    ctaTitle
                  )}
                </h2>
              ) : null}

              {ctaDescription ? (
                <p className="mt-6 max-w-xl text-base leading-8 text-neutral-300">
                  {ctaDescription}
                </p>
              ) : null}
            </div>

            {ctaText && ctaHref ? (
              <Link
                href={ctaHref}
                className="inline-flex w-fit border border-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                {ctaText}
              </Link>
            ) : null}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}