/*
 * OBSIDIAN Meta Pixel helpers.
 *
 * Browser-only tracking for Meta (Facebook / Instagram) ads.
 *
 * Privacy rules enforced here:
 * - Only product IDs, quantities, prices and order totals are sent.
 * - Customer name, phone, email and address are never sent.
 * - Order IDs are never sent in clear text. Purchase events use a
 *   one-way hash of the order ID as the event ID, so a future
 *   Conversions API integration can deduplicate against it.
 * - Automatic form/button scraping (autoConfig) is disabled.
 * - Pixel history auto-tracking is disabled; PageView is sent
 *   manually so client-side navigation is never double counted.
 */

export const META_PIXEL_ID = String(
  process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
).trim();

export const DEFAULT_META_CURRENCY = "BDT";

const META_PIXEL_SCRIPT_SRC =
  "https://connect.facebook.net/en_US/fbevents.js";

const TRACKED_PURCHASES_STORAGE_KEY =
  "obsidian-meta-tracked-purchases";

const MAX_TRACKED_PURCHASES = 50;

/*
 * Paths where no PageView is sent. These pages either belong to
 * staff (admin) or can carry order references or account data in
 * the URL, which Meta would otherwise receive with the page URL.
 */
const EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/account",
  "/success",
  "/track-order",
];

export function isValidMetaPixelId(value) {
  return /^\d{10,20}$/.test(
    String(value || "").trim()
  );
}

export function isMetaPixelEnabled() {
  return isValidMetaPixelId(
    META_PIXEL_ID
  );
}

export function isMetaTrackedPath(pathname) {
  const path = String(pathname || "/");

  return !EXCLUDED_PATH_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}/`)
  );
}

export function isMetaPixelAllowedPath(pathname) {
  const path = String(pathname || "/");

  return !(
    path === "/admin" ||
    path.startsWith("/admin/")
  );
}

function toMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100) / 100;
}

function toQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.floor(quantity);
}

function toCurrency(value) {
  const currency = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{3}$/.test(currency)
    ? currency
    : DEFAULT_META_CURRENCY;
}

function toContentId(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, 120);
}

/*
 * Merges cart lines of the same product (different sizes) into one
 * Meta content entry. Size is internal inventory data and is not
 * sent to Meta.
 */
export function buildMetaContents(items) {
  const contentsById = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const id = toContentId(item?.id);

    if (!id) {
      continue;
    }

    const quantity = toQuantity(item?.quantity);
    const itemPrice = toMoney(item?.price);
    const existing = contentsById.get(id);

    if (existing) {
      existing.quantity += quantity;
      continue;
    }

    contentsById.set(id, {
      id,
      quantity,
      item_price: itemPrice,
    });
  }

  return Array.from(contentsById.values());
}

function sumContents(contents) {
  return toMoney(
    contents.reduce(
      (total, item) =>
        total + item.item_price * item.quantity,
      0
    )
  );
}

function countItems(contents) {
  return contents.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function buildViewContentParams(
  product,
  currency = DEFAULT_META_CURRENCY
) {
  const id = toContentId(product?.id);

  if (!id) {
    return null;
  }

  const params = {
    content_ids: [id],
    content_type: "product",
    value: toMoney(product?.price),
    currency: toCurrency(currency),
  };

  const name = String(product?.name || "").trim();

  if (name) {
    params.content_name = name.slice(0, 150);
  }

  return params;
}

export function buildAddToCartParams(
  { id, name, price, quantity },
  currency = DEFAULT_META_CURRENCY
) {
  const contents = buildMetaContents([
    { id, price, quantity },
  ]);

  if (contents.length === 0) {
    return null;
  }

  const params = {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    value: sumContents(contents),
    currency: toCurrency(currency),
  };

  const productName = String(name || "").trim();

  if (productName) {
    params.content_name = productName.slice(0, 150);
  }

  return params;
}

export function buildInitiateCheckoutParams(
  cartItems,
  currency = DEFAULT_META_CURRENCY
) {
  const contents = buildMetaContents(cartItems);

  if (contents.length === 0) {
    return null;
  }

  return {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    num_items: countItems(contents),
    value: sumContents(contents),
    currency: toCurrency(currency),
  };
}

/*
 * Purchase value is the trusted order total returned by the
 * server (after discounts, including delivery), never a total
 * calculated in the browser.
 */
export function buildPurchaseParams(order, pricing) {
  const contents = buildMetaContents(order?.items);
  const total = Number(pricing?.total);

  if (
    contents.length === 0 ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  return {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    num_items: countItems(contents),
    value: toMoney(total),
    currency: toCurrency(pricing?.currency),
  };
}

async function sha256Hex(value) {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle || typeof TextEncoder === "undefined") {
    return "";
  }

  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/*
 * Deterministic, non-reversible event ID for an order. The server
 * can compute the same value later for Conversions API
 * deduplication without the raw order ID ever reaching Meta.
 */
export async function createPurchaseEventId(orderId) {
  const id = String(orderId || "").trim();

  if (!id) {
    return "";
  }

  const hash = await sha256Hex(`obsidian-purchase:${id}`);

  return hash ? `purchase_${hash.slice(0, 40)}` : "";
}

/* ---------------- Browser runtime ---------------- */

let isInitialized = false;
const pendingCalls = [];
let lastPageViewPath = "";

function hasWindow() {
  return typeof window !== "undefined";
}

function installMetaPixelStub() {
  if (window.fbq) {
    return;
  }

  /* Standard Meta Pixel base code, written out without eval. */
  const fbq = function fbq(...args) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  };

  if (!window._fbq) {
    window._fbq = fbq;
  }

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  /*
   * Next.js handles routing; stop the pixel from auto-sending
   * PageView on history changes so navigations are counted once.
   */
  fbq.disablePushState = true;

  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = META_PIXEL_SCRIPT_SRC;

  const firstScript = document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

export function initMetaPixel() {
  if (!hasWindow() || isInitialized || !isMetaPixelEnabled()) {
    return isInitialized;
  }

  try {
    installMetaPixelStub();

    window.fbq("set", "autoConfig", false, META_PIXEL_ID);
    window.fbq("init", META_PIXEL_ID);

    isInitialized = true;

    while (pendingCalls.length > 0) {
      const call = pendingCalls.shift();
      call();
    }
  } catch (error) {
    console.error("Meta Pixel could not be initialized:", error);
  }

  return isInitialized;
}

function runWhenReady(call) {
  if (!hasWindow() || !isMetaPixelEnabled()) {
    return;
  }

  const safeCall = () => {
    try {
      call();
    } catch (error) {
      console.error("Meta Pixel event could not be sent:", error);
    }
  };

  if (isInitialized) {
    safeCall();
    return;
  }

  /* Child components can fire before the root pixel initializes. */
  if (pendingCalls.length < 20) {
    pendingCalls.push(safeCall);
  }
}

export function trackMetaEvent(eventName, params, options = {}) {
  if (!eventName || !params) {
    return;
  }

  runWhenReady(() => {
    if (options.eventId) {
      window.fbq("track", eventName, params, {
        eventID: options.eventId,
      });
    } else {
      window.fbq("track", eventName, params);
    }
  });
}

export function createPageViewKey(pathname, search = "") {
  const path = String(pathname || "");
  const query = String(search || "").replace(/^\?/, "");

  return query ? `${path}?${query}` : path;
}

/*
 * One PageView per page address. Exclusions are decided by the
 * path alone; deduplication uses path + query so that query-only
 * navigations (e.g. /shop?series=...) are counted once each, and
 * re-renders of the same address are never counted twice.
 */
export function trackMetaPageView(pathname, search = "") {
  const path = String(pathname || "");
  const pageKey = createPageViewKey(path, search);

  if (!path || pageKey === lastPageViewPath) {
    return;
  }

  /*
   * Remember excluded pages too, so /shop -> /account -> /shop
   * still counts the second /shop visit.
   */
  lastPageViewPath = pageKey;

  if (!isMetaTrackedPath(path)) {
    return;
  }

  runWhenReady(() => {
    window.fbq("track", "PageView");
  });
}

function readTrackedPurchases() {
  try {
    const stored = window.sessionStorage.getItem(
      TRACKED_PURCHASES_STORAGE_KEY
    );

    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberTrackedPurchase(eventId) {
  try {
    const tracked = readTrackedPurchases()
      .filter((value) => value !== eventId)
      .concat(eventId)
      .slice(-MAX_TRACKED_PURCHASES);

    window.sessionStorage.setItem(
      TRACKED_PURCHASES_STORAGE_KEY,
      JSON.stringify(tracked)
    );
  } catch {
    /* Storage can be unavailable in private modes; ignore. */
  }
}

/*
 * Sends Purchase at most once per order in this browser session,
 * even if checkout is resubmitted or the success flow repeats.
 */
export async function trackMetaPurchase({ order, pricing }) {
  if (!hasWindow() || !isMetaPixelEnabled()) {
    return false;
  }

  const params = buildPurchaseParams(order, pricing);

  if (!params) {
    return false;
  }

  let eventId = "";

  try {
    eventId = await createPurchaseEventId(order?.id || order?.orderId);
  } catch {
    eventId = "";
  }

  if (eventId) {
    if (readTrackedPurchases().includes(eventId)) {
      return false;
    }

    rememberTrackedPurchase(eventId);
  }

  trackMetaEvent("Purchase", params, { eventId });

  return true;
}
