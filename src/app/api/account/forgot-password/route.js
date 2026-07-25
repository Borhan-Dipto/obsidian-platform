import crypto from "crypto";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getNotificationSettings } from "@/lib/notificationSettings";
import { getSettings } from "@/lib/settings";
import {
  getTransactionalEmailProviderStatus,
  sendTransactionalEmail,
} from "@/lib/transactionalEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 254;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

const RESET_TOKEN_EXPIRY_MINUTES = 30;
const REQUEST_COOLDOWN_SECONDS = 60;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 20;

const MINIMUM_SECRET_LENGTH = 32;

let indexSetupPromise = null;

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
    MAX_EMAIL_LENGTH
  ).toLowerCase();
}

function isValidEmail(email) {
  return Boolean(
    email &&
      email.length <=
        MAX_EMAIL_LENGTH &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
  );
}

function createResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  return NextResponse.json(data, {
    status,

    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      ...extraHeaders,
    },
  });
}

function createErrorResponse(
  message,
  status,
  field = null
) {
  return createResponse(
    {
      success: false,
      message,
      field,
    },
    status
  );
}

function createGenericSuccessResponse(
  resetUrl = null
) {
  const response = {
    success: true,

    message:
      "If an OBSIDIAN account exists for this email, password reset instructions have been sent.",
  };

  if (
    process.env.NODE_ENV !==
      "production" &&
    resetUrl
  ) {
    response.resetUrl =
      resetUrl;
  }

  return createResponse(
    response
  );
}

function getCustomerAuthSecret() {
  const secret =
    normalizeText(
      process.env
        .CUSTOMER_AUTH_SECRET,
      1000
    );

  if (
    secret.length <
    MINIMUM_SECRET_LENGTH
  ) {
    throw new Error(
      `CUSTOMER_AUTH_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters.`
    );
  }

  return secret;
}

function createRawToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashRateLimitIdentifier(
  scope,
  value
) {
  return crypto
    .createHmac(
      "sha256",
      getCustomerAuthSecret()
    )
    .update(
      `${scope}:${normalizeText(
        value,
        500
      )}`
    )
    .digest("hex");
}

function getClientIp(request) {
  const candidates = [
    request.headers.get(
      "x-vercel-forwarded-for"
    ),

    request.headers.get(
      "x-forwarded-for"
    ),

    request.headers.get(
      "x-real-ip"
    ),
  ];

  for (
    const candidate
    of candidates
  ) {
    const firstAddress =
      normalizeText(
        candidate,
        500
      )
        .split(",")[0]
        .trim()
        .slice(0, 128);

    if (firstAddress) {
      return firstAddress;
    }
  }

  return "unknown";
}

function isSameOriginRequest(
  request
) {
  const originHeader =
    normalizeText(
      request.headers.get(
        "origin"
      ),
      2000
    );

  if (!originHeader) {
    return true;
  }

  try {
    return (
      new URL(
        originHeader
      ).origin ===
      new URL(
        request.url
      ).origin
    );
  } catch {
    return false;
  }
}

async function readRequestBody(
  request
) {
  const contentLength =
    Number(
      request.headers.get(
        "content-length"
      ) || 0
    );

  if (
    Number.isFinite(
      contentLength
    ) &&
    contentLength >
      MAX_REQUEST_BODY_BYTES
  ) {
    return {
      success: false,
      status: 413,

      message:
        "The password reset request is too large.",
    };
  }

  let rawBody;

  try {
    rawBody =
      await request.text();
  } catch {
    return {
      success: false,
      status: 400,

      message:
        "Invalid request data.",
    };
  }

  if (
    Buffer.byteLength(
      rawBody,
      "utf8"
    ) >
    MAX_REQUEST_BODY_BYTES
  ) {
    return {
      success: false,
      status: 413,

      message:
        "The password reset request is too large.",
    };
  }

  try {
    return {
      success: true,

      data:
        JSON.parse(
          rawBody
        ),
    };
  } catch {
    return {
      success: false,
      status: 400,

      message:
        "Invalid request data.",
    };
  }
}

function normalizeOrigin(
  value,
  allowHttp = false
) {
  const normalizedValue =
    normalizeText(
      value,
      2000
    );

  if (!normalizedValue) {
    return "";
  }

  const candidate =
    /^[a-z][a-z\d+.-]*:\/\//i.test(
      normalizedValue
    )
      ? normalizedValue
      : `https://${normalizedValue}`;

  try {
    const parsedUrl =
      new URL(candidate);

    if (
      parsedUrl.protocol ===
      "https:"
    ) {
      return parsedUrl.origin;
    }

    if (
      allowHttp &&
      parsedUrl.protocol ===
        "http:"
    ) {
      return parsedUrl.origin;
    }
  } catch {
    return "";
  }

  return "";
}

function resolveBaseUrl(
  request
) {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  const candidates = [
    process.env
      .NEXT_PUBLIC_SITE_URL,

    process.env.SITE_URL,

    process.env.APP_URL,

    process.env
      .BETTER_AUTH_URL,

    process.env
      .VERCEL_PROJECT_PRODUCTION_URL,
  ];

  for (
    const candidate
    of candidates
  ) {
    const origin =
      normalizeOrigin(
        candidate,
        !isProduction
      );

    if (origin) {
      return origin;
    }
  }

  if (!isProduction) {
    const requestOrigin =
      normalizeOrigin(
        new URL(
          request.url
        ).origin,
        true
      );

    if (requestOrigin) {
      return requestOrigin;
    }
  }

  throw new Error(
    "A valid production website URL is required for password reset links."
  );
}

function createResetUrl(
  baseUrl,
  rawToken
) {
  return (
    `${baseUrl}/account/reset-password?token=` +
    encodeURIComponent(
      rawToken
    )
  );
}

async function prepareIndexes(
  passwordResetCollection,
  rateLimitCollection
) {
  if (!indexSetupPromise) {
    indexSetupPromise =
      Promise.all([
        passwordResetCollection.createIndex(
          {
            tokenHash: 1,
          },
          {
            unique: true,

            name:
              "unique_password_reset_token_hash",
          }
        ),

        passwordResetCollection.createIndex(
          {
            expiresAt: 1,
          },
          {
            expireAfterSeconds:
              0,

            name:
              "expire_password_reset_tokens",
          }
        ),

        passwordResetCollection.createIndex(
          {
            customerId: 1,
            createdAt: -1,
          },
          {
            name:
              "customer_password_reset_history",
          }
        ),

        passwordResetCollection.createIndex(
          {
            email: 1,
            createdAt: -1,
          },
          {
            name:
              "email_password_reset_history",
          }
        ),

        rateLimitCollection.createIndex(
          {
            expiresAt: 1,
          },
          {
            expireAfterSeconds:
              0,

            name:
              "customer_password_reset_rate_limit_ttl",
          }
        ),
      ]).catch((error) => {
        indexSetupPromise =
          null;

        console.error(
          "Password reset index warning:",
          error
        );

        return null;
      });
  }

  await indexSetupPromise;
}

async function consumeRateLimit(
  collection,
  {
    scope,
    identifier,
    limit,
    nowMs,
  }
) {
  const windowStartedAtMs =
    Math.floor(
      nowMs /
        RATE_LIMIT_WINDOW_MS
    ) *
    RATE_LIMIT_WINDOW_MS;

  const windowEndsAtMs =
    windowStartedAtMs +
    RATE_LIMIT_WINDOW_MS;

  const identifierHash =
    hashRateLimitIdentifier(
      scope,
      identifier
    );

  const bucketId =
    `customer-password-reset:${scope}:` +
    `${identifierHash}:` +
    `${windowStartedAtMs}`;

  const now =
    new Date(nowMs);

  const document =
    await collection.findOneAndUpdate(
      {
        _id: bucketId,
      },
      {
        $inc: {
          attempts: 1,
        },

        $set: {
          updatedAt: now,
        },

        $setOnInsert: {
          scope,

          windowStartedAt:
            new Date(
              windowStartedAtMs
            ),

          windowEndsAt:
            new Date(
              windowEndsAtMs
            ),

          expiresAt:
            new Date(
              windowEndsAtMs +
                RATE_LIMIT_WINDOW_MS
            ),

          createdAt: now,
        },
      },
      {
        upsert: true,

        returnDocument:
          "after",

        includeResultMetadata:
          false,
      }
    );

  const attempts =
    Number(
      document?.attempts ||
        1
    );

  return {
    allowed:
      attempts <= limit,

    retryAfterSeconds:
      Math.max(
        1,
        Math.ceil(
          (windowEndsAtMs -
            nowMs) /
            1000
        )
      ),
  };
}

async function enforceRateLimit(
  collection,
  email,
  request
) {
  const nowMs =
    Date.now();

  const clientIp =
    getClientIp(request);

  const [
    emailLimit,
    ipLimit,
  ] = await Promise.all([
    consumeRateLimit(
      collection,
      {
        scope: "email",
        identifier: email,

        limit:
          EMAIL_ATTEMPT_LIMIT,

        nowMs,
      }
    ),

    consumeRateLimit(
      collection,
      {
        scope: "ip",

        identifier:
          clientIp,

        limit:
          IP_ATTEMPT_LIMIT,

        nowMs,
      }
    ),
  ]);

  const blocked = [
    emailLimit,
    ipLimit,
  ].filter(
    (result) =>
      !result.allowed
  );

  return {
    allowed:
      blocked.length === 0,

    retryAfterSeconds:
      blocked.length > 0
        ? Math.max(
            ...blocked.map(
              (result) =>
                result
                  .retryAfterSeconds
            )
          )
        : 0,

    clientIp,
  };
}

function getAccountStatus(
  customer
) {
  return normalizeText(
    customer?.accountStatus ||
      customer?.status ||
      "active",
    50
  ).toLowerCase();
}

function getCustomerName(
  customer
) {
  return (
    normalizeText(
      customer?.fullName,
      200
    ) ||
    normalizeText(
      customer?.name,
      200
    ) ||
    [
      customer?.firstName,
      customer?.lastName,
    ]
      .map((value) =>
        normalizeText(
          value,
          100
        )
      )
      .filter(Boolean)
      .join(" ") ||
    "there"
  );
}

function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function createResetEmailHtml({
  storeName,
  customerName,
  resetUrl,
}) {
  const safeStoreName =
    escapeHtml(storeName);

  const safeCustomerName =
    escapeHtml(
      customerName
    );

  const safeResetUrl =
    escapeHtml(resetUrl);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f1e8;color:#111111;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1e8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #ded8ca;">
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 24px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">${safeStoreName}</p>
                <h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hello ${safeCustomerName},</p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.7;">We received a request to reset your ${safeStoreName} account password. This secure link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
                <p style="margin:0 0 28px;">
                  <a href="${safeResetUrl}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:15px 24px;font-size:15px;font-weight:700;">Reset password</a>
                </p>
                <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 28px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${safeResetUrl}" style="color:#111111;">${safeResetUrl}</a>
                </p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#5c5c5c;">If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createResetEmailText({
  storeName,
  customerName,
  resetUrl,
}) {
  return [
    `${storeName} password reset`,
    "",
    `Hello ${customerName},`,
    "",
    `We received a request to reset your ${storeName} account password.`,
    `This secure link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.`,
    "",
    resetUrl,
    "",
    "If you did not request this change, you can safely ignore this email.",
  ].join("\n");
}

function getPasswordResetReplyTo(
  notificationSettings,
  storeSettings
) {
  return (
    normalizeEmail(
      notificationSettings
        ?.email?.replyTo
    ) ||
    normalizeEmail(
      storeSettings
        ?.contact?.email
    )
  );
}

function isUnknownDeliveryOutcome(
  error
) {
  return [
    "TRANSACTIONAL_EMAIL_PROVIDER_TIMEOUT",
    "TRANSACTIONAL_EMAIL_PROVIDER_REQUEST_FAILED",
  ].includes(
    normalizeText(
      error?.code,
      100
    )
  );
}

export async function POST(
  request
) {
  try {
    if (
      !isSameOriginRequest(
        request
      )
    ) {
      return createErrorResponse(
        "The password reset request could not be verified.",
        403
      );
    }

    const parsedRequest =
      await readRequestBody(
        request
      );

    if (
      !parsedRequest.success
    ) {
      return createErrorResponse(
        parsedRequest.message,
        parsedRequest.status
      );
    }

    const email =
      normalizeEmail(
        parsedRequest
          .data?.email
      );

    if (!email) {
      return createErrorResponse(
        "Please enter your email address.",
        400,
        "email"
      );
    }

    if (
      !isValidEmail(email)
    ) {
      return createErrorResponse(
        "Please enter a valid email address.",
        400,
        "email"
      );
    }

    const client =
      await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    const customersCollection =
      db.collection(
        "customers"
      );

    const passwordResetCollection =
      db.collection(
        "customerPasswordResets"
      );

    const rateLimitCollection =
      db.collection(
        "customerPasswordResetRateLimits"
      );

    await prepareIndexes(
      passwordResetCollection,
      rateLimitCollection
    );

    const rateLimit =
      await enforceRateLimit(
        rateLimitCollection,
        email,
        request
      );

    if (
      !rateLimit.allowed
    ) {
      return createResponse(
        {
          success: false,

          message:
            "Too many password reset requests. Please wait before trying again.",

          field: "email",
        },
        429,
        {
          "Retry-After":
            String(
              rateLimit
                .retryAfterSeconds
            ),
        }
      );
    }

    const [
      notificationSettings,
      storeSettings,
    ] = await Promise.all([
      getNotificationSettings(),
      getSettings(),
    ]);

    const providerStatus =
      getTransactionalEmailProviderStatus();

    const replyTo =
      getPasswordResetReplyTo(
        notificationSettings,
        storeSettings
      );

    if (
      process.env.NODE_ENV ===
        "production" &&
      !providerStatus.configured
    ) {
      console.error(
        "Customer password reset email provider is not configured."
      );

      return createErrorResponse(
        "Password reset service is temporarily unavailable. Please try again later.",
        503
      );
    }

    const customer =
      await customersCollection.findOne(
        {
          $or: [
            {
              email,
            },

            {
              emailNormalized:
                email,
            },
          ],
        },
        {
          projection: {
            _id: 1,
            customerId: 1,
            email: 1,
            fullName: 1,
            name: 1,
            firstName: 1,
            lastName: 1,
            status: 1,
            accountStatus: 1,
          },
        }
      );

    if (
      !customer ||
      getAccountStatus(
        customer
      ) !== "active"
    ) {
      return createGenericSuccessResponse();
    }

    const now =
      new Date();

    const cooldownStart =
      new Date(
        now.getTime() -
          REQUEST_COOLDOWN_SECONDS *
            1000
      );

    const recentResetRequest =
      await passwordResetCollection.findOne(
        {
          customerId:
            customer._id,

          createdAt: {
            $gte:
              cooldownStart,
          },

          usedAt: null,
          revokedAt: null,
        },
        {
          projection: {
            _id: 1,
          },

          sort: {
            createdAt: -1,
          },
        }
      );

    if (
      recentResetRequest
    ) {
      return createGenericSuccessResponse();
    }

    const baseUrl =
      resolveBaseUrl(
        request
      );

    const rawToken =
      createRawToken();

    const tokenHash =
      hashToken(rawToken);

    const resetUrl =
      createResetUrl(
        baseUrl,
        rawToken
      );

    const expiresAt =
      new Date(
        now.getTime() +
          RESET_TOKEN_EXPIRY_MINUTES *
            60 *
            1000
      );

    const recipientEmail =
      normalizeEmail(
        customer.email ||
          email
      );

    const storeName =
      normalizeText(
        storeSettings
          ?.store?.name,
        120
      ) || "OBSIDIAN";

    const customerName =
      getCustomerName(
        customer
      );

    const resetDocument = {
      customerId:
        customer._id,

      publicCustomerId:
        customer.customerId ||
        null,

      email:
        recipientEmail,

      tokenHash,
      expiresAt,

      usedAt: null,
      revokedAt: null,
      revokedReason: null,

      requestIpHash:
        hashRateLimitIdentifier(
          "ip",
          rateLimit.clientIp
        ),

      requestUserAgent:
        normalizeText(
          request.headers.get(
            "user-agent"
          ),
          1000
        ),

      deliveryProvider:
        providerStatus.configured
          ? providerStatus.provider
          : "development",

      deliveryStatus:
        "pending",

      createdAt: now,
      updatedAt: now,
    };

    const insertResult =
      await passwordResetCollection.insertOne(
        resetDocument
      );

    let deliveryResult =
      null;

    try {
      if (
        providerStatus.configured
      ) {
        deliveryResult =
          await sendTransactionalEmail(
            {
              to:
                recipientEmail,

              subject:
                `Reset your ${storeName} password`,

              html:
                createResetEmailHtml(
                  {
                    storeName,
                    customerName,
                    resetUrl,
                  }
                ),

              text:
                createResetEmailText(
                  {
                    storeName,
                    customerName,
                    resetUrl,
                  }
                ),

              replyTo,

              idempotencyKey:
                `password-reset:${tokenHash}`,
            }
          );
      }
    } catch (deliveryError) {
      const failedAt =
        new Date();

      const deliveryOutcomeUnknown =
        isUnknownDeliveryOutcome(
          deliveryError
        );

      const deliveryFailureUpdate = {
        deliveryStatus:
          deliveryOutcomeUnknown
            ? "unknown"
            : "failed",

        deliveryError:
          normalizeText(
            deliveryError
              ?.message,
            1000
          ),

        deliveryAttemptedAt:
          failedAt,

        updatedAt:
          failedAt,
      };

      if (
        !deliveryOutcomeUnknown
      ) {
        deliveryFailureUpdate.revokedAt =
          failedAt;

        deliveryFailureUpdate.revokedReason =
          "Password reset email delivery failed.";
      }

      try {
        await passwordResetCollection.updateOne(
          {
            _id:
              insertResult
                .insertedId,
          },
          {
            $set:
              deliveryFailureUpdate,
          }
        );
      } catch (
        bookkeepingError
      ) {
        console.error(
          "Customer password reset failure bookkeeping error:",
          bookkeepingError
        );
      }

      console.error(
        "Customer password reset email error:",
        {
          customerId:
            customer.customerId ||
            String(
              customer._id
            ),

          provider:
            providerStatus.provider,

          code:
            normalizeText(
              deliveryError?.code,
              100
            ) || null,

          status:
            deliveryError?.status ||
            null,

          message:
            normalizeText(
              deliveryError
                ?.message,
              1000
            ),
        }
      );

      if (
        process.env.NODE_ENV ===
        "production"
      ) {
        return createGenericSuccessResponse();
      }

      return createErrorResponse(
        "We could not send the password reset email right now. Please try again.",
        502
      );
    }

    const deliveredAt =
      new Date();

    try {
      await passwordResetCollection.updateOne(
        {
          _id:
            insertResult
              .insertedId,
        },
        {
          $set: {
            deliveryStatus:
              providerStatus.configured
                ? "sent"
                : "development",

            deliveryProviderMessageId:
              deliveryResult
                ?.providerMessageId ||
              null,

            deliveredAt:
              providerStatus.configured
                ? deliveredAt
                : null,

            updatedAt:
              deliveredAt,
          },
        }
      );

      await passwordResetCollection.updateMany(
        {
          customerId:
            customer._id,

          _id: {
            $ne:
              insertResult
                .insertedId,
          },

          usedAt: null,
          revokedAt: null,
        },
        {
          $set: {
            revokedAt:
              deliveredAt,

            revokedReason:
              "Superseded by a newer password reset request.",

            updatedAt:
              deliveredAt,
          },
        }
      );
    } catch (
      bookkeepingError
    ) {
      console.error(
        "Customer password reset delivery bookkeeping error:",
        bookkeepingError
      );
    }

    console.info(
      "Customer password reset prepared:",
      {
        customerId:
          customer.customerId ||
          String(
            customer._id
          ),

        email:
          recipientEmail,

        expiresAt,

        deliveryStatus:
          providerStatus.configured
            ? "sent"
            : "development",
      }
    );

    return createGenericSuccessResponse(
      resetUrl
    );
  } catch (error) {
    console.error(
      "Customer Forgot Password Error:",
      error
    );

    return createErrorResponse(
      "We could not process your password reset request right now. Please try again.",
      500
    );
  }
}