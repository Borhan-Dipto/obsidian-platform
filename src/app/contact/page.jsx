import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const PAGE_URL = `${SITE_URL}/contact`;

const PAGE_DESCRIPTION =
  "Contact OBSIDIAN for product questions, order support, collaborations, and general inquiries. Reach our team by email or WhatsApp.";

const SOCIAL_IMAGE = "/images/hero1.jpeg";

const CONTACT_EMAIL = "contact@obsidianwearbd.store";
const CONTACT_PHONE = "+8801814455199";
const WHATSAPP_NUMBER = "8801814455199";
const LOCATION = "Dhaka, Bangladesh";

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello OBSIDIAN, I would like to know more about your products."
);

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export const metadata = {
  title: "Contact",

  description: PAGE_DESCRIPTION,

  alternates: {
    canonical: "/contact",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/contact",
    siteName: SITE_NAME,
    title: `Contact ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: `Contact ${SITE_NAME}`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Contact ${SITE_NAME}`,
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

export default function ContactPage() {
  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: `Contact ${SITE_NAME}`,
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
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: CONTACT_PHONE,
        email: CONTACT_EMAIL,
        areaServed: "BD",
        availableLanguage: ["English", "Bengali"],
      },
    ],
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
        name: "Contact",
        item: PAGE_URL,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(contactPageJsonLd),
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
              Contact
            </span>
          </nav>

          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div>
              <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
                Contact
              </p>

              <h1 className="max-w-4xl font-heading text-6xl font-light leading-none md:text-8xl">
                Reach
                <br />
                Obsidian
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-700">
                For product questions, order support, collaborations, or general
                inquiries, contact the OBSIDIAN team. We will respond as soon as
                possible.
              </p>

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="border-t border-black/10 pt-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
                    Order Support
                  </p>

                  <p className="mt-4 text-sm leading-7 text-neutral-700">
                    Get help with order confirmation, delivery, exchange, or
                    product availability.
                  </p>
                </div>

                <div className="border-t border-black/10 pt-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
                    Collaborations
                  </p>

                  <p className="mt-4 text-sm leading-7 text-neutral-700">
                    Contact us for creative partnerships, campaigns, wholesale,
                    and brand opportunities.
                  </p>
                </div>
              </div>
            </div>

            <aside className="h-fit border border-black/10 bg-[#eee7dd] p-8 md:p-10 lg:sticky lg:top-32">
              <p className="mb-8 text-xs uppercase tracking-[0.4em] text-neutral-500">
                Contact Details
              </p>

              <div className="divide-y divide-black/10">
                <div className="pb-8">
                  <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Email
                  </p>

                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="break-all text-lg transition hover:opacity-60"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>

                <div className="py-8">
                  <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    WhatsApp
                  </p>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg transition hover:opacity-60"
                  >
                    +880 1814-455199
                  </a>
                </div>

                <div className="pt-8">
                  <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Location
                  </p>

                  <p className="text-lg">{LOCATION}</p>
                </div>
              </div>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-12 flex w-full justify-center bg-[#0b0b0b] px-8 py-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Message On WhatsApp
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-4 flex w-full justify-center border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Send An Email
              </a>

              <p className="mt-6 text-center text-xs leading-6 text-neutral-500">
                Customer support is available for orders across Bangladesh.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 px-6 py-24 lg:px-10">
        <div className="container-custom flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Explore Obsidian
            </p>

            <h2 className="max-w-3xl font-heading text-5xl font-light leading-none md:text-6xl">
              Discover Pieces Built With Precision
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
              Explore premium essentials designed with structure, restraint, and
              quiet confidence.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-fit border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            Explore Shop
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}