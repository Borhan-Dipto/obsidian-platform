import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ORGANIZATION_LOGO_PATH,
  buildOrganizationProfile,
  normalizeEmail,
  normalizeProfileUrl,
  normalizeTelephone,
} from "../../src/lib/seoOrganization.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function readSource(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("organization profile uses only real settings values", () => {
  const profile = buildOrganizationProfile(
    {
      store: { name: "OBSIDIAN", tagline: "Built under pressure." },
      contact: {
        email: "Support@Example.com",
        whatsappNumber: "01712345678",
        location: "Dhaka, Bangladesh",
      },
      social: {
        facebookUrl: "https://www.facebook.com/obsidianwear",
        instagramUrl: "not a url",
        tiktokUrl: "http://insecure.example.com",
        youtubeUrl: "",
      },
    },
    "https://example.com/"
  );

  assert.equal(profile.name, "OBSIDIAN");
  assert.equal(profile.email, "support@example.com");
  assert.equal(profile.telephone, "+8801712345678");
  assert.deepEqual(profile.sameAs, ["https://www.facebook.com/obsidianwear"]);
  assert.equal(profile.logo.url, `https://example.com${ORGANIZATION_LOGO_PATH}`);
  assert.equal(profile.address.addressCountry, "BD");
  assert.equal(profile.contactPoint[0].telephone, "+8801712345678");
});

test("organization profile omits missing details instead of inventing them", () => {
  const profile = buildOrganizationProfile({}, "https://example.com");

  assert.equal(profile.name, "OBSIDIAN");

  for (const key of ["email", "telephone", "sameAs", "address", "slogan"]) {
    assert.equal(key in profile, false, key);
  }

  assert.equal(normalizeEmail("mailto:a@b.co"), "a@b.co");
  assert.equal(normalizeEmail("nope"), "");
  assert.equal(normalizeTelephone("+880 1712-345678"), "+8801712345678");
  assert.equal(normalizeTelephone("123"), "");
  assert.equal(normalizeProfileUrl("javascript:alert(1)"), "");
});

test("organization logo is a real, large image (not the favicon)", () => {
  assert.equal(
    existsSync(path.join(projectRoot, "public", ORGANIZATION_LOGO_PATH)),
    true
  );

  for (const file of [
    "src/app/page.tsx",
    "src/app/about/page.jsx",
    "src/app/contact/page.jsx",
  ]) {
    assert.doesNotMatch(readSource(file), /favicon\.ico`/, file);
  }

  assert.doesNotMatch(readSource("src/app/page.tsx"), /contact@obsidianwearbd\.store/);
});

test("homepage title always includes the brand", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, /title:\s*\{\s*absolute:\s*completeTitle,?\s*\}/);
});

test("root layout no longer forces the homepage canonical on every page", () => {
  const layout = readSource("src/app/layout.tsx");

  assert.doesNotMatch(layout, /canonical:\s*"\/"/);
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
});

test("private pages are noindex with their own canonical", () => {
  for (const segment of ["account", "cart", "checkout", "success", "wishlist"]) {
    const layout = readSource(`src/app/${segment}/layout.jsx`);

    assert.match(layout, /index:\s*false/, segment);
    assert.match(layout, new RegExp(`canonical:\\s*"/${segment}"`), segment);
  }
});

test("legacy /artifact page redirects permanently to its collection", () => {
  const config = readSource("next.config.ts");

  assert.match(config, /source:\s*"\/artifact"/);
  assert.match(config, /destination:\s*\n?\s*"\/collections\/artifact-series"/);
  assert.match(config, /permanent:\s*true/);
});

test("sitemap lists collection pages using the canonical encoding", () => {
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(sitemap, /createCollectionPath\(series\)/);
  assert.match(sitemap, /\.\.\.collectionRoutes/);
});

test("store policies: delivery lines use settings and never guess charges", async () => {
  const {
    buildDeliveryLines,
    buildMerchantReturnPolicy,
    RETURN_WINDOW_DAYS,
  } = await import("../../src/lib/storePolicies.js");

  const lines = buildDeliveryLines({ delivery: { insideDhaka: 90, outsideDhaka: 130 } });

  assert.equal(lines[0].value, "1–3 business days · ৳90");
  assert.equal(lines[1].value, "3–5 business days · ৳130");
  assert.match(lines[2].value, /7 days/);

  const noCharges = buildDeliveryLines({});

  assert.equal(noCharges[0].value, "1–3 business days");

  const policy = buildMerchantReturnPolicy("https://example.com/");

  assert.equal(policy["@id"], "https://example.com/#return-policy");
  assert.equal(policy.merchantReturnDays, RETURN_WINDOW_DAYS);
  assert.equal(policy.applicableCountry, "BD");
});

test("product offers reference the global return policy; delivery policy states estimates", () => {
  assert.match(readSource("src/app/product/[id]/page.jsx"), /#return-policy/);
  assert.match(readSource("src/app/page.tsx"), /hasMerchantReturnPolicy/);
  assert.match(readSource("src/lib/legalDefaults.js"), /1–3 business days inside Dhaka/);
});

test("owner product facts are validated and never invented", async () => {
  const source = readSource("src/lib/catalog.js");

  assert.match(source, /export function normalizeProductDetails/);
  assert.match(source, /between 80 and 600/);
  assert.match(readSource("src/app/product/[id]/page.jsx"), /\.filter\(\(row\) => row\.value\)/);
});

test("no unowned-domain email remains in the code", () => {
  for (const file of [
    "src/components/layout/Footer.jsx",
    "src/app/contact/page.jsx",
    "src/components/legal/LegalPolicyPage.jsx",
    "src/lib/settings.js",
  ]) {
    assert.doesNotMatch(readSource(file), /@obsidianwearbd\.store|hello@obsidianwear\.com/, file);
  }
});
