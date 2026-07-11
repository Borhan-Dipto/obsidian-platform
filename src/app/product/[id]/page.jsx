import Link from "next/link";
import { cache } from "react";
import clientPromise from "../../../lib/mongodb";
import ProductActions from "../../../components/product/ProductActions";
import RelatedProducts from "../../../components/product/RelatedProducts";
import RecentlyViewedProducts from "../../../components/product/RecentlyViewedProducts";
import ProductImageZoom from "../../../components/product/ProductImageZoom";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

const DEFAULT_DESCRIPTION =
  "A refined OBSIDIAN essential built with pressure, precision, and purpose.";

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function createMetadataDescription(value) {
  const description = cleanText(value, DEFAULT_DESCRIPTION);

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trim()}...`;
}

function getProductImage(product) {
  return cleanText(product?.image, FALLBACK_IMAGE);
}

function getAbsoluteUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl, `${SITE_URL}/`).toString();
  } catch {
    return new URL(FALLBACK_IMAGE, `${SITE_URL}/`).toString();
  }
}

function createProductPath(id) {
  return `/product/${encodeURIComponent(id)}`;
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const getProduct = cache(async (id) => {
  const productId = cleanText(id);

  if (!productId) {
    return null;
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const product = await db.collection("products").findOne({
      id: productId,
    });

    if (!product) {
      return null;
    }

    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error("Product lookup error:", error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description:
        "The requested OBSIDIAN product could not be found or is no longer available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productName = cleanText(product.name, "OBSIDIAN Product");
  const description = createMetadataDescription(product.description);
  const productPath = createProductPath(product.id);
  const productImage = getProductImage(product);

  return {
    title: productName,
    description,

    alternates: {
      canonical: productPath,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: SITE_NAME,
      url: productPath,
      title: `${productName} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: productImage,
          width: 1200,
          height: 1500,
          alt: productName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${productName} | ${SITE_NAME}`,
      description,
      images: [productImage],
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

    other: {
      "product:price:amount": String(Number(product.price) || 0),
      "product:price:currency": "BDT",
      "product:availability":
        Number(product.stock) > 0 ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-32 pb-20">
          <div className="max-w-2xl text-center">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Product
            </p>

            <h1 className="font-heading text-5xl font-light leading-none md:text-7xl">
              Product not found.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-neutral-600">
              This piece may have been removed, renamed, or is no longer
              available in the current collection.
            </p>

            <Link
              href="/shop"
              className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            >
              Back To Shop
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  const productName = cleanText(product.name, "OBSIDIAN Product");
  const productSeries = cleanText(product.series, "OBSIDIAN");
  const productColor = cleanText(product.color, "Obsidian Black");
  const productDescription = cleanText(
    product.description,
    DEFAULT_DESCRIPTION
  );

  const productImage = getProductImage(product);
  const productImageUrl = getAbsoluteUrl(productImage);
  const productPath = createProductPath(product.id);
  const productUrl = getAbsoluteUrl(productPath);

  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const isInStock = stock > 0;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: productName,
    description: productDescription,
    image: [productImageUrl],
    sku: String(product.id),
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: productSeries,
    color: productColor,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: price.toFixed(2),
      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        name: "Shop",
        item: `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: productUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <Navbar />

      <section className="px-6 pt-32 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500"
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <Link href="/shop" className="transition hover:text-black">
              Shop
            </Link>

            <span aria-hidden="true">/</span>

            <span
              className="max-w-[220px] truncate text-[#0b0b0b]"
              aria-current="page"
            >
              {productName}
            </span>
          </nav>

          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="space-y-6">
              <ProductImageZoom
                src={productImage}
                alt={`${productName} by ${SITE_NAME}`}
              />
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                {productSeries}
              </p>

              <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
                {productName}
              </h1>

              <p className="mt-8 text-3xl font-light">
                ৳ {price.toLocaleString("en-BD")}
              </p>

              <p className="mt-8 max-w-xl text-base leading-8 text-neutral-600">
                {productDescription}
              </p>

              <div className="mt-10 space-y-5 border-y border-black/10 py-7 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Color</span>
                  <span>{productColor}</span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Availability</span>

                  {isInStock ? (
                    <span>{stock} Available</span>
                  ) : (
                    <span className="text-red-700">Out of Stock</span>
                  )}
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Series</span>
                  <span>{productSeries}</span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">Product Code</span>
                  <span>{product.id}</span>
                </div>
              </div>

              <ProductActions product={product} />

              <div className="mt-10 grid gap-3 border-t border-black/10 pt-8 text-sm text-neutral-600 sm:grid-cols-2">
                <p>✓ Premium Cotton</p>
                <p>✓ Oversized Fit</p>
                <p>✓ Cash On Delivery</p>
                <p>✓ Easy Exchange</p>
                <p>✓ 2–5 Days Delivery</p>
              </div>

              <div className="mt-12 space-y-7 border-t border-black/10 pt-8">
                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Product Details
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    {product.details ||
                      "A premium everyday essential designed for structure, comfort, and quiet confidence."}
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Delivery
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    Delivery is available across Bangladesh. Every order is
                    reviewed and confirmed after checkout before dispatch.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    Exchange Support
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    Exchange assistance is available according to the OBSIDIAN
                    exchange policy. Keep the product unused and retain its
                    original packaging and tags.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecentlyViewedProducts product={product} />
      <RelatedProducts currentProductId={product.id} />

      <Footer />
    </main>
  );
}