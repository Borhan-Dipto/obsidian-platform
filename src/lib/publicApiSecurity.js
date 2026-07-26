import { createHmac } from "node:crypto";
import clientPromise from "./mongodb";

const DATABASE_FALLBACK_NAME = "obsidian";
const RATE_LIMIT_COLLECTION_NAME = "publicApiRateLimits";
const SECURITY_EVENT_COLLECTION_NAME =
  "publicApiSecurityEvents";

const SECURITY_EVENT_RETENTION_MS =
  90 * 24 * 60 * 60 * 1000;

const RATE_LIMIT_RETENTION_BUFFER_MS =
  24 * 60 * 60 * 1000;

const MINIMUM_SECURITY_SECRET_LENGTH = 32;

const DEFAULT_HONEYPOT_FIELDS = [
  "_gotcha",
  "website",
  "companyWebsite",
];

let indexSetupPromise = null;

function normalizeText(
  value,
  maximumLength = 1000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function getSecuritySecret() {
  const secret = normalizeText(
    process.env.PUBLIC_API_SECURITY_SECRET ||
      process.env.CUSTOMER_AUTH_SECRET ||
      process.env.BETTER_AUTH_SECRET,
    2000
  );

  if (
    secret.length <
    MINIMUM_SECURITY_SECRET_LENGTH
  ) {
    throw new Error(
      "PUBLIC_API_SECURITY_SECRET, CUSTOMER_AUTH_SECRET, or BETTER_AUTH_SECRET must contain at least 32 characters."
    );
  }

  return secret;
}

function hashIdentifier(
  scope,
  value
) {
  return createHmac(
    "sha256",
    getSecuritySecret()
  )
    .update(
      `${normalizeText(
        scope,
        120
      )}:${normalizeText(
        value,
        2000
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

  for (const candidate of candidates) {
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

function normalizeOrigin(
  value
) {
  const normalizedValue =
    normalizeText(
      value,
      2000
    );

  if (!normalizedValue) {
    return "";
  }

  try {
    const parsedUrl =
      new URL(
        normalizedValue
      );

    if (
      ![
        "http:",
        "https:",
      ].includes(
        parsedUrl.protocol
      )
    ) {
      return "";
    }

    return parsedUrl.origin
      .toLowerCase();
  } catch {
    return "";
  }
}

function getTrustedRequestOrigins(
  request
) {
  const trustedOrigins =
    new Set();

  const candidates = [
    request.url,
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
  ];

  for (
    const candidate
    of candidates
  ) {
    const origin =
      normalizeOrigin(
        candidate
      );

    if (origin) {
      trustedOrigins.add(
        origin
      );
    }
  }

  return trustedOrigins;
}

function isSameOriginRequest(
  request
) {
  const fetchSite = normalizeText(
    request.headers.get(
      "sec-fetch-site"
    ),
    40
  ).toLowerCase();

  if (
    fetchSite &&
    ![
      "same-origin",
      "same-site",
      "none",
    ].includes(fetchSite)
  ) {
    return false;
  }

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

  const requestOrigin =
    normalizeOrigin(
      originHeader
    );

  if (!requestOrigin) {
    return false;
  }

  return getTrustedRequestOrigins(
    request
  ).has(requestOrigin);
}

function isJsonRequest(request) {
  const contentType =
    normalizeText(
      request.headers.get(
        "content-type"
      ),
      240
    ).toLowerCase();

  return (
    contentType ===
      "application/json" ||
    contentType.startsWith(
      "application/json;"
    )
  );
}

function getRequestPath(request) {
  try {
    return new URL(
      request.url
    ).pathname;
  } catch {
    return "";
  }
}

export function createPublicApiResponse(
  body,
  status = 200,
  extraHeaders = {}
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "private, no-store, no-cache, must-revalidate, max-age=0",

      Pragma: "no-cache",
      Expires: "0",

      "X-Content-Type-Options":
        "nosniff",

      ...extraHeaders,
    },
  });
}

async function getSecurityCollections() {
  const client =
    await clientPromise;

  if (
    !client ||
    typeof client.db !==
      "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  const database = client.db(
    process.env.MONGODB_DB ||
      DATABASE_FALLBACK_NAME
  );

  const rateLimitCollection =
    database.collection(
      RATE_LIMIT_COLLECTION_NAME
    );

  const eventCollection =
    database.collection(
      SECURITY_EVENT_COLLECTION_NAME
    );

  if (!indexSetupPromise) {
    indexSetupPromise =
      Promise.all([
        rateLimitCollection.createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "public_api_rate_limit_ttl",

            expireAfterSeconds: 0,
          }
        ),

        eventCollection.createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "public_api_security_event_ttl",

            expireAfterSeconds: 0,
          }
        ),

        eventCollection.createIndex(
          {
            action: 1,
            eventType: 1,
            createdAt: -1,
          },
          {
            name:
              "public_api_security_event_lookup",
          }
        ),
      ]).catch((error) => {
        indexSetupPromise = null;
        throw error;
      });
  }

  await indexSetupPromise;

  return {
    rateLimitCollection,
    eventCollection,
  };
}

async function recordSecurityEvent({
  request,
  action,
  eventType,
  scope = "",
  identifier = "",
  details = {},
}) {
  try {
    const {
      eventCollection,
    } =
      await getSecurityCollections();

    const now = new Date();

    await eventCollection.insertOne({
      action:
        normalizeText(
          action,
          120
        ),

      eventType:
        normalizeText(
          eventType,
          120
        ),

      method:
        normalizeText(
          request.method,
          20
        ).toUpperCase(),

      path:
        normalizeText(
          getRequestPath(request),
          500
        ),

      scope:
        normalizeText(
          scope,
          120
        ) || null,

      clientIpHash:
        hashIdentifier(
          "client-ip",
          getClientIp(request)
        ),

      identifierHash:
        identifier
          ? hashIdentifier(
              scope ||
                "identifier",
              identifier
            )
          : null,

      userAgentHash:
        hashIdentifier(
          "user-agent",

          request.headers.get(
            "user-agent"
          ) || "unknown"
        ),

      details:
        isPlainObject(details)
          ? details
          : {},

      createdAt: now,

      expiresAt:
        new Date(
          now.getTime() +
            SECURITY_EVENT_RETENTION_MS
        ),
    });
  } catch (error) {
    console.error(
      "Public API security event logging error:",
      error
    );
  }
}

async function createSecurityFailure({
  request,
  action,
  eventType,
  status,
  message,
  code,
  scope = "",
  identifier = "",
  headers = {},
  details = {},
}) {
  await recordSecurityEvent({
    request,
    action,
    eventType,
    scope,
    identifier,
    details,
  });

  return {
    success: false,

    response:
      createPublicApiResponse(
        {
          success: false,
          code,
          message,
        },
        status,
        headers
      ),
  };
}

function normalizePolicyOptions(
  action,
  maxBodyBytes
) {
  const normalizedAction =
    normalizeText(
      action,
      120
    );

  const normalizedMaximum =
    Number(maxBodyBytes);

  if (
    !normalizedAction ||
    !Number.isInteger(
      normalizedMaximum
    ) ||
    normalizedMaximum < 2
  ) {
    throw new TypeError(
      "Public API security policy is invalid."
    );
  }

  return {
    action:
      normalizedAction,

    maxBodyBytes:
      normalizedMaximum,
  };
}

export async function enforcePublicRequestEnvelope(
  request,
  {
    action,
    maxBodyBytes,
    sameOrigin = true,
    requireJson = true,
    rateLimits = [],
  }
) {
  const policy =
    normalizePolicyOptions(
      action,
      maxBodyBytes
    );

  if (
    sameOrigin &&
    !isSameOriginRequest(
      request
    )
  ) {
    return createSecurityFailure({
      request,
      action:
        policy.action,

      eventType:
        "cross_origin_rejected",

      status: 403,

      code:
        "CROSS_ORIGIN_REQUEST_REJECTED",

      message:
        "This request could not be verified.",
    });
  }

  if (
    requireJson &&
    !isJsonRequest(request)
  ) {
    return createSecurityFailure({
      request,
      action:
        policy.action,

      eventType:
        "invalid_content_type",

      status: 415,

      code:
        "INVALID_CONTENT_TYPE",

      message:
        "Request content type must be application/json.",
    });
  }

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
      policy.maxBodyBytes
  ) {
    return createSecurityFailure({
      request,
      action:
        policy.action,

      eventType:
        "request_body_too_large",

      status: 413,

      code:
        "REQUEST_BODY_TOO_LARGE",

      message:
        "Request body is too large.",

      details: {
        declaredBytes:
          contentLength,

        maximumBytes:
          policy.maxBodyBytes,
      },
    });
  }

  if (
    Array.isArray(rateLimits) &&
    rateLimits.length > 0
  ) {
    try {
      const {
        rateLimitCollection,
      } =
        await getSecurityCollections();

      const clientIp =
        getClientIp(request);

      const normalizedRules =
        rateLimits
          .map(
            normalizeRateLimitRule
          )
          .filter(Boolean);

      const nowMs = Date.now();

      for (
        const rule
        of normalizedRules
      ) {
        const identifier =
          rule.scope === "ip"
            ? clientIp
            : resolveRateLimitIdentifier(
                rule,
                {},
                request
              );

        if (!identifier) {
          continue;
        }

        const result =
          await consumeRateLimit({
            collection:
              rateLimitCollection,

            action:
              policy.action,

            scope:
              rule.scope,

            identifier,

            limit:
              rule.limit,

            windowMs:
              rule.windowMs,

            nowMs,
          });

        if (!result.allowed) {
          return createSecurityFailure({
            request,

            action:
              policy.action,

            eventType:
              "rate_limit_exceeded",

            status: 429,

            code:
              "RATE_LIMITED",

            message:
              "Too many requests. Please try again later.",

            scope:
              result.scope,

            identifier:
              result.identifier,

            headers: {
              "Retry-After":
                String(
                  result.retryAfterSeconds
                ),

              "X-Obsidian-Challenge":
                "required",
            },

            details: {
              attempts:
                result.attempts,

              limit:
                result.limit,
            },
          });
        }
      }
    } catch (error) {
      console.error(
        "Public API envelope security policy error:",
        error
      );

      return {
        success: false,

        response:
          createPublicApiResponse(
            {
              success: false,

              code:
                "SECURITY_POLICY_UNAVAILABLE",

              message:
                "This request cannot be processed safely right now. Please try again later.",
            },
            503,
            {
              "Retry-After":
                "60",
            }
          ),
      };
    }
  }

  return {
    success: true,
    policy,
  };
}

function normalizeRateLimitRule(
  rule
) {
  const limit =
    Number(rule?.limit);

  const windowMs =
    Number(rule?.windowMs);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1000
  ) {
    return null;
  }

  return {
    scope:
      normalizeText(
        rule.scope,
        120
      ) || "request",

    limit,
    windowMs,

    identifier:
      rule.identifier,
  };
}

async function consumeRateLimit({
  collection,
  action,
  scope,
  identifier,
  limit,
  windowMs,
  nowMs,
}) {
  const windowStartedAtMs =
    Math.floor(
      nowMs /
        windowMs
    ) * windowMs;

  const windowEndsAtMs =
    windowStartedAtMs +
    windowMs;

  const identifierHash =
    hashIdentifier(
      `${action}:${scope}`,
      identifier
    );

  const bucketId = [
    "public-api",
    action,
    scope,
    identifierHash,
    windowStartedAtMs,
  ].join(":");

  const now =
    new Date(nowMs);

  const update = {
    $inc: {
      attempts: 1,
    },

    $set: {
      updatedAt: now,
    },

    $setOnInsert: {
      action,
      scope,
      identifierHash,
      limit,

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
            RATE_LIMIT_RETENTION_BUFFER_MS
        ),

      createdAt: now,
    },
  };

  let document;

  try {
    document =
      await collection.findOneAndUpdate(
        {
          _id: bucketId,
        },
        update,
        {
          upsert: true,

          returnDocument:
            "after",

          includeResultMetadata:
            false,
        }
      );
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    document =
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
        },
        {
          returnDocument:
            "after",

          includeResultMetadata:
            false,
        }
      );
  }

  const attempts =
    Number(
      document?.attempts ||
        1
    );

  return {
    allowed:
      attempts <= limit,

    attempts,
    limit,
    scope,
    identifier,

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

function resolveRateLimitIdentifier(
  rule,
  body,
  request
) {
  if (
    typeof rule.identifier ===
      "function"
  ) {
    return normalizeText(
      rule.identifier(
        body,
        request
      ),
      2000
    );
  }

  return normalizeText(
    rule.identifier,
    2000
  );
}

function containsHoneypotValue(
  body,
  fields
) {
  return fields.some(
    (field) =>
      Boolean(
        normalizeText(
          body?.[field],
          500
        )
      )
  );
}

export async function enforcePublicJsonRequest(
  request,
  {
    action,
    maxBodyBytes,
    sameOrigin = true,
    rateLimits = [],
    honeypotFields =
      DEFAULT_HONEYPOT_FIELDS,
  }
) {
  const envelope =
    await enforcePublicRequestEnvelope(
      request,
      {
        action,
        maxBodyBytes,
        sameOrigin,
      }
    );

  if (!envelope.success) {
    return envelope;
  }

  let rawBody;

  try {
    rawBody =
      await request.text();
  } catch {
    return createSecurityFailure({
      request,

      action:
        envelope.policy.action,

      eventType:
        "request_body_read_failed",

      status: 400,

      code:
        "INVALID_REQUEST_BODY",

      message:
        "Invalid request body.",
    });
  }

  const actualBodyBytes =
    Buffer.byteLength(
      rawBody,
      "utf8"
    );

  if (
    actualBodyBytes >
    envelope.policy
      .maxBodyBytes
  ) {
    return createSecurityFailure({
      request,

      action:
        envelope.policy.action,

      eventType:
        "request_body_too_large",

      status: 413,

      code:
        "REQUEST_BODY_TOO_LARGE",

      message:
        "Request body is too large.",

      details: {
        actualBytes:
          actualBodyBytes,

        maximumBytes:
          envelope.policy
            .maxBodyBytes,
      },
    });
  }

  let body;

  try {
    body =
      JSON.parse(rawBody);
  } catch {
    return createSecurityFailure({
      request,

      action:
        envelope.policy.action,

      eventType:
        "malformed_json",

      status: 400,

      code:
        "INVALID_JSON",

      message:
        "Invalid request body.",
    });
  }

  if (!isPlainObject(body)) {
    return createSecurityFailure({
      request,

      action:
        envelope.policy.action,

      eventType:
        "invalid_json_shape",

      status: 400,

      code:
        "INVALID_REQUEST_BODY",

      message:
        "Invalid request body.",
    });
  }

  const normalizedHoneypotFields =
    Array.isArray(
      honeypotFields
    )
      ? honeypotFields
          .map((field) =>
            normalizeText(
              field,
              120
            )
          )
          .filter(Boolean)
      : DEFAULT_HONEYPOT_FIELDS;

  if (
    containsHoneypotValue(
      body,
      normalizedHoneypotFields
    )
  ) {
    return createSecurityFailure({
      request,

      action:
        envelope.policy.action,

      eventType:
        "bot_honeypot_triggered",

      status: 400,

      code:
        "INVALID_REQUEST",

      message:
        "Invalid request.",
    });
  }

  try {
    const {
      rateLimitCollection,
    } =
      await getSecurityCollections();

    const clientIp =
      getClientIp(request);

    const normalizedRules =
      rateLimits
        .map(
          normalizeRateLimitRule
        )
        .filter(Boolean);

    const nowMs = Date.now();

    for (
      const rule
      of normalizedRules
    ) {
      const identifier =
        rule.scope === "ip"
          ? clientIp
          : resolveRateLimitIdentifier(
              rule,
              body,
              request
            );

      if (!identifier) {
        continue;
      }

      const result =
        await consumeRateLimit({
          collection:
            rateLimitCollection,

          action:
            envelope.policy.action,

          scope:
            rule.scope,

          identifier,

          limit:
            rule.limit,

          windowMs:
            rule.windowMs,

          nowMs,
        });

      if (!result.allowed) {
        return createSecurityFailure({
          request,

          action:
            envelope.policy.action,

          eventType:
            "rate_limit_exceeded",

          status: 429,

          code:
            "RATE_LIMITED",

          message:
            "Too many requests. Please try again later.",

          scope:
            result.scope,

          identifier:
            result.identifier,

          headers: {
            "Retry-After":
              String(
                result.retryAfterSeconds
              ),

            "X-Obsidian-Challenge":
              "required",
          },

          details: {
            attempts:
              result.attempts,

            limit:
              result.limit,
          },
        });
      }
    }
  } catch (error) {
    console.error(
      "Public API security policy error:",
      error
    );

    return {
      success: false,

      response:
        createPublicApiResponse(
          {
            success: false,

            code:
              "SECURITY_POLICY_UNAVAILABLE",

            message:
              "This request cannot be processed safely right now. Please try again later.",
          },
          503,
          {
            "Retry-After":
              "60",
          }
        ),
    };
  }

  return {
    success: true,
    body,
  };
}
