import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  "src/app/product/[id]/page.jsx",
  "utf8"
);

const fullGuidePage = readFileSync(
  "src/app/size-guide/page.jsx",
  "utf8"
);

const actions = readFileSync(
  "src/components/product/ProductActions.jsx",
  "utf8"
);

const guide = readFileSync(
  "src/components/product/ProductSizeGuide.jsx",
  "utf8"
);

const sharedGuide = readFileSync(
  "src/lib/sizeGuide.js",
  "utf8"
);

test(
  "product ordering keeps compact size controls and a separate visible chart",
  () => {
    for (const size of [
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
    ]) {
      assert.match(
        sharedGuide,
        new RegExp(
          `size: "${size}"`
        )
      );
    }

    assert.match(
      actions,
      /OBSIDIAN_SIZE_ORDER/
    );

    assert.match(
      actions,
      /role="radiogroup"/
    );

    assert.match(
      actions,
      /role="radio"/
    );

    assert.match(
      actions,
      /selectedSize/
    );

    assert.match(
      actions,
      /addToCart/
    );

    assert.doesNotMatch(
      actions,
      /ProductSizeGuide/
    );

    assert.match(
      page,
      /<ProductActions\s+product=\{product\}/
    );

    assert.match(
      page,
      /<ProductSizeGuide[\s\S]*content=\{sizeGuideContent\}[\s\S]*<RecentlyViewedProducts/
    );

    assert.match(
      guide,
      /<table/
    );

    assert.match(
      guide,
      /Fits Body Chest/
    );

    assert.match(
      guide,
      /Garment Chest/
    );

    assert.match(
      guide,
      /Length/
    );

    assert.match(
      guide,
      /Shoulder/
    );

    assert.doesNotMatch(
      guide,
      /<button/
    );

    assert.doesNotMatch(
      guide,
      /role="dialog"/
    );

    assert.match(
      fullGuidePage,
      /getObsidianSizeGuideRows/
    );
  }
);
