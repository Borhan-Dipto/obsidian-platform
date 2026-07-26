import assert from "node:assert/strict";

import {
  readFileSync,
} from "node:fs";

import test from "node:test";

const source =
  readFileSync(
    new URL(
      "../../src/lib/publicApiSecurity.js",
      import.meta.url
    ),
    "utf8"
  );

test(
  "same-origin verification trusts only configured deployment origins",
  () => {
    assert.match(
      source,
      /process\.env\.BETTER_AUTH_URL/
    );

    assert.match(
      source,
      /process\.env\.URL/
    );

    assert.match(
      source,
      /process\.env\.DEPLOY_URL/
    );

    assert.match(
      source,
      /process\.env\.DEPLOY_PRIME_URL/
    );

    assert.match(
      source,
      /return\s+getTrustedRequestOrigins\(\s*request\s*\)\.has\(\s*requestOrigin\s*\);/
    );

    assert.doesNotMatch(
      source,
      /originHeader\.includes|startsWith\(originHeader/
    );
  }
);
