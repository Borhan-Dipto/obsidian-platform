import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import {
  getSizeGuideContent,
} from "../../lib/getCmsContent";

import {
  getObsidianSizeGuideRows,
} from "../../lib/sizeGuide";

function cleanText(
  value,
  fallback = ""
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  const cleanedValue =
    value
      .replace(/\s+/g, " ")
      .trim();

  return (
    cleanedValue ||
    fallback
  );
}

function createMetadataDescription(
  value,
  fallback
) {
  const description =
    cleanText(
      value,
      fallback
    );

  if (
    description.length <=
    160
  ) {
    return description;
  }

  return `${description
    .slice(0, 157)
    .trim()}...`;
}

function MeasurementValue({
  inches,
  centimetres,
}) {
  return (
    <span className="whitespace-nowrap">
      <strong className="font-medium text-[#0b0b0b]">
        {cleanText(
          inches,
          "—"
        )}
        ″
      </strong>

      <span className="ml-2 text-neutral-400">
        {cleanText(
          centimetres,
          "—"
        )}{" "}
        cm
      </span>
    </span>
  );
}

export async function generateMetadata() {
  const sizeGuidePage =
    await getSizeGuideContent();

  const seo =
    sizeGuidePage?.seo ||
    {};

  const title =
    cleanText(
      seo.title,
      "Size Guide"
    );

  const description =
    createMetadataDescription(
      seo.description,
      "Find your ideal OBSIDIAN fit with our size guide for oversized and relaxed silhouettes."
    );

  const canonical =
    cleanText(
      seo.canonical,
      "/size-guide"
    );

  const ogImage =
    cleanText(
      seo.ogImage,
      "/images/collection-artifact.jpeg"
    );

  const shouldIndex =
    seo.index !== false;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      title:
        `${title} | OBSIDIAN`,
      description,
      url: canonical,
      siteName:
        "OBSIDIAN",

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
      card:
        "summary_large_image",

      title:
        `${title} | OBSIDIAN`,

      description,

      images: [
        ogImage,
      ],
    },

    robots: {
      index:
        shouldIndex,

      follow:
        shouldIndex,

      googleBot: {
        index:
          shouldIndex,

        follow:
          shouldIndex,

        "max-image-preview":
          "large",

        "max-snippet":
          -1,

        "max-video-preview":
          -1,
      },
    },

    keywords:
      cleanText(
        seo.keywords
      ),
  };
}

export default async function SizeGuidePage() {
  const sizeGuidePage =
    await getSizeGuideContent();

  const content =
    sizeGuidePage?.content ||
    {};

  const sizes =
    getObsidianSizeGuideRows(
      content
    ).filter(
      (row) =>
        row.isActive !== false
    );

  const noteId =
    "standalone-size-guide-notes";

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-5 pb-24 pt-36 sm:px-7 lg:px-10 lg:pb-32 lg:pt-44">
        <div className="mx-auto max-w-[1500px]">
          <header className="grid gap-8 border-b border-black/10 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.48fr)] lg:items-end lg:gap-16">
            <div>
              <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
                {cleanText(
                  content.eyebrow,
                  "Size Guide"
                )}
              </p>

              <h1 className="max-w-4xl font-heading text-6xl font-light leading-[0.9] md:text-8xl">
                {cleanText(
                  content.title,
                  "Find Your Fit"
                )}
              </h1>
            </div>

            <div className="lg:justify-self-end">
              <p className="max-w-xl text-base leading-8 text-neutral-700">
                {cleanText(
                  content.description,
                  "Our pieces are designed with a relaxed oversized fit. Use the guide below to choose your preferred silhouette."
                )}
              </p>

              <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                Measurements:{" "}
                {cleanText(
                  content.measurementUnit,
                  "in / cm"
                )}
              </p>
            </div>
          </header>

          {sizes.length > 0 ? (
            <div className="mt-12 overflow-x-auto border border-black/10">
              <table
                aria-label={cleanText(
                  content.tableAriaLabel,
                  "OBSIDIAN clothing size guide"
                )}
                aria-describedby={
                  noteId
                }
                className="w-full min-w-[1050px] border-collapse text-left"
              >
                <thead className="bg-[#0b0b0b] text-[#f1ece4]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.26em]"
                    >
                      {cleanText(
                        content.sizeColumnLabel,
                        "Size"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.26em]"
                    >
                      {cleanText(
                        content.bodyChestColumnLabel,
                        "Fits Body Chest"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.26em]"
                    >
                      {cleanText(
                        content.chestColumnLabel,
                        "Garment Chest"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.26em]"
                    >
                      {cleanText(
                        content.lengthColumnLabel,
                        "Length"
                      )}
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.26em]"
                    >
                      {cleanText(
                        content.shoulderColumnLabel,
                        "Shoulder"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sizes.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={
                          item.id ||
                          item.size
                        }
                        className={`border-t border-black/10 ${
                          index % 2 ===
                          0
                            ? "bg-[#eee7dd]"
                            : "bg-[#f1ece4]"
                        }`}
                      >
                        <th
                          scope="row"
                          className="px-6 py-6 font-heading text-2xl font-light"
                        >
                          {item.size}
                        </th>

                        <td className="px-6 py-6 text-sm text-neutral-600">
                          <MeasurementValue
                            inches={
                              item.bodyChest
                            }
                            centimetres={
                              item.bodyChestCm
                            }
                          />
                        </td>

                        <td className="px-6 py-6 text-sm text-neutral-600">
                          <MeasurementValue
                            inches={
                              item.chest
                            }
                            centimetres={
                              item.chestCm
                            }
                          />
                        </td>

                        <td className="px-6 py-6 text-sm text-neutral-600">
                          <MeasurementValue
                            inches={
                              item.length
                            }
                            centimetres={
                              item.lengthCm
                            }
                          />
                        </td>

                        <td className="px-6 py-6 text-sm text-neutral-600">
                          <MeasurementValue
                            inches={
                              item.shoulder
                            }
                            centimetres={
                              item.shoulderCm
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-12 border border-black/10 px-6 py-16 text-center">
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

          <div
            id={noteId}
            className="mt-8 grid gap-3 border-t border-black/10 pt-7 text-sm leading-7 text-neutral-600 sm:grid-cols-2 sm:gap-10"
          >
            <p>
              {cleanText(
                content.note,
                "Garment measurements represent the finished product."
              )}
            </p>

            <p>
              {cleanText(
                content.toleranceNote,
                "Allow approximately ±1.5 cm production tolerance."
              )}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
