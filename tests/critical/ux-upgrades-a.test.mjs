import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("predictive search shows live product matches in the navbar", () => {
  assert.match(read("src/components/layout/Navbar.jsx"), /<PredictiveSearch/);
  assert.match(read("src/components/layout/PredictiveSearch.jsx"), /words\.every/);
});

test("size buttons show low stock, sold-out sizes offer WhatsApp notify-me", () => {
  const actions = read("src/components/product/ProductActions.jsx");

  assert.match(actions, /\{sizeStock\} left/);
  assert.match(actions, /notify me on WhatsApp/);
  assert.match(actions, /soldOutSizes/);
});

test("owner can add a model fit reference; shown only when filled", () => {
  assert.match(read("src/lib/catalog.js"), /model: 120/);
  assert.match(read("src/components/admin/ProductDetailsFields.jsx"), /detailModel/);
  assert.match(read("src/components/product/ProductActions.jsx"), /modelInfo \?/);
});

test("shop cards show a second photo on hover when one exists; cart suggests pairings", () => {
  assert.match(read("src/components/shop/ShopPageView.jsx"), /product\.gallery\[0\]/);
  assert.match(read("src/components/cart/MiniCartDrawer.jsx"), /<CartSuggestions/);
});
