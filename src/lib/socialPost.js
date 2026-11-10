/*
 * Facebook + Instagram post text for a product, built only from the
 * product's own facts (name, collection, colour, description, fabric
 * details, price). Safe for server and client: the admin panel shows
 * these as editable drafts, the server re-checks what is sent.
 */

export const SOCIAL_LIMITS = {
  caption: 2200, // Instagram caption limit
  comment: 500,
  hashtags: 30, // Instagram hashtag limit
  facebookHashtags: 6,
  instagramHashtags: 12,
};

const BRAND_TAGS = ["#OBSIDIAN", "#ObsidianWear"];

/* Broad, relevant tags rotated per product so posts don't all look the same. */
const HASHTAG_POOL = [
  "#Streetwear",
  "#OversizedTshirt",
  "#DhakaFashion",
  "#BDFashion",
  "#MensFashionBD",
  "#StreetwearBD",
  "#GraphicTee",
  "#MensStyle",
  "#OOTD",
  "#BangladeshFashion",
  "#PremiumStreetwear",
  "#DropShoulder",
];

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function toHashtag(value) {
  const words = String(value ?? "")
    .replace(/^#/, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  return `#${words.map((word) => word[0].toUpperCase() + word.slice(1)).join("")}`.slice(0, 60);
}

/* Parses "#a, b #c" typed by the owner into a clean, unique tag list. */
export function parseHashtags(input) {
  const list = Array.isArray(input) ? input : String(input ?? "").split(/[\s,]+/);
  const seen = new Set();

  return list
    .map(toHashtag)
    .filter((tag) => tag && !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()))
    .slice(0, SOCIAL_LIMITS.hashtags);
}

function seededShuffle(list, seedText) {
  let hash = 2166136261;

  for (const char of String(seedText)) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }

  const random = () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507) >>> 0;
    return hash / 4294967296;
  };

  return list
    .map((item) => [random(), item])
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => item);
}

export function buildSocialHashtags(product, max = SOCIAL_LIMITS.instagramHashtags) {
  const details = product?.details || {};
  const color = clean(product?.color);

  const derived = [
    clean(product?.series),
    color ? `${color} Tee` : "",
    /oversized/i.test(details.fit || "") ? "Oversized Tee" : "",
    /dtf/i.test(details.print || "") ? "DTF Print" : "",
  ];

  const pool = seededShuffle(HASHTAG_POOL, product?.id || product?.name || "obsidian");

  return parseHashtags([...BRAND_TAGS, ...derived, ...pool]).slice(0, Math.max(1, max));
}

function firstSentences(text, maxLength = 280) {
  const value = clean(text);

  if (value.length <= maxLength) {
    return value;
  }

  const cut = value.slice(0, maxLength);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));

  return end > 80 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function detailLine(details = {}) {
  const gsm = Number(details.gsm);

  return [
    clean(details.material),
    Number.isInteger(gsm) && gsm > 0 ? `${gsm} GSM` : "",
    clean(details.fit),
    clean(details.print),
  ]
    .filter(Boolean)
    .join(" · ");
}

/*
 * Caption body (without hashtags). Facebook points to the order link in
 * the first comment; Instagram points to the link in the bio, because
 * links in Instagram captions and comments are not clickable.
 */
export function buildSocialCaption(product, platform = "facebook", { currencySymbol = "৳" } = {}) {
  const name = clean(product?.name) || "OBSIDIAN";
  const series = clean(product?.series);
  const price = Number(product?.price);

  const lines = [
    series && series.toLowerCase() !== name.toLowerCase() ? `${name} — ${series}` : name,
    "",
    firstSentences(product?.description),
    "",
    detailLine(product?.details),
    Number.isFinite(price) && price > 0
      ? `${currencySymbol}${Math.round(price).toLocaleString("en-BD")} · Cash on Delivery · 7-day exchange`
      : "Cash on Delivery · 7-day exchange",
    "",
    platform === "instagram"
      ? "🔗 Order via the link in our bio"
      : "👇 Order link in the comments",
  ];

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, SOCIAL_LIMITS.caption);
}

export function buildFirstComment(productUrl) {
  return `🛒 Order now: ${productUrl}`;
}

/* Final text sent to the platform: caption + hashtags, within limits. */
export function composeSocialText(caption, hashtags = []) {
  const tags = parseHashtags(hashtags).join(" ");
  const body = clean(caption) ? String(caption).trim() : "";
  const text = [body, tags].filter(Boolean).join("\n\n");

  return text.slice(0, SOCIAL_LIMITS.caption);
}

export function buildSocialDraft(product, productUrl) {
  return {
    facebookCaption: buildSocialCaption(product, "facebook"),
    instagramCaption: buildSocialCaption(product, "instagram"),
    facebookHashtags: buildSocialHashtags(product, SOCIAL_LIMITS.facebookHashtags),
    instagramHashtags: buildSocialHashtags(product, SOCIAL_LIMITS.instagramHashtags),
    comment: buildFirstComment(productUrl),
  };
}
