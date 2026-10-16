import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createFbcValue,
  createFbpValue,
  createPurchaseEventId,
} from "../../src/lib/metaPixel.js";
import {
  buildPurchaseServerEvent,
  collectMetaRequestContext,
  createServerPurchaseEventId,
  getMetaCapiConfig,
  normalizePhoneForMeta,
  readCookie,
  sendMetaPurchaseEvent,
  sha256Hex,
} from "../../src/lib/metaConversionsApi.js";
import {
  buildGa4ItemEventParams,
  buildGa4Items,
  buildGa4PurchaseParams,
  isValidGa4MeasurementId,
} from "../../src/lib/googleAnalytics.js";
import {
  buildMetaFeedCsv,
  buildMetaFeedRow,
  escapeCsvValue,
} from "../../src/lib/metaCatalogFeed.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function readSource(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const sampleOrder = {
  orderId: "OBS-20261016-ABC123",
  customer: {
    fullName: "Rahim Uddin Khan",
    phone: "01712345678",
    email: "Rahim@Example.com ",
    address: "House 1, Road 2, Dhanmondi, Dhaka",
    note: "Call before delivery",
  },
  items: [
    { id: "tee-1", name: "Normal 006", size: "M", quantity: 1, price: 499 },
    { id: "tee-1", name: "Normal 006", size: "L", quantity: 1, price: 499 },
    { id: "tee-2", name: "Artifact 001", size: "M", quantity: 1, price: 1299 },
  ],
  pricing: { currency: "BDT", total: 2357, payableDeliveryCharge: 60 },
};

function headersFrom(record) {
  return new Headers(record);
}

/* ---------- Conversions API ---------- */

test("server and browser purchase event IDs are identical (dedup)", async () => {
  const browserId = await createPurchaseEventId(sampleOrder.orderId);
  const serverId = createServerPurchaseEventId(sampleOrder.orderId);

  assert.equal(serverId, browserId);
  assert.match(serverId, /^purchase_[0-9a-f]{40}$/);
  assert.equal(createServerPurchaseEventId(""), "");
});

test("Bangladesh phone numbers are normalized with country code", () => {
  assert.equal(normalizePhoneForMeta("01712345678"), "8801712345678");
  assert.equal(normalizePhoneForMeta("+880 1712-345678"), "8801712345678");
  assert.equal(normalizePhoneForMeta("008801712345678"), "8801712345678");
  assert.equal(normalizePhoneForMeta("1712345678"), "8801712345678");
  assert.equal(normalizePhoneForMeta("abc"), "");
});

test("CAPI Purchase without consent flag sends no contact data", () => {
  const event = buildPurchaseServerEvent({
    order: sampleOrder,
    context: {
      clientIpAddress: "103.4.5.6",
      clientUserAgent: "Mozilla/5.0",
      fbp: "fb.1.1700000000000.123456",
      fbc: "fb.1.1700000000000.AbCdEf123",
      eventSourceUrl: "https://obsidianwearbd.store/checkout",
    },
    eventTime: 1760000000,
  });

  assert.equal(event.event_name, "Purchase");
  assert.equal(event.action_source, "website");
  assert.equal(event.event_time, 1760000000);
  assert.equal(event.custom_data.value, 2357);
  assert.equal(event.custom_data.currency, "BDT");
  assert.equal(event.custom_data.num_items, 3);
  assert.deepEqual(event.custom_data.content_ids, ["tee-1", "tee-2"]);
  assert.equal(event.user_data.client_ip_address, "103.4.5.6");
  assert.equal(event.user_data.fbp, "fb.1.1700000000000.123456");
  assert.equal(event.user_data.fbc, "fb.1.1700000000000.AbCdEf123");
  assert.deepEqual(event.user_data.country, [sha256Hex("bd")]);

  for (const key of ["ph", "em", "fn", "ln", "external_id"]) {
    assert.equal(key in event.user_data, false, key);
  }

  const serialized = JSON.stringify(event);

  for (const forbidden of [
    "01712345678",
    "Rahim",
    "Dhanmondi",
    "Call before",
    "OBS-20261016",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("CAPI hashed contact is SHA-256 of normalized values only", () => {
  const event = buildPurchaseServerEvent({
    order: sampleOrder,
    context: {},
    sendHashedContact: true,
  });

  assert.deepEqual(event.user_data.ph, [sha256Hex("8801712345678")]);
  assert.deepEqual(event.user_data.em, [sha256Hex("rahim@example.com")]);
  assert.deepEqual(event.user_data.fn, [sha256Hex("rahim")]);
  assert.deepEqual(event.user_data.ln, [sha256Hex("khan")]);
  assert.match(event.user_data.external_id[0], /^[0-9a-f]{64}$/);

  const serialized = JSON.stringify(event);

  for (const forbidden of ["01712345678", "8801712345678", "rahim", "Dhanmondi"]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});

test("CAPI rejects orders without a valid total or items", () => {
  assert.equal(
    buildPurchaseServerEvent({ order: { ...sampleOrder, pricing: { total: 0 } } }),
    null
  );
  assert.equal(
    buildPurchaseServerEvent({ order: { ...sampleOrder, items: [] } }),
    null
  );
});

test("request context reads cookies safely and strips query strings", () => {
  const request = {
    headers: headersFrom({
      cookie: "a=1; _fbp=fb.1.1700000000000.42; _fbc=fb.1.1700000000000.Click_ID-1; x=2",
      "user-agent": "TestAgent/1.0",
      "x-forwarded-for": "103.4.5.6, 10.0.0.1",
      referer: "https://obsidianwearbd.store/checkout?phone=017&x=1",
    }),
  };

  const context = collectMetaRequestContext(request, "https://obsidianwearbd.store");

  assert.equal(context.clientIpAddress, "103.4.5.6");
  assert.equal(context.clientUserAgent, "TestAgent/1.0");
  assert.equal(context.fbp, "fb.1.1700000000000.42");
  assert.equal(context.fbc, "fb.1.1700000000000.Click_ID-1");
  assert.equal(context.eventSourceUrl, "https://obsidianwearbd.store/checkout");

  const hostile = collectMetaRequestContext(
    {
      headers: headersFrom({
        cookie: "_fbp=<script>; _fbc=javascript:alert(1)",
        referer: "https://evil.example/checkout",
      }),
    },
    "https://obsidianwearbd.store"
  );

  assert.equal(hostile.fbp, "");
  assert.equal(hostile.fbc, "");
  assert.equal(hostile.eventSourceUrl, "https://obsidianwearbd.store/checkout");
  assert.equal(readCookie("a=1; b=2", "b"), "2");
});

test("CAPI is disabled without a token and never calls the network", async () => {
  const originalToken = process.env.META_CAPI_ACCESS_TOKEN;
  const originalFetch = globalThis.fetch;
  let called = false;

  delete process.env.META_CAPI_ACCESS_TOKEN;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("should not be called");
  };

  try {
    assert.equal(getMetaCapiConfig().enabled, false);

    const result = await sendMetaPurchaseEvent({ order: sampleOrder, context: {} });

    assert.equal(result.sent, false);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalToken !== undefined) {
      process.env.META_CAPI_ACCESS_TOKEN = originalToken;
    }
  }
});

test("CAPI sends to the pixel endpoint with test code and survives errors", async () => {
  const saved = {
    pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    token: process.env.META_CAPI_ACCESS_TOKEN,
    code: process.env.META_CAPI_TEST_EVENT_CODE,
  };
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const requests = [];

  process.env.NEXT_PUBLIC_META_PIXEL_ID = "1620403752959832";
  process.env.META_CAPI_ACCESS_TOKEN = "test-token-abcdefghijklmnopqrstuvwxyz";
  process.env.META_CAPI_TEST_EVENT_CODE = "TEST12345";
  console.error = () => {};

  try {
    globalThis.fetch = async (url, init) => {
      requests.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    };

    const ok = await sendMetaPurchaseEvent({ order: sampleOrder, context: {} });

    assert.equal(ok.sent, true);
    assert.match(requests[0].url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/1620403752959832\/events$/);
    assert.equal(requests[0].body.test_event_code, "TEST12345");
    assert.equal(requests[0].body.data[0].event_name, "Purchase");

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: "Invalid token" } }), { status: 400 });
    assert.equal((await sendMetaPurchaseEvent({ order: sampleOrder, context: {} })).sent, false);

    globalThis.fetch = async () => {
      throw new Error("network down");
    };
    assert.equal((await sendMetaPurchaseEvent({ order: sampleOrder, context: {} })).sent, false);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;

    for (const [key, env] of [
      ["pixel", "NEXT_PUBLIC_META_PIXEL_ID"],
      ["token", "META_CAPI_ACCESS_TOKEN"],
      ["code", "META_CAPI_TEST_EVENT_CODE"],
    ]) {
      if (saved[key] === undefined) {
        delete process.env[env];
      } else {
        process.env[env] = saved[key];
      }
    }
  }
});

test("order API sends CAPI only for new orders, after the response", () => {
  const source = readSource("src/app/api/orders/route.js");
  const sendIndex = source.indexOf("sendMetaPurchaseEvent({");
  const newOrderIndex = source.indexOf('"Order placed successfully."');

  assert.match(source, /import \{ after \} from "next\/server";/);
  assert.equal(source.split("sendMetaPurchaseEvent({").length - 1, 1);
  assert.ok(sendIndex > 0 && sendIndex < newOrderIndex);
  assert.match(source, /after\(async \(\) => \{\s*await sendMetaPurchaseEvent/);
});

test("access token is server-only", () => {
  for (const file of [
    "src/lib/metaPixel.js",
    "src/lib/googleAnalytics.js",
    "src/components/analytics/MetaPixel.jsx",
    "src/app/checkout/page.jsx",
  ]) {
    assert.doesNotMatch(readSource(file), /META_CAPI_ACCESS_TOKEN/, file);
  }

  assert.doesNotMatch(
    readSource("src/lib/metaConversionsApi.js"),
    /NEXT_PUBLIC_META_CAPI/
  );
});

/* ---------- First-party click IDs ---------- */

test("fbc/fbp cookie values follow Meta's format", () => {
  assert.equal(createFbcValue("AbC_123-xyz.987", 1700000000000), "fb.1.1700000000000.AbC_123-xyz.987");
  assert.equal(createFbcValue("bad value<>"), "");
  assert.equal(createFbpValue(1700000000000, 42), "fb.1.1700000000000.42");
});

/* ---------- GA4 ---------- */

test("GA4 measurement ID validation", () => {
  assert.equal(isValidGa4MeasurementId("G-ABC123XYZ9"), true);
  assert.equal(isValidGa4MeasurementId("UA-12345-1"), false);
  assert.equal(isValidGa4MeasurementId(""), false);
});

test("GA4 items and purchase use hashed transaction ID and real total", async () => {
  const items = buildGa4Items(sampleOrder.items);

  assert.equal(items.length, 3);
  assert.equal(items[0].item_variant, "M");
  assert.equal(buildGa4ItemEventParams(sampleOrder.items).value, 2297);
  assert.equal(buildGa4ItemEventParams([]), null);

  const transactionId = await createPurchaseEventId(sampleOrder.orderId);
  const purchase = buildGa4PurchaseParams({
    order: sampleOrder,
    pricing: sampleOrder.pricing,
    transactionId,
  });

  assert.equal(purchase.transaction_id, transactionId);
  assert.equal(purchase.value, 2357);
  assert.equal(purchase.shipping, 60);
  assert.equal(purchase.currency, "BDT");
  assert.equal(JSON.stringify(purchase).includes("01712345678"), false);
  assert.equal(JSON.stringify(purchase).includes("OBS-20261016"), false);
  assert.equal(
    buildGa4PurchaseParams({ order: sampleOrder, pricing: sampleOrder.pricing, transactionId: "" }),
    null
  );
});

test("GA4 is wired into all funnel steps and CSP", () => {
  assert.match(readSource("src/components/analytics/MetaViewContent.jsx"), /"view_item"/);
  assert.match(readSource("src/components/product/ProductActions.jsx"), /"add_to_cart"/);

  const checkout = readSource("src/app/checkout/page.jsx");

  assert.match(checkout, /"begin_checkout"/);
  assert.match(checkout, /trackGa4Purchase\(/);

  const config = readSource("next.config.ts");

  assert.match(config, /"https:\/\/www\.googletagmanager\.com"/);
  assert.match(config, /"https:\/\/\*\.google-analytics\.com"/);
});

/* ---------- Domain verification ---------- */

test("domain verification meta tag comes from env only", () => {
  const layout = readSource("src/app/layout.tsx");

  assert.match(layout, /"facebook-domain-verification": code/);
  assert.match(layout, /process\.env\.META_DOMAIN_VERIFICATION/);
});

/* ---------- Catalog feed ---------- */

test("catalog feed rows match pixel content IDs and Meta's format", () => {
  const row = buildMetaFeedRow(
    {
      id: "tee-1",
      name: "Normal 006",
      description: "Heavyweight cotton tee",
      price: 499,
      stock: 0,
      sizes: ["M"],
      sizeStock: { M: 11 },
      image: "https://res.cloudinary.com/demo/image/upload/tee.jpg",
      color: "White",
      series: "Obsidian White",
    },
    "https://obsidianwearbd.store"
  );

  assert.equal(row.id, "tee-1");
  assert.equal(row.price, "499.00 BDT");
  assert.equal(row.availability, "in stock");
  assert.equal(row.link, "https://obsidianwearbd.store/product/tee-1");
  assert.equal(row.brand, "OBSIDIAN");

  assert.equal(buildMetaFeedRow({ id: "x", name: "Free", price: 0 }, "https://obsidianwearbd.store"), null);
});

test("catalog CSV escapes quotes, commas and formula injection", () => {
  assert.equal(escapeCsvValue('Tee, "black"'), '"Tee, ""black"""');
  assert.equal(escapeCsvValue("=HYPERLINK(1)"), "'=HYPERLINK(1)");

  const csv = buildMetaFeedCsv(
    [
      { id: "a", name: "A, tee", price: 100, stock: 2, image: "/a.jpg" },
      { id: "", name: "Skip", price: 100 },
    ],
    "https://obsidianwearbd.store"
  );
  const lines = csv.trim().split("\n");

  assert.equal(lines.length, 2);
  assert.match(lines[0], /^id,title,description,availability,condition,price,link,image_link,additional_image_link,brand/);
  assert.match(lines[1], /^a,"A, tee",/);
  assert.match(lines[1], /https:\/\/obsidianwearbd\.store\/a\.jpg/);
});

/* ---------- Privacy policy ---------- */

test("privacy policy discloses Meta Pixel, Conversions API and Google Analytics", () => {
  const legal = readSource("src/lib/legalDefaults.js");

  assert.match(legal, /Meta Pixel and Meta Conversions API/);
  assert.match(legal, /Google Analytics/);
  assert.match(legal, /hashed/);
});
