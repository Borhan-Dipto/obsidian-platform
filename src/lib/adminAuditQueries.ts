import "server-only";

import type {
  Filter,
} from "mongodb";
import {
  ADMIN_AUDIT_SEVERITIES,
  ADMIN_AUDIT_STATUSES,
  type AdminAuditLogDocument,
} from "./adminAuditLog";
import {
  getMongoDatabase,
} from "./mongodb";

const AUDIT_COLLECTION_NAME =
  "admin_security_audit_logs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE_NUMBER = 100000;
const MAX_SEARCH_LENGTH = 120;

type AuditStatus =
  (typeof ADMIN_AUDIT_STATUSES)[
    keyof typeof ADMIN_AUDIT_STATUSES
  ];

type AuditSeverity =
  (typeof ADMIN_AUDIT_SEVERITIES)[
    keyof typeof ADMIN_AUDIT_SEVERITIES
  ];

export type AdminAuditQueryInput = {
  page?: unknown;
  limit?: unknown;
  event?: unknown;
  status?: unknown;
  severity?: unknown;
  actor?: unknown;
  search?: unknown;
  from?: unknown;
  to?: unknown;
};

export type AdminAuditQueryFilters = {
  event: string;
  status: AuditStatus | "";
  severity: AuditSeverity | "";
  actor: string;
  search: string;
  from: string;
  to: string;
};

export type AdminAuditListItem = {
  id: string;
  event: string;
  status: AuditStatus;
  severity: AuditSeverity;
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

  request: {
    requestId: string;
    ipAddress: string;
    ipHash: string;
    userAgent: string;
    method: string;
    path: string;
    origin: string;
    referer: string;
  };

  metadata:
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | boolean
    | null;

  occurredAt: string;
  createdAt: string;
};

export type AdminAuditQueryResult = {
  items: AdminAuditListItem[];

  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };

  filters: AdminAuditQueryFilters;
};

export type AdminAuditSummary = {
  totalEvents: number;
  eventsLast24Hours: number;
  eventsLast7Days: number;
  failuresLast7Days: number;
  blockedLast7Days: number;
  criticalLast7Days: number;
  uniqueActorsLast7Days: number;
  latestEventAt: string | null;
};

function normalizeText(
  value: unknown,
  maximumLength = 1000
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

function normalizePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number
): number {
  const parsedValue =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  if (
    !Number.isFinite(
      parsedValue
    ) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return Math.min(
    parsedValue,
    maximum
  );
}

function normalizeStatus(
  value: unknown
): AuditStatus | "" {
  const candidate =
    normalizeText(
      value,
      20
    ).toLowerCase();

  const allowedStatuses =
    Object.values(
      ADMIN_AUDIT_STATUSES
    );

  return allowedStatuses.includes(
    candidate as AuditStatus
  )
    ? (candidate as AuditStatus)
    : "";
}

function normalizeSeverity(
  value: unknown
): AuditSeverity | "" {
  const candidate =
    normalizeText(
      value,
      20
    ).toLowerCase();

  const allowedSeverities =
    Object.values(
      ADMIN_AUDIT_SEVERITIES
    );

  return allowedSeverities.includes(
    candidate as AuditSeverity
  )
    ? (candidate as AuditSeverity)
    : "";
}

function normalizeEvent(
  value: unknown
): string {
  return normalizeText(
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
}

function escapeRegularExpression(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function parseDateBoundary(
  value: unknown,
  endOfDay: boolean
): Date | null {
  const candidate =
    normalizeText(
      value,
      80
    );

  if (!candidate) {
    return null;
  }

  const dateOnlyMatch =
    candidate.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (dateOnlyMatch) {
    const year =
      Number(dateOnlyMatch[1]);

    const month =
      Number(dateOnlyMatch[2]);

    const day =
      Number(dateOnlyMatch[3]);

    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0
      )
    );

    return Number.isFinite(
      date.getTime()
    )
      ? date
      : null;
  }

  const date =
    new Date(candidate);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function serializeDate(
  value: unknown
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(
          String(value ?? "")
        );

  return Number.isFinite(
    date.getTime()
  )
    ? date.toISOString()
    : "";
}

function maskIpAddress(
  value: unknown
): string {
  const ipAddress =
    normalizeText(
      value,
      128
    );

  if (!ipAddress) {
    return "";
  }

  if (
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(
      ipAddress
    )
  ) {
    const parts =
      ipAddress.split(".");

    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }

  if (
    ipAddress.includes(":")
  ) {
    const segments =
      ipAddress
        .split(":")
        .filter(Boolean);

    return segments.length > 2
      ? `${segments
          .slice(0, 3)
          .join(":")}:****`
      : "****";
  }

  return "****";
}

function serializeMetadata(
  value: unknown
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

  try {
    return JSON.parse(
      JSON.stringify(value)
    ) as
      | Record<string, unknown>
      | unknown[]
      | string
      | number
      | boolean
      | null;
  } catch {
    return null;
  }
}

function serializeAuditDocument(
  document: AdminAuditLogDocument
): AdminAuditListItem {
  return {
    id:
      normalizeText(
        document._id,
        200
      ),

    event:
      normalizeText(
        document.event,
        120
      ),

    status:
      normalizeStatus(
        document.status
      ) ||
      ADMIN_AUDIT_STATUSES.INFO,

    severity:
      normalizeSeverity(
        document.severity
      ) ||
      ADMIN_AUDIT_SEVERITIES.INFO,

    message:
      normalizeText(
        document.message,
        1000
      ),

    actor: {
      userId:
        normalizeText(
          document.actor?.userId,
          200
        ),

      email:
        normalizeText(
          document.actor?.email,
          254
        ).toLowerCase(),

      name:
        normalizeText(
          document.actor?.name,
          200
        ),

      roles:
        Array.isArray(
          document.actor?.roles
        )
          ? document.actor.roles
              .map((role) =>
                normalizeText(
                  role,
                  80
                ).toLowerCase()
              )
              .filter(Boolean)
              .slice(0, 20)
          : [],
    },

    target: {
      type:
        normalizeText(
          document.target?.type,
          120
        ),

      id:
        normalizeText(
          document.target?.id,
          300
        ),

      label:
        normalizeText(
          document.target?.label,
          500
        ),
    },

    request: {
      requestId:
        normalizeText(
          document.request
            ?.requestId,
          200
        ),

      ipAddress:
        maskIpAddress(
          document.request
            ?.ipAddress
        ),

      ipHash:
        normalizeText(
          document.request
            ?.ipHash,
          128
        ),

      userAgent:
        normalizeText(
          document.request
            ?.userAgent,
          1000
        ),

      method:
        normalizeText(
          document.request
            ?.method,
          20
        ).toUpperCase(),

      path:
        normalizeText(
          document.request
            ?.path,
          1000
        ),

      origin:
        normalizeText(
          document.request
            ?.origin,
          500
        ),

      referer:
        normalizeText(
          document.request
            ?.referer,
          1000
        ),
    },

    metadata:
      serializeMetadata(
        document.metadata
      ),

    occurredAt:
      serializeDate(
        document.occurredAt
      ),

    createdAt:
      serializeDate(
        document.createdAt
      ),
  };
}

async function getAuditCollection() {
  const database =
    await getMongoDatabase();

  return database.collection<AdminAuditLogDocument>(
    AUDIT_COLLECTION_NAME
  );
}

function normalizeQueryInput(
  input: AdminAuditQueryInput
): {
  page: number;
  limit: number;
  filters: AdminAuditQueryFilters;
  fromDate: Date | null;
  toDate: Date | null;
} {
  const page =
    normalizePositiveInteger(
      input.page,
      1,
      MAX_PAGE_NUMBER
    );

  const limit =
    normalizePositiveInteger(
      input.limit,
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

  const fromDate =
    parseDateBoundary(
      input.from,
      false
    );

  const toDate =
    parseDateBoundary(
      input.to,
      true
    );

  const filters: AdminAuditQueryFilters =
    {
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

      actor:
        normalizeText(
          input.actor,
          MAX_SEARCH_LENGTH
        ),

      search:
        normalizeText(
          input.search,
          MAX_SEARCH_LENGTH
        ),

      from:
        fromDate
          ? fromDate.toISOString()
          : "",

      to:
        toDate
          ? toDate.toISOString()
          : "",
    };

  return {
    page,
    limit,
    filters,
    fromDate,
    toDate,
  };
}

function buildAuditFilter(
  normalized: ReturnType<
    typeof normalizeQueryInput
  >
): Filter<AdminAuditLogDocument> {
  const conditions:
    Filter<AdminAuditLogDocument>[] =
      [];

  const {
    filters,
    fromDate,
    toDate,
  } = normalized;

  if (filters.event) {
    conditions.push({
      event:
        filters.event,
    });
  }

  if (filters.status) {
    conditions.push({
      status:
        filters.status,
    });
  }

  if (filters.severity) {
    conditions.push({
      severity:
        filters.severity,
    });
  }

  if (
    fromDate ||
    toDate
  ) {
    const occurredAtFilter: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (fromDate) {
      occurredAtFilter.$gte =
        fromDate;
    }

    if (toDate) {
      occurredAtFilter.$lte =
        toDate;
    }

    conditions.push({
      occurredAt:
        occurredAtFilter,
    });
  }

  if (filters.actor) {
    const actorPattern =
      escapeRegularExpression(
        filters.actor
      );

    conditions.push({
      $or: [
        {
          "actor.email": {
            $regex:
              actorPattern,
            $options: "i",
          },
        },
        {
          "actor.name": {
            $regex:
              actorPattern,
            $options: "i",
          },
        },
        {
          "actor.userId": {
            $regex:
              actorPattern,
            $options: "i",
          },
        },
      ],
    });
  }

  if (filters.search) {
    const searchPattern =
      escapeRegularExpression(
        filters.search
      );

    conditions.push({
      $or: [
        {
          event: {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          message: {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "actor.email": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "actor.name": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "target.type": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "target.id": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "target.label": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "request.path": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
        {
          "request.ipHash": {
            $regex:
              searchPattern,
            $options: "i",
          },
        },
      ],
    });
  }

  if (
    conditions.length === 0
  ) {
    return {};
  }

  if (
    conditions.length === 1
  ) {
    return conditions[0];
  }

  return {
    $and: conditions,
  };
}

export async function findAdminAuditLogs(
  input: AdminAuditQueryInput = {}
): Promise<AdminAuditQueryResult> {
  const normalized =
    normalizeQueryInput(
      input
    );

  const filter =
    buildAuditFilter(
      normalized
    );

  const skip =
    (normalized.page - 1) *
    normalized.limit;

  const collection =
    await getAuditCollection();

  const [
    documents,
    totalItems,
  ] = await Promise.all([
    collection
      .find(filter)
      .sort({
        occurredAt: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(
        normalized.limit
      )
      .toArray(),

    collection.countDocuments(
      filter
    ),
  ]);

  const totalPages =
    totalItems > 0
      ? Math.ceil(
          totalItems /
            normalized.limit
        )
      : 0;

  return {
    items:
      documents.map(
        serializeAuditDocument
      ),

    pagination: {
      page:
        normalized.page,

      limit:
        normalized.limit,

      totalItems,
      totalPages,

      hasPreviousPage:
        normalized.page > 1,

      hasNextPage:
        normalized.page <
        totalPages,
    },

    filters:
      normalized.filters,
  };
}

export async function getAdminAuditSummary(): Promise<AdminAuditSummary> {
  const collection =
    await getAuditCollection();

  const now =
    new Date();

  const last24Hours =
    new Date(
      now.getTime() -
        24 *
          60 *
          60 *
          1000
    );

  const last7Days =
    new Date(
      now.getTime() -
        7 *
          24 *
          60 *
          60 *
          1000
    );

  const [
    totalEvents,
    eventsLast24Hours,
    eventsLast7Days,
    failuresLast7Days,
    blockedLast7Days,
    criticalLast7Days,
    uniqueActorIds,
    latestEvent,
  ] = await Promise.all([
    collection.countDocuments(
      {}
    ),

    collection.countDocuments({
      occurredAt: {
        $gte:
          last24Hours,
      },
    }),

    collection.countDocuments({
      occurredAt: {
        $gte:
          last7Days,
      },
    }),

    collection.countDocuments({
      occurredAt: {
        $gte:
          last7Days,
      },

      status:
        ADMIN_AUDIT_STATUSES.FAILURE,
    }),

    collection.countDocuments({
      occurredAt: {
        $gte:
          last7Days,
      },

      status:
        ADMIN_AUDIT_STATUSES.BLOCKED,
    }),

    collection.countDocuments({
      occurredAt: {
        $gte:
          last7Days,
      },

      severity:
        ADMIN_AUDIT_SEVERITIES.CRITICAL,
    }),

    collection.distinct(
      "actor.userId",
      {
        occurredAt: {
          $gte:
            last7Days,
        },

        "actor.userId": {
          $ne: "",
        },
      }
    ),

    collection
      .find(
        {},
        {
          projection: {
            occurredAt: 1,
          },
        }
      )
      .sort({
        occurredAt: -1,
      })
      .limit(1)
      .next(),
  ]);

  return {
    totalEvents,
    eventsLast24Hours,
    eventsLast7Days,
    failuresLast7Days,
    blockedLast7Days,
    criticalLast7Days,

    uniqueActorsLast7Days:
      uniqueActorIds.length,

    latestEventAt:
      latestEvent
        ? serializeDate(
            latestEvent.occurredAt
          )
        : null,
  };
}

export async function getAdminAuditEventOptions(): Promise<
  string[]
> {
  const collection =
    await getAuditCollection();

  const events =
    await collection.distinct(
      "event",
      {
        event: {
          $ne: "",
        },
      }
    );

  return events
    .map((event) =>
      normalizeEvent(event)
    )
    .filter(Boolean)
    .sort((first, second) =>
      first.localeCompare(
        second
      )
    )
    .slice(0, 500);
}