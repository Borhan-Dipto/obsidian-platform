import "server-only";

import {
  createHash,
  randomUUID,
} from "node:crypto";
import type {
  Collection,
  Document,
} from "mongodb";
import {
  getMongoDatabase,
} from "./mongodb";

const AUDIT_COLLECTION_NAME =
  "admin_security_audit_logs";

const DEFAULT_RETENTION_DAYS =
  365;

const MAX_RETENTION_DAYS =
  3650;

const MAX_METADATA_DEPTH =
  5;

const MAX_ARRAY_ITEMS =
  50;

const MAX_STRING_LENGTH =
  2000;

const SENSITIVE_KEY_PATTERN =
  /password|passphrase|secret|token|cookie|authorization|credential|api[-_]?key|private[-_]?key|totp|otp|recovery[-_]?code|backup[-_]?code/i;

export const ADMIN_AUDIT_EVENTS =
  Object.freeze({
    AUTH_SIGN_IN_SUCCESS:
      "auth.sign_in.success",

    AUTH_SIGN_IN_FAILURE:
      "auth.sign_in.failure",

    AUTH_TWO_FACTOR_SUCCESS:
      "auth.two_factor.success",

    AUTH_TWO_FACTOR_FAILURE:
      "auth.two_factor.failure",

    AUTH_RECOVERY_CODE_SUCCESS:
      "auth.recovery_code.success",

    AUTH_RECOVERY_CODE_FAILURE:
      "auth.recovery_code.failure",

    AUTH_TWO_FACTOR_ENABLED:
      "auth.two_factor.enabled",

    AUTH_TWO_FACTOR_DISABLED:
      "auth.two_factor.disabled",

    AUTH_SIGN_OUT:
      "auth.sign_out",

    AUTH_ACCESS_BLOCKED:
      "auth.access.blocked",

    SESSION_CREATED:
      "session.created",

    SESSION_REVOKED:
      "session.revoked",

    SESSION_REVOKED_ALL:
      "session.revoked_all",

    ADMIN_ROLE_CHANGED:
      "admin.role.changed",

    ADMIN_ACCOUNT_BANNED:
      "admin.account.banned",

    ADMIN_ACCOUNT_UNBANNED:
      "admin.account.unbanned",

    ADMIN_ACCOUNT_CREATED:
      "admin.account.created",

    ADMIN_ACCOUNT_UPDATED:
      "admin.account.updated",

    SECURITY_SETTINGS_UPDATED:
      "security.settings.updated",

    CONTENT_UPDATED:
      "content.updated",

    PRODUCT_CREATED:
      "product.created",

    PRODUCT_UPDATED:
      "product.updated",

    PRODUCT_DELETED:
      "product.deleted",

    ORDER_UPDATED:
      "order.updated",

    CUSTOMER_UPDATED:
      "customer.updated",
  } as const);

export const ADMIN_AUDIT_STATUSES =
  Object.freeze({
    SUCCESS: "success",
    FAILURE: "failure",
    BLOCKED: "blocked",
    INFO: "info",
  } as const);

export const ADMIN_AUDIT_SEVERITIES =
  Object.freeze({
    INFO: "info",
    WARNING: "warning",
    CRITICAL: "critical",
  } as const);

type AdminAuditStatus =
  (typeof ADMIN_AUDIT_STATUSES)[
    keyof typeof ADMIN_AUDIT_STATUSES
  ];

type AdminAuditSeverity =
  (typeof ADMIN_AUDIT_SEVERITIES)[
    keyof typeof ADMIN_AUDIT_SEVERITIES
  ];

type HeaderRecord = Record<
  string,
  | string
  | string[]
  | null
  | undefined
>;

type HeaderSource =
  | Headers
  | HeaderRecord
  | null
  | undefined;

export type AdminAuditActor = {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  roles?: string[] | string | null;
};

export type AdminAuditTarget = {
  type?: string | null;
  id?: string | null;
  label?: string | null;
};

export type AdminAuditRequestContext = {
  requestId: string;
  ipAddress: string;
  ipHash: string;
  userAgent: string;
  method: string;
  path: string;
  origin: string;
  referer: string;
};

export type CreateAdminAuditLogInput = {
  event: string;
  status?: AdminAuditStatus;
  severity?: AdminAuditSeverity;
  message?: string;
  actor?: AdminAuditActor | null;
  target?: AdminAuditTarget | null;
  request?: Partial<AdminAuditRequestContext> | null;
  metadata?: unknown;
  occurredAt?: Date | string | number;
};

export type AdminAuditLogDocument =
  Document & {
    _id: string;
    version: 1;
    event: string;
    status: AdminAuditStatus;
    severity: AdminAuditSeverity;
    message: string;
    actor: {
      userId: string;
      email: string;
      name: string;
      roles: string[];
    };
    target: {
      type: string;
      id: string;
      label: string;
    };
    request: AdminAuditRequestContext;
    metadata:
      | Record<string, unknown>
      | unknown[]
      | string
      | number
      | boolean
      | null;
    occurredAt: Date;
    createdAt: Date;
    expiresAt: Date;
  };

type AuditWriteResult =
  | {
      ok: true;
      id: string;
    }
  | {
      ok: false;
      id: null;
    };

declare global {
  var _adminAuditIndexesPromise:
    | Promise<void>
    | undefined;
}

function normalizeText(
  value: unknown,
  maximumLength =
    MAX_STRING_LENGTH
): string {
  return String(
    value ?? ""
  )
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maximumLength
    );
}

function normalizeEmail(
  value: unknown
): string {
  return normalizeText(
    value,
    254
  ).toLowerCase();
}

function normalizeEvent(
  value: unknown
): string {
  const event = normalizeText(
    value,
    120
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9._:-]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

  return (
    event ||
    "admin.unknown"
  );
}

function normalizeStatus(
  value: unknown
): AdminAuditStatus {
  const candidate =
    normalizeText(
      value,
      20
    ).toLowerCase();

  const validStatuses =
    Object.values(
      ADMIN_AUDIT_STATUSES
    );

  return validStatuses.includes(
    candidate as AdminAuditStatus
  )
    ? (candidate as AdminAuditStatus)
    : ADMIN_AUDIT_STATUSES.INFO;
}

function normalizeSeverity(
  value: unknown
): AdminAuditSeverity {
  const candidate =
    normalizeText(
      value,
      20
    ).toLowerCase();

  const validSeverities =
    Object.values(
      ADMIN_AUDIT_SEVERITIES
    );

  return validSeverities.includes(
    candidate as AdminAuditSeverity
  )
    ? (candidate as AdminAuditSeverity)
    : ADMIN_AUDIT_SEVERITIES.INFO;
}

function normalizeRoles(
  value: unknown
): string[] {
  const roles = Array.isArray(
    value
  )
    ? value
    : String(
        value ?? ""
      ).split(",");

  return Array.from(
    new Set(
      roles
        .map((role) =>
          normalizeText(
            role,
            80
          ).toLowerCase()
        )
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function normalizeDate(
  value: unknown,
  fallback: Date
): Date {
  if (
    value instanceof Date &&
    Number.isFinite(
      value.getTime()
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    const parsedDate =
      new Date(value);

    if (
      Number.isFinite(
        parsedDate.getTime()
      )
    ) {
      return parsedDate;
    }
  }

  return fallback;
}

function getRetentionDays(): number {
  const configured =
    Number.parseInt(
      String(
        process.env
          .ADMIN_AUDIT_RETENTION_DAYS ||
          ""
      ),
      10
    );

  if (
    !Number.isFinite(
      configured
    )
  ) {
    return DEFAULT_RETENTION_DAYS;
  }

  return Math.min(
    Math.max(
      configured,
      30
    ),
    MAX_RETENTION_DAYS
  );
}

function createExpirationDate(
  createdAt: Date
): Date {
  const expiresAt =
    new Date(createdAt);

  expiresAt.setUTCDate(
    expiresAt.getUTCDate() +
      getRetentionDays()
  );

  return expiresAt;
}

function readHeader(
  source: HeaderSource,
  name: string
): string {
  if (!source) {
    return "";
  }

  if (
    typeof Headers !==
      "undefined" &&
    source instanceof Headers
  ) {
    return normalizeText(
      source.get(name),
      MAX_STRING_LENGTH
    );
  }

  const record =
    source as HeaderRecord;

  const directValue =
    record[name];

  const lowercaseValue =
    record[
      name.toLowerCase()
    ];

  const value =
    directValue ??
    lowercaseValue;

  if (
    Array.isArray(value)
  ) {
    return normalizeText(
      value[0],
      MAX_STRING_LENGTH
    );
  }

  return normalizeText(
    value,
    MAX_STRING_LENGTH
  );
}

function normalizeIpAddress(
  value: unknown
): string {
  const candidate =
    normalizeText(
      value,
      256
    )
      .split(",")[0]
      .trim();

  return candidate.slice(
    0,
    128
  );
}

function hashIpAddress(
  ipAddress: string
): string {
  if (!ipAddress) {
    return "";
  }

  return createHash(
    "sha256"
  )
    .update(ipAddress)
    .digest("hex");
}

function sanitizePath(
  value: unknown
): string {
  const candidate =
    normalizeText(
      value,
      1000
    );

  if (!candidate) {
    return "";
  }

  try {
    const parsedUrl =
      new URL(
        candidate,
        "http://localhost"
      );

    return (
      `${parsedUrl.pathname}`.slice(
        0,
        1000
      ) || "/"
    );
  } catch {
    return candidate
      .split("?")[0]
      .split("#")[0]
      .slice(0, 1000);
  }
}

function sanitizeOrigin(
  value: unknown
): string {
  const candidate =
    normalizeText(
      value,
      1000
    );

  if (!candidate) {
    return "";
  }

  try {
    return new URL(
      candidate
    ).origin.slice(
      0,
      500
    );
  } catch {
    return "";
  }
}

function sanitizeReferer(
  value: unknown
): string {
  const candidate =
    normalizeText(
      value,
      1000
    );

  if (!candidate) {
    return "";
  }

  try {
    const parsedUrl =
      new URL(candidate);

    return (
      `${parsedUrl.origin}${parsedUrl.pathname}`
    ).slice(0, 1000);
  } catch {
    return sanitizePath(
      candidate
    );
  }
}

function sanitizeMetadataValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
):
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value ===
    "string"
  ) {
    return normalizeText(
      value
    );
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
      "bigint"
  ) {
    return value.toString();
  }

  if (
    value instanceof Date
  ) {
    return Number.isFinite(
      value.getTime()
    )
      ? value.toISOString()
      : "";
  }

  if (
    value instanceof Error
  ) {
    return {
      name: normalizeText(
        value.name,
        120
      ),

      message:
        normalizeText(
          value.message,
          1000
        ),
    };
  }

  if (
    typeof value !==
      "object"
  ) {
    return normalizeText(
      value
    );
  }

  if (
    depth >=
    MAX_METADATA_DEPTH
  ) {
    return "[MAX_DEPTH]";
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }

  seen.add(value);

  if (
    Array.isArray(value)
  ) {
    return value
      .slice(
        0,
        MAX_ARRAY_ITEMS
      )
      .map((item) =>
        sanitizeMetadataValue(
          item,
          depth + 1,
          seen
        )
      );
  }

  const result:
    Record<string, unknown> =
      {};

  const entries =
    Object.entries(
      value as Record<
        string,
        unknown
      >
    ).slice(
      0,
      100
    );

  for (
    const [
      rawKey,
      rawValue,
    ] of entries
  ) {
    const key =
      normalizeText(
        rawKey,
        120
      );

    if (!key) {
      continue;
    }

    if (
      SENSITIVE_KEY_PATTERN.test(
        key
      )
    ) {
      result[key] =
        "[REDACTED]";

      continue;
    }

    result[key] =
      sanitizeMetadataValue(
        rawValue,
        depth + 1,
        seen
      );
  }

  return result;
}

function normalizeRequestContext(
  request:
    | Partial<AdminAuditRequestContext>
    | null
    | undefined
): AdminAuditRequestContext {
  const ipAddress =
    normalizeIpAddress(
      request?.ipAddress
    );

  return {
    requestId:
      normalizeText(
        request?.requestId,
        200
      ) || randomUUID(),

    ipAddress,

    ipHash:
      normalizeText(
        request?.ipHash,
        128
      ) ||
      hashIpAddress(
        ipAddress
      ),

    userAgent:
      normalizeText(
        request?.userAgent,
        1000
      ),

    method:
      normalizeText(
        request?.method,
        20
      ).toUpperCase(),

    path:
      sanitizePath(
        request?.path
      ),

    origin:
      sanitizeOrigin(
        request?.origin
      ),

    referer:
      sanitizeReferer(
        request?.referer
      ),
  };
}

async function getAuditCollection(): Promise<
  Collection<AdminAuditLogDocument>
> {
  const database =
    await getMongoDatabase();

  return database.collection<AdminAuditLogDocument>(
    AUDIT_COLLECTION_NAME
  );
}

async function ensureAuditIndexes(): Promise<void> {
  if (
    global
      ._adminAuditIndexesPromise
  ) {
    return global
      ._adminAuditIndexesPromise;
  }

  global._adminAuditIndexesPromise =
    (async () => {
      const collection =
        await getAuditCollection();

      await Promise.all([
        collection.createIndex(
          {
            occurredAt: -1,
          },
          {
            name:
              "audit_occurred_at_desc",
          }
        ),

        collection.createIndex(
          {
            event: 1,
            occurredAt: -1,
          },
          {
            name:
              "audit_event_occurred_at",
          }
        ),

        collection.createIndex(
          {
            status: 1,
            occurredAt: -1,
          },
          {
            name:
              "audit_status_occurred_at",
          }
        ),

        collection.createIndex(
          {
            "actor.userId": 1,
            occurredAt: -1,
          },
          {
            name:
              "audit_actor_occurred_at",
          }
        ),

        collection.createIndex(
          {
            "request.ipHash": 1,
            occurredAt: -1,
          },
          {
            name:
              "audit_ip_hash_occurred_at",
          }
        ),

        collection.createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "audit_expiration_ttl",
            expireAfterSeconds: 0,
          }
        ),
      ]);
    })().catch((error) => {
      global
        ._adminAuditIndexesPromise =
        undefined;

      throw error;
    });

  return global
    ._adminAuditIndexesPromise;
}

export function getAdminAuditRequestContext(
  source: HeaderSource,
  options: {
    method?: string;
    path?: string;
  } = {}
): AdminAuditRequestContext {
  const forwardedFor =
    readHeader(
      source,
      "x-forwarded-for"
    );

  const ipAddress =
    normalizeIpAddress(
      readHeader(
        source,
        "cf-connecting-ip"
      ) ||
        readHeader(
          source,
          "x-real-ip"
        ) ||
        forwardedFor
    );

  const requestId =
    readHeader(
      source,
      "x-request-id"
    ) ||
    readHeader(
      source,
      "x-vercel-id"
    ) ||
    randomUUID();

  return normalizeRequestContext({
    requestId,
    ipAddress,

    userAgent:
      readHeader(
        source,
        "user-agent"
      ),

    method:
      options.method ||
      readHeader(
        source,
        "x-http-method"
      ),

    path:
      options.path ||
      readHeader(
        source,
        "x-invoke-path"
      ) ||
      readHeader(
        source,
        "x-matched-path"
      ),

    origin:
      readHeader(
        source,
        "origin"
      ),

    referer:
      readHeader(
        source,
        "referer"
      ),
  });
}

export async function writeAdminAuditLog(
  input: CreateAdminAuditLogInput
): Promise<AuditWriteResult> {
  const createdAt =
    new Date();

  const occurredAt =
    normalizeDate(
      input.occurredAt,
      createdAt
    );

  const id =
    randomUUID();

  const document: AdminAuditLogDocument =
    {
      _id: id,
      version: 1,

      event:
        normalizeEvent(
          input.event
        ),

      status:
        normalizeStatus(
          input.status
        ),

      severity:
        normalizeSeverity(
          input.severity
        ),

      message:
        normalizeText(
          input.message,
          1000
        ),

      actor: {
        userId:
          normalizeText(
            input.actor?.userId,
            200
          ),

        email:
          normalizeEmail(
            input.actor?.email
          ),

        name:
          normalizeText(
            input.actor?.name,
            200
          ),

        roles:
          normalizeRoles(
            input.actor?.roles
          ),
      },

      target: {
        type:
          normalizeText(
            input.target?.type,
            120
          ),

        id:
          normalizeText(
            input.target?.id,
            300
          ),

        label:
          normalizeText(
            input.target?.label,
            500
          ),
      },

      request:
        normalizeRequestContext(
          input.request
        ),

      metadata:
        sanitizeMetadataValue(
          input.metadata
        ),

      occurredAt,
      createdAt,

      expiresAt:
        createExpirationDate(
          createdAt
        ),
    };

  try {
    await ensureAuditIndexes();

    const collection =
      await getAuditCollection();

    await collection.insertOne(
      document
    );

    return {
      ok: true,
      id,
    };
  } catch (error) {
    console.error(
      "Admin audit log write failed:",
      error instanceof Error
        ? error.message
        : "Unknown audit logging error."
    );

    return {
      ok: false,
      id: null,
    };
  }
}