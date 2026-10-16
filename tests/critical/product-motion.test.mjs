import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(
    path,
    "utf8"
  );
}

const page = readSource(
  "src/app/product/[id]/page.jsx"
);

const actions = readSource(
  "src/components/product/ProductActions.jsx"
);

const guide = readSource(
  "src/components/product/ProductSizeGuide.jsx"
);

const zoom = readSource(
  "src/components/product/ProductGallery.jsx"
);

const recent = readSource(
  "src/components/product/RecentlyViewedProducts.jsx"
);

const related = readSource(
  "src/components/product/RelatedProducts.jsx"
);

const reveal = readSource(
  "src/components/ui/Reveal.jsx"
);

const globals = readSource(
  "src/app/globals.css"
);

test(
  "product experience retains accessible premium motion without changing commerce flow",
  () => {
    assert.match(
      page,
      /obsidian-product-page/
    );

    assert.match(
      page,
      /obsidian-product-breadcrumb/
    );

    assert.match(
      page,
      /obsidian-product-media-column/
    );

    assert.match(
      page,
      /obsidian-product-info-column/
    );

    assert.match(
      actions,
      /obsidian-product-size-button/
    );

    assert.match(
      actions,
      /obsidian-product-size-button--selected/
    );

    assert.match(
      actions,
      /obsidian-product-quantity-control/
    );

    assert.match(
      actions,
      /obsidian-product-primary-action/
    );

    assert.match(
      actions,
      /addToCart/
    );

    assert.match(
      actions,
      /openMiniCart/
    );

    assert.match(
      zoom,
      /obsidian-product-media-shell/
    );

    assert.match(
      zoom,
      /obsidian-product-media-image/
    );

    assert.match(
      guide,
      /import Reveal/
    );

    assert.match(
      guide,
      /variant="clip-up"/
    );

    assert.match(
      guide,
      /obsidian-product-size-card/
    );

    assert.match(
      recent,
      /import Reveal/
    );

    assert.match(
      recent,
      /variant="scale"/
    );

    assert.match(
      related,
      /import Reveal/
    );

    assert.match(
      related,
      /variant="scale"/
    );

    assert.match(
      reveal,
      /\.\.\.restProps/
    );

    assert.match(
      reveal,
      /\{\.\.\.restProps\}/
    );

    assert.match(
      globals,
      /OBSIDIAN PRODUCT MOTION V1/
    );

    assert.match(
      globals,
      /obsidianProductMediaEnter/
    );

    assert.match(
      globals,
      /obsidianProductInfoEnter/
    );

    assert.match(
      globals,
      /prefers-reduced-motion:\s*reduce[\s\S]*obsidian-product-primary-action/
    );
  }
);
