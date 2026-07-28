import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(
    path,
    "utf8"
  );
}

const catalog = readSource(
  "src/lib/catalog.js"
);

const inventory = readSource(
  "src/lib/productInventory.js"
);

const inventoryFields = readSource(
  "src/components/admin/ProductInventoryFields.jsx"
);

const addProduct = readSource(
  "src/components/admin/AddProductClient.jsx"
);

const editProduct = readSource(
  "src/components/admin/EditProductClient.jsx"
);

const productActions = readSource(
  "src/components/product/ProductActions.jsx"
);

const orderPricing = readSource(
  "src/lib/orderPricing.js"
);

const orderLifecycle = readSource(
  "src/lib/orderLifecycle.js"
);

test(
  "size inventory remains admin-managed and transactionally protected",
  () => {
    assert.match(
      inventory,
      /OBSIDIAN_SIZE_ORDER/
    );

    assert.match(
      inventory,
      /getProductSizeStock/
    );

    assert.match(
      inventory,
      /getProductTotalStock/
    );

    assert.match(
      catalog,
      /validateProductSizeInventory/
    );

    assert.match(
      catalog,
      /normalizedSizeStock/
    );

    assert.match(
      catalog,
      /totalStock/
    );

    assert.match(
      inventoryFields,
      /Stock By Size/
    );

    assert.match(
      inventoryFields,
      /Enable Size Inventory/
    );

    assert.match(
      addProduct,
      /ProductInventoryFields/
    );

    assert.match(
      addProduct,
      /sizeStock/
    );

    assert.match(
      editProduct,
      /ProductInventoryFields/
    );

    assert.match(
      editProduct,
      /originalLegacyStock/
    );

    assert.match(
      productActions,
      /getProductSizeStock/
    );

    assert.match(
      productActions,
      /disabled=\{[\s\S]*!isAvailable/
    );

    assert.match(
      productActions,
      /stock:\s*selectedStock/
    );

    assert.match(
      orderPricing,
      /createStockReservationOperation/
    );

    assert.match(
      orderPricing,
      /sizeStock\.\$\{[\s\S]*sizeStockField[\s\S]*\}/
    );

    assert.match(
      orderLifecycle,
      /releaseCancelledOrderReservations/
    );

    assert.match(
      orderLifecycle,
      /sizeStock\.\$\{[\s\S]*reservation[\s\S]*sizeStockField[\s\S]*\}/
    );
  }
);
