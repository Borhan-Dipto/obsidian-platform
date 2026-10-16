import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LOW_STOCK_THRESHOLD,
  MAX_GALLERY_IMAGES,
  getProductImages,
  getStockLabel,
} from "../../src/lib/productImages.js";
import { buildMetaFeedRow } from "../../src/lib/metaCatalogFeed.js";

function readSource(path) {
  return readFileSync(path, "utf8");
}

test("product images: main first, gallery after, no blanks or duplicates", () => {
  assert.deepEqual(
    getProductImages({
      image: "/a.jpg",
      gallery: ["/b.jpg", "", "/a.jpg", "/b.jpg", " /c.jpg "],
    }),
    ["/a.jpg", "/b.jpg", "/c.jpg"]
  );

  assert.deepEqual(getProductImages({}), []);

  const many = Array.from({ length: 20 }, (_, i) => `/${i}.jpg`);

  assert.equal(
    getProductImages({ image: "/main.jpg", gallery: many }).length,
    MAX_GALLERY_IMAGES + 1
  );
});

test("stock wording hides exact counts unless stock is low", () => {
  assert.equal(getStockLabel(279).text, "In stock");
  assert.equal(getStockLabel(LOW_STOCK_THRESHOLD).text, `Only ${LOW_STOCK_THRESHOLD} left`);
  assert.equal(getStockLabel(0).text, "Out of stock");
  assert.equal(getStockLabel(undefined).tone, "out");

  for (const file of [
    "src/app/product/[id]/page.jsx",
    "src/components/shop/ShopPageView.jsx",
    "src/components/product/QuickViewModal.jsx",
    "src/components/cart/MiniCartDrawer.jsx",
    "src/app/cart/page.jsx",
  ]) {
    assert.doesNotMatch(readSource(file), /\$\{stock\} (In Stock|Available|available)/, file);
  }
});

test("catalog feed sends gallery photos as additional_image_link", () => {
  const row = buildMetaFeedRow(
    {
      id: "tee",
      name: "Tee",
      price: 900,
      stock: 3,
      image: "/main.jpg",
      gallery: ["/back.jpg", "https://cdn.example.com/print.jpg", "/main.jpg"],
    },
    "https://obsidianwearbd.store"
  );

  assert.equal(
    row.additional_image_link,
    "https://obsidianwearbd.store/back.jpg,https://cdn.example.com/print.jpg"
  );

  const plain = buildMetaFeedRow(
    { id: "x", name: "X", price: 100, stock: 1, image: "/x.jpg" },
    "https://obsidianwearbd.store"
  );

  assert.equal(plain.additional_image_link, "");
});

test("gallery is validated server-side and editable in admin", () => {
  const catalog = readSource("src/lib/catalog.js");

  assert.match(catalog, /export function normalizeProductGallery/);
  assert.match(catalog, /gallery: galleryResult\.value/);

  for (const file of [
    "src/components/admin/EditProductClient.jsx",
    "src/components/admin/AddProductClient.jsx",
  ]) {
    const source = readSource(file);

    assert.match(source, /<ProductGalleryFields/, file);
    assert.match(source, /gallery: formData\.gallery/, file);
  }
});

test("product photos are never cropped in product frames", () => {
  for (const file of [
    "src/components/product/ProductGallery.jsx",
    "src/components/shop/ShopPageView.jsx",
    "src/components/product/RelatedProducts.jsx",
    "src/components/product/RecentlyViewedProducts.jsx",
    "src/components/product/QuickViewModal.jsx",
  ]) {
    assert.match(readSource(file), /<FramedImage/, file);
  }

  assert.match(readSource("src/components/ui/FramedImage.jsx"), /object-contain/);
});

test("phones get a sticky buy bar and a touch-friendly zoom hint", () => {
  const actions = readSource("src/components/product/ProductActions.jsx");
  const gallery = readSource("src/components/product/ProductGallery.jsx");
  const page = readSource("src/app/product/[id]/page.jsx");

  assert.match(actions, /IntersectionObserver/);
  assert.match(actions, /lg:hidden/);
  assert.match(gallery, /Tap to enlarge/);
  assert.doesNotMatch(gallery, /Hover To Zoom/i);

  /* Add to Cart comes before the long description and spec table. */
  assert.ok(page.indexOf("<ProductActions") < page.indexOf("{productDescription}"));
});

test("shop shows two products per row on phones and folds filters away", () => {
  assert.match(readSource("src/components/shop/ShopPageView.jsx"), /grid grid-cols-2/);

  const filters = readSource("src/components/shop/ShopFilters.jsx");

  assert.match(filters, /mobileFiltersOpen/);
  assert.match(filters, /Filter &amp; Sort/);
});

test("checkout: area must be chosen, BD mobile validated, total shown near the button", () => {
  const checkout = readSource("src/app/checkout/page.jsx");
  const orders = readSource("src/app/api/orders/route.js");

  assert.match(checkout, /useState\(""\);/);
  assert.match(checkout, /Please choose your delivery area\./);
  assert.match(checkout, /Total to pay/);
  assert.ok(checkout.indexOf("Total to pay") < checkout.indexOf('type="submit"'));

  const bdMobile = /^(?:88)?01[3-9]\d{8}$/;

  assert.match(checkout, /01\[3-9\]\\d\{8\}/);
  assert.match(orders, /01\[3-9\]\\d\{8\}/);
  assert.ok(bdMobile.test("01712345678"));
  assert.ok(bdMobile.test("8801712345678"));
  assert.ok(!bdMobile.test("01212345678"));
  assert.ok(!bdMobile.test("0171234567"));
});

test("site-wide help: WhatsApp button, branded 404 and error pages", () => {
  assert.match(readSource("src/app/layout.tsx"), /<FloatingWhatsApp/);
  assert.match(readSource("src/app/not-found.jsx"), /Continue shopping/);
  assert.match(readSource("src/app/error.jsx"), /retry\(\)/);
  assert.match(readSource("src/app/global-error.jsx"), /<html/);
  assert.match(readSource("src/components/layout/Navbar.jsx"), /\/size-guide/);
});

test("delivery wording matches the delivery policy (1–3 / 3–5 days)", () => {
  assert.doesNotMatch(readSource("src/lib/cmsDefaults.js"), /2–5 Days/);
  assert.doesNotMatch(readSource("src/app/cart/page.jsx"), /2–5 Days/);
});
