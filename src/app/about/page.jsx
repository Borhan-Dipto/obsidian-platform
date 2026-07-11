import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const PAGE_URL = `${SITE_URL}/about`;

const PAGE_DESCRIPTION =
  "Discover the story, philosophy, and origin of OBSIDIAN—a premium menswear brand from Bangladesh built around resilience, craftsmanship, and timeless design.";

const SOCIAL_IMAGE = "/images/hero1.jpeg";

export const metadata = {
  title: "About",

  description: PAGE_DESCRIPTION,

  alternates: {
    canonical: "/about",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/about",
    siteName: SITE_NAME,
    title: `About ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: "About OBSIDIAN premium menswear brand",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `About ${SITE_NAME}`,
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

export default function AboutPage() {
  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: `About ${SITE_NAME}`,
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
    inLanguage: "en-BD",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.ico`,
    },
    description:
      "OBSIDIAN is a premium menswear brand from Bangladesh creating modern essentials shaped by pressure, precision, and timeless design.",
    foundingLocation: {
      "@type": "Place",
      name: "Bangladesh",
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    slogan: "Built Under Pressure. Finished With Precision.",
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
        name: "About",
        item: PAGE_URL,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(aboutPageJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <Navbar />

      <section className="px-6 pt-36 pb-24 lg:px-10 lg:pt-40">
        <div className="container-custom max-w-5xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-[#0b0b0b]" aria-current="page">
              About
            </span>
          </nav>

          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            About Obsidian
          </p>

          <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
            Built Under Pressure.
            <br />
            Finished With Precision.
          </h1>

          <p className="mt-12 max-w-3xl text-xl leading-10 text-neutral-700">
            OBSIDIAN is a modern essentials brand inspired by resilience,
            craftsmanship, and timeless design. We create garments that feel
            intentional, enduring, and quietly confident.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-10">
        <div className="container-custom grid gap-16 md:grid-cols-2">
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Our Philosophy
            </p>

            <h2 className="font-heading text-5xl font-light md:text-6xl">
              Substance
              <br />
              Over Noise
            </h2>
          </div>

          <div>
            <p className="text-lg leading-9 text-neutral-700">
              We believe true character is formed slowly—not through trends,
              but through pressure, patience, and purpose. Every collection is
              designed to reflect those values through materials, silhouettes,
              and visual storytelling.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] px-6 py-24 text-[#f1ece4] lg:px-10">
        <div className="container-custom max-w-4xl">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Why Obsidian
          </p>

          <h2 className="font-heading text-5xl font-light md:text-7xl">
            Formed By Nature.
            <br />
            Refined By Pressure.
          </h2>

          <p className="mt-10 max-w-3xl text-lg leading-9 text-neutral-300">
            Obsidian is volcanic glass created under intense heat and pressure.
            That idea sits at the heart of our brand. We believe meaningful
            things are forged, not rushed. Every piece carries that philosophy
            forward.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-10">
        <div className="container-custom max-w-4xl">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Origin
          </p>

          <h2 className="font-heading text-5xl font-light">
            Designed In Bangladesh
          </h2>

          <p className="mt-10 text-lg leading-9 text-neutral-700">
            OBSIDIAN was founded with a simple idea: create garments that feel
            premium, intentional, and timeless. Rooted in Bangladesh&apos;s deep
            manufacturing heritage, we aim to combine thoughtful design with
            quality craftsmanship.
          </p>
        </div>
      </section>

      <section className="border-t border-black/10 px-6 py-24 lg:px-10">
        <div className="container-custom flex max-w-5xl flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Discover Obsidian
            </p>

            <h2 className="font-heading text-5xl font-light leading-none md:text-6xl">
              Explore The Collections
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">
              Discover premium essentials shaped by restraint, structure, and
              quiet confidence.
            </p>
          </div>

          <Link
            href="/collections"
            className="inline-flex w-fit border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            View Collections
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}