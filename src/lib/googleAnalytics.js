/*
 * OBSIDIAN Google Analytics 4 (GA4) helpers.
 *
 * Loaded only when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set. Mirrors
 * the Meta Pixel funnel with GA4's recommended e-commerce events:
 * page_view, view_item, add_to_cart, begin_checkout, purchase.
 *
 * Privacy: no customer name, phone, email or address is sent. The
 * purchase transaction_id is the same one-way hash used for Meta,
 * never the raw order ID. Admin pages never load GA4, and private
 * pages (account, success, order tracking) send no page_view.
 */

import {
  isMetaPixelAllowedPath,
  isMetaTrackedPath,
} from "./metaPixel.js";

export const GA4_MEASUREMENT_ID = String(
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ""
)
  .trim()
  .toUpperCase();

const GA4_CURRENCY = "BDT";

const TRACKED_GA4_PURCHASES_KEY = "obsidian-ga4-tracked-purchases";

export function isValidGa4MeasurementId(value) {
  return /^G-[A-Z0-9]{4,20}$/.test(String(value || "").trim());
}

export function isGa4Enabled() {
  return isValidGa4MeasurementId(GA4_MEASUREMENT_ID);
}

export const isGa4AllowedPath = isMetaPixelAllowedPath;
export const isGa4TrackedPath = isMetaTrackedPath;

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

function toItemId(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, 120);
}

/*
 * GA4 items. Unlike Meta, GA4 has a variant field, so the size is
 * kept (it is product data, not customer data).
 */
export function buildGa4Items(items) {
  const result = [];

  for (const item of Array.isArray(items) ? items : []) {
    const itemId = toItemId(item?.id);

    if (!itemId) {
      continue;
    }

    const ga4Item = {
      item_id: itemId,
      price: toMoney(item?.price),
      quantity: toQuantity(item?.quantity),
    };

    const name = String(item?.name || "").trim();

    if (name) {
      ga4Item.item_name = name.slice(0, 100);
    }

    const series = String(item?.series || "").trim();

    if (series) {
      ga4Item.item_category = series.slice(0, 100);
    }

    const size = String(item?.size || "").trim();

    if (size) {
      ga4Item.item_variant = size.slice(0, 20);
    }

    result.push(ga4Item);
  }

  return result;
}

function sumItems(items) {
  return toMoney(
    items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );
}

export function buildGa4ItemEventParams(items) {
  const ga4Items = buildGa4Items(items);

  if (ga4Items.length === 0) {
    return null;
  }

  return {
    currency: GA4_CURRENCY,
    value: sumItems(ga4Items),
    items: ga4Items,
  };
}

export function buildGa4PurchaseParams({
  order,
  pricing,
  transactionId,
}) {
  const ga4Items = buildGa4Items(order?.items);
  const total = Number(pricing?.total);

  if (
    !transactionId ||
    ga4Items.length === 0 ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  const currency = /^[A-Z]{3}$/.test(
    String(pricing?.currency || "").toUpperCase()
  )
    ? String(pricing.currency).toUpperCase()
    : GA4_CURRENCY;

  const params = {
    transaction_id: transactionId,
    currency,
    value: toMoney(total),
    items: ga4Items,
  };

  const shipping = Number(
    pricing?.payableDeliveryCharge ?? pricing?.deliveryCharge
  );

  if (Number.isFinite(shipping) && shipping >= 0) {
    params.shipping = toMoney(shipping);
  }

  const couponCode = String(order?.coupon?.code || "").trim();

  if (couponCode) {
    params.coupon = couponCode.slice(0, 50);
  }

  return params;
}

/* ---------------- Browser runtime ---------------- */

let isInitialized = false;
let lastPageKey = "";

function hasWindow() {
  return typeof window !== "undefined";
}

export function initGa4() {
  if (!hasWindow() || isInitialized || !isGa4Enabled()) {
    return isInitialized;
  }

  try {
    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }

    window.gtag("js", new Date());

    /* page_view is sent manually on each route change. */
    window.gtag("config", GA4_MEASUREMENT_ID, {
      send_page_view: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA4_MEASUREMENT_ID
    )}`;
    document.head.appendChild(script);

    isInitialized = true;
  } catch (error) {
    console.error("GA4 could not be initialized:", error);
  }

  return isInitialized;
}

export function trackGa4Event(eventName, params) {
  if (
    !hasWindow() ||
    !isGa4Enabled() ||
    !eventName ||
    !params
  ) {
    return;
  }

  try {
    initGa4();
    window.gtag("event", eventName, params);
  } catch (error) {
    console.error("GA4 event could not be sent:", error);
  }
}

export function trackGa4PageView(pathname, search = "") {
  const path = String(pathname || "");
  const query = String(search || "").replace(/^\?/, "");
  const pageKey = query ? `${path}?${query}` : path;

  if (!path || pageKey === lastPageKey) {
    return;
  }

  lastPageKey = pageKey;

  if (!isGa4TrackedPath(path)) {
    return;
  }

  trackGa4Event("page_view", {
    page_location: `${window.location.origin}${pageKey}`,
    page_path: pageKey,
    page_title: document.title,
  });
}

function readTrackedPurchases() {
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(TRACKED_GA4_PURCHASES_KEY) ||
        "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberTrackedPurchase(transactionId) {
  try {
    window.sessionStorage.setItem(
      TRACKED_GA4_PURCHASES_KEY,
      JSON.stringify(
        readTrackedPurchases()
          .filter((value) => value !== transactionId)
          .concat(transactionId)
          .slice(-50)
      )
    );
  } catch {
    /* ignore */
  }
}

export function trackGa4Purchase({ order, pricing, transactionId }) {
  if (!hasWindow() || !isGa4Enabled()) {
    return false;
  }

  const params = buildGa4PurchaseParams({
    order,
    pricing,
    transactionId,
  });

  if (!params) {
    return false;
  }

  if (readTrackedPurchases().includes(transactionId)) {
    return false;
  }

  rememberTrackedPurchase(transactionId);
  trackGa4Event("purchase", params);

  return true;
}
