import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAboutContent } from "../../lib/getCmsContent";
import { ORGANIZATION_LOGO_PATH } from "../../lib/seoOrganization";

export const dynamic = "force-dynamic";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const DEFAULT_DESCRIPTION =
  "Discover the story, philosophy, and origin of OBSIDIAN—a premium menswear brand from Bangladesh built around resilience, craftsmanship, and timeless design.";

const DEFAULT_SOCIAL_IMAGE = "/images/hero1.jpeg";

const DEFAULT_SECTIONS = [
  {
    id: "about-default-hero",
    type: "heroText",
    order: 1,
    isEnabled: true,
    content: {
      eyebrow: "Our Story",
      title: "Built Under Pressure.\nFinished With Precision.",
      description:
        "OBSIDIAN is a premium menswear brand shaped by resilience, restraint, and timeless design.",
    },
  },
  {
    id: "about-default-story",
    type: "splitText",
    order: 2,
    isEnabled: true,
    content: {
      eyebrow: "The Origin",
      title: "Created With Purpose",
      description:
        "Inspired by obsidian—formed through intense pressure and transformed into something enduring—we create considered clothing for men who value confidence, structure, and precision.",
    },
  },
  {
    id: "about-default-philosophy",
    type: "darkText",
    order: 3,
    isEnabled: true,
    content: {
      eyebrow: "Our Philosophy",
      title: "Quiet Confidence.\nLasting Character.",
      description:
        "We believe premium style does not need to demand attention. It is expressed through proportion, material, construction, and the confidence of the person wearing it.",
    },
  },
  {
    id: "about-default-craft",
    type: "text",
    order: 4,
    isEnabled: true,
    content: {
      eyebrow: "Our Standard",
      title: "Designed With Restraint",
      description:
        "Every OBSIDIAN piece is developed with a focus on proportion, versatility, material, and finish. Our aim is to create modern essentials that feel relevant today and remain wearable beyond a single season.",
    },
  },
  {
    id: "about-default-cta",
    type: "cta",
    order: 5,
    isEnabled: true,
    content: {
      eyebrow: "Discover Obsidian",
      title: "Explore The Collections",
      description:
        "Discover premium essentials shaped by restraint, structure, and quiet confidence.",
      buttonText: "View Collections",
      buttonHref: "/collections",
    },
  },
];

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

function getVisibleSections(sections = []) {
  const sourceSections =
    Array.isArray(sections) && sections.length > 0
      ? sections
      : DEFAULT_SECTIONS;

  return [...sourceSections]
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

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
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

function isExternalLink(href) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}

function ActionLink({
  href,
  children,
  className,
}) {
  if (isExternalLink(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export async function generateMetadata() {
  const aboutContent = await getAboutContent();
  const seo = aboutContent?.seo || {};

  const title = normalizeText(seo.title, "About");

  const description = normalizeText(
    seo.description,
    DEFAULT_DESCRIPTION
  );

  const canonical = normalizeText(
    seo.canonical,
    "/about"
  );

  const socialImage = normalizeText(
    seo.ogImage,
    DEFAULT_SOCIAL_IMAGE
  );

  const allowIndexing = seo.index !== false;

  return {
    title,
    description,

    keywords: normalizeText(seo.keywords)
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),

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
          alt: `${title} — ${SITE_NAME}`,
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

function HeroTextSection({ section }) {
  const content = section.content || {};

  const eyebrow = normalizeText(content.eyebrow);
  const title = normalizeText(content.title);
  const description = normalizeText(content.description);

  return (
    <section className="px-6 pb-24 pt-16 lg:px-10 lg:pb-32 lg:pt-20">
      <div className="container-custom max-w-5xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-neutral-500"
        >
          <Link
            href="/"
            className="transition hover:text-black"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <span
            className="text-[#0b0b0b]"
            aria-current="page"
          >
            About
          </span>
        </nav>

        {eyebrow ? (
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}

        {title ? (
          <h1 className="font-heading text-5xl font-light leading-[0.95] sm:text-6xl md:text-8xl">
            {renderMultilineTitle(title)}
          </h1>
        ) : null}

        {description ? (
          <p className="mt-10 max-w-3xl text-lg leading-9 text-neutral-700 md:mt-12 md:text-xl md:leading-10">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SplitTextSection({ section }) {
  const content = section.content || {};

  const eyebrow = normalizeText(content.eyebrow);
  const title = normalizeText(content.title);
  const description = normalizeText(content.description);

  return (
    <section className="border-t border-black/10 px-6 py-20 lg:px-10 lg:py-28">
      <div className="container-custom grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          {eyebrow ? (
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-neutral-500">
              {eyebrow}
            </p>
          ) : null}

          {title ? (
            <h2 className="font-heading text-4xl font-light leading-tight sm:text-5xl md:text-6xl">
              {renderMultilineTitle(title)}
            </h2>
          ) : null}
        </div>

        {description ? (
          <div className="md:pt-10">
            <p className="text-lg leading-9 text-neutral-700">
              {description}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DarkTextSection({ section }) {
  const content = section.content || {};

  const eyebrow = normalizeText(content.eyebrow);
  const title = normalizeText(content.title);
  const description = normalizeText(content.description);

  return (
    <section className="bg-[#0b0b0b] px-6 py-20 text-[#f1ece4] lg:px-10 lg:py-28">
      <div className="container-custom max-w-4xl">
        {eyebrow ? (
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}

        {title ? (
          <h2 className="font-heading text-4xl font-light leading-tight sm:text-5xl md:text-7xl">
            {renderMultilineTitle(title)}
          </h2>
        ) : null}

        {description ? (
          <p className="mt-8 max-w-3xl text-lg leading-9 text-neutral-300 md:mt-10">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TextSection({ section }) {
  const content = section.content || {};

  const eyebrow = normalizeText(content.eyebrow);
  const title = normalizeText(content.title);
  const description = normalizeText(content.description);

  return (
    <section className="border-t border-black/10 px-6 py-20 lg:px-10 lg:py-28">
      <div className="container-custom max-w-4xl">
        {eyebrow ? (
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}

        {title ? (
          <h2 className="font-heading text-4xl font-light leading-tight sm:text-5xl">
            {renderMultilineTitle(title)}
          </h2>
        ) : null}

        {description ? (
          <p className="mt-8 text-lg leading-9 text-neutral-700 md:mt-10">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CtaSection({ section }) {
  const content = section.content || {};

  const eyebrow = normalizeText(content.eyebrow);
  const title = normalizeText(content.title);
  const description = normalizeText(content.description);
  const buttonText = normalizeText(content.buttonText);
  const buttonHref = normalizeText(content.buttonHref);

  if (
    !eyebrow &&
    !title &&
    !description &&
    !(buttonText && buttonHref)
  ) {
    return null;
  }

  return (
    <section className="border-t border-black/10 px-6 py-20 lg:px-10 lg:py-28">
      <div className="container-custom flex max-w-5xl flex-col justify-between gap-10 md:flex-row md:items-end">
        <div>
          {eyebrow ? (
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
              {eyebrow}
            </p>
          ) : null}

          {title ? (
            <h2 className="font-heading text-4xl font-light leading-none sm:text-5xl md:text-6xl">
              {renderMultilineTitle(title)}
            </h2>
          ) : null}

          {description ? (
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>

        {buttonText && buttonHref ? (
          <ActionLink
            href={buttonHref}
            className="inline-flex w-fit shrink-0 items-center justify-center border border-[#0b0b0b] px-8 py-4 text-center text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            {buttonText}
          </ActionLink>
        ) : null}
      </div>
    </section>
  );
}

function AboutSectionRenderer({ section }) {
  if (!section?.type) {
    return null;
  }

  switch (section.type) {
    case "heroText":
      return <HeroTextSection section={section} />;

    case "splitText":
      return <SplitTextSection section={section} />;

    case "darkText":
      return <DarkTextSection section={section} />;

    case "text":
      return <TextSection section={section} />;

    case "cta":
      return <CtaSection section={section} />;

    default:
      return null;
  }
}

export default async function AboutPage() {
  const aboutContent = await getAboutContent();
  const seo = aboutContent?.seo || {};

  const pageDescription = normalizeText(
    seo.description,
    DEFAULT_DESCRIPTION
  );

  const canonicalPath = normalizeText(
    seo.canonical,
    "/about"
  );

  const pageUrl = getAbsoluteUrl(canonicalPath);

  const socialImage = getAbsoluteUrl(
    normalizeText(
      seo.ogImage,
      DEFAULT_SOCIAL_IMAGE
    )
  );

  const visibleSections = getVisibleSections(
    aboutContent?.sections
  );

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `About ${SITE_NAME}`,
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
      url: `${SITE_URL}${ORGANIZATION_LOGO_PATH}`,
      width: 2048,
      height: 2048,
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

    slogan:
      "Built Under Pressure. Finished With Precision.",
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
        name: "About",
        item: pageUrl,
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
          __html: serializeJsonLd(
            organizationJsonLd
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

      {visibleSections.map((section) => (
        <AboutSectionRenderer
          key={
            section.id ||
            `${section.type}-${section.order}`
          }
          section={section}
        />
      ))}

      <Footer />
    </main>
  );
}