import Reveal from "../ui/Reveal";

const DEFAULT_CONTENT = {
  eyebrow: "Our Direction",
  title: "Starting with T-shirts. Building a fashion label.",

  paragraphs: [
    "OBSIDIAN begins with graphic and oversized T-shirts, but the vision is bigger than one product. We are building a fashion brand around dark essentials, structured silhouettes, and quiet visual strength.",
    "As the brand grows, OBSIDIAN can expand into shirts, polos, hoodies, jackets, pants, accessories, and future seasonal collections—all under one consistent identity system.",
  ],

  featureCards: [
    {
      id: "story-launch-product",
      number: "01",
      title: "Launch Product",
      description:
        "We start focused with T-shirts—oversized fits, graphic drops, washed textures, and everyday wearable essentials.",
      order: 1,
      isActive: true,
    },
    {
      id: "story-brand-expansion",
      number: "02",
      title: "Brand Expansion",
      description:
        "The platform is ready for more fashion items—from shirts and hoodies to pants, accessories, and complete outfit categories.",
      order: 2,
      isActive: true,
    },
    {
      id: "story-future-collections",
      number: "03",
      title: "Future Collections",
      description:
        "Every new product line can be released through curated drops, collection stories, and the same OBSIDIAN visual language.",
      order: 3,
      isActive: true,
    },
  ],

  systemBlock: {
    isEnabled: true,
    eyebrow: "Fashion System",
    title: "One brand. Many future categories.",

    categories: [
      {
        id: "category-tshirts",
        title: "T-Shirts",
        description:
          "The first product line—oversized, graphic, minimal, and built around the core OBSIDIAN identity.",
        order: 1,
        isActive: true,
      },
      {
        id: "category-tops",
        title: "Tops",
        description:
          "Future shirts, polos, long sleeves, hoodies, and outerwear can be added as the brand grows.",
        order: 2,
        isActive: true,
      },
      {
        id: "category-bottoms",
        title: "Bottoms",
        description:
          "Pants, cargos, shorts, and everyday bottomwear can become part of future OBSIDIAN drops.",
        order: 3,
        isActive: true,
      },
      {
        id: "category-accessories",
        title: "Accessories",
        description:
          "Caps, bags, small goods, and lifestyle pieces can complete the fashion ecosystem later.",
        order: 4,
        isActive: true,
      },
    ],
  },
};

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function mergeContent(base, incoming) {
  if (!isPlainObject(incoming)) {
    return { ...base };
  }

  const result = {
    ...base,
  };

  Object.entries(incoming).forEach(([key, value]) => {
    if (
      isPlainObject(base[key]) &&
      isPlainObject(value)
    ) {
      result[key] = {
        ...base[key],
        ...value,
      };
      return;
    }

    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

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

function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_CONTENT.paragraphs];
  }

  return value
    .map((paragraph) =>
      typeof paragraph === "string"
        ? paragraph.trim()
        : ""
    )
    .filter(Boolean);
}

function normalizeItems(items, fallbackItems = []) {
  const sourceItems = Array.isArray(items)
    ? items
    : fallbackItems;

  return [...sourceItems]
    .filter((item) => item && item.isActive !== false)
    .sort(
      (firstItem, secondItem) =>
        normalizeOrder(firstItem.order) -
        normalizeOrder(secondItem.order)
    );
}

function renderMultilineTitle(title, fallback) {
  const normalizedTitle = normalizeText(
    title,
    fallback
  );

  const lines = normalizedTitle
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

function getFeatureCardClasses(index, totalItems) {
  const isLast = index === totalItems - 1;

  if (totalItems === 1) {
    return "py-10";
  }

  if (index === 0) {
    return "border-b border-[#f1ece4]/10 py-10 md:border-b-0 md:border-r md:pr-10";
  }

  if (isLast) {
    return "py-10 md:pl-10";
  }

  return "border-b border-[#f1ece4]/10 py-10 md:border-b-0 md:border-r md:px-10";
}

function getCategoryCardClasses(index, totalItems) {
  const isLast = index === totalItems - 1;
  const isSecondLast = index === totalItems - 2;

  if (totalItems === 1) {
    return "p-8 lg:p-10";
  }

  if (isLast) {
    return "p-8 lg:p-10";
  }

  if (isSecondLast) {
    return "border-b border-[#f1ece4]/10 p-8 sm:border-b-0 sm:border-r lg:p-10";
  }

  return "border-b border-[#f1ece4]/10 p-8 sm:border-r lg:p-10";
}

export default function BrandStory({
  section = null,
  content = null,
} = {}) {
  const sectionContent =
    content ||
    section?.content ||
    {};

  const story = mergeContent(
    DEFAULT_CONTENT,
    sectionContent
  );

  const eyebrow = normalizeText(
    story.eyebrow,
    DEFAULT_CONTENT.eyebrow
  );

  const title = normalizeText(
    story.title,
    DEFAULT_CONTENT.title
  );

  const paragraphs = normalizeParagraphs(
    story.paragraphs
  );

  const featureCards = normalizeItems(
    story.featureCards,
    DEFAULT_CONTENT.featureCards
  );

  const systemBlock = mergeContent(
    DEFAULT_CONTENT.systemBlock,
    story.systemBlock
  );

  const categories = normalizeItems(
    systemBlock.categories,
    DEFAULT_CONTENT.systemBlock.categories
  );

  const systemEnabled =
    systemBlock.isEnabled !== false;

  return (
    <section className="obsidian-dark-panel relative overflow-hidden px-6 py-32 text-[#f1ece4] lg:py-40">
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f1ece4_1px,transparent_1px),linear-gradient(#f1ece4_1px,transparent_1px)] bg-[size:96px_96px]" />
      </div>

      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#b1844a]/8 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 bottom-10 h-[28rem] w-[28rem] rounded-full bg-[#f1ece4]/4 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.52fr_0.48fr] lg:items-end">
          <Reveal
            variant="fade-up"
            duration={1050}
          >
            {eyebrow ? (
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-8 bg-[#b1844a]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#f1ece4]/45">
                  {eyebrow}
                </p>
              </div>
            ) : null}

            {title ? (
              <h2 className="font-heading max-w-5xl text-[4rem] font-light leading-[0.9] tracking-[-0.055em] text-[#f1ece4] sm:text-[5.6rem] lg:text-[7.3rem]">
                {renderMultilineTitle(
                  title,
                  DEFAULT_CONTENT.title
                )}
              </h2>
            ) : null}
          </Reveal>

          {paragraphs.length > 0 ? (
            <Reveal
              variant="fade-up"
              delay={140}
              duration={980}
              className="max-w-2xl lg:pb-4"
            >
              {paragraphs.map(
                (paragraph, index) => (
                  <p
                    key={`${paragraph}-${index}`}
                    className={
                      index === 0
                        ? "text-lg leading-9 text-[#eee7dd]/70"
                        : "mt-8 text-lg leading-9 text-[#eee7dd]/50"
                    }
                  >
                    {paragraph}
                  </p>
                )
              )}
            </Reveal>
          ) : null}
        </div>

        {featureCards.length > 0 ? (
          <div
            className={`mt-24 grid grid-cols-1 border-y border-[#f1ece4]/10 ${
              featureCards.length === 1
                ? "md:grid-cols-1"
                : featureCards.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-3"
            }`}
          >
            {featureCards.map(
              (card, index) => (
                <Reveal
                  key={
                    card.id ||
                    `${card.title}-${index}`
                  }
                  variant="fade-up"
                  duration={880}
                  delay={120 + index * 90}
                  className={getFeatureCardClasses(
                    index,
                    featureCards.length
                  )}
                >
                  {normalizeText(card.number) ? (
                    <p className="font-heading text-4xl font-light text-[#b1844a]">
                      {card.number}
                    </p>
                  ) : null}

                  {normalizeText(card.title) ? (
                    <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]">
                      {card.title}
                    </h3>
                  ) : null}

                  {normalizeText(
                    card.description
                  ) ? (
                    <p className="mt-5 max-w-sm text-sm leading-7 text-[#eee7dd]/55">
                      {card.description}
                    </p>
                  ) : null}
                </Reveal>
              )
            )}
          </div>
        ) : null}

        {systemEnabled ? (
          <Reveal
            variant="scale"
            delay={180}
            duration={1050}
            className="mt-20"
          >
            <div className="grid grid-cols-1 border border-[#f1ece4]/10 md:grid-cols-[0.42fr_0.58fr]">
              <div className="border-b border-[#f1ece4]/10 bg-[#f1ece4]/[0.03] p-8 md:border-b-0 md:border-r lg:p-10">
                {normalizeText(
                  systemBlock.eyebrow
                ) ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#b1844a]">
                    {systemBlock.eyebrow}
                  </p>
                ) : null}

                {normalizeText(
                  systemBlock.title
                ) ? (
                  <h3 className="mt-8 font-heading text-[3.2rem] font-light leading-[0.9] tracking-[-0.045em] text-[#f1ece4] sm:text-[4.5rem]">
                    {renderMultilineTitle(
                      systemBlock.title,
                      DEFAULT_CONTENT.systemBlock
                        .title
                    )}
                  </h3>
                ) : null}
              </div>

              {categories.length > 0 ? (
                <div
                  className={`grid grid-cols-1 ${
                    categories.length > 1
                      ? "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  {categories.map(
                    (category, index) => (
                      <div
                        key={
                          category.id ||
                          `${category.title}-${index}`
                        }
                        className={getCategoryCardClasses(
                          index,
                          categories.length
                        )}
                      >
                        {normalizeText(
                          category.title
                        ) ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                            {category.title}
                          </p>
                        ) : null}

                        {normalizeText(
                          category.description
                        ) ? (
                          <p className="mt-5 text-sm leading-7 text-[#eee7dd]/55">
                            {
                              category.description
                            }
                          </p>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
