import Image from "next/image";
import Link from "next/link";

const DEFAULT_CONTENT = {
  eyebrow: "Built Under Pressure",
  title: "Where pressure meets precision",
  subtitle:
    "Engineered essentials shaped by pressure, precision, and quiet confidence.",

  desktopImage: "/images/hero-obsidian-editorial.png",
  mobileImage: "/images/hero-obsidian-editorial.png",
  imageAlt: "OBSIDIAN editorial campaign",

  mediaType: "image",
  videoUrl: "",

  primaryCta: {
    isEnabled: true,
    label: "Explore Collection",
    href: "/collections",
    openInNewTab: false,
  },

  secondaryCta: {
    isEnabled: true,
    label: "Shop All",
    href: "/shop",
    openInNewTab: false,
  },

  overlayOpacity: 20,
  contentAlignment: "left",
  backgroundPosition: "62% top",
  minHeight: 820,

  featuredCard: {
    isEnabled: true,
    eyebrow: "New Drop",
    title: "Artifact Series",
    image: "/images/collection-artifact.jpeg",
    imageAlt: "Artifact Series",
    href: "/shop?series=Artifact%20Series",
    buttonText: "View",
    openInNewTab: false,
  },

  sideCard: {
    isEnabled: true,
    title: "Obsidian System",
    description:
      "A refined uniform for discipline, strength, and intentional everyday presence.",
    href: "/collections",
    buttonText: "Discover",
    openInNewTab: false,
  },

  metaLabel: {
    isEnabled: true,
    lineOne: "OBS / 01",
    lineTwo: "Bangladesh",
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
    return base;
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

  const cleanedValue = value.trim();

  return cleanedValue || fallback;
}

function normalizeNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getLinkProps(openInNewTab) {
  if (!openInNewTab) {
    return {};
  }

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

function renderMultilineTitle(title) {
  const normalizedTitle = normalizeText(
    title,
    DEFAULT_CONTENT.title
  );

  const lines = normalizedTitle
    .split(/\n|<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => (
    <span
      key={`${line}-${index}`}
      className="-mb-[0.12em] block overflow-hidden pb-[0.12em]"
    >
      <span
        className="obsidian-hero-title-line block"
        style={{
          "--motion-delay": `${260 + index * 110}ms`,
        }}
      >
        {line}
      </span>
    </span>
  ));
}

export default function Hero({ section = null, content = null } = {}) {
  const sectionContent =
    content ||
    section?.content ||
    {};

  const hero = mergeContent(
    DEFAULT_CONTENT,
    sectionContent
  );

  const overlayOpacity = Math.min(
    90,
    Math.max(
      0,
      normalizeNumber(
        hero.overlayOpacity,
        DEFAULT_CONTENT.overlayOpacity
      )
    )
  );

  const minHeight = Math.max(
    620,
    normalizeNumber(
      hero.minHeight,
      DEFAULT_CONTENT.minHeight
    )
  );

  const contentAlignment =
    hero.contentAlignment === "center"
      ? "center"
      : hero.contentAlignment === "right"
        ? "right"
        : "left";

  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  const horizontalAlignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  const desktopImage = normalizeText(
    hero.desktopImage,
    DEFAULT_CONTENT.desktopImage
  );

  const mobileImage = normalizeText(
    hero.mobileImage,
    desktopImage
  );

  const imageAlt = normalizeText(
    hero.imageAlt,
    DEFAULT_CONTENT.imageAlt
  );

  const backgroundPosition = normalizeText(
    hero.backgroundPosition,
    DEFAULT_CONTENT.backgroundPosition
  );

  const videoUrl = normalizeText(hero.videoUrl);

  const mediaType =
    hero.mediaType === "video" && videoUrl
      ? "video"
      : "image";

  const primaryCtaEnabled =
    hero.primaryCta?.isEnabled !== false &&
    normalizeText(hero.primaryCta?.label) &&
    normalizeText(hero.primaryCta?.href);

  const secondaryCtaEnabled =
    hero.secondaryCta?.isEnabled !== false &&
    normalizeText(hero.secondaryCta?.label) &&
    normalizeText(hero.secondaryCta?.href);

  const featuredCardEnabled =
    hero.featuredCard?.isEnabled !== false &&
    normalizeText(hero.featuredCard?.title) &&
    normalizeText(hero.featuredCard?.href);

  const sideCardEnabled =
    hero.sideCard?.isEnabled !== false &&
    normalizeText(hero.sideCard?.title);

  return (
    <section
      className="obsidian-hero relative h-screen overflow-hidden bg-[#0b0b0b] text-[#f1ece4]"
      style={{
        minHeight: `${minHeight}px`,
      }}
    >
      {mediaType === "video" ? (
        <div className="obsidian-hero-media-shell absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={desktopImage}
            className="obsidian-hero-media h-full w-full object-cover"
            style={{
              objectPosition: backgroundPosition,
            }}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      ) : (
        <>
          <div className="obsidian-hero-media-shell absolute inset-0 md:hidden">
            <Image
              src={mobileImage}
              alt={imageAlt}
              fill
              priority
              sizes="100vw"
              className="obsidian-hero-media object-cover"
              style={{
                objectPosition: backgroundPosition,
              }}
            />
          </div>

          <div className="obsidian-hero-media-shell absolute inset-0 hidden md:block">
            <Image
              src={desktopImage}
              alt={imageAlt}
              fill
              priority
              sizes="100vw"
              className="obsidian-hero-media object-cover"
              style={{
                objectPosition: backgroundPosition,
              }}
            />
          </div>
        </>
      )}

      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: overlayOpacity / 100,
        }}
      />

      <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,rgba(11,11,11,0.95)_0%,rgba(11,11,11,0.76)_48%,rgba(11,11,11,0.25)_78%,transparent_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(to_top,rgba(11,11,11,0.82)_0%,rgba(11,11,11,0.28)_55%,transparent_100%)]" />

      <div className="relative z-20 flex h-full items-center px-6 pt-16 pb-20 sm:px-10 lg:px-20">
        <div
          className={`flex w-full max-w-[650px] flex-col ${alignmentClasses[contentAlignment]}`}
        >
          {normalizeText(hero.eyebrow) ? (
            <div
              className={`obsidian-hero-item mb-7 flex items-center gap-4 ${horizontalAlignmentClasses[contentAlignment]}`}
              style={{
                "--motion-delay": "150ms",
              }}
            >
              <span className="h-px w-10 bg-[#b1844a]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d7bea0]">
                {hero.eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="font-heading text-[4.6rem] font-light leading-[0.84] tracking-[-0.06em] sm:text-[6rem] lg:text-[7.6rem]">
            {renderMultilineTitle(hero.title)}
          </h1>

          {normalizeText(hero.subtitle) ? (
            <p
              className="obsidian-hero-item mt-7 max-w-md text-base leading-8 text-[#eee7dd]/82"
              style={{
                "--motion-delay": "560ms",
              }}
            >
              {hero.subtitle}
            </p>
          ) : null}

          {(primaryCtaEnabled || secondaryCtaEnabled) ? (
            <div
              className={`obsidian-hero-item mt-10 flex flex-wrap items-center gap-6 ${horizontalAlignmentClasses[contentAlignment]}`}
              style={{
                "--motion-delay": "700ms",
              }}
            >
              {primaryCtaEnabled ? (
                <Link
                  href={hero.primaryCta.href}
                  {...getLinkProps(
                    hero.primaryCta.openInNewTab
                  )}
                  className="obsidian-motion-button group inline-flex items-center gap-5 rounded-full bg-[#f1ece4] px-9 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0b0b0b] hover:bg-[#d7bea0]"
                >
                  {hero.primaryCta.label}

                  <span className="obsidian-motion-arrow">
                    →
                  </span>
                </Link>
              ) : null}

              {secondaryCtaEnabled ? (
                <Link
                  href={hero.secondaryCta.href}
                  {...getLinkProps(
                    hero.secondaryCta.openInNewTab
                  )}
                  className="inline-flex border-b border-[#d7bea0]/70 pb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4]/85 transition-transform duration-300 motion-safe:hover:-translate-y-px hover:text-[#d7bea0]"
                >
                  {hero.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}

          {featuredCardEnabled ? (
            <Link
              href={hero.featuredCard.href}
              {...getLinkProps(
                hero.featuredCard.openInNewTab
              )}
              className="obsidian-hero-card obsidian-motion-card relative z-40 mt-10 flex w-fit items-center gap-4 border border-[#f1ece4]/10 bg-[#0b0b0b]/45 p-3 backdrop-blur-md hover:bg-[#0b0b0b]/70"
              style={{
                "--motion-delay": "820ms",
              }}
            >
              {normalizeText(hero.featuredCard.image) ? (
                <div className="relative h-[60px] w-[60px] overflow-hidden bg-[#111]">
                  <Image
                    src={hero.featuredCard.image}
                    alt={normalizeText(
                      hero.featuredCard.imageAlt,
                      hero.featuredCard.title
                    )}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div>
                {normalizeText(
                  hero.featuredCard.eyebrow
                ) ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#b1844a]">
                    {hero.featuredCard.eyebrow}
                  </p>
                ) : null}

                <h3 className="mt-1 font-heading text-[1.35rem] font-light">
                  {hero.featuredCard.title}
                </h3>

                {normalizeText(
                  hero.featuredCard.buttonText
                ) ? (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7bea0]">
                    {hero.featuredCard.buttonText} →
                  </p>
                ) : null}
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      {sideCardEnabled ? (
        <div
          className="obsidian-hero-side absolute right-8 top-[42%] z-20 hidden w-[250px] border border-[#f1ece4]/12 bg-[#0b0b0b]/62 p-7 backdrop-blur-md lg:block xl:right-16"
          style={{
            "--motion-delay": "760ms",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]">
            {hero.sideCard.title}
          </p>

          {normalizeText(
            hero.sideCard.description
          ) ? (
            <p className="mt-5 text-sm leading-7 text-[#eee7dd]/70">
              {hero.sideCard.description}
            </p>
          ) : null}

          {normalizeText(hero.sideCard.href) &&
          normalizeText(
            hero.sideCard.buttonText
          ) ? (
            <Link
              href={hero.sideCard.href}
              {...getLinkProps(
                hero.sideCard.openInNewTab
              )}
              className="mt-7 inline-block text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7bea0]"
            >
              {hero.sideCard.buttonText} →
            </Link>
          ) : null}
        </div>
      ) : null}

      {hero.metaLabel?.isEnabled !== false ? (
        <div
          className="obsidian-hero-meta absolute right-8 top-28 z-20 hidden text-center lg:block xl:right-16"
          style={{
            "--motion-delay": "620ms",
          }}
        >
          {normalizeText(
            hero.metaLabel.lineOne
          ) ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
              {hero.metaLabel.lineOne}
            </p>
          ) : null}

          {normalizeText(
            hero.metaLabel.lineTwo
          ) ? (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
              {hero.metaLabel.lineTwo}
            </p>
          ) : null}

          <span className="mx-auto mt-4 block h-px w-8 bg-[#b1844a]" />
        </div>
      ) : null}
    </section>
  );
}
