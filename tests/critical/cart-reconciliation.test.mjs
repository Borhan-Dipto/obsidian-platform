import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(
    path,
    "utf8"
  );
}

const orderPricing =
  readSource(
    "src/lib/orderPricing.js"
  );

const cartValidationRoute =
  readSource(
    "src/app/api/cart/validate/route.js"
  );

const cartContext =
  readSource(
    "src/context/CartContext.jsx"
  );

const cartPage =
  readSource(
    "src/app/cart/page.jsx"
  );

const miniCartDrawer =
  readSource(
    "src/components/cart/MiniCartDrawer.jsx"
  );

const checkoutPage =
  readSource(
    "src/app/checkout/page.jsx"
  );

test(
  "cart stock and price reconciliation remains server-trusted and size-aware",
  () => {
    assert.match(
      orderPricing,
      /buildTrustedCartSnapshot/
    );

    assert.match(
      orderPricing,
      /requestedQuantity/
    );

    assert.match(
      orderPricing,
      /availableStock/
    );

    assert.match(
      orderPricing,
      /hasCorrections/
    );

    assert.match(
      orderPricing,
      /PRODUCT_UNAVAILABLE/
    );

    assert.match(
      orderPricing,
      /OUT_OF_STOCK/
    );

    assert.match(
      orderPricing,
      /QUANTITY_ADJUSTED/
    );

    assert.match(
      orderPricing,
      /hasAuthoritativeSizes/
    );

    assert.match(
      orderPricing,
      /INVALID_SIZE_STOCK_CONFIGURATION/
    );

    assert.match(
      cartValidationRoute,
      /enforcePublicJsonRequest/
    );

    assert.match(
      cartValidationRoute,
      /action:\s*"cart-validate"/
    );

    assert.match(
      cartValidationRoute,
      /buildTrustedCartSnapshot/
    );

    assert.match(
      cartValidationRoute,
      /Cache-Control/
    );

    assert.match(
      cartContext,
      /createCartLineKey/
    );

    assert.match(
      cartContext,
      /\/api\/cart\/validate/
    );

    assert.match(
      cartContext,
      /refreshCart/
    );

    assert.match(
      cartContext,
      /CART_REFRESH_INTERVAL_MS/
    );

    assert.match(
      cartContext,
      /isCartRefreshing/
    );

    assert.match(
      cartContext,
      /lastCartRefreshAt/
    );

    assert.match(
      cartContext,
      /snapshotItem\s*\.isAvailable/
    );

    assert.match(
      cartContext,
      /availableStock/
    );

    assert.match(
      cartContext,
      /Prevent duplicate lines/
    );
  }
);

test(
  "cart, mini-cart and checkout retain clear inventory correction flows",
  () => {
    assert.match(
      cartPage,
      /Refresh Cart/
    );

    assert.match(
      cartPage,
      /refreshCart\(\{\s*force:\s*true/
    );

    assert.match(
      cartPage,
      /Checking Stock/
    );

    assert.match(
      cartPage,
      /Stock checked/
    );

    assert.match(
      miniCartDrawer,
      /refreshCart/
    );

    assert.match(
      miniCartDrawer,
      /Checking current stock and prices/
    );

    assert.match(
      miniCartDrawer,
      /Cart Updated/
    );

    assert.match(
      miniCartDrawer,
      /isCartRefreshing/
    );

    assert.match(
      checkoutPage,
      /INVENTORY_CORRECTION_CODES/
    );

    assert.match(
      checkoutPage,
      /INSUFFICIENT_STOCK/
    );

    assert.match(
      checkoutPage,
      /STOCK_CHANGED/
    );

    assert.match(
      checkoutPage,
      /PRODUCT_UNAVAILABLE/
    );

    assert.match(
      checkoutPage,
      /INVALID_SIZE/
    );

    assert.match(
      checkoutPage,
      /trustedItemsChangeCart/
    );

    assert.match(
      checkoutPage,
      /refreshCart\(\{\s*force:\s*true/
    );

    assert.match(
      checkoutPage,
      /currently available/
    );

    assert.match(
      checkoutPage,
      /Checking Stock/
    );

    assert.match(
      checkoutPage,
      /!isStorageReady/
    );
  }
);
