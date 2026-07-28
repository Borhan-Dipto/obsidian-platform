import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navbar = readFileSync(
  "src/components/layout/Navbar.jsx",
  "utf8"
);

const globalStyles = readFileSync(
  "src/app/globals.css",
  "utf8"
);

test(
  "homepage navbar keeps readable controls and a dark wordmark",
  () => {
    assert.match(
      navbar,
      /data-obsidian-nav-contrast/
    );

    assert.match(
      navbar,
      /isHomepage[\s\S]*!isScrolled[\s\S]*!isOpen[\s\S]*!isSearchOpen/
    );

    assert.match(
      globalStyles,
      /OBSIDIAN NAVBAR CONTRAST V1/
    );

    assert.match(
      globalStyles,
      /data-obsidian-nav-contrast="light"[\s\S]*\.obsidian-nav-reveal/
    );

    assert.match(
      globalStyles,
      /data-obsidian-nav-contrast="light"[\s\S]*nav \.obsidian-liquid-control/
    );

    const wordmarkRule =
      globalStyles.match(
        /header\[data-obsidian-nav-contrast="light"\] \.obsidian-wordmark\s*\{([^}]*)\}/
      )?.[1] || "";

    assert.match(
      wordmarkRule,
      /color:\s*#0b0b0b\s*!important/
    );

    assert.match(
      wordmarkRule,
      /text-shadow:\s*none/
    );

    assert.doesNotMatch(
      wordmarkRule,
      /#fff(?:fff)?/i
    );
  }
);
