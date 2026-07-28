import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getSizeGuideContent } from "../../lib/getCmsContent";
import { getObsidianSizeGuideRows } from "../../lib/sizeGuide";
import { normalizeActiveItems } from "../../lib/cmsDefaults";

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
  const sizeGuidePage = await getSizeGuideContent();
  const seo = sizeGuidePage?.seo || {};

  const title = cleanText(seo.title, "Size Guide");

  const description = createMetadataDescription(
    seo.description,
    "Find your ideal OBSIDIAN fit with our size guide for oversized and relaxed silhouettes."
  );

  const canonical = cleanText(
    seo.canonical,
    "/size-guide"
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

export default async function SizeGuidePage() {
  const sizeGuidePage = await getSizeGuideContent();
  const content = sizeGuidePage?.content || {};

  const sizes = normalizeActiveItems(
    getObsidianSizeGuideRows()
  );

  const measurementUnit = cleanText(
    content.measurementUnit,
    "in"
  );

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {cleanText(content.eyebrow, "Size Guide")}
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            {cleanText(content.title, "Find Your Fit")}
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
            {cleanText(
              content.description,
              "Our pieces are designed with a relaxed oversized fit. Use the guide below to choose your preferred silhouette."
            )}
          </p>

          {sizes.length > 0 ? (
            <div className="mt-16 overflow-x-auto border border-black/10">
              <table
                className="w-full min-w-[680px] text-left"
                aria-label={cleanText(
                  content.tableAriaLabel,
                  "OBSIDIAN clothing size guide"
                )}
              >
                <thead className="bg-[#0b0b0b] text-[#f1ece4]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-5 text-xs uppercase tracking-[0.3em]"
                    >
                      {cleanText(
                        content.sizeColumnLabel,
                        "Size"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-xs uppercase tracking-[0.3em]"
                    >
                      {cleanText(
                        content.chestColumnLabel,
                        "Chest"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-xs uppercase tracking-[0.3em]"
                    >
                      {cleanText(
                        content.lengthColumnLabel,
                        "Length"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-xs uppercase tracking-[0.3em]"
                    >
                      {cleanText(
                        content.shoulderColumnLabel,
                        "Shoulder"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sizes.map((item) => {
                    const sizeLabel = cleanText(item.size);

                    return (
                      <tr
                        key={item.id || sizeLabel}
                        className="border-t border-black/10"
                      >
                        <th
                          scope="row"
                          className="px-6 py-5 font-normal"
                        >
                          {sizeLabel}
                        </th>

                        <td className="px-6 py-5">
                          {cleanText(item.chest)}{" "}
                          {measurementUnit}
                        </td>

                        <td className="px-6 py-5">
                          {cleanText(item.length)}{" "}
                          {measurementUnit}
                        </td>

                        <td className="px-6 py-5">
                          {cleanText(item.shoulder)}{" "}
                          {measurementUnit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-16 border border-black/10 px-6 py-16 text-center">
              <h2 className="font-heading text-4xl font-light md:text-5xl">
                {cleanText(
                  content.emptyStateTitle,
                  "No size information is available."
                )}
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-600">
                {cleanText(
                  content.emptyStateDescription,
                  "Please contact OBSIDIAN support for assistance with choosing the right size."
                )}
              </p>
            </div>
          )}

          <p className="mt-8 max-w-2xl text-sm leading-7 text-neutral-600">
            {cleanText(
              content.note,
              "Measurements may vary slightly due to fabric, wash, and production process."
            )}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}