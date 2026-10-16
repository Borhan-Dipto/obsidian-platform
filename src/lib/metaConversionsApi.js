import crypto from "crypto";

/*
 * OBSIDIAN Meta Conversions API (server-side).
 *
 * Sends the Purchase event from the server after a new order is
 * saved, so purchases are still measured when the browser pixel is
 * blocked (ad blockers, iOS restrictions, closed tabs).
 *
 * Deduplication: the browser pixel and this server event share the
 * same event_id (see createPurchaseEventId in metaPixel.js), so Meta
 * counts each order once.
 *
 * Privacy:
 * - The access token is server-only (META_CAPI_ACCESS_TOKEN) and is
 *   never exposed to the browser.
 * - Raw customer data is never sent. Contact fields are SHA-256
 *   hashed, and are only included when
 *   META_CAPI_SEND_HASHED_CONTACT=true is set by the store owner.
 * - Delivery address, notes and the raw order ID are never sent.
 *
 * Failures are logged and never affect checkout.
 */

const DEFAULT_GRAPH_API_VERSION = "v26.0";
const REQUEST_TIMEOUT_MS = 8000;

function readEnv(name) {
  return String(process.env[name] || "").trim();
}

export function getMetaCapiConfig() {
  const pixelId = readEnv("NEXT_PUBLIC_META_PIXEL_ID");
  const accessToken = readEnv("META_CAPI_ACCESS_TOKEN");
  const apiVersion =
    readEnv("META_GRAPH_API_VERSION") ||
    DEFAULT_GRAPH_API_VERSION;

  return {
    pixelId,
    accessToken,
    apiVersion: /^v\d+\.\d+$/.test(apiVersion)
      ? apiVersion
      : DEFAULT_GRAPH_API_VERSION,
    testEventCode: readEnv("META_CAPI_TEST_EVENT_CODE"),
    sendHashedContact:
      readEnv("META_CAPI_SEND_HASHED_CONTACT").toLowerCase() ===
      "true",
    enabled:
      /^\d{10,20}$/.test(pixelId) &&
      accessToken.length >= 20,
  };
}

export function sha256Hex(value) {
  return crypto
    .createHash("sha256")
    .update(String(value), "utf8")
    .digest("hex");
}

/*
 * Must stay identical to createPurchaseEventId() in metaPixel.js
 * (browser) so Meta can deduplicate the two Purchase events.
 */
export function createServerPurchaseEventId(orderId) {
  const id = String(orderId || "").trim();

  if (!id) {
    return "";
  }

  return `purchase_${sha256Hex(
    `obsidian-purchase:${id}`
  ).slice(0, 40)}`;
}

/*
 * Bangladesh numbers: 01XXXXXXXXX -> 8801XXXXXXXXX.
 * Meta expects digits only, with country code.
 */
export function normalizePhoneForMeta(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (/^01\d{9}$/.test(digits)) {
    digits = `88${digits}`;
  } else if (/^1\d{9}$/.test(digits)) {
    digits = `880${digits}`;
  }

  return /^\d{8,15}$/.test(digits) ? digits : "";
}

function normalizeEmailForMeta(value) {
  const email = String(value || "").trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeNamePart(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function splitFullName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: normalizeNamePart(parts[0]),
    lastName:
      parts.length > 1
        ? normalizeNamePart(parts[parts.length - 1])
        : "",
  };
}

function cleanCookieValue(value, pattern) {
  const cookie = String(value || "").trim().slice(0, 500);

  return pattern.test(cookie) ? cookie : "";
}

export function readCookie(cookieHeader, name) {
  const header = String(cookieHeader || "");

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();

    if (key === name) {
      try {
        return decodeURIComponent(
          part.slice(separatorIndex + 1).trim()
        );
      } catch {
        return "";
      }
    }
  }

  return "";
}

function getClientIp(headers) {
  for (const name of [
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const first = String(headers.get(name) || "")
      .split(",")[0]
      .trim()
      .slice(0, 128);

    if (first && /^[0-9a-fA-F:.]+$/.test(first)) {
      return first;
    }
  }

  return "";
}

function getSafeSourceUrl(headers, siteUrl) {
  const referer = String(headers.get("referer") || "");

  try {
    const url = new URL(referer);
    const site = new URL(siteUrl);

    if (url.host === site.host) {
      /* Drop query/hash: they can carry personal data. */
      return `${url.origin}${url.pathname}`;
    }
  } catch {
    /* fall through */
  }

  return `${String(siteUrl).replace(/\/+$/, "")}/checkout`;
}

/*
 * Collects only what Meta needs for attribution from the incoming
 * checkout request. Call this inside the request, before after().
 */
export function collectMetaRequestContext(request, siteUrl) {
  const headers = request.headers;
  const cookieHeader = headers.get("cookie");

  return {
    clientIpAddress: getClientIp(headers),
    clientUserAgent: String(
      headers.get("user-agent") || ""
    ).slice(0, 500),
    fbp: cleanCookieValue(
      readCookie(cookieHeader, "_fbp"),
      /^fb\.\d\.\d+\.\d+$/
    ),
    fbc: cleanCookieValue(
      readCookie(cookieHeader, "_fbc"),
      /^fb\.\d\.\d+\.[A-Za-z0-9_\-.]+$/
    ),
    eventSourceUrl: getSafeSourceUrl(headers, siteUrl),
  };
}

function buildContents(items) {
  const contentsById = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const id = String(item?.id ?? "")
      .normalize("NFKC")
      .trim()
      .slice(0, 120);

    if (!id) {
      continue;
    }

    const quantity = Math.max(
      1,
      Math.floor(Number(item?.quantity) || 1)
    );
    const price = Math.max(0, Number(item?.price) || 0);
    const existing = contentsById.get(id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      contentsById.set(id, {
        id,
        quantity,
        item_price: Math.round(price * 100) / 100,
      });
    }
  }

  return Array.from(contentsById.values());
}

export function buildPurchaseServerEvent({
  order,
  context,
  sendHashedContact = false,
  eventTime = Math.floor(Date.now() / 1000),
}) {
  const orderId = order?.orderId || order?.id;
  const eventId = createServerPurchaseEventId(orderId);
  const contents = buildContents(order?.items);
  const total = Number(order?.pricing?.total);

  if (
    !eventId ||
    contents.length === 0 ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  const currency = /^[A-Z]{3}$/.test(
    String(order?.pricing?.currency || "").toUpperCase()
  )
    ? String(order.pricing.currency).toUpperCase()
    : "BDT";

  const userData = {
    country: [sha256Hex("bd")],
  };

  if (context?.clientIpAddress) {
    userData.client_ip_address = context.clientIpAddress;
  }

  if (context?.clientUserAgent) {
    userData.client_user_agent = context.clientUserAgent;
  }

  if (context?.fbp) {
    userData.fbp = context.fbp;
  }

  if (context?.fbc) {
    userData.fbc = context.fbc;
  }

  if (sendHashedContact) {
    const customer = order?.customer || {};
    const phone = normalizePhoneForMeta(customer.phone);
    const email = normalizeEmailForMeta(
      customer.email || customer.emailNormalized
    );
    const { firstName, lastName } = splitFullName(
      customer.fullName || customer.name
    );

    if (phone) {
      userData.ph = [sha256Hex(phone)];
      /* Stable, non-reversible customer key for matching. */
      userData.external_id = [
        sha256Hex(`obsidian-customer:${phone}`),
      ];
    }

    if (email) {
      userData.em = [sha256Hex(email)];
    }

    if (firstName) {
      userData.fn = [sha256Hex(firstName)];
    }

    if (lastName) {
      userData.ln = [sha256Hex(lastName)];
    }
  }

  return {
    event_name: "Purchase",
    event_time: eventTime,
    event_id: eventId,
    action_source: "website",
    event_source_url:
      context?.eventSourceUrl || undefined,
    user_data: userData,
    custom_data: {
      currency,
      value: Math.round(total * 100) / 100,
      content_type: "product",
      content_ids: contents.map((item) => item.id),
      contents,
      num_items: contents.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
    },
  };
}

export async function sendMetaServerEvents(
  events,
  config = getMetaCapiConfig()
) {
  const validEvents = (Array.isArray(events) ? events : []).filter(
    Boolean
  );

  if (!config.enabled || validEvents.length === 0) {
    return { sent: false, reason: "disabled_or_empty" };
  }

  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`;

  const body = {
    data: validEvents,
    access_token: config.accessToken,
  };

  if (config.testEventCode) {
    body.test_event_code = config.testEventCode;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      /* Never log the token or the payload (it holds hashes). */
      console.error("Meta Conversions API rejected events:", {
        status: response.status,
        error: result?.error?.message || "unknown",
        type: result?.error?.type || "",
        code: result?.error?.code || "",
        traceId: result?.error?.fbtrace_id || "",
      });

      return { sent: false, reason: "rejected" };
    }

    return {
      sent: true,
      received: Number(result?.events_received) || 0,
    };
  } catch (error) {
    console.error("Meta Conversions API request failed:", {
      name: error?.name || "Error",
      message: error?.message || "",
    });

    return { sent: false, reason: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendMetaPurchaseEvent({ order, context }) {
  const config = getMetaCapiConfig();

  if (!config.enabled) {
    return { sent: false, reason: "disabled" };
  }

  const event = buildPurchaseServerEvent({
    order,
    context,
    sendHashedContact: config.sendHashedContact,
  });

  if (!event) {
    return { sent: false, reason: "invalid_order" };
  }

  return sendMetaServerEvents([event], config);
}
