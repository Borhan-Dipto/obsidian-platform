import {
  getActiveObsidianSizeGuideRows,
} from "../../lib/sizeGuide";
import Reveal from "../ui/Reveal";

function cleanText(
  value,
  fallback = ""
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return (
    value.replace(/\s+/g, " ").trim() ||
    fallback
  );
}

function resolveContent(value) {
  if (
    value?.content &&
    typeof value.content === "object" &&
    !Array.isArray(value.content)
  ) {
    return value.content;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function MeasurementValue({
  inches,
  centimetres,
}) {
  return (
    <span>
      <strong className="font-medium text-[#0b0b0b]">
        {inches}″
      </strong>

      <span className="ml-2 text-neutral-400">
        {centimetres} cm
      </span>
    </span>
  );
}

export default function ProductSizeGuide({
  content = {},
}) {
  const resolvedContent =
    resolveContent(content);

  const sizeRows =
    getActiveObsidianSizeGuideRows(
      resolvedContent
    );

  return (
    <section
      aria-labelledby="product-size-chart-title"
      className="obsidian-product-size-chart border-t border-black/10 bg-[#eee7dd]"
    >
      <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <Reveal
          as="header"
          variant="fade-up"
          duration={900}
          y={24}
          className="grid gap-6 border-b border-black/10 pb-9 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-end lg:gap-16"
        >
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-neutral-500">
              {cleanText(
                resolvedContent.eyebrow,
                "Size Guide"
              )}
            </p>

            <h2
              id="product-size-chart-title"
              className="mt-4 max-w-3xl font-heading text-4xl font-light leading-none sm:text-5xl lg:text-6xl"
            >
              {cleanText(
                resolvedContent.inlineTitle,
                "Find Your OBSIDIAN Fit"
              )}
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-neutral-600 lg:justify-self-end">
            {cleanText(
              resolvedContent.inlineDescription,
              "Compare body-fit and finished garment measurements before selecting your size. Measurements follow OBSIDIAN's relaxed oversized silhouette."
            )}
          </p>
        </Reveal>

        <Reveal
          as="div"
          variant="clip-up"
          delay={80}
          duration={1050}
          y={18}
          className="mt-10 hidden overflow-hidden border border-black/10 bg-[#f1ece4] md:block"
        >
          <table
            className="w-full table-fixed text-left"
            aria-label={cleanText(
              resolvedContent.tableAriaLabel,
              "OBSIDIAN product size measurements"
            )}
          >
            <thead className="bg-[#0b0b0b] text-[#f1ece4]">
              <tr>
                <th
                  scope="col"
                  className="w-[14%] px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em]"
                >
                  Size
                </th>

                <th
                  scope="col"
                  className="px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em]"
                >
                  Fits Body Chest
                </th>

                <th
                  scope="col"
                  className="px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em]"
                >
                  Garment Chest
                </th>

                <th
                  scope="col"
                  className="px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em]"
                >
                  Length
                </th>

                <th
                  scope="col"
                  className="px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em]"
                >
                  Shoulder
                </th>
              </tr>
            </thead>

            <tbody>
              {sizeRows.map(
                (item) => (
                  <tr
                    key={item.size}
                    className="obsidian-product-size-row border-t border-black/10 transition hover:bg-black/[0.025]"
                  >
                    <th
                      scope="row"
                      className="px-6 py-6 font-heading text-3xl font-light"
                    >
                      {item.size}
                    </th>

                    <td className="px-6 py-6 text-sm">
                      <MeasurementValue
                        inches={item.bodyChest}
                        centimetres={
                          item.bodyChestCm
                        }
                      />
                    </td>

                    <td className="px-6 py-6 text-sm">
                      <MeasurementValue
                        inches={item.chest}
                        centimetres={
                          item.chestCm
                        }
                      />
                    </td>

                    <td className="px-6 py-6 text-sm">
                      <MeasurementValue
                        inches={item.length}
                        centimetres={
                          item.lengthCm
                        }
                      />
                    </td>

                    <td className="px-6 py-6 text-sm">
                      <MeasurementValue
                        inches={item.shoulder}
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
        </Reveal>

        <div className="mt-8 grid gap-3 md:hidden">
          {sizeRows.map(
            (item, index) => (
              <Reveal
                key={item.size}
                as="article"
                variant="fade-up"
                delay={index * 70}
                duration={820}
                y={20}
                className="obsidian-product-size-card border border-black/10 bg-[#f1ece4] p-5"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                    OBSIDIAN Size
                  </p>

                  <h3 className="font-heading text-4xl font-light">
                    {item.size}
                  </h3>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <dt className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Fits Body Chest
                    </dt>

                    <dd className="mt-2 text-xs">
                      <MeasurementValue
                        inches={item.bodyChest}
                        centimetres={
                          item.bodyChestCm
                        }
                      />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Garment Chest
                    </dt>

                    <dd className="mt-2 text-xs">
                      <MeasurementValue
                        inches={item.chest}
                        centimetres={
                          item.chestCm
                        }
                      />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Length
                    </dt>

                    <dd className="mt-2 text-xs">
                      <MeasurementValue
                        inches={item.length}
                        centimetres={
                          item.lengthCm
                        }
                      />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Shoulder
                    </dt>

                    <dd className="mt-2 text-xs">
                      <MeasurementValue
                        inches={item.shoulder}
                        centimetres={
                          item.shoulderCm
                        }
                      />
                    </dd>
                  </div>
                </dl>
              </Reveal>
            )
          )}
        </div>

        <div className="obsidian-product-size-note mt-7 flex flex-col gap-3 border-t border-black/10 pt-6 text-[10px] leading-5 text-neutral-500 sm:flex-row sm:items-start sm:justify-between">
          <p>
            Garment measurements represent the
            finished product.
          </p>

          <p className="sm:text-right">
            Allow approximately ±1.5 cm
            production tolerance.
          </p>
        </div>
      </div>
    </section>
  );
}
