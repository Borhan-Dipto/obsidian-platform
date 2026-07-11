import type { Metadata } from "next";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import Collections from "../components/sections/Collections";
import BrandStory from "../components/sections/BrandStory";
import FeaturedProduct from "../components/sections/FeaturedProduct";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const SITE_DESCRIPTION =
  "Premium menswear and engineered essentials built under pressure and finished with precision.";

const HERO_IMAGE = "/images/hero1.jpeg";

export const metadata: Metadata = {
  title: "Premium Menswear Bangladesh",

  description: SITE_DESCRIPTION,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/",
    siteName: SITE_NAME,
    title: "OBSIDIAN | Premium Menswear Bangladesh",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: "OBSIDIAN premium menswear collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "OBSIDIAN | Premium Menswear Bangladesh",
    description: SITE_DESCRIPTION,
    images: [HERO_IMAGE],
  },
};

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function Home() {
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
    description: SITE_DESCRIPTION,
    email: "mailto:contact@obsidianwearbd.store",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Bengali"],
      areaServed: "BD",
    },
    sameAs: [],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-BD",
  };

  return (
    <main className="bg-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(websiteJsonLd),
        }}
      />

      <Navbar />
      <Hero />
      <Collections />
      <BrandStory />
      <FeaturedProduct />
      <Footer />
    </main>
  );
}