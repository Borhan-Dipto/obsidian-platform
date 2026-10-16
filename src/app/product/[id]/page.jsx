import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import clientPromise from "../../../lib/mongodb";

import {
  PRODUCTS_COLLECTION_NAME,
  getPublicProductQuery,
} from "../../../lib/catalog";

import {
  getProductContent,
  getSizeGuideContent,
} from "../../../lib/getCmsContent";
import { normalizeActiveItems } from "../../../lib/cmsDefaults";
import {
  DEFAULT_SETTINGS,
  getSettings,
} from "../../../lib/settings";
import { buildDeliveryLines } from "../../../lib/storePolicies";
import {
  buildFaqJsonLd,
  buildProductFaq,
} from "../../../lib/productFaq.js";
import ProductActions from "../../../components/product/ProductActions";
import ProductSizeGuide from "../../../components/product/ProductSizeGuide";
import RelatedProducts from "../../../components/product/RelatedProducts";
import RecentlyViewedProducts from "../../../components/product/RecentlyViewedProducts";
import ProductGallery from "../../../components/product/ProductGallery";
import {
  getProductImages,
  getStockLabel,
} from "../../../lib/productImages.js";
import MetaViewContent from "../../../components/analytics/MetaViewContent";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";

const SITE_NAME = "OBSIDIAN";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function replaceTemplate(template, values = {}) {
  let result = cleanText(template);

  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, String(value ?? ""));
  }

  return result;
}

function createMetadataDescription(value, fallback) {
  const description = cleanText(value, fallback);

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trim()}...`;
}

function getProductImage(product, fallbackImage) {
  return cleanText(product?.image, fallbackImage);
}

function getAbsoluteUrl(pathOrUrl, fallbackImage) {
  try {
    return new URL(pathOrUrl, `${SITE_URL}/`).toString();
  } catch {
    return new URL(fallbackImage, `${SITE_URL}/`).toString();
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

    const product = await db
      .collection(
        PRODUCTS_COLLECTION_NAME
      )
      .findOne(
        getPublicProductQuery({
          id: productId,
        })
      );

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

  const [product, productPage] = await Promise.all([
    getProduct(id),
    getProductContent(),
  ]);

  const seo = productPage?.seo || {};
  const content = productPage?.content || {};

  const fallbackTitle = cleanText(
    seo.fallbackTitle,
    "OBSIDIAN Product"
  );

  const fallbackDescription = cleanText(
    seo.fallbackDescription,
    "A refined OBSIDIAN essential built with pressure, precision, and purpose."
  );

  const fallbackImage = cleanText(
    seo.fallbackImage,
    "/images/collection-artifact.jpeg"
  );

  if (!product) {
    return {
      title: cleanText(
        seo.notFoundTitle,
        "Product Not Found"
      ),

      description: cleanText(
        seo.notFoundDescription,
        "The requested OBSIDIAN product could not be found or is no longer available."
      ),

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productName = cleanText(
    product.name,
    cleanText(
      content.productFallbackName,
      fallbackTitle
    )
  );

  const description = createMetadataDescription(
    product.description,
    cleanText(
      content.productFallbackDescription,
      fallbackDescription
    )
  );

  const productPath = createProductPath(product.id);

  const canonicalPath = replaceTemplate(
    cleanText(seo.canonicalTemplate, productPath),
    {
      id: product.id,
      product: productName,
      site: SITE_NAME,
    }
  );

  const productImage = getProductImage(
    product,
    fallbackImage
  );

  const metadataTitle = replaceTemplate(
    cleanText(seo.titleTemplate, "{product}"),
    {
      product: productName,
      site: SITE_NAME,
    }
  );

  const openGraphTitle = replaceTemplate(
    cleanText(
      seo.openGraphTitleTemplate,
      "{product} | OBSIDIAN"
    ),
    {
      product: productName,
      site: SITE_NAME,
    }
  );

  const twitterTitle = replaceTemplate(
    cleanText(
      seo.twitterTitleTemplate,
      "{product} | OBSIDIAN"
    ),
    {
      product: productName,
      site: SITE_NAME,
    }
  );

  const shouldIndex = seo.index !== false;
  const shouldFollow = seo.follow !== false;

  return {
    title: metadataTitle,
    description,

    alternates: {
      canonical: canonicalPath,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: SITE_NAME,
      url: productPath,
      title: openGraphTitle,
      description,

      images: [
        {
          url: productImage,
          alt: productName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description,
      images: [productImage],
    },

    robots: {
      index: shouldIndex,
      follow: shouldFollow,

      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    other: {
      "product:price:amount": String(
        Number(product.price) || 0
      ),
      "product:price:currency": "BDT",
      "product:availability":
        Number(product.stock) > 0
          ? "in stock"
          : "out of stock",
    },
  };
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;

  const [product, productPage, sizeGuidePage] = await Promise.all([
    getProduct(id),
    getProductContent(),
    getSizeGuideContent(),
  ]);

  const seo = productPage?.seo || {};
  const content = productPage?.content || {};
  const sizeGuideContent =
    sizeGuidePage?.content || {};

  const fallbackImage = cleanText(
    seo.fallbackImage,
    "/images/collection-artifact.jpeg"
  );

  if (!product) {
    notFound();
  }

  const productName = cleanText(
    product.name,
    cleanText(
      content.productFallbackName,
      "OBSIDIAN Product"
    )
  );

  const productSeries = cleanText(
    product.series,
    cleanText(
      content.productFallbackSeries,
      "OBSIDIAN"
    )
  );

  const productColor = cleanText(
    product.color,
    cleanText(
      content.productFallbackColor,
      "Obsidian Black"
    )
  );

  const productDescription = cleanText(
    product.description,
    cleanText(
      content.productFallbackDescription,
      "A refined OBSIDIAN essential built with pressure, precision, and purpose."
    )
  );

  const productImage = getProductImage(
    product,
    fallbackImage
  );

  const productImages = getProductImages(product);

  if (productImages.length === 0) {
    productImages.push(productImage);
  }

  const productImageUrls = productImages.map((image) =>
    getAbsoluteUrl(image, fallbackImage)
  );

  const productPath = createProductPath(product.id);

  const productUrl = getAbsoluteUrl(
    productPath,
    fallbackImage
  );

  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const isInStock = stock > 0;

  const currencySymbol = cleanText(
    content.currencySymbol,
    "৳"
  );

  const currencyLocale = cleanText(
    content.currencyLocale,
    "en-BD"
  );

  const stockLabel = getStockLabel(stock);

  const imageAlt = replaceTemplate(
    cleanText(
      content.productImageAltTemplate,
      "{product} by OBSIDIAN"
    ),
    {
      product: productName,
      site: SITE_NAME,
    }
  );

  const featureHighlights = normalizeActiveItems(
    content.featureHighlights
  );

  /* Owner-confirmed product facts; empty ones are not shown. */
  const productDetails =
    product.details && typeof product.details === "object"
      ? product.details
      : {};

  const productGsm = Number(productDetails.gsm);

  const detailRows = [
    {
      key: "material",
      label: "Fabric",
      value: cleanText(productDetails.material),
    },
    {
      key: "gsm",
      label: "Fabric Weight",
      value:
        Number.isInteger(productGsm) && productGsm > 0
          ? `${productGsm} GSM`
          : "",
    },
    {
      key: "fit",
      label: "Fit",
      value: cleanText(productDetails.fit),
    },
    {
      key: "print",
      label: "Print",
      value: cleanText(productDetails.print),
    },
  ].filter((row) => row.value);

  const productCare = cleanText(productDetails.care);

  const storeSettings = await getSettings().catch(
    () => DEFAULT_SETTINGS
  );

  const deliveryLines = buildDeliveryLines(
    storeSettings,
    currencySymbol
  );

  const faqItems = buildProductFaq({
    settings: storeSettings,
    details: productDetails,
    currencySymbol,
  });

  const additionalProperty = detailRows
    .filter((row) => row.key !== "material")
    .map((row) => ({
      "@type": "PropertyValue",
      name: row.label,
      value: row.value,
    }));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: productName,
    description: productDescription,
    image: productImageUrls,
    sku: String(product.id),
    url: productUrl,

    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },

    category: productSeries,
    color: productColor,

    ...(cleanText(productDetails.material)
      ? { material: cleanText(productDetails.material) }
      : {}),

    ...(additionalProperty.length > 0
      ? { additionalProperty }
      : {}),

    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: price.toFixed(2),

      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",

      itemCondition: "https://schema.org/NewCondition",

      /* Global policy published on the Organization markup. */
      hasMerchantReturnPolicy: {
        "@id": `${SITE_URL}/#return-policy`,
      },

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
        name: cleanText(
          content.breadcrumbHomeLabel,
          "Home"
        ),
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cleanText(
          content.breadcrumbShopLabel,
          "Shop"
        ),
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
    <main className="obsidian-product-page min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildFaqJsonLd(faqItems, productUrl)
          ),
        }}
      />

      <MetaViewContent
        productId={String(product.id)}
        productName={productName}
        price={price}
        currency="BDT"
      />

      <Navbar />

      <section className="px-6 pt-28 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label={cleanText(
              content.breadcrumbAriaLabel,
              "Breadcrumb"
            )}
            className="obsidian-product-breadcrumb mb-6 flex flex-wrap items-center gap-3 text-[11px] uppercase lg:mb-10 tracking-[0.28em] text-neutral-500"
          >
            <Link
              href="/"
              className="transition hover:text-black"
            >
              {cleanText(
                content.breadcrumbHomeLabel,
                "Home"
              )}
            </Link>

            <span aria-hidden="true">/</span>

            <Link
              href="/shop"
              className="transition hover:text-black"
            >
              {cleanText(
                content.breadcrumbShopLabel,
                "Shop"
              )}
            </Link>

            <span aria-hidden="true">/</span>

            <span
              className="max-w-[220px] truncate text-[#0b0b0b]"
              aria-current="page"
            >
              {productName}
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="obsidian-product-media-column space-y-6">
              <ProductGallery
                images={productImages}
                alt={imageAlt}
              />
            </div>

            <div className="obsidian-product-info-column lg:sticky lg:top-32 lg:self-start">
              <p className="mb-4 text-xs uppercase tracking-[0.4em] text-neutral-500 lg:mb-5">
                {productSeries}
              </p>

              <h1 className="font-heading text-5xl font-light leading-none sm:text-6xl md:text-8xl">
                {productName}
              </h1>

              <p className="mt-8 text-3xl font-light">
                {currencySymbol}{" "}
                {price.toLocaleString(currencyLocale)}
              </p>

              <ProductActions
                product={product}
                productName={productName}
                productImage={productImage}
              />

              {featureHighlights.length > 0 && (
                <div className="mt-10 grid gap-3 border-t border-black/10 pt-8 text-sm text-neutral-600 sm:grid-cols-2">
                  {featureHighlights.map((item) => (
                    <p key={item.id}>
                      ✓ {cleanText(item.text)}
                    </p>
                  ))}
                </div>
              )}

              <p className="mt-8 max-w-xl text-base leading-8 text-neutral-600">
                {productDescription}
              </p>

              <div className="mt-10 space-y-5 border-y border-black/10 py-7 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">
                    {cleanText(
                      content.colorLabel,
                      "Color"
                    )}
                  </span>

                  <span>{productColor}</span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">
                    {cleanText(
                      content.availabilityLabel,
                      "Availability"
                    )}
                  </span>

                  {isInStock ? (
                    <span>{stockLabel.text}</span>
                  ) : (
                    <span className="text-red-700">
                      {cleanText(
                        content.outOfStockText,
                        "Out of Stock"
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">
                    {cleanText(
                      content.seriesLabel,
                      "Series"
                    )}
                  </span>

                  <span>{productSeries}</span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-neutral-500">
                    {cleanText(
                      content.productCodeLabel,
                      "Product Code"
                    )}
                  </span>

                  <span>{product.id}</span>
                </div>

                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex justify-between gap-8"
                  >
                    <span className="text-neutral-500">
                      {row.label}
                    </span>

                    <span className="text-right">
                      {row.value}
                    </span>
                  </div>
                ))}

                {productCare ? (
                  <div className="flex justify-between gap-8">
                    <span className="text-neutral-500">
                      Care
                    </span>

                    <span className="max-w-[65%] text-right">
                      {productCare}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-12 space-y-7 border-t border-black/10 pt-8">
                {/* Generic copy only when the owner has not entered fabric facts. */}
                {detailRows.length === 0 ? (
                  <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    {cleanText(
                      content.productDetailsTitle,
                      "Product Details"
                    )}
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    {cleanText(
                      product.details,
                      cleanText(
                        content.productDetailsFallback,
                        "A premium everyday essential designed for structure, comfort, and quiet confidence."
                      )
                    )}
                  </p>
                </div>
                ) : null}

                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    {cleanText(
                      content.deliveryTitle,
                      "Delivery"
                    )}
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    {cleanText(
                      content.deliveryDescription,
                      "Delivery is available across Bangladesh. Every order is reviewed and confirmed after checkout before dispatch."
                    )}
                  </p>

                  <dl className="mt-4 space-y-2 text-sm">
                    {deliveryLines.map((line) => (
                      <div
                        key={line.key}
                        className="flex justify-between gap-8"
                      >
                        <dt className="text-neutral-500">
                          {line.label}
                        </dt>

                        <dd className="text-right text-neutral-700">
                          {line.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h2 className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    {cleanText(
                      content.exchangeTitle,
                      "Exchange Support"
                    )}
                  </h2>

                  <p className="leading-8 text-neutral-600">
                    {cleanText(
                      content.exchangeDescription,
                      "Exchange assistance is available according to the OBSIDIAN exchange policy. Keep the product unused and retain its original packaging and tags."
                    )}
                  </p>
                </div>

                <section aria-labelledby="product-faq-title">
                  <h2
                    id="product-faq-title"
                    className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500"
                  >
                    Questions
                  </h2>

                  <div className="divide-y divide-black/10 border-y border-black/10">
                    {faqItems.map((item) => (
                      <details
                        key={item.id}
                        className="group py-1"
                      >
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-2 text-sm text-[#0b0b0b] [&::-webkit-details-marker]:hidden">
                          {item.question}

                          <span
                            aria-hidden="true"
                            className="text-lg leading-none text-neutral-500 transition-transform duration-300 group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>

                        <p className="pb-4 text-sm leading-7 text-neutral-600">
                          {item.answer}
                          {item.link ? (
                            <>
                              {" "}
                              <Link
                                href={item.link.href}
                                className="border-b border-black/30 text-[#0b0b0b]"
                              >
                                {item.link.label}
                              </Link>
                            </>
                          ) : null}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductSizeGuide
        content={sizeGuideContent}
      />

      <RecentlyViewedProducts product={product} />

      <RelatedProducts
        currentProductId={product.id}
      />

      <Footer />
    </main>
  );
}