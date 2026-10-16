import type { Metadata } from "next";
import type { ComponentType } from "react";

import ObsidianLogoReveal from "../components/intro/ObsidianLogoReveal";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import Collections from "../components/sections/Collections";
import BrandStory from "../components/sections/BrandStory";
import FeaturedProduct from "../components/sections/FeaturedProduct";

import { getHomepageContent } from "../lib/getCmsContent";
import {
  DEFAULT_SETTINGS,
  getSettings,
} from "../lib/settings";
import { buildOrganizationProfile } from "../lib/seoOrganization";

export const dynamic = "force-dynamic";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const DEFAULT_SITE_DESCRIPTION =
  "Premium menswear and engineered essentials built under pressure and finished with precision.";

const DEFAULT_HERO_IMAGE =
  "/images/hero-obsidian-editorial.png";

type HomepageSeo = {
  title?: string;
  description?: string;
  keywords?: string | string[];
  ogImage?: string;
  canonical?: string;
  index?: boolean;
};

type HomepageSection = {
  id?: string;
  type?: string;
  order?: number;
  isEnabled?: boolean;
  content?: Record<string, unknown>;
};

type HomepageContent = {
  key?: string;
  status?: string;
  seo?: HomepageSeo;
  sections?: HomepageSection[];
};

type CmsSectionProps = {
  section?: HomepageSection | null;
  content?: Record<string, unknown> | null;
};

/*
 * These components are written in JavaScript.
 * TypeScript otherwise infers their default `section = null`
 * value as the only accepted prop type.
 */
const CmsHero =
  Hero as unknown as ComponentType<CmsSectionProps>;

const CmsCollections =
  Collections as unknown as ComponentType<CmsSectionProps>;

const CmsBrandStory =
  BrandStory as unknown as ComponentType<CmsSectionProps>;

const CmsFeaturedProduct =
  FeaturedProduct as unknown as ComponentType<CmsSectionProps>;

function normalizeText(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeCanonicalUrl(
  value: unknown
): string {
  const canonical = normalizeText(value, "/");

  if (
    canonical.startsWith("http://") ||
    canonical.startsWith("https://")
  ) {
    return canonical;
  }

  return canonical.startsWith("/")
    ? canonical
    : `/${canonical}`;
}

function normalizeImageUrl(value: unknown): string {
  return normalizeText(
    value,
    DEFAULT_HERO_IMAGE
  );
}

function normalizeKeywords(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((keyword) =>
        normalizeText(keyword)
      )
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function normalizeOrder(value: unknown): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function getSortedEnabledSections(
  homepageContent: HomepageContent | null
): HomepageSection[] {
  if (
    !Array.isArray(homepageContent?.sections)
  ) {
    return [];
  }

  return [...homepageContent.sections]
    .filter(
      (section) =>
        section &&
        section.isEnabled !== false &&
        normalizeText(section.type)
    )
    .sort(
      (firstSection, secondSection) =>
        normalizeOrder(firstSection.order) -
        normalizeOrder(secondSection.order)
    );
}

function getHeroSection(
  homepageContent: HomepageContent | null
): HomepageSection | null {
  const sections = Array.isArray(
    homepageContent?.sections
  )
    ? homepageContent.sections
    : [];

  return (
    sections.find(
      (section) =>
        section?.type === "hero" &&
        section.isEnabled !== false
    ) || null
  );
}

function getHomepageSeo(
  homepageContent: HomepageContent | null
) {
  const seo = homepageContent?.seo || {};

  const heroSection =
    getHeroSection(homepageContent);

  const heroContent =
    heroSection?.content &&
    typeof heroSection.content === "object"
      ? heroSection.content
      : {};

  const title = normalizeText(
    seo.title,
    "Premium Menswear Bangladesh"
  );

  const description = normalizeText(
    seo.description,
    DEFAULT_SITE_DESCRIPTION
  );

  const canonical =
    normalizeCanonicalUrl(seo.canonical);

  const ogImage = normalizeImageUrl(
    seo.ogImage ||
      heroContent.desktopImage ||
      heroContent.mobileImage
  );

  const keywords = normalizeKeywords(
    seo.keywords
  );

  return {
    title,
    description,
    canonical,
    ogImage,
    keywords,
    index: seo.index !== false,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const homepageContent =
    (await getHomepageContent()) as HomepageContent | null;

  const seo = getHomepageSeo(
    homepageContent
  );

  const completeTitle = seo.title
    .toUpperCase()
    .includes(SITE_NAME)
    ? seo.title
    : `${seo.title} | ${SITE_NAME}`;

  return {
    /*
     * absolute: the homepage title must always carry the brand name
     * (completeTitle adds "| OBSIDIAN" when the CMS title lacks it).
     */
    title: {
      absolute: completeTitle,
    },

    description: seo.description,

    keywords:
      seo.keywords.length > 0
        ? seo.keywords
        : undefined,

    alternates: {
      canonical: seo.canonical,
    },

    robots: {
      index: seo.index,
      follow: seo.index,

      googleBot: {
        index: seo.index,
        follow: seo.index,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      url: seo.canonical,
      siteName: SITE_NAME,
      title: completeTitle,
      description: seo.description,

      images: [
        {
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} premium menswear`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: completeTitle,
      description: seo.description,
      images: [seo.ogImage],
    },
  };
}

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(
    /</g,
    "\\u003c"
  );
}

function renderHomepageSection(
  section: HomepageSection,
  index: number
) {
  const sectionType = normalizeText(
    section.type
  );

  const key =
    normalizeText(section.id) ||
    `${sectionType || "section"}-${index}`;

  if (sectionType === "hero") {
    return (
      <CmsHero
        key={key}
        section={section}
      />
    );
  }

  if (sectionType === "collections") {
    return (
      <CmsCollections
        key={key}
        section={section}
      />
    );
  }

  if (
    sectionType === "brandStory" ||
    sectionType === "brand-story"
  ) {
    return (
      <CmsBrandStory
        key={key}
        section={section}
      />
    );
  }

  if (
    sectionType === "featuredProduct" ||
    sectionType === "featured-product"
  ) {
    return (
      <CmsFeaturedProduct
        key={key}
        section={section}
      />
    );
  }

  return null;
}

export default async function Home() {
  const homepageContent =
    (await getHomepageContent()) as HomepageContent | null;

  const sections =
    getSortedEnabledSections(
      homepageContent
    );

  const seo = getHomepageSeo(
    homepageContent
  );

  const storeSettings = await getSettings().catch(
    () => DEFAULT_SETTINGS
  );

  /*
   * Organization data comes from admin Settings (contact + social
   * links), so the schema always matches what the business has
   * actually entered. Empty fields are omitted, never invented.
   */
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    url: SITE_URL,
    description: seo.description,

    ...buildOrganizationProfile(
      storeSettings,
      SITE_URL
    ),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: seo.description,

    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },

    potentialAction: {
      "@type": "SearchAction",

      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },

      "query-input":
        "required name=search_term_string",
    },

    inLanguage: "en-BD",
  };

  return (
    <main className="bg-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            organizationJsonLd
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            websiteJsonLd
          ),
        }}
      />

      <ObsidianLogoReveal />

      <Navbar />

      {sections.length > 0 ? (
        sections.map(
          (section, index) =>
            renderHomepageSection(
              section,
              index
            )
        )
      ) : (
        <>
          <CmsHero />
          <CmsCollections />
          <CmsBrandStory />
          <CmsFeaturedProduct />
        </>
      )}

      <Footer />
    </main>
  );
}