import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import test from "node:test";

function readSource(relativePath) {
  return readFileSync(
    new URL(
      `../../${relativePath}`,
      import.meta.url
    ),
    "utf8"
  );
}

test(
  "premium public motion remains accessible, coordinated, and fail-open",
  () => {
    const globals = readSource(
      "src/app/globals.css"
    );

    const reveal = readSource(
      "src/components/ui/Reveal.jsx"
    );

    const hero = readSource(
      "src/components/sections/Hero.jsx"
    );

    const collections = readSource(
      "src/components/sections/Collections.js"
    );

    const featuredProduct =
      readSource(
        "src/components/sections/FeaturedProduct.jsx"
      );

    assert.match(
      globals,
      /--motion-ease-standard/
    );

    assert.match(
      globals,
      /data-motion-ready="true"/
    );

    assert.match(
      globals,
      /prefers-reduced-motion:\s*reduce/
    );

    assert.match(
      reveal,
      /IntersectionObserver/
    );

    assert.match(
      reveal,
      /checkViewportFallback/
    );

    assert.match(
      reveal,
      /useState\(true\)/
    );

    assert.match(
      reveal,
      /data-motion-ready/
    );

    assert.match(
      hero,
      /obsidian-hero-title-line/
    );

    assert.match(
      hero,
      /obsidian-hero-media-shell/
    );

    assert.match(
      collections,
      /variant="fade-up"/
    );

    assert.match(
      featuredProduct,
      /variant="scale"/
    );
  }
);
