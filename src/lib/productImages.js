/*
 * Product photo helpers that are safe to use on both server and
 * client. A product has one main image (`image`, used for the cart,
 * catalog feed and collection covers) plus an optional `gallery` of
 * extra photos (back, print close-up, fabric, on-model).
 */

export const MAX_GALLERY_IMAGES = 7;

function cleanImageUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* Main image first, then gallery photos; empty and duplicate URLs removed. */
export function getProductImages(product) {
  const urls = [
    cleanImageUrl(product?.image),
    ...(Array.isArray(product?.gallery) ? product.gallery : []).map(
      cleanImageUrl
    ),
  ].filter(Boolean);

  return [...new Set(urls)].slice(0, MAX_GALLERY_IMAGES + 1);
}

/*
 * Customer-facing stock wording. Exact counts are only shown when
 * stock is low, which is when the number actually helps a buyer.
 */
export const LOW_STOCK_THRESHOLD = 5;

export function getStockLabel(stock) {
  const amount = Number(stock) || 0;

  if (amount <= 0) {
    return { tone: "out", text: "Out of stock" };
  }

  if (amount <= LOW_STOCK_THRESHOLD) {
    return { tone: "low", text: `Only ${amount} left` };
  }

  return { tone: "in", text: "In stock" };
}
