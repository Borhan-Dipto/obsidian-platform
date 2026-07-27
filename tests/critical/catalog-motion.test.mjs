import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("shop and collections retain accessible fail-open catalog motion", async () => {
  const [
    globals,
    loading,
    shop,
    collections,
    filters,
    quickView,
    wishlist,
  ] = await Promise.all([
    read("src/app/globals.css"),
    read("src/app/loading.jsx"),
    read("src/app/shop/page.jsx"),
    read("src/app/collections/page.jsx"),
    read("src/components/shop/ShopFilters.jsx"),
    read("src/components/product/QuickViewButton.jsx"),
    read("src/components/product/WishlistButton.jsx"),
  ]);

  assert.match(globals, /OBSIDIAN CATALOG MOTION V1/);
  assert.match(globals, /\.obsidian-catalog-card/);
  assert.match(globals, /\.obsidian-filter-progress/);
  assert.match(globals, /prefers-reduced-motion:\s*reduce/);

  assert.match(shop, /import Reveal/);
  assert.match(shop, /as="article"/);
  assert.match(shop, /Math\.min\(index, 8\) \* 70/);
  assert.match(shop, /obsidian-catalog-media/);

  assert.match(collections, /import Reveal/);
  assert.match(collections, /as="li"/);
  assert.match(collections, /obsidian-catalog-card/);

  assert.match(filters, /aria-busy=\{isPending\}/);
  assert.match(filters, /obsidian-filter-progress/);
  assert.match(filters, /obsidian-filter-chip/);

  assert.match(quickView, /opacity-100/);
  assert.match(quickView, /md:opacity-0/);
  assert.match(quickView, /md:group-hover:opacity-100/);

  assert.match(wishlist, /aria-pressed=\{saved\}/);
  assert.match(wishlist, /obsidian-wishlist-toggle--saved/);

  assert.match(loading, /obsidian-loading-pulse/);
  assert.doesNotMatch(loading, /animate-pulse/);
});
