import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import TrackOrderClient from "./TrackOrderClient";
import { getTrackOrderContent } from "../../lib/getCmsContent";

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function createMetadataDescription(value, fallback) {
  const description = cleanText(value, fallback);

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trim()}...`;
}

export async function generateMetadata() {
  const trackOrderPage = await getTrackOrderContent();
  const seo = trackOrderPage?.seo || {};

  const title = cleanText(seo.title, "Track Order");

  const description = createMetadataDescription(
    seo.description,
    "Track your OBSIDIAN order using your tracking ID and view its current delivery status."
  );

  const canonical = cleanText(
    seo.canonical,
    "/track-order"
  );

  const ogImage = cleanText(
    seo.ogImage,
    "/images/collection-artifact.jpeg"
  );

  const shouldIndex = seo.index !== false;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      title: `${title} | OBSIDIAN`,
      description,
      url: canonical,
      siteName: "OBSIDIAN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 1500,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${title} | OBSIDIAN`,
      description,
      images: [ogImage],
    },

    robots: {
      index: shouldIndex,
      follow: shouldIndex,

      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    keywords: cleanText(seo.keywords),
  };
}

export default async function TrackOrderPage() {
  const trackOrderPage = await getTrackOrderContent();
  const content = trackOrderPage?.content || {};

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-24 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[980px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {cleanText(
              content.eyebrow,
              "Order Tracking"
            )}
          </p>

          <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
            {cleanText(
              content.title,
              "Track Order"
            )}
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600">
            {cleanText(
              content.description,
              "Enter your tracking ID and checkout phone number to securely check your order status."
            )}
          </p>

          <TrackOrderClient content={content} />
        </div>
      </section>

      <Footer />
    </main>
  );
}