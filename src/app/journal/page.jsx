import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const PAGE_URL = `${SITE_URL}/journal`;

const PAGE_DESCRIPTION =
  "Explore stories from OBSIDIAN about pressure, resilience, craftsmanship, design, and the ideas behind each collection.";

const SOCIAL_IMAGE = "/images/hero1.jpeg";

const POSTS = [
  {
    id: "meaning-of-obsidian",
    title: "The Meaning Of Obsidian",
    description:
      "A reflection on pressure, resilience, and the identity behind the OBSIDIAN brand.",
    category: "Brand Story",
    readingTime: "3 Min Read",
  },
  {
    id: "artifact-series",
    title: "The Artifact Series",
    description:
      "How ancient visual language became the foundation of our first collection.",
    category: "Collection Notes",
    readingTime: "4 Min Read",
  },
  {
    id: "built-under-pressure",
    title: "Built Under Pressure",
    description:
      "Why we believe character, design, and purpose are formed slowly.",
    category: "Philosophy",
    readingTime: "3 Min Read",
  },
];

export const metadata = {
  title: "Journal",

  description: PAGE_DESCRIPTION,

  alternates: {
    canonical: "/journal",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/journal",
    siteName: SITE_NAME,
    title: `Journal | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Journal`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Journal | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [SOCIAL_IMAGE],
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

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function JournalPage() {
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: `Journal | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    breadcrumb: {
      "@id": `${PAGE_URL}#breadcrumb`,
    },
    mainEntity: {
      "@id": `${PAGE_URL}#journal-list`,
    },
    inLanguage: "en-BD",
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${PAGE_URL}#journal-list`,
    name: `${SITE_NAME} Journal Stories`,
    numberOfItems: POSTS.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: POSTS.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: post.title,
        description: post.description,
        genre: post.category,
        creator: {
          "@id": `${SITE_URL}/#organization`,
        },
        inLanguage: "en-BD",
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${PAGE_URL}#breadcrumb`,
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
        item: PAGE_URL,
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
          __html: serializeJsonLd(itemListJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <Navbar />

      <section className="px-6 pt-36 pb-32 lg:px-10 lg:pt-40 lg:pb-40">
        <div className="container-custom">
          <nav
            aria-label="Breadcrumb"
            className="mb-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-[#0b0b0b]" aria-current="page">
              Journal
            </span>
          </nav>

          <div className="max-w-5xl">
            <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Journal
            </p>

            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              Stories Of
              <br />
              Pressure
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
              Reflections on design, resilience, craftsmanship, and the ideas
              that shape every OBSIDIAN collection.
            </p>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {POSTS.map((post, index) => (
              <article
                key={post.id}
                className="group flex min-h-[360px] flex-col justify-between border border-black/10 bg-[#eee7dd] p-8 transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-5">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                      {post.category}
                    </p>

                    <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="mt-8 font-heading text-4xl font-light leading-none">
                    {post.title}
                  </h2>

                  <p className="mt-6 text-sm leading-7 text-neutral-600">
                    {post.description}
                  </p>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-black/10 pt-5">
                  <p className="text-[10px] uppercase tracking-[0.27em] text-neutral-500">
                    {post.readingTime}
                  </p>

                  <span
                    aria-hidden="true"
                    className="transition duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#0b0b0b] px-6 py-24 text-[#f1ece4] lg:px-10">
        <div className="container-custom flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Explore Obsidian
            </p>

            <h2 className="max-w-3xl font-heading text-5xl font-light leading-none md:text-6xl">
              Discover The Pieces Behind The Stories
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-neutral-300">
              Explore garments shaped by restraint, structure, and quiet
              confidence.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-fit border border-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Explore Shop
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}