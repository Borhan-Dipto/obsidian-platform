import Image from "next/image";
import Link from "next/link";
import clientPromise from "../../lib/mongodb";

const DEFAULT_CONTENT = {
  eyebrow: "Featured Product",
  productId: "artifact-001",
  customTitle: "",
  customDescription: "",
  imageOverride: "",
  imageAlt: "",
  buttonText: "View Product",
  showPrice: true,
  showSeries: true,
  showColor: true,
  showStock: false,
};

const FALLBACK_PRODUCT = {
  id: "artifact-001",
  name: "Artifact 001",
  description:
    "A dark oversized piece inspired by ancient strength, pressure, and refined purpose.",
  image: "/images/featured-artifact.jpeg",
  price: 0,
  stock: 0,
  series: "Artifact Series",
  color: "Obsidian Black",
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

  return Object.entries(incoming).reduce(
    (result, [key, value]) => {
      if (
        isPlainObject(base[key]) &&
        isPlainObject(value)
      ) {
        result[key] = {
          ...base[key],
          ...value,
        };
      } else if (value !== undefined) {
        result[key] = value;
      }

      return result;
    },
    { ...base }
  );
}

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getSafeImage(value) {
  return normalizeText(
    value,
    FALLBACK_PRODUCT.image
  );
}

async function getProduct(productId) {
  const normalizedProductId = normalizeText(
    productId,
    DEFAULT_CONTENT.productId
  );

  try {
    const client = await clientPromise;
    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const product = await db
      .collection("products")
      .findOne({
        id: normalizedProductId,
      });

    if (!product) {
      return null;
    }

    return JSON.parse(
      JSON.stringify(product)
    );
  } catch (error) {
    console.error(
      "Featured product loading error:",
      error
    );

    return null;
  }
}

export default async function FeaturedProduct({
  section = null,
  content = null,
} = {}) {
  if (section?.isEnabled === false) {
    return null;
  }

  const sectionContent =
    content ||
    section?.content ||
    {};

  const cmsContent = mergeContent(
    DEFAULT_CONTENT,
    sectionContent
  );

  const productId = normalizeText(
    cmsContent.productId,
    DEFAULT_CONTENT.productId
  );

  const databaseProduct =
    await getProduct(productId);

  const product = databaseProduct || {
    ...FALLBACK_PRODUCT,
    id: productId,
  };

  const title = normalizeText(
    cmsContent.customTitle,
    normalizeText(
      product.name,
      FALLBACK_PRODUCT.name
    )
  );

  const description = normalizeText(
    cmsContent.customDescription,
    normalizeText(
      product.description,
      FALLBACK_PRODUCT.description
    )
  );

  const image = getSafeImage(
    cmsContent.imageOverride ||
      product.image
  );

  const imageAlt = normalizeText(
    cmsContent.imageAlt,
    title
  );

  const eyebrow = normalizeText(
    cmsContent.eyebrow,
    DEFAULT_CONTENT.eyebrow
  );

  const buttonText = normalizeText(
    cmsContent.buttonText,
    DEFAULT_CONTENT.buttonText
  );

  const productHref = databaseProduct
    ? `/product/${product.id}`
    : "/shop";

  const price = normalizeNumber(
    product.price
  );

  const stock = normalizeNumber(
    product.stock
  );

  const series = normalizeText(
    product.series,
    FALLBACK_PRODUCT.series
  );

  const color = normalizeText(
    product.color,
    FALLBACK_PRODUCT.color
  );

  const showPrice =
    cmsContent.showPrice !== false;

  const showSeries =
    cmsContent.showSeries !== false;

  const showColor =
    cmsContent.showColor !== false;

  const showStock =
    cmsContent.showStock === true;

  const metaItems = [];

  if (showSeries && series) {
    metaItems.push(series);
  }

  if (showColor && color) {
    metaItems.push(color);
  }

  if (showStock) {
    metaItems.push(
      stock > 0
        ? `${stock} In Stock`
        : "Out of Stock"
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#0b0b0b] px-6 py-32 text-[#f1ece4] lg:py-40">
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f1ece4_1px,transparent_1px),linear-gradient(#f1ece4_1px,transparent_1px)] bg-[size:110px_110px]" />
      </div>

      <div className="pointer-events-none absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-[#b1844a]/10 blur-3xl" />

      <div className="container-custom relative z-10 grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center lg:gap-24">
        <Link
          href={productHref}
          className="group relative block aspect-square overflow-hidden bg-[#111]"
          aria-label={`View ${title}`}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-50" />

          {!databaseProduct ? (
            <div className="absolute left-5 top-5 border border-white/15 bg-black/45 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
              Preview
            </div>
          ) : null}
        </Link>

        <div>
          {eyebrow ? (
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-8 bg-[#b1844a]" />

              <p className="text-xs uppercase tracking-[0.45em] text-neutral-500">
                {eyebrow}
              </p>
            </div>
          ) : null}

          <h2 className="font-heading text-5xl font-light leading-tight md:text-7xl">
            {title}
          </h2>

          {showPrice && databaseProduct ? (
            <p className="mt-7 text-2xl font-light text-[#d7bea0]">
              ৳ {price}
            </p>
          ) : null}

          {description ? (
            <p className="mt-8 max-w-xl text-lg leading-9 text-neutral-300">
              {description}
            </p>
          ) : null}

          {metaItems.length > 0 ? (
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-neutral-500">
              {metaItems.join(" / ")}
            </p>
          ) : null}

          {buttonText ? (
            <Link
              href={productHref}
              className="group mt-12 inline-flex items-center gap-5 border border-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              {buttonText}

              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
