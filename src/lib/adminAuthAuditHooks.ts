import "server-only";

import {
  createAuthMiddleware,
} from "better-auth/api";
import {
  ADMIN_AUDIT_EVENTS,
  ADMIN_AUDIT_SEVERITIES,
  ADMIN_AUDIT_STATUSES,
  getAdminAuditRequestContext,
  writeAdminAuditLog,
  type AdminAuditActor,
} from "./adminAuditLog";

type UnknownRecord =
  Record<string, unknown>;

type AuthHookContext = {
  path?: unknown;
  body?: unknown;
  headers?: unknown;
  request?: unknown;
  context?: unknown;
};

const SECURITY_FAILURE_PATHS =
  new Set([
    "/sign-in/email",
    "/two-factor/verify-totp",
    "/two-factor/verify-backup-code",
    "/two-factor/enable",
    "/two-factor/disable",
  ]);

function asRecord(
  value: unknown
): UnknownRecord {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as UnknownRecord;
}

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

function normalizeEmail(
  value: unknown
): string {
  return normalizeText(
    value,
    254
  ).toLowerCase();
}

function normalizePath(
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

    return parsedUrl.pathname;
  } catch {
    return candidate
      .split("?")[0]
      .split("#")[0];
  }
}

function normalizeRoles(
  value: unknown
): string[] {
  const values = Array.isArray(
    value
  )
    ? value
    : String(
        value ?? ""
      ).split(",");

  return Array.from(
    new Set(
      values
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

function getContextRecord(
  context: AuthHookContext
): UnknownRecord {
  return asRecord(
    context.context
  );
}

function getBodyRecord(
  context: AuthHookContext
): UnknownRecord {
  return asRecord(
    context.body
  );
}

function getReturnedRecord(
  context: AuthHookContext
): UnknownRecord {
  const authContext =
    getContextRecord(
      context
    );

  const returned =
    authContext.returned;

  if (
    returned instanceof Response
  ) {
    return {};
  }

  return asRecord(
    returned
  );
}

function getNewSessionRecord(
  context: AuthHookContext
): UnknownRecord {
  const authContext =
    getContextRecord(
      context
    );

  return asRecord(
    authContext.newSession
  );
}

function getCurrentSessionRecord(
  context: AuthHookContext
): UnknownRecord {
  const authContext =
    getContextRecord(
      context
    );

  return asRecord(
    authContext.session
  );
}

function getUserFromSessionRecord(
  sessionRecord: UnknownRecord
): UnknownRecord {
  const embeddedUser =
    asRecord(
      sessionRecord.user
    );

  if (
    Object.keys(
      embeddedUser
    ).length > 0
  ) {
    return embeddedUser;
  }

  return sessionRecord;
}

function getActorFromContext(
  context: AuthHookContext
): AdminAuditActor {
  const body =
    getBodyRecord(
      context
    );

  const newSession =
    getNewSessionRecord(
      context
    );

  const currentSession =
    getCurrentSessionRecord(
      context
    );

  const newSessionUser =
    getUserFromSessionRecord(
      newSession
    );

  const currentSessionUser =
    getUserFromSessionRecord(
      currentSession
    );

  const user =
    Object.keys(
      newSessionUser
    ).length > 0
      ? newSessionUser
      : currentSessionUser;

  const sessionUserId =
    normalizeText(
      newSession.userId ||
        currentSession.userId,
      200
    );

  return {
    userId:
      normalizeText(
        user.id ||
          user.userId ||
          sessionUserId,
        200
      ),

    email:
      normalizeEmail(
        user.email ||
          body.email
      ),

    name:
      normalizeText(
        user.name,
        200
      ),

    roles:
      normalizeRoles(
        user.role ||
          user.roles
      ),
  };
}

function getRequestHeaders(
  context: AuthHookContext
): Headers | null {
  if (
    context.headers instanceof
    Headers
  ) {
    return context.headers;
  }

  const request =
    context.request;

  if (
    request instanceof Request
  ) {
    return request.headers;
  }

  const requestRecord =
    asRecord(request);

  if (
    requestRecord.headers instanceof
    Headers
  ) {
    return requestRecord.headers;
  }

  return null;
}

function getRequestMethod(
  context: AuthHookContext
): string {
  const request =
    context.request;

  if (
    request instanceof Request
  ) {
    return request.method;
  }

  const requestRecord =
    asRecord(request);

  return normalizeText(
    requestRecord.method,
    20
  );
}

function getRequestPath(
  context: AuthHookContext
): string {
  const directPath =
    normalizePath(
      context.path
    );

  if (directPath) {
    return directPath;
  }

  const request =
    context.request;

  if (
    request instanceof Request
  ) {
    return normalizePath(
      request.url
    );
  }

  const requestRecord =
    asRecord(request);

  return normalizePath(
    requestRecord.url
  );
}

function buildRequestContext(
  context: AuthHookContext
) {
  const path =
    getRequestPath(
      context
    );

  return getAdminAuditRequestContext(
    getRequestHeaders(
      context
    ),
    {
      method:
        getRequestMethod(
          context
        ) || "POST",

      path,
    }
  );
}

function getNestedBoolean(
  source: UnknownRecord,
  key: string
): boolean {
  if (
    source[key] === true
  ) {
    return true;
  }

  const data =
    asRecord(
      source.data
    );

  const body =
    asRecord(
      source.body
    );

  return (
    data[key] === true ||
    body[key] === true
  );
}

function hasTwoFactorRedirect(
  context: AuthHookContext
): boolean {
  return getNestedBoolean(
    getReturnedRecord(
      context
    ),
    "twoFactorRedirect"
  );
}

function hasExistingAuthenticatedSession(
  context: AuthHookContext
): boolean {
  const session =
    getCurrentSessionRecord(
      context
    );

  return Boolean(
    session.userId ||
      asRecord(
        session.user
      ).id
  );
}

function createSuccessEvent(
  path: string,
  context: AuthHookContext
): {
  event: string;
  message: string;
  severity: "info" | "warning";
  metadata?: UnknownRecord;
} | null {
  if (
    path === "/sign-in/email"
  ) {
    const secondFactorRequired =
      hasTwoFactorRedirect(
        context
      );

    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_SIGN_IN_SUCCESS,

      message:
        secondFactorRequired
          ? "Administrator password accepted and second-factor challenge issued."
          : "Administrator signed in successfully.",

      severity:
        ADMIN_AUDIT_SEVERITIES.INFO,

      metadata: {
        secondFactorRequired,
      },
    };
  }

  if (
    path ===
    "/two-factor/verify-totp"
  ) {
    const enrollmentFlow =
      hasExistingAuthenticatedSession(
        context
      ) &&
      !getNewSessionRecord(
        context
      ).userId;

    return {
      event:
        enrollmentFlow
          ? ADMIN_AUDIT_EVENTS
              .AUTH_TWO_FACTOR_ENABLED
          : ADMIN_AUDIT_EVENTS
              .AUTH_TWO_FACTOR_SUCCESS,

      message:
        enrollmentFlow
          ? "Administrator enabled authenticator-based two-factor authentication."
          : "Administrator completed authenticator verification successfully.",

      severity:
        ADMIN_AUDIT_SEVERITIES.INFO,

      metadata: {
        method: "totp",
        enrollmentFlow,
        trustedDevice: false,
      },
    };
  }

  if (
    path ===
    "/two-factor/verify-backup-code"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_RECOVERY_CODE_SUCCESS,

      message:
        "Administrator completed login using a single-use recovery code.",

      severity:
        ADMIN_AUDIT_SEVERITIES.WARNING,

      metadata: {
        method:
          "backup_code",
        trustedDevice: false,
      },
    };
  }

  if (
    path ===
    "/two-factor/enable"
  ) {
    return {
      event:
        "auth.two_factor.enrollment_started",

      message:
        "Administrator started authenticator enrollment.",

      severity:
        ADMIN_AUDIT_SEVERITIES.INFO,

      metadata: {
        method: "totp",
      },
    };
  }

  if (
    path ===
    "/two-factor/disable"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_TWO_FACTOR_DISABLED,

      message:
        "Administrator disabled two-factor authentication.",

      severity:
        ADMIN_AUDIT_SEVERITIES.WARNING,
    };
  }

  if (
    path === "/sign-out"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_SIGN_OUT,

      message:
        "Administrator ended the secure session.",

      severity:
        ADMIN_AUDIT_SEVERITIES.INFO,
    };
  }

  if (
    path ===
    "/revoke-session"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .SESSION_REVOKED,

      message:
        "Administrator revoked an active session.",

      severity:
        ADMIN_AUDIT_SEVERITIES.WARNING,
    };
  }

  if (
    path ===
      "/revoke-sessions" ||
    path ===
      "/revoke-other-sessions"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .SESSION_REVOKED_ALL,

      message:
        path ===
        "/revoke-other-sessions"
          ? "Administrator revoked all other active sessions."
          : "Administrator revoked all active sessions.",

      severity:
        ADMIN_AUDIT_SEVERITIES.WARNING,
    };
  }

  return null;
}

function createFailureEvent(
  path: string
): {
  event: string;
  message: string;
} | null {
  if (
    path === "/sign-in/email"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_SIGN_IN_FAILURE,

      message:
        "Administrator sign-in attempt failed.",
    };
  }

  if (
    path ===
    "/two-factor/verify-totp"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_TWO_FACTOR_FAILURE,

      message:
        "Authenticator verification attempt failed.",
    };
  }

  if (
    path ===
    "/two-factor/verify-backup-code"
  ) {
    return {
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_RECOVERY_CODE_FAILURE,

      message:
        "Recovery-code verification attempt failed.",
    };
  }

  if (
    path ===
    "/two-factor/enable"
  ) {
    return {
      event:
        "auth.two_factor.enable_failure",

      message:
        "Two-factor enrollment request failed.",
    };
  }

  if (
    path ===
    "/two-factor/disable"
  ) {
    return {
      event:
        "auth.two_factor.disable_failure",

      message:
        "Two-factor disable request failed.",
    };
  }

  return null;
}

function extractErrorDetails(
  error: unknown
): {
  name: string;
  code: string;
  status: string;
  message: string;
} {
  const errorRecord =
    asRecord(error);

  const cause =
    asRecord(
      errorRecord.cause
    );

  return {
    name:
      normalizeText(
        errorRecord.name,
        120
      ),

    code:
      normalizeText(
        errorRecord.code ||
          cause.code,
        120
      ),

    status:
      normalizeText(
        errorRecord.status ||
          errorRecord.statusCode ||
          cause.status,
        80
      ),

    message:
      normalizeText(
        errorRecord.message ||
          cause.message,
        500
      ),
  };
}

export const adminAuthAuditAfterHook =
  createAuthMiddleware(
    async (context) => {
      const hookContext =
        context as AuthHookContext;

      const path =
        getRequestPath(
          hookContext
        );

      const event =
        createSuccessEvent(
          path,
          hookContext
        );

      if (!event) {
        return;
      }

      await writeAdminAuditLog({
        event:
          event.event,

        status:
          ADMIN_AUDIT_STATUSES.SUCCESS,

        severity:
          event.severity,

        message:
          event.message,

        actor:
          getActorFromContext(
            hookContext
          ),

        request:
          buildRequestContext(
            hookContext
          ),

        metadata:
          event.metadata || {
            endpoint: path,
          },
      });
    }
  );

export async function handleAdminAuthApiError(
  error: unknown,
  context: unknown
): Promise<void> {
  const hookContext =
    context as AuthHookContext;

  const path =
    getRequestPath(
      hookContext
    );

  if (
    !SECURITY_FAILURE_PATHS.has(
      path
    )
  ) {
    return;
  }

  const failureEvent =
    createFailureEvent(
      path
    );

  if (!failureEvent) {
    return;
  }

  const errorDetails =
    extractErrorDetails(
      error
    );

  const isRateLimited =
    errorDetails.status ===
      "429" ||
    errorDetails.code
      .toUpperCase()
      .includes(
        "RATE_LIMIT"
      ) ||
    errorDetails.code
      .toUpperCase()
      .includes(
        "TEMPORARILY_LOCKED"
      );

  await writeAdminAuditLog({
    event:
      failureEvent.event,

    status:
      isRateLimited
        ? ADMIN_AUDIT_STATUSES.BLOCKED
        : ADMIN_AUDIT_STATUSES.FAILURE,

    severity:
      isRateLimited
        ? ADMIN_AUDIT_SEVERITIES.CRITICAL
        : ADMIN_AUDIT_SEVERITIES.WARNING,

    message:
      failureEvent.message,

    actor:
      getActorFromContext(
        hookContext
      ),

    request:
      buildRequestContext(
        hookContext
      ),

    metadata: {
      endpoint: path,

      error: {
        name:
          errorDetails.name,

        code:
          errorDetails.code,

        status:
          errorDetails.status,

        message:
          errorDetails.message,
      },

      rateLimited:
        isRateLimited,
    },
  });
}