import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildAddToCartParams,
  buildInitiateCheckoutParams,
  buildMetaContents,
  buildPurchaseParams,
  buildViewContentParams,
  createPageViewKey,
  createPurchaseEventId,
  isMetaPixelAllowedPath,
  isMetaTrackedPath,
  isValidMetaPixelId,
} from "../../src/lib/metaPixel.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function readSource(relativePath) {
  return readFileSync(
    path.join(projectRoot, relativePath),
    "utf8"
  );
}

test("pixel ID validation accepts numeric IDs only", () => {
  assert.equal(isValidMetaPixelId("1620403752959832"), true);
  assert.equal(isValidMetaPixelId(""), false);
  assert.equal(isValidMetaPixelId("YOUR_ACTUAL_PIXEL_ID"), false);
  assert.equal(isValidMetaPixelId("123<script>"), false);
});

test("admin never loads the pixel; private pages send no PageView", () => {
  assert.equal(isMetaPixelAllowedPath("/admin"), false);
  assert.equal(isMetaPixelAllowedPath("/admin/orders"), false);
  assert.equal(isMetaPixelAllowedPath("/shop"), true);

  for (const privatePath of [
    "/admin",
    "/account",
    "/account/orders/OBS-1",
    "/success",
    "/track-order",
  ]) {
    assert.equal(isMetaTrackedPath(privatePath), false, privatePath);
  }

  for (const publicPath of ["/", "/shop", "/product/abc", "/cart", "/checkout"]) {
    assert.equal(isMetaTrackedPath(publicPath), true, publicPath);
  }

  assert.equal(isMetaTrackedPath("/accounting"), true);
});

test("page view key includes the query string", () => {
  assert.equal(createPageViewKey("/shop"), "/shop");
  assert.equal(createPageViewKey("/shop", ""), "/shop");
  assert.equal(
    createPageViewKey("/shop", "series=Artifact%20Series"),
    "/shop?series=Artifact%20Series"
  );
  assert.equal(createPageViewKey("/shop", "?a=1"), "/shop?a=1");
  assert.notEqual(
    createPageViewKey("/shop", "series=A"),
    createPageViewKey("/shop", "series=B")
  );
});

test("pixel tracker reads search params inside a Suspense boundary", () => {
  const source = readSource("src/components/analytics/MetaPixel.jsx");

  assert.match(source, /useSearchParams\(\)/);
  assert.match(source, /<Suspense fallback=\{null\}>/);
  assert.match(source, /trackMetaPageView\(pathname, search\)/);
});

test("contents merge sizes of one product and drop invalid lines", () => {
  const contents = buildMetaContents([
    { id: "tee-1", size: "M", quantity: 1, price: 799 },
    { id: "tee-1", size: "L", quantity: 2, price: 799 },
    { id: "", quantity: 1, price: 100 },
    { id: "tee-2", quantity: -4, price: "abc" },
  ]);

  assert.deepEqual(contents, [
    { id: "tee-1", quantity: 3, item_price: 799 },
    { id: "tee-2", quantity: 1, item_price: 0 },
  ]);
});

test("ViewContent and AddToCart payloads use BDT and product IDs", () => {
  assert.deepEqual(
    buildViewContentParams({ id: "tee-1", name: "Oversized Tee", price: 799 }),
    {
      content_ids: ["tee-1"],
      content_type: "product",
      value: 799,
      currency: "BDT",
      content_name: "Oversized Tee",
    }
  );

  const addToCart = buildAddToCartParams({
    id: "tee-1",
    name: "Oversized Tee",
    price: 799,
    quantity: 2,
  });

  assert.equal(addToCart.value, 1598);
  assert.equal(addToCart.currency, "BDT");
  assert.deepEqual(addToCart.content_ids, ["tee-1"]);
  assert.equal(buildViewContentParams({ id: "" }), null);
});

test("InitiateCheckout totals the cart", () => {
  const params = buildInitiateCheckoutParams([
    { id: "tee-1", quantity: 2, price: 799 },
    { id: "tee-2", quantity: 1, price: 1200 },
  ]);

  assert.equal(params.num_items, 3);
  assert.equal(params.value, 2798);
  assert.equal(buildInitiateCheckoutParams([]), null);
});

test("Purchase uses the trusted server total and never customer data", () => {
  const order = {
    id: "OBS-123-ABC",
    customer: {
      name: "Customer",
      phone: "01700000000",
      address: "Dhaka",
    },
    items: [{ id: "tee-1", size: "M", quantity: 2, price: 799 }],
  };

  const params = buildPurchaseParams(order, {
    total: 1718,
    currency: "BDT",
  });

  assert.equal(params.value, 1718);
  assert.equal(params.num_items, 2);

  const serialized = JSON.stringify(params);

  for (const forbidden of ["01700000000", "Dhaka", "Customer", "OBS-123-ABC", "\"M\""]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }

  assert.equal(buildPurchaseParams(order, { total: 0 }), null);
  assert.equal(buildPurchaseParams({ items: [] }, { total: 500 }), null);
});

test("purchase event ID is stable and does not reveal the order ID", async () => {
  const first = await createPurchaseEventId("OBS-123-ABC");
  const second = await createPurchaseEventId("OBS-123-ABC");
  const other = await createPurchaseEventId("OBS-123-ABD");

  assert.match(first, /^purchase_[0-9a-f]{40}$/);
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.equal(first.includes("OBS"), false);
  assert.equal(await createPurchaseEventId(""), "");
});

test("pixel helpers disable auto-config and history auto-tracking", () => {
  const source = readSource("src/lib/metaPixel.js");

  assert.match(source, /"autoConfig",\s*false/);
  assert.match(source, /disablePushState = true/);
  assert.doesNotMatch(source, /fbq\("init",[^)]*\{/);
});

test("storefront wiring and CSP allow Meta only where needed", () => {
  assert.match(readSource("src/app/layout.tsx"), /<MetaPixel \/>/);
  assert.match(readSource("src/app/product/[id]/page.jsx"), /<MetaViewContent/);
  assert.match(
    readSource("src/components/product/ProductActions.jsx"),
    /"AddToCart"/
  );

  const checkout = readSource("src/app/checkout/page.jsx");

  assert.match(checkout, /"InitiateCheckout"/);
  assert.match(checkout, /if \(!data\.duplicate\)\s*\{\s*trackMetaPurchase/);

  const config = readSource("next.config.ts");

  assert.match(config, /"https:\/\/connect\.facebook\.net"/);
  assert.match(config, /"frame-src 'none'"/);
});
