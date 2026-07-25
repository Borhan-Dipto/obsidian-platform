import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { setCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_ATTEMPT_LIMIT = 8;
const IP_ATTEMPT_LIMIT = 30;

const GENERIC_LOGIN_ERROR =
  "The email address or password is incorrect.";

const DUMMY_PASSWORD_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxdK6jTc4a9E70/s1WlQ6KxBvCq";

let rateLimitIndexPromise = null;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function createErrorResponse(
  message,
  status,
  field = null,
  extraHeaders = {}
) {
  return NextResponse.json(
    {
      success: false,
      message,
      field,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        ...extraHeaders,
      },
    }
  );
}

function serializeCustomer(customer) {
  return {
    id: String(customer._id),

    customerId:
      customer.customerId,

    fullName:
      customer.fullName ||
      customer.name ||
      [
        customer.firstName,
        customer.lastName,
      ]
        .filter(Boolean)
        .join(" "),

    firstName:
      customer.firstName || "",

    lastName:
      customer.lastName || "",

    email:
      customer.email,

    phone:
      customer.phone || "",

    status:
      customer.status ||
      customer.accountStatus ||
      "active",

    emailVerified: Boolean(
      customer.emailVerified
    ),

    loyaltyTier:
      customer.loyaltyTier ||
      "member",

    createdAt:
      customer.createdAt || null,

    lastLoginAt:
      customer.lastLoginAt ||
      null,
  };
}

function getAccountStatus(customer) {
  return normalizeText(
    customer?.status ||
      customer?.accountStatus ||
      "active"
  ).toLowerCase();
}

function isAccountBlocked(status) {
  return [
    "disabled",
    "suspended",
    "blocked",
    "deleted",
    "inactive",
  ].includes(status);
}

function getBlockedAccountMessage(
  status
) {
  if (status === "suspended") {
    return "This account is temporarily suspended. Please contact customer support.";
  }

  if (status === "blocked") {
    return "This account has been blocked. Please contact customer support.";
  }

  if (status === "deleted") {
    return "This account is no longer available.";
  }

  return "This account is currently unavailable. Please contact customer support.";
}

function getRateLimitSecret() {
  const secret =
    normalizeText(
      process.env
        .CUSTOMER_AUTH_SECRET
    );

  if (secret.length < 32) {
    throw new Error(
      "CUSTOMER_AUTH_SECRET must contain at least 32 characters."
    );
  }

  return secret;
}

function hashRateLimitIdentifier(
  scope,
  value
) {
  return crypto
    .createHmac(
      "sha256",
      getRateLimitSecret()
    )
    .update(
      `${scope}:${normalizeText(
        value
      )}`
    )
    .digest("hex");
}

function getClientIp(request) {
  const headerCandidates = [
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
    of headerCandidates
  ) {
    const firstAddress =
      normalizeText(candidate)
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
      )
    );

  if (!originHeader) {
    return true;
  }

  try {
    const requestOrigin =
      new URL(
        request.url
      ).origin;

    const suppliedOrigin =
      new URL(
        originHeader
      ).origin;

    return (
      requestOrigin ===
      suppliedOrigin
    );
  } catch {
    return false;
  }
}

async function ensureRateLimitIndex(
  collection
) {
  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise =
      collection
        .createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "customer_login_rate_limit_ttl",

            expireAfterSeconds: 0,
          }
        )
        .catch((error) => {
          console.error(
            "Customer login rate-limit index error:",
            error
          );

          return null;
        });
  }

  await rateLimitIndexPromise;
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
    `customer-login:${scope}:` +
    `${identifierHash}:` +
    `${windowStartedAtMs}`;

  const now = new Date(nowMs);

  const rateLimitDocument =
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
      rateLimitDocument
        ?.attempts || 1
    );

  const retryAfterSeconds =
    Math.max(
      1,
      Math.ceil(
        (windowEndsAtMs -
          nowMs) /
          1000
      )
    );

  return {
    allowed:
      attempts <= limit,

    attempts,
    limit,
    retryAfterSeconds,
    bucketId,
  };
}

async function enforceLoginRateLimit(
  collection,
  email,
  request
) {
  await ensureRateLimitIndex(
    collection
  );

  const nowMs = Date.now();

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
        identifier: clientIp,
        limit:
          IP_ATTEMPT_LIMIT,
        nowMs,
      }
    ),
  ]);

  const blockedLimits = [
    emailLimit,
    ipLimit,
  ].filter(
    (result) =>
      !result.allowed
  );

  return {
    allowed:
      blockedLimits.length ===
      0,

    retryAfterSeconds:
      blockedLimits.length > 0
        ? Math.max(
            ...blockedLimits.map(
              (result) =>
                result.retryAfterSeconds
            )
          )
        : 0,

    emailBucketId:
      emailLimit.bucketId,
  };
}

async function clearSuccessfulEmailLimit(
  collection,
  bucketId
) {
  if (!bucketId) {
    return;
  }

  try {
    await collection.deleteOne({
      _id: bucketId,
    });
  } catch (error) {
    console.error(
      "Customer login rate-limit cleanup error:",
      error
    );
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
        "The sign-in request is too large.",
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
        "The sign-in request is too large.",
    };
  }

  try {
    return {
      success: true,

      data:
        JSON.parse(rawBody),
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
        "The sign-in request could not be verified.",
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

    const requestBody =
      parsedRequest.data;

    const email =
      normalizeEmail(
        requestBody?.email
      );

    const password =
      requestBody?.password;

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

    if (
      typeof password !==
        "string" ||
      password.length === 0
    ) {
      return createErrorResponse(
        "Please enter your password.",
        400,
        "password"
      );
    }

    if (
      password.length >
      MAX_PASSWORD_LENGTH
    ) {
      return createErrorResponse(
        GENERIC_LOGIN_ERROR,
        401
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

    const rateLimitCollection =
      db.collection(
        "customer_login_rate_limits"
      );

    const rateLimit =
      await enforceLoginRateLimit(
        rateLimitCollection,
        email,
        request
      );

    if (
      !rateLimit.allowed
    ) {
      return createErrorResponse(
        "Too many sign-in attempts. Please wait before trying again.",
        429,
        null,
        {
          "Retry-After":
            String(
              rateLimit.retryAfterSeconds
            ),
        }
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
        }
      );

    const storedPasswordHash =
      customer?.passwordHash ||
      customer?.password;

    const usablePasswordHash =
      typeof storedPasswordHash ===
        "string" &&
      storedPasswordHash.trim()
        ? storedPasswordHash
        : DUMMY_PASSWORD_HASH;

    let passwordMatches = false;

    try {
      passwordMatches =
        await bcrypt.compare(
          password,
          usablePasswordHash
        );
    } catch (passwordError) {
      console.error(
        "Customer Password Compare Error:",
        passwordError
      );

      passwordMatches = false;
    }

    const hasPasswordAccount =
      Boolean(
        customer &&
          typeof storedPasswordHash ===
            "string" &&
          storedPasswordHash.trim()
      );

    if (
      !hasPasswordAccount ||
      !passwordMatches
    ) {
      if (customer?._id) {
        const failedAt =
          new Date();

        await customersCollection
          .updateOne(
            {
              _id:
                customer._id,
            },
            {
              $set: {
                lastFailedLoginAt:
                  failedAt,

                updatedAt:
                  failedAt,
              },

              $inc: {
                failedLoginCount:
                  1,
              },
            }
          )
          .catch(
            (updateError) => {
              console.error(
                "Customer failed-login audit error:",
                updateError
              );
            }
          );
      }

      return createErrorResponse(
        GENERIC_LOGIN_ERROR,
        401
      );
    }

    const accountStatus =
      getAccountStatus(
        customer
      );

    if (
      isAccountBlocked(
        accountStatus
      )
    ) {
      return createErrorResponse(
        getBlockedAccountMessage(
          accountStatus
        ),
        403
      );
    }

    const now = new Date();

    await customersCollection.updateOne(
      {
        _id: customer._id,
      },
      {
        $set: {
          lastLoginAt: now,
          lastActiveAt: now,
          updatedAt: now,
          failedLoginCount: 0,
        },

        $unset: {
          lastFailedLoginAt: "",
        },

        $inc: {
          loginCount: 1,
        },
      }
    );

    const authenticatedCustomer = {
      ...customer,

      lastLoginAt: now,
      lastActiveAt: now,
      failedLoginCount: 0,

      loginCount:
        Number(
          customer.loginCount ||
            0
        ) + 1,
    };

    await setCustomerSession(
      authenticatedCustomer
    );

    await clearSuccessfulEmailLimit(
      rateLimitCollection,
      rateLimit.emailBucketId
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Welcome back to OBSIDIAN.",

        customer:
          serializeCustomer(
            authenticatedCustomer
          ),

        redirectTo:
          "/account",
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Customer Login Error:",
      error
    );

    return createErrorResponse(
      "We could not sign you in right now. Please try again.",
      500
    );
  }
}