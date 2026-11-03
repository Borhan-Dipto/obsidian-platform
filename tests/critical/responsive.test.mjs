import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("responsive fixes stay in place", () => {
  assert.match(read("src/components/layout/Navbar.jsx"), /truncate whitespace-nowrap text-\[10px\]/);
  assert.match(read("src/components/layout/FloatingWhatsApp.jsx"), /hidden text-\[11px\][^"]*xl:inline/);
  assert.match(read("src/app/product/[id]/page.jsx"), /lg:text-6xl xl:text-7xl/);
  assert.match(read("src/components/product/ProductActions.jsx"), /lg:grid-cols-3 xl:grid-cols-6/);
  assert.match(read("src/components/sections/Collections.js"), /snap-x snap-mandatory/);
  assert.doesNotMatch(read("src/components/shop/ShopFilters.jsx"), /lg:block`/);
  assert.match(read("src/components/ui/Reveal.jsx"), /Math\.min\(\s*600/);
});
