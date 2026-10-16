import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createCollectionPath,
  createCollectionSlug,
  findSeriesBySlug,
  isSeriesOnlyQuery,
} from "../../src/lib/collectionUrls.js";
import { buildFaqJsonLd, buildProductFaq } from "../../src/lib/productFaq.js";

const read = (path) => readFileSync(path, "utf8");

test("collection slugs are clean and stable", () => {
  assert.equal(createCollectionSlug("Artifact Series"), "artifact-series");
  assert.equal(createCollectionSlug("  Drop   Shoulder "), "drop-shoulder");
  assert.equal(createCollectionPath("Obsidian White"), "/collections/obsidian-white");
  assert.equal(createCollectionPath(""), "/shop");
  assert.equal(
    findSeriesBySlug(["Artifact Series", "Plain White"], "PLAIN-WHITE"),
    "Plain White"
  );
  assert.equal(findSeriesBySlug(["Artifact Series"], "nope"), "");
});

test("only series-only shop URLs move to collection pages", () => {
  assert.equal(isSeriesOnlyQuery({ series: "Artifact Series" }), true);
  assert.equal(isSeriesOnlyQuery({ series: "Artifact Series", color: "Black" }), false);
  assert.equal(isSeriesOnlyQuery({ series: "Artifact Series", q: "" }), true);
  assert.equal(isSeriesOnlyQuery({}), false);
});

test("collection routing, links, sitemap and legacy redirect use /collections/<slug>", () => {
  const view = read("src/components/shop/ShopPageView.jsx");

  assert.match(view, /permanentRedirect\(\s*createCollectionPath\(selectedSeries\)/);
  assert.match(view, /\? createCollectionPath\(selectedSeries\)/);
  assert.match(read("src/app/collections/[slug]/page.jsx"), /renderShopPage/);
  assert.match(read("src/components/sections/Collections.js"), /createCollectionPath\(series\)/);
  assert.match(read("src/app/collections/page.jsx"), /createCollectionPath\(/);
  assert.match(read("src/app/sitemap.ts"), /createCollectionPath\(series\)/);
  assert.match(read("next.config.ts"), /"\/collections\/artifact-series"/);
  assert.match(read("src/components/shop/ShopFilters.jsx"), /staysOnCollection/);
});

test("product FAQ uses only published facts and omits missing ones", () => {
  const items = buildProductFaq({
    settings: {
      delivery: { insideDhaka: 90, outsideDhaka: 130 },
      payment: { cashOnDelivery: true, bkash: false },
    },
    details: { material: "100% Cotton", gsm: 220, fit: "Oversized, drop shoulder", care: "Wash cold." },
  });

  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  assert.match(byId.delivery.answer, /1–3 business days \(৳90\)/);
  assert.match(byId.delivery.answer, /3–5 business days \(৳130\)/);
  assert.match(byId.payment.answer, /cash when your order arrives/);
  assert.match(byId.exchange.answer, /within 7 days of delivery/);
  assert.match(byId.size.answer, /oversized, drop shoulder fit/);
  assert.equal(byId.fabric.answer, "100% Cotton, 220 GSM. Care: Wash cold.");

  const bare = buildProductFaq({ settings: {}, details: {} });

  assert.deepEqual(bare.map((item) => item.id), ["delivery", "exchange", "size"]);
  assert.doesNotMatch(bare[0].answer, /৳/);

  const ld = buildFaqJsonLd(items, "https://example.com/product/x");

  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, items.length);
});

test("FAQ is visible on the product page, not schema-only", () => {
  const page = read("src/app/product/[id]/page.jsx");

  assert.match(page, /buildFaqJsonLd\(faqItems/);
  assert.match(page, /faqItems\.map/);
});

test("only the LCP image is preloaded", () => {
  const hero = read("src/components/sections/Hero.jsx");

  assert.equal((hero.match(/fetchPriority="high"/g) || []).length, 2);
  assert.doesNotMatch(hero, /\n\s*priority\n/);
  assert.doesNotMatch(read("src/components/sections/Collections.js"), /priority=/);
  assert.doesNotMatch(read("src/components/sections/FeaturedProduct.jsx"), /\n\s*priority\n/);
});

test("collection redirects are real 308s answered by the proxy", () => {
  const proxy = read("src/proxy.js");

  assert.match(proxy, /export function proxy/);
  assert.match(proxy, /isSeriesOnlyQuery\(params\)/);
  assert.match(proxy, /NextResponse\.redirect\([^)]*\), 308\)/);
  assert.match(proxy, /matcher: \["\/shop", "\/collections\/:slug"\]/);
});
