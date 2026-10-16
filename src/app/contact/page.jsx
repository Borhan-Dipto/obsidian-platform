import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getContactContent } from "../../lib/getCmsContent";
import clientPromise from "../../lib/mongodb";
import { ORGANIZATION_LOGO_PATH } from "../../lib/seoOrganization";

export const dynamic = "force-dynamic";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const DEFAULT_DESCRIPTION =
  "Contact OBSIDIAN for product questions, order support, collaborations, and general inquiries.";

const DEFAULT_SOCIAL_IMAGE = "/images/hero1.jpeg";

const DEFAULT_SETTINGS = {
  store: {
    name: "OBSIDIAN",
  },

  contact: {
    email: "obsidianwear.management@gmail.com",
    phone: "+8801814455199",
    whatsappNumber: "8801814455199",
    location: "Dhaka, Bangladesh",
  },
};

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
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

function normalizePhoneNumber(value) {
  return String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
}

function normalizeWhatsAppNumber(value) {
  return String(value || "")
    .trim()
    .replace(/\D/g, "");
}

function formatPhoneNumber(value) {
  const normalizedValue = normalizePhoneNumber(value);

  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.startsWith("+880") &&
    normalizedValue.length === 14
  ) {
    return `${normalizedValue.slice(
      0,
      4
    )} ${normalizedValue.slice(
      4,
      8
    )}-${normalizedValue.slice(8)}`;
  }

  return normalizedValue;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
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
    <Link
      href={href}
      className={className}
    >
      {children}
    </Link>
  );
}

async function getStoreSettings() {
  try {
    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const settings = await db
      .collection("settings")
      .findOne({
        type: "store",
      });

    return {
      store: {
        ...DEFAULT_SETTINGS.store,
        ...(settings?.store || {}),
      },

      contact: {
        ...DEFAULT_SETTINGS.contact,
        ...(settings?.contact || {}),
      },
    };
  } catch (error) {
    console.error(
      "Contact page settings loading error:",
      error
    );

    return DEFAULT_SETTINGS;
  }
}

export async function generateMetadata() {
  const contactContent = await getContactContent();

  const seo = contactContent?.seo || {};

  const title = normalizeText(
    seo.title,
    "Contact"
  );

  const description = normalizeText(
    seo.description,
    DEFAULT_DESCRIPTION
  );

  const canonical = normalizeText(
    seo.canonical,
    "/contact"
  );

  const socialImage = normalizeText(
    seo.ogImage,
    DEFAULT_SOCIAL_IMAGE
  );

  const allowIndexing = seo.index !== false;

  const keywords = normalizeText(
    seo.keywords
  )
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
          alt: `Contact ${SITE_NAME}`,
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

export default async function ContactPage() {
  const [contactContent, settings] =
    await Promise.all([
      getContactContent(),
      getStoreSettings(),
    ]);

  const content = contactContent?.content || {};
  const seo = contactContent?.seo || {};

  const storeName = normalizeText(
    settings.store?.name,
    DEFAULT_SETTINGS.store.name
  );

  const email = normalizeText(
    settings.contact?.email,
    DEFAULT_SETTINGS.contact.email
  );

  const phone = normalizePhoneNumber(
    settings.contact?.phone ||
      DEFAULT_SETTINGS.contact.phone
  );

  const whatsappNumber =
    normalizeWhatsAppNumber(
      settings.contact?.whatsappNumber ||
        DEFAULT_SETTINGS.contact.whatsappNumber
    );

  const location = normalizeText(
    settings.contact?.location,
    DEFAULT_SETTINGS.contact.location
  );

  const eyebrow = normalizeText(
    content.eyebrow,
    "Contact"
  );

  const title = normalizeText(
    content.title,
    "Reach Obsidian"
  );

  const description = normalizeText(
    content.description,
    "For product questions, order support, collaborations, or general inquiries, contact the OBSIDIAN team."
  );

  const supportTitle = normalizeText(
    content.supportTitle,
    "Order Support"
  );

  const supportDescription = normalizeText(
    content.supportDescription,
    "Get help with order confirmation, delivery, exchange, or product availability."
  );

  const collaborationTitle = normalizeText(
    content.collaborationTitle,
    "Collaborations"
  );

  const collaborationDescription =
    normalizeText(
      content.collaborationDescription,
      "Contact us for creative partnerships, campaigns, wholesale, and brand opportunities."
    );

  const contactDetailsTitle = normalizeText(
    content.contactDetailsTitle,
    "Contact Details"
  );

  const emailLabel = normalizeText(
    content.emailLabel,
    "Email"
  );

  const whatsappLabel = normalizeText(
    content.whatsappLabel,
    "WhatsApp"
  );

  const phoneLabel = normalizeText(
    content.phoneLabel,
    "Phone"
  );

  const locationLabel = normalizeText(
    content.locationLabel,
    "Location"
  );

  const whatsappButtonText =
    normalizeText(
      content.whatsappButtonText,
      "Message On WhatsApp"
    );

  const emailButtonText = normalizeText(
    content.emailButtonText,
    "Send An Email"
  );

  const whatsappMessage = normalizeText(
    content.whatsappMessage,
    "Hello OBSIDIAN, I would like to know more about your products."
  );

  const availabilityMessage =
    normalizeText(
      content.availabilityMessage,
      "Customer support is available for orders across Bangladesh."
    );

  const ctaEnabled =
    content.ctaEnabled !== false;

  const ctaEyebrow = normalizeText(
    content.ctaEyebrow,
    "Explore Obsidian"
  );

  const ctaTitle = normalizeText(
    content.ctaTitle,
    "Discover Pieces Built With Precision"
  );

  const ctaDescription = normalizeText(
    content.ctaDescription,
    "Explore premium essentials designed with structure, restraint, and quiet confidence."
  );

  const ctaButtonText = normalizeText(
    content.ctaButtonText,
    "Explore Shop"
  );

  const ctaButtonHref = normalizeText(
    content.ctaButtonHref,
    "/shop"
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "";

  const formattedPhone =
    formatPhoneNumber(phone);

  const pageDescription = normalizeText(
    seo.description,
    DEFAULT_DESCRIPTION
  );

  const canonicalPath = normalizeText(
    seo.canonical,
    "/contact"
  );

  const pageUrl =
    getAbsoluteUrl(canonicalPath);

  const socialImage = getAbsoluteUrl(
    normalizeText(
      seo.ogImage,
      DEFAULT_SOCIAL_IMAGE
    )
  );

  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `Contact ${storeName}`,
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
    name: storeName,
    url: SITE_URL,

    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}${ORGANIZATION_LOGO_PATH}`,
      width: 2048,
      height: 2048,
    },

    email: email || undefined,
    telephone: phone || undefined,

    address: {
      "@type": "PostalAddress",
      addressLocality: location,
      addressCountry: "BD",
    },

    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: phone || undefined,
        email: email || undefined,
        areaServed: "BD",
        availableLanguage: [
          "English",
          "Bengali",
        ],
      },
    ],

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
        name: "Contact",
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
            contactPageJsonLd
          ),
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

      <section className="px-6 pb-32 pt-36 lg:px-10 lg:pb-40 lg:pt-40">
        <div className="container-custom">
          <nav
            aria-label="Breadcrumb"
            className="mb-12 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-neutral-500"
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
              Contact
            </span>
          </nav>

          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div>
              {eyebrow ? (
                <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <h1 className="max-w-4xl font-heading text-6xl font-light leading-none md:text-8xl">
                  {title}
                </h1>
              ) : null}

              {description ? (
                <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-700">
                  {description}
                </p>
              ) : null}

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="border-t border-black/10 pt-6">
                  {supportTitle ? (
                    <p className="text-[11px] uppercase tracking-[0.32em] text-neutral-500">
                      {supportTitle}
                    </p>
                  ) : null}

                  {supportDescription ? (
                    <p className="mt-4 text-sm leading-7 text-neutral-700">
                      {supportDescription}
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-black/10 pt-6">
                  {collaborationTitle ? (
                    <p className="text-[11px] uppercase tracking-[0.32em] text-neutral-500">
                      {collaborationTitle}
                    </p>
                  ) : null}

                  {collaborationDescription ? (
                    <p className="mt-4 text-sm leading-7 text-neutral-700">
                      {collaborationDescription}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="h-fit border border-black/10 bg-[#eee7dd] p-8 md:p-10 lg:sticky lg:top-32">
              {contactDetailsTitle ? (
                <p className="mb-8 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  {contactDetailsTitle}
                </p>
              ) : null}

              <div className="divide-y divide-black/10">
                {email ? (
                  <div className="pb-8">
                    {emailLabel ? (
                      <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                        {emailLabel}
                      </p>
                    ) : null}

                    <a
                      href={`mailto:${email}`}
                      className="break-all text-lg transition hover:opacity-60"
                    >
                      {email}
                    </a>
                  </div>
                ) : null}

                {whatsappNumber ? (
                  <div className="py-8">
                    {whatsappLabel ? (
                      <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                        {whatsappLabel}
                      </p>
                    ) : null}

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg transition hover:opacity-60"
                    >
                      {formattedPhone ||
                        `+${whatsappNumber}`}
                    </a>
                  </div>
                ) : null}

                {phone &&
                phone !==
                  `+${whatsappNumber}` ? (
                  <div className="py-8">
                    {phoneLabel ? (
                      <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                        {phoneLabel}
                      </p>
                    ) : null}

                    <a
                      href={`tel:${phone}`}
                      className="text-lg transition hover:opacity-60"
                    >
                      {formattedPhone || phone}
                    </a>
                  </div>
                ) : null}

                {location ? (
                  <div className="pt-8">
                    {locationLabel ? (
                      <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                        {locationLabel}
                      </p>
                    ) : null}

                    <p className="text-lg">
                      {location}
                    </p>
                  </div>
                ) : null}
              </div>

              {whatsappNumber &&
              whatsappButtonText ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-12 flex w-full justify-center bg-[#0b0b0b] px-8 py-5 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {whatsappButtonText}
                </a>
              ) : null}

              {email &&
              emailButtonText ? (
                <a
                  href={`mailto:${email}`}
                  className="mt-4 flex w-full justify-center border border-[#0b0b0b] px-8 py-4 text-center text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                >
                  {emailButtonText}
                </a>
              ) : null}

              {availabilityMessage ? (
                <p className="mt-6 text-center text-xs leading-6 text-neutral-500">
                  {availabilityMessage}
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {ctaEnabled ? (
        <section className="border-t border-black/10 px-6 py-24 lg:px-10">
          <div className="container-custom flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              {ctaEyebrow ? (
                <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  {ctaEyebrow}
                </p>
              ) : null}

              {ctaTitle ? (
                <h2 className="max-w-3xl font-heading text-5xl font-light leading-none md:text-6xl">
                  {ctaTitle}
                </h2>
              ) : null}

              {ctaDescription ? (
                <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
                  {ctaDescription}
                </p>
              ) : null}
            </div>

            {ctaButtonText &&
            ctaButtonHref ? (
              <ActionLink
                href={ctaButtonHref}
                className="inline-flex w-fit shrink-0 border border-[#0b0b0b] px-8 py-4 text-center text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                {ctaButtonText}
              </ActionLink>
            ) : null}
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  );
}