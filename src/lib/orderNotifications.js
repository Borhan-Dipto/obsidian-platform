import "server-only";

import crypto from "crypto";
import clientPromise from "./mongodb";
import { getSettings } from "./settings";
import {
  getNotificationProviderStatus,
  getNotificationSettings,
} from "./notificationSettings";

export const NOTIFICATION_DELIVERIES_COLLECTION_NAME =
  "notification_deliveries";

const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_ERROR_LENGTH = 1000;

let notificationIndexPromise = null;

function normalizeText(
  value,
  maximumLength = 5000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function normalizeEmail(value) {
  return normalizeText(
    value,
    254
  ).toLowerCase();
}

function normalizePhoneDigits(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 20);
}

function normalizeInternationalPhone(value) {
  let digits =
    normalizePhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  const defaultCountryCode =
    normalizePhoneDigits(
      process.env
        .NOTIFICATION_DEFAULT_COUNTRY_CODE ||
        "880"
    );

  if (
    defaultCountryCode &&
    digits.startsWith("0")
  ) {
    digits =
      defaultCountryCode +
      digits.slice(1);
  } else if (
    defaultCountryCode &&
    digits.length <= 10 &&
    !digits.startsWith(
      defaultCountryCode
    )
  ) {
    digits =
      defaultCountryCode + digits;
  }

  if (
    digits.length < 8 ||
    digits.length > 15
  ) {
    return "";
  }

  return digits;
}

function getSmsRecipient(value) {
  const phone =
    normalizeInternationalPhone(value);

  return phone ? `+${phone}` : "";
}

function getWhatsAppRecipient(value) {
  return normalizeInternationalPhone(
    value
  );
}

function normalizeStatus(value) {
  return normalizeText(
    value,
    50
  ).toLowerCase();
}

function formatStatus(value) {
  const normalizedStatus =
    normalizeStatus(value);

  if (!normalizedStatus) {
    return "Pending";
  }

  return normalizedStatus
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getCurrencySymbol(currency) {
  return currency === "BDT"
    ? "৳"
    : currency || "";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  );
}

function getOrderTotal(order) {
  return Number(
    order?.pricing?.total ??
      order?.total ??
      0
  );
}

function getOrderCurrency(
  order,
  storeSettings
) {
  return normalizeText(
    order?.pricing?.currency ||
      storeSettings?.store?.currency ||
      "BDT",
    10
  ).toUpperCase();
}

function getOrderId(order) {
  return normalizeText(
    order?.orderId ||
      order?.id,
    120
  ).toUpperCase();
}

function getBaseUrl(explicitBaseUrl) {
  const candidates = [
    explicitBaseUrl,

    process.env
      .NEXT_PUBLIC_SITE_URL,

    process.env.SITE_URL,

    process.env.APP_URL,

    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "",

    "https://obsidianwearbd.store",
  ];

  for (const candidate of candidates) {
    const normalizedCandidate =
      normalizeText(
        candidate,
        2000
      );

    if (!normalizedCandidate) {
      continue;
    }

    try {
      const parsedUrl = new URL(
        normalizedCandidate
      );

      if (
        parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:"
      ) {
        return parsedUrl.origin;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return "";
}

function createTrackingUrl(
  orderId,
  baseUrl
) {
  if (!orderId) {
    return "";
  }

  const path =
    `/track-order?orderId=${encodeURIComponent(
      orderId
    )}`;

  return baseUrl
    ? `${baseUrl}${path}`
    : path;
}

function createTemplateValues({
  order,
  storeSettings,
  status,
  baseUrl,
}) {
  const orderId = getOrderId(order);

  const currency = getOrderCurrency(
    order,
    storeSettings
  );

  const total =
    `${getCurrencySymbol(currency)} ${formatMoney(
      getOrderTotal(order)
    )}`.trim();

  return {
    storeName: normalizeText(
      storeSettings?.store?.name ||
        "OBSIDIAN",
      100
    ),

    customerName: normalizeText(
      order?.customer?.fullName ||
        "Customer",
      120
    ),

    customerPhone:
      normalizeInternationalPhone(
        order?.customer?.phone
      ),

    orderId,

    status: formatStatus(
      status ||
        order?.status ||
        "pending"
    ),

    total,

    currency,

    trackingUrl:
      createTrackingUrl(
        orderId,
        baseUrl
      ),
  };
}

function replaceTemplateTokens(
  template,
  values
) {
  let result = String(
    template || ""
  );

  for (const [
    token,
    value,
  ] of Object.entries({
    "{{storeName}}":
      values.storeName,

    "{{customerName}}":
      values.customerName,

    "{{orderId}}":
      values.orderId,

    "{{status}}":
      values.status,

    "{{total}}":
      values.total,

    "{{currency}}":
      values.currency,

    "{{trackingUrl}}":
      values.trackingUrl,
  })) {
    result = result
      .split(token)
      .join(String(value || ""));
  }

  return result.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value) {
  return escapeHtml(value).replace(
    /\n/g,
    "<br />"
  );
}

function getOrderItems(order) {
  return Array.isArray(order?.items)
    ? order.items
    : [];
}

function getLineTotal(item) {
  return Number(
    item?.lineTotal ??
      Number(item?.price || 0) *
        Number(item?.quantity || 0)
  );
}

function createOrderItemsHtml(
  order,
  currencySymbol
) {
  const items =
    getOrderItems(order);

  if (items.length === 0) {
    return "";
  }

  const rows = items
    .map((item) => {
      const productDetails = [
        item?.size
          ? `Size ${item.size}`
          : "",

        item?.color || "",

        `Qty ${Number(
          item?.quantity || 1
        )}`,
      ]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #dedbd5;vertical-align:top;">
            <strong style="font-size:14px;">
              ${escapeHtml(
                item?.name ||
                  "Product"
              )}
            </strong>

            <div style="margin-top:5px;color:#777777;font-size:12px;line-height:1.6;">
              ${escapeHtml(
                productDetails
              )}
            </div>
          </td>

          <td style="padding:14px 0;border-bottom:1px solid #dedbd5;text-align:right;vertical-align:top;font-size:14px;">
            ${escapeHtml(
              currencySymbol
            )} ${escapeHtml(
              formatMoney(
                getLineTotal(item)
              )
            )}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table
      role="presentation"
      style="width:100%;margin-top:28px;border-collapse:collapse;"
    >
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function createEmailHtml({
  storeName,
  heading,
  message,
  order,
  trackingUrl,
}) {
  const currency =
    normalizeText(
      order?.pricing?.currency ||
        "BDT",
      10
    ).toUpperCase();

  const currencySymbol =
    getCurrencySymbol(currency);

  const orderId =
    getOrderId(order);

  const total =
    getOrderTotal(order);

  const itemsHtml =
    createOrderItemsHtml(
      order,
      currencySymbol
    );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>${escapeHtml(
    heading
  )}</title>
</head>

<body style="margin:0;background:#f1ece4;color:#111111;font-family:Arial,Helvetica,sans-serif;">
  <div style="padding:32px 16px;">
    <div style="max-width:680px;margin:0 auto;border:1px solid #d8d1c7;background:#ffffff;padding:38px;">
      <p style="margin:0;color:#777777;font-size:10px;text-transform:uppercase;letter-spacing:0.28em;">
        Order Notification
      </p>

      <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:38px;font-weight:400;letter-spacing:0.06em;">
        ${escapeHtml(
          storeName
        )}
      </h1>

      <div style="margin-top:30px;padding-top:28px;border-top:1px solid #dedbd5;">
        <h2 style="margin:0;font-family:Georgia,serif;font-size:27px;font-weight:400;">
          ${escapeHtml(
            heading
          )}
        </h2>

        <p style="margin:20px 0 0;color:#555555;font-size:15px;line-height:1.8;">
          ${textToHtml(
            message
          )}
        </p>
      </div>

      ${
        orderId
          ? `
            <div style="margin-top:28px;padding:18px;border:1px solid #dedbd5;background:#f7f4ef;">
              <div style="color:#777777;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;">
                Order ID
              </div>

              <div style="margin-top:9px;font-size:17px;font-weight:700;letter-spacing:0.06em;">
                ${escapeHtml(
                  orderId
                )}
              </div>
            </div>
          `
          : ""
      }

      ${itemsHtml}

      <div style="margin-top:26px;text-align:right;">
        <span style="color:#777777;font-size:12px;text-transform:uppercase;letter-spacing:0.16em;">
          Total
        </span>

        <div style="margin-top:8px;font-family:Georgia,serif;font-size:28px;">
          ${escapeHtml(
            currencySymbol
          )} ${escapeHtml(
            formatMoney(total)
          )}
        </div>
      </div>

      ${
        trackingUrl
          ? `
            <div style="margin-top:32px;text-align:center;">
              <a
                href="${escapeHtml(
                  trackingUrl
                )}"
                style="display:inline-block;background:#111111;color:#ffffff;padding:15px 24px;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;"
              >
                Track Order
              </a>
            </div>
          `
          : ""
      }

      <p style="margin:38px 0 0;padding-top:24px;border-top:1px solid #dedbd5;color:#888888;font-size:11px;line-height:1.7;text-align:center;">
        This is an automatic transactional message from
        ${escapeHtml(storeName)}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function createPlainEmailText({
  heading,
  message,
  order,
  trackingUrl,
}) {
  const orderId =
    getOrderId(order);

  const lines = [
    heading,
    "",
    message,

    orderId
      ? `Order ID: ${orderId}`
      : "",

    `Total: ${getOrderCurrency(
      order,
      {}
    )} ${formatMoney(
      getOrderTotal(order)
    )}`,

    trackingUrl
      ? `Track order: ${trackingUrl}`
      : "",
  ];

  return lines
    .filter(
      (line, index) =>
        line ||
        lines[index - 1]
    )
    .join("\n")
    .trim();
}

function createProviderError(
  provider,
  status,
  responseData
) {
  const providerMessage =
    normalizeText(
      responseData?.message ||
        responseData?.error?.message ||
        responseData?.error ||
        responseData?.detail ||
        "",
      MAX_ERROR_LENGTH
    );

  const message =
    providerMessage ||
    `${provider} request failed with status ${status}.`;

  const error = new Error(message);

  error.provider = provider;
  error.status = status;

  return error;
}

async function readResponseData(
  response
) {
  const responseText =
    await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(
      responseText
    );
  } catch {
    return {
      message: normalizeText(
        responseText,
        MAX_ERROR_LENGTH
      ),
    };
  }
}

async function providerFetch(
  url,
  options
) {
  return fetch(url, {
    ...options,

    signal: AbortSignal.timeout(
      PROVIDER_TIMEOUT_MS
    ),

    cache: "no-store",
  });
}

async function sendResendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}) {
  const apiKey =
    normalizeText(
      process.env.RESEND_API_KEY,
      500
    );

  const from =
    normalizeText(
      process.env
        .NOTIFICATION_EMAIL_FROM,
      500
    );

  if (!apiKey || !from) {
    throw new Error(
      "Resend email provider is not configured."
    );
  }

  const requestBody = {
    from,
    to: [to],
    subject,
    html,
    text,
  };

  if (replyTo) {
    requestBody.reply_to =
      replyTo;
  }

  const response =
    await providerFetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          requestBody
        ),
      }
    );

  const data =
    await readResponseData(
      response
    );

  if (!response.ok) {
    throw createProviderError(
      "Resend",
      response.status,
      data
    );
  }

  return {
    provider: "resend",

    providerMessageId:
      normalizeText(
        data?.id,
        500
      ),

    responseStatus:
      response.status,
  };
}

async function sendTwilioSms({
  to,
  body,
}) {
  const accountSid =
    normalizeText(
      process.env
        .TWILIO_ACCOUNT_SID,
      500
    );

  const authToken =
    normalizeText(
      process.env
        .TWILIO_AUTH_TOKEN,
      500
    );

  const messagingServiceSid =
    normalizeText(
      process.env
        .TWILIO_MESSAGING_SERVICE_SID,
      500
    );

  const from =
    normalizeText(
      process.env
        .TWILIO_SMS_FROM,
      100
    );

  if (
    !accountSid ||
    !authToken ||
    (!messagingServiceSid &&
      !from)
  ) {
    throw new Error(
      "Twilio SMS provider is not configured."
    );
  }

  const formData =
    new URLSearchParams();

  formData.set("To", to);
  formData.set("Body", body);

  if (messagingServiceSid) {
    formData.set(
      "MessagingServiceSid",
      messagingServiceSid
    );
  } else {
    formData.set(
      "From",
      from
    );
  }

  const authorization =
    Buffer.from(
      `${accountSid}:${authToken}`
    ).toString("base64");

  const response =
    await providerFetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
        accountSid
      )}/Messages.json`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Basic ${authorization}`,

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: formData.toString(),
      }
    );

  const data =
    await readResponseData(
      response
    );

  if (!response.ok) {
    throw createProviderError(
      "Twilio",
      response.status,
      data
    );
  }

  return {
    provider: "twilio",

    providerMessageId:
      normalizeText(
        data?.sid,
        500
      ),

    responseStatus:
      response.status,
  };
}

async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode,
  parameters,
}) {
  const phoneNumberId =
    normalizeText(
      process.env
        .WHATSAPP_PHONE_NUMBER_ID,
      500
    );

  const accessToken =
    normalizeText(
      process.env
        .WHATSAPP_ACCESS_TOKEN,
      2000
    );

  const apiVersion =
    normalizeText(
      process.env
        .WHATSAPP_API_VERSION,
      30
    );

  if (
    !phoneNumberId ||
    !accessToken ||
    !apiVersion
  ) {
    throw new Error(
      "WhatsApp Cloud API provider is not configured."
    );
  }

  if (!templateName) {
    throw new Error(
      "WhatsApp template name is missing."
    );
  }

  const bodyParameters =
    parameters.map((value) => ({
      type: "text",
      text:
        normalizeText(
          value,
          1000
        ) || "-",
    }));

  const requestBody = {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to,

    type: "template",

    template: {
      name: templateName,

      language: {
        code:
          languageCode || "en",
      },

      components: [
        {
          type: "body",
          parameters:
            bodyParameters,
        },
      ],
    },
  };

  const response =
    await providerFetch(
      `https://graph.facebook.com/${encodeURIComponent(
        apiVersion
      )}/${encodeURIComponent(
        phoneNumberId
      )}/messages`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          requestBody
        ),
      }
    );

  const data =
    await readResponseData(
      response
    );

  if (!response.ok) {
    throw createProviderError(
      "WhatsApp Cloud API",
      response.status,
      data
    );
  }

  return {
    provider:
      "whatsapp-cloud-api",

    providerMessageId:
      normalizeText(
        data?.messages?.[0]?.id,
        500
      ),

    responseStatus:
      response.status,
  };
}

function hashRecipient(value) {
  return crypto
    .createHash("sha256")
    .update(
      String(value || "")
        .trim()
        .toLowerCase()
    )
    .digest("hex");
}

function maskRecipient(
  recipient,
  channel
) {
  const value =
    String(recipient || "");

  if (channel === "email") {
    const [
      localPart,
      domain,
    ] = value.split("@");

    if (
      !localPart ||
      !domain
    ) {
      return "***";
    }

    return `${
      localPart.slice(0, 2) ||
      "*"
    }***@${domain}`;
  }

  const digits =
    normalizePhoneDigits(value);

  if (digits.length <= 4) {
    return "****";
  }

  return `${"*".repeat(
    Math.max(
      4,
      digits.length - 4
    )
  )}${digits.slice(-4)}`;
}

async function getNotificationDatabase() {
  const client =
    await clientPromise;

  return client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );
}

async function ensureNotificationIndexes() {
  if (!notificationIndexPromise) {
    notificationIndexPromise =
      (async () => {
        const database =
          await getNotificationDatabase();

        const collection =
          database.collection(
            NOTIFICATION_DELIVERIES_COLLECTION_NAME
          );

        await Promise.all([
          collection.createIndex(
            {
              dedupeKey: 1,
            },
            {
              unique: true,

              name:
                "notification_dedupe_unique",
            }
          ),

          collection.createIndex(
            {
              orderId: 1,
              createdAt: -1,
            },
            {
              name:
                "notification_order_history",
            }
          ),

          collection.createIndex(
            {
              status: 1,
              createdAt: -1,
            },
            {
              name:
                "notification_delivery_status",
            }
          ),
        ]);

        return collection;
      })().catch((error) => {
        notificationIndexPromise =
          null;

        throw error;
      });
  }

  return notificationIndexPromise;
}

function createDedupeKey({
  eventType,
  orderId,
  eventStatus,
  channel,
  audience,
  recipient,
}) {
  return [
    eventType,
    orderId,
    eventStatus || "none",
    channel,
    audience,
    hashRecipient(recipient),
  ].join(":");
}

async function claimDelivery({
  eventType,
  orderId,
  eventStatus,
  channel,
  audience,
  recipient,
}) {
  const collection =
    await ensureNotificationIndexes();

  const dedupeKey =
    createDedupeKey({
      eventType,
      orderId,
      eventStatus,
      channel,
      audience,
      recipient,
    });

  const now = new Date();

  try {
    const result =
      await collection.updateOne(
        {
          dedupeKey,
        },
        {
          $setOnInsert: {
            dedupeKey,
            eventType,
            eventStatus:
              eventStatus || null,
            orderId,
            channel,
            audience,

            recipientHash:
              hashRecipient(
                recipient
              ),

            recipientMasked:
              maskRecipient(
                recipient,
                channel
              ),

            status: "pending",
            createdAt: now,
            updatedAt: now,
          },
        },
        {
          upsert: true,
        }
      );

    return {
      claimed:
        result.upsertedCount === 1,

      dedupeKey,
      collection,
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        claimed: false,
        dedupeKey,
        collection,
      };
    }

    throw error;
  }
}

function normalizeErrorMessage(error) {
  if (
    error?.name ===
    "TimeoutError"
  ) {
    return "Notification provider request timed out.";
  }

  return normalizeText(
    error?.message ||
      "Notification delivery failed.",
    MAX_ERROR_LENGTH
  );
}

async function executeDelivery({
  eventType,
  orderId,
  eventStatus,
  channel,
  audience,
  recipient,
  send,
}) {
  if (!recipient) {
    return {
      channel,
      audience,
      status: "skipped",
      reason:
        "recipient_missing",
    };
  }

  let claim;

  try {
    claim = await claimDelivery({
      eventType,
      orderId,
      eventStatus,
      channel,
      audience,
      recipient,
    });
  } catch (error) {
    console.error(
      "Notification claim error:",
      error
    );

    return {
      channel,
      audience,
      status: "failed",
      reason:
        "delivery_log_error",
    };
  }

  if (!claim.claimed) {
    return {
      channel,
      audience,
      status: "skipped",
      reason: "duplicate",
    };
  }

  try {
    const providerResult =
      await send();

    const deliveredAt =
      new Date();

    await claim.collection.updateOne(
      {
        dedupeKey:
          claim.dedupeKey,
      },
      {
        $set: {
          status: "sent",

          provider:
            providerResult.provider,

          providerMessageId:
            providerResult
              .providerMessageId ||
            "",

          responseStatus:
            providerResult
              .responseStatus ||
            null,

          sentAt:
            deliveredAt,

          updatedAt:
            deliveredAt,
        },

        $unset: {
          error: "",
          failedAt: "",
        },
      }
    );

    return {
      channel,
      audience,
      status: "sent",

      provider:
        providerResult.provider,

      providerMessageId:
        providerResult
          .providerMessageId ||
        "",
    };
  } catch (error) {
    const failedAt =
      new Date();

    const errorMessage =
      normalizeErrorMessage(error);

    try {
      await claim.collection.updateOne(
        {
          dedupeKey:
            claim.dedupeKey,
        },
        {
          $set: {
            status: "failed",
            error: errorMessage,
            failedAt,
            updatedAt: failedAt,
          },
        }
      );
    } catch (logError) {
      console.error(
        "Notification failure log error:",
        logError
      );
    }

    console.error(
      `${channel} notification failed:`,
      errorMessage
    );

    return {
      channel,
      audience,
      status: "failed",
      error: errorMessage,
    };
  }
}

function summarizeResults(results) {
  return {
    attempted:
      results.length,

    sent: results.filter(
      (result) =>
        result.status === "sent"
    ).length,

    failed: results.filter(
      (result) =>
        result.status === "failed"
    ).length,

    skipped: results.filter(
      (result) =>
        result.status === "skipped"
    ).length,

    results,
  };
}

function getCustomerEmail(order) {
  const email =
    normalizeEmail(
      order?.customer?.email
    );

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return "";
  }

  return email;
}

function getCustomerPhone(order) {
  return normalizeInternationalPhone(
    order?.customer?.phone
  );
}

function getWhatsAppParameters(
  eventType,
  values
) {
  if (
    eventType ===
    "admin-order-placed"
  ) {
    return [
      values.customerName,
      values.orderId,
      values.total,
      values.customerPhone,
    ];
  }

  if (
    eventType ===
    "order-status-updated"
  ) {
    return [
      values.customerName,
      values.orderId,
      values.status,
      values.trackingUrl,
    ];
  }

  return [
    values.customerName,
    values.orderId,
    values.total,
    values.trackingUrl,
  ];
}

function createEmailDelivery({
  eventType,
  eventStatus,
  audience,
  recipient,
  subjectTemplate,
  messageTemplate,
  values,
  order,
  replyTo,
}) {
  const subject =
    replaceTemplateTokens(
      subjectTemplate,
      values
    );

  const message =
    replaceTemplateTokens(
      messageTemplate,
      values
    );

  return executeDelivery({
    eventType,
    eventStatus,
    orderId: values.orderId,
    channel: "email",
    audience,
    recipient,

    send: () =>
      sendResendEmail({
        to: recipient,
        subject,

        html: createEmailHtml({
          storeName:
            values.storeName,

          heading: subject,
          message,
          order,

          trackingUrl:
            values.trackingUrl,
        }),

        text: createPlainEmailText({
          heading: subject,
          message,
          order,

          trackingUrl:
            values.trackingUrl,
        }),

        replyTo,
      }),
  });
}

function createSmsDelivery({
  eventType,
  eventStatus,
  audience,
  recipient,
  messageTemplate,
  values,
}) {
  const smsRecipient =
    getSmsRecipient(recipient);

  const message =
    replaceTemplateTokens(
      messageTemplate,
      values
    );

  return executeDelivery({
    eventType,
    eventStatus,
    orderId: values.orderId,
    channel: "sms",
    audience,

    recipient:
      smsRecipient,

    send: () =>
      sendTwilioSms({
        to: smsRecipient,
        body: message,
      }),
  });
}

function createWhatsAppDelivery({
  eventType,
  eventStatus,
  audience,
  recipient,
  templateName,
  languageCode,
  values,
}) {
  const whatsappRecipient =
    getWhatsAppRecipient(
      recipient
    );

  return executeDelivery({
    eventType,
    eventStatus,
    orderId: values.orderId,
    channel: "whatsapp",
    audience,

    recipient:
      whatsappRecipient,

    send: () =>
      sendWhatsAppTemplate({
        to: whatsappRecipient,
        templateName,
        languageCode,

        parameters:
          getWhatsAppParameters(
            eventType,
            values
          ),
      }),
  });
}

async function loadNotificationContext({
  order,
  status,
  baseUrl,
}) {
  const [
    storeSettings,
    notificationSettings,
  ] = await Promise.all([
    getSettings(),
    getNotificationSettings(),
  ]);

  const resolvedBaseUrl =
    getBaseUrl(baseUrl);

  const values =
    createTemplateValues({
      order,
      storeSettings,
      status,
      baseUrl:
        resolvedBaseUrl,
    });

  return {
    storeSettings,
    notificationSettings,
    providers:
      getNotificationProviderStatus(),
    values,
  };
}

export async function dispatchOrderPlacedNotifications({
  order,
  baseUrl = "",
}) {
  if (!order) {
    return summarizeResults([]);
  }

  const {
    notificationSettings,
    values,
  } =
    await loadNotificationContext({
      order,
      status: order.status,
      baseUrl,
    });

  const deliveries = [];

  const customerEmail =
    getCustomerEmail(order);

  const customerPhone =
    getCustomerPhone(order);

  if (
    notificationSettings.email
      .enabled
  ) {
    if (
      notificationSettings.email
        .customerOrderPlaced &&
      customerEmail
    ) {
      deliveries.push(
        createEmailDelivery({
          eventType:
            "order-placed",

          audience:
            "customer",

          recipient:
            customerEmail,

          subjectTemplate:
            notificationSettings.email
              .orderPlacedSubject,

          messageTemplate:
            notificationSettings.email
              .orderPlacedMessage,

          values,
          order,

          replyTo:
            notificationSettings.email
              .replyTo,
        })
      );
    }

    if (
      notificationSettings.email
        .adminOrderPlaced
    ) {
      for (const recipient of notificationSettings
        .email
        .adminRecipients) {
        deliveries.push(
          createEmailDelivery({
            eventType:
              "admin-order-placed",

            audience: "admin",
            recipient,

            subjectTemplate:
              notificationSettings.email
                .adminOrderPlacedSubject,

            messageTemplate:
              notificationSettings.email
                .adminOrderPlacedMessage,

            values,
            order,

            replyTo:
              notificationSettings.email
                .replyTo,
          })
        );
      }
    }
  }

  if (
    notificationSettings.sms.enabled
  ) {
    if (
      notificationSettings.sms
        .customerOrderPlaced &&
      customerPhone
    ) {
      deliveries.push(
        createSmsDelivery({
          eventType:
            "order-placed",

          audience:
            "customer",

          recipient:
            customerPhone,

          messageTemplate:
            notificationSettings.sms
              .orderPlacedMessage,

          values,
        })
      );
    }

    if (
      notificationSettings.sms
        .adminOrderPlaced
    ) {
      for (const recipient of notificationSettings
        .sms.adminRecipients) {
        deliveries.push(
          createSmsDelivery({
            eventType:
              "admin-order-placed",

            audience: "admin",
            recipient,

            messageTemplate:
              notificationSettings.sms
                .adminOrderPlacedMessage,

            values,
          })
        );
      }
    }
  }

  if (
    notificationSettings.whatsapp
      .enabled
  ) {
    if (
      notificationSettings.whatsapp
        .customerOrderPlaced &&
      customerPhone
    ) {
      deliveries.push(
        createWhatsAppDelivery({
          eventType:
            "order-placed",

          audience:
            "customer",

          recipient:
            customerPhone,

          templateName:
            notificationSettings
              .whatsapp.templates
              .orderPlaced,

          languageCode:
            notificationSettings
              .whatsapp.languageCode,

          values,
        })
      );
    }

    if (
      notificationSettings.whatsapp
        .adminOrderPlaced
    ) {
      for (const recipient of notificationSettings
        .whatsapp
        .adminRecipients) {
        deliveries.push(
          createWhatsAppDelivery({
            eventType:
              "admin-order-placed",

            audience: "admin",
            recipient,

            templateName:
              notificationSettings
                .whatsapp.templates
                .adminOrderPlaced,

            languageCode:
              notificationSettings
                .whatsapp
                .languageCode,

            values,
          })
        );
      }
    }
  }

  const results =
    await Promise.all(deliveries);

  return summarizeResults(results);
}

export async function dispatchOrderStatusNotifications({
  order,
  previousStatus = "",
  nextStatus = "",
  baseUrl = "",
}) {
  if (!order) {
    return summarizeResults([]);
  }

  const normalizedPreviousStatus =
    normalizeStatus(
      previousStatus
    );

  const normalizedNextStatus =
    normalizeStatus(
      nextStatus ||
        order.status
    );

  if (
    !normalizedNextStatus ||
    normalizedPreviousStatus ===
      normalizedNextStatus
  ) {
    return summarizeResults([]);
  }

  const {
    notificationSettings,
    values,
  } =
    await loadNotificationContext({
      order,
      status:
        normalizedNextStatus,
      baseUrl,
    });

  if (
    !notificationSettings
      .statusEvents[
      normalizedNextStatus
    ]
  ) {
    return summarizeResults([]);
  }

  const deliveries = [];

  const customerEmail =
    getCustomerEmail(order);

  const customerPhone =
    getCustomerPhone(order);

  if (
    notificationSettings.email
      .enabled &&
    notificationSettings.email
      .customerStatusUpdates &&
    customerEmail
  ) {
    deliveries.push(
      createEmailDelivery({
        eventType:
          "order-status-updated",

        eventStatus:
          normalizedNextStatus,

        audience:
          "customer",

        recipient:
          customerEmail,

        subjectTemplate:
          notificationSettings.email
            .statusUpdateSubject,

        messageTemplate:
          notificationSettings.email
            .statusUpdateMessage,

        values,
        order,

        replyTo:
          notificationSettings.email
            .replyTo,
      })
    );
  }

  if (
    notificationSettings.sms
      .enabled &&
    notificationSettings.sms
      .customerStatusUpdates &&
    customerPhone
  ) {
    deliveries.push(
      createSmsDelivery({
        eventType:
          "order-status-updated",

        eventStatus:
          normalizedNextStatus,

        audience:
          "customer",

        recipient:
          customerPhone,

        messageTemplate:
          notificationSettings.sms
            .statusUpdateMessage,

        values,
      })
    );
  }

  if (
    notificationSettings.whatsapp
      .enabled &&
    notificationSettings.whatsapp
      .customerStatusUpdates &&
    customerPhone
  ) {
    deliveries.push(
      createWhatsAppDelivery({
        eventType:
          "order-status-updated",

        eventStatus:
          normalizedNextStatus,

        audience:
          "customer",

        recipient:
          customerPhone,

        templateName:
          notificationSettings
            .whatsapp.templates
            .statusUpdate,

        languageCode:
          notificationSettings
            .whatsapp.languageCode,

        values,
      })
    );
  }

  const results =
    await Promise.all(deliveries);

  return summarizeResults(results);
}