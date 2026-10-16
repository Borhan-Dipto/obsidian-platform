/*
 * OBSIDIAN product feed for Meta Commerce Manager (catalog).
 *
 * The feed "id" is the product's own id, which is exactly what the
 * Meta Pixel and Conversions API send as content_ids. That match is
 * what makes dynamic / retargeting ads work.
 */

import { getProductTotalStock } from "./productInventory.js";

export const META_FEED_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "color",
  "material",
  "product_type",
  "google_product_category",
];

/* Google taxonomy: Apparel & Accessories > Clothing > Shirts & Tops */
const DEFAULT_PRODUCT_CATEGORY = "212";

function cleanText(value, maxLength) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function escapeCsvValue(value) {
  const text = String(value ?? "");

  /* Block spreadsheet formula injection. */
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return /[",\n\r]/.test(safeText)
    ? `"${safeText.replace(/"/g, '""')}"`
    : safeText;
}

function toAbsoluteUrl(pathOrUrl, siteUrl) {
  try {
    return new URL(pathOrUrl, `${siteUrl}/`).toString();
  } catch {
    return "";
  }
}

export function buildMetaFeedRow(product, siteUrl) {
  const id = cleanText(product?.id, 100);
  const title = cleanText(product?.name, 150);
  const price = Number(product?.price);

  if (!id || !title || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  const imageLink = toAbsoluteUrl(
    cleanText(product?.image, 2000) ||
      "/images/collection-artifact.jpeg",
    siteUrl
  );

  if (!imageLink) {
    return null;
  }

  const stock = getProductTotalStock(product);

  return {
    id,
    title,
    description:
      cleanText(product?.description, 5000) || title,
    availability: stock > 0 ? "in stock" : "out of stock",
    condition: "new",
    price: `${price.toFixed(2)} BDT`,
    link: toAbsoluteUrl(
      `/product/${encodeURIComponent(id)}`,
      siteUrl
    ),
    image_link: imageLink,
    /* Meta accepts up to 20 extra photos, comma-separated. */
    additional_image_link: (Array.isArray(product?.gallery)
      ? product.gallery
      : []
    )
      .map((url) => toAbsoluteUrl(cleanText(url, 2000), siteUrl))
      .filter((url) => url && url !== imageLink)
      .slice(0, 20)
      .join(","),
    brand: "OBSIDIAN",
    color: cleanText(product?.color, 100),
    material: cleanText(product?.details?.material, 200),
    product_type: cleanText(product?.series, 750),
    google_product_category: DEFAULT_PRODUCT_CATEGORY,
  };
}

export function buildMetaFeedCsv(products, siteUrl) {
  const lines = [META_FEED_COLUMNS.join(",")];

  for (const product of Array.isArray(products) ? products : []) {
    const row = buildMetaFeedRow(product, siteUrl);

    if (!row) {
      continue;
    }

    lines.push(
      META_FEED_COLUMNS.map((column) =>
        escapeCsvValue(row[column])
      ).join(",")
    );
  }

  return `${lines.join("\n")}\n`;
}
