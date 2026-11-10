import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildSocialCaption,
  buildSocialDraft,
  buildSocialHashtags,
  composeSocialText,
  parseHashtags,
  toHashtag,
} from "../../src/lib/socialPost.js";
import { getSocialConfig, toSocialImageUrl } from "../../src/lib/metaSocialPublisher.js";

const product = {
  id: "artifact-005",
  name: "Artifact 005",
  series: "Artifact Series",
  color: "Washed Black",
  price: 899,
  description: "Artifact 005 turns a fragment of stone into a blueprint. The back carries a technical study.",
  details: { material: "100% Cotton", gsm: 220, fit: "Oversized, drop shoulder", print: "DTF (Direct-to-Film)" },
};

test("hashtags are clean, unique, relevant and capped", () => {
  assert.equal(toHashtag("washed black tee"), "#WashedBlackTee");
  assert.deepEqual(parseHashtags("#obsidian, OBSIDIAN streetwear"), ["#Obsidian", "#Streetwear"]);

  const tags = buildSocialHashtags(product, 12);

  assert.equal(tags.length, 12);
  assert.equal(tags[0], "#OBSIDIAN");
  assert.ok(tags.includes("#ArtifactSeries"));
  assert.ok(tags.includes("#WashedBlackTee"));
  assert.deepEqual(buildSocialHashtags(product, 12), tags, "same product → same tags");
  assert.equal(parseHashtags(Array.from({ length: 40 }, (_, i) => `t${i}`)).length, 30);
});

test("Facebook caption has no link (link goes in the first comment); Instagram points to bio", () => {
  const facebook = buildSocialCaption(product, "facebook");
  const instagram = buildSocialCaption(product, "instagram");

  assert.doesNotMatch(facebook, /https?:\/\//);
  assert.match(facebook, /Order link in the comments/);
  assert.match(facebook, /৳899 · Cash on Delivery · 7-day exchange/);
  assert.match(facebook, /100% Cotton · 220 GSM/);
  assert.match(instagram, /link in our bio/);

  const draft = buildSocialDraft(product, "https://example.com/product/artifact-005");

  assert.equal(draft.comment, "🛒 Order now: https://example.com/product/artifact-005");
  assert.ok(composeSocialText(draft.facebookCaption, draft.facebookHashtags).endsWith(draft.facebookHashtags.join(" ")));
});

test("captions never invent missing facts", () => {
  const caption = buildSocialCaption({ id: "x", name: "Plain" }, "facebook");

  assert.doesNotMatch(caption, /GSM|Cotton|undefined|NaN/);
});

test("images go to Meta as absolute JPEG URLs; posting is off until connected", () => {
  assert.equal(
    toSocialImageUrl("https://res.cloudinary.com/demo/image/upload/v1/a.png", "https://site.test"),
    "https://res.cloudinary.com/demo/image/upload/f_jpg,q_90/v1/a.png"
  );
  assert.equal(toSocialImageUrl("/images/a.jpeg", "https://site.test/"), "https://site.test/images/a.jpeg");

  const saved = { ...process.env };
  delete process.env.META_PAGE_ID;
  delete process.env.META_PAGE_ACCESS_TOKEN;
  assert.equal(getSocialConfig().facebookReady, false);
  process.env = saved;
});

test("admin edit page has the post button; API is admin-only", () => {
  assert.match(readFileSync("src/components/admin/EditProductClient.jsx", "utf8"), /<SocialPostPanel/);
  assert.match(readFileSync("src/components/admin/SocialPostPanel.jsx", "utf8"), /Post now to social media/);

  const route = readFileSync("src/app/api/admin/products/[id]/social-post/route.js", "utf8");

  assert.match(route, /requireAdminApiPermission\(\s*request,\s*\{ products: \["update"\] \}/);
});
