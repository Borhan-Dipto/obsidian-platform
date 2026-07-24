import "server-only";

import {
  ADMIN_AUTH_STATES,
  getAdminAuthorization,
} from "./adminAuth";

import {
  normalizeAdminRoles,
} from "./adminPermissions";

import {
  ADMIN_AUDIT_EVENTS,
  ADMIN_AUDIT_SEVERITIES,
  ADMIN_AUDIT_STATUSES,
  getAdminAuditRequestContext,
  writeAdminAuditLog,
} from "./adminAuditLog";

const NO_STORE_HEADERS = {
  "Cache-Control":
    "private, no-store, max-age=0",

  Pragma:
    "no-cache",

  "X-Content-Type-Options":
    "nosniff",
};

function normalizeText(
  value,
  maximumLength = 1000
) {
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

function createJsonResponse(
  body,
  status
) {
  return Response.json(
    body,
    {
      status,
      headers:
        NO_STORE_HEADERS,
    }
  );
}

function resolveRequestPath(
  request,
  fallbackPath = ""
) {
  const configuredPath =
    normalizeText(
      fallbackPath,
      1000
    );

  if (configuredPath) {
    return configuredPath;
  }

  try {
    return new URL(
      request.url
    ).pathname;
  } catch {
    return "";
  }
}

async function recordPermissionDenial({
  request,
  authorization,
  permissions,
  path,
}) {
  if (
    authorization.authenticated !==
      true ||
    !authorization.session?.user
  ) {
    return;
  }

  try {
    const user =
      authorization.session.user;

    await writeAdminAuditLog({
      event:
        ADMIN_AUDIT_EVENTS
          .AUTH_ACCESS_BLOCKED,

      status:
        ADMIN_AUDIT_STATUSES
          .BLOCKED,

      severity:
        ADMIN_AUDIT_SEVERITIES
          .WARNING,

      message:
        "Administrator attempted an API operation without the required permission.",

      actor: {
        userId:
          user.id,

        email:
          user.email,

        name:
          user.name,

        roles:
          normalizeAdminRoles(
            user.role
          ),
      },

      request:
        getAdminAuditRequestContext(
          request.headers,
          {
            method:
              request.method,

            path,
          }
        ),

      metadata: {
        requiredPermissions:
          permissions,
      },
    });
  } catch (error) {
    console.error(
      "Admin API permission-denial audit failed:",
      error instanceof Error
        ? error.message
        : "Unknown audit error."
    );
  }
}

export async function requireAdminApiPermission(
  request,
  permissions,
  options = {}
) {
  const authorization =
    await getAdminAuthorization(
      permissions
    );

  if (
    authorization.authenticated ===
      true &&
    authorization.authorized ===
      true
  ) {
    return {
      authorized: true,
      session:
        authorization.session,
      response: null,
    };
  }

  const path =
    resolveRequestPath(
      request,
      options.path
    );

  if (
    authorization.status ===
    ADMIN_AUTH_STATES.PERMISSION_DENIED
  ) {
    await recordPermissionDenial({
      request,
      authorization,

      permissions:
        authorization.permissions,

      path,
    });
  }

  if (
    authorization.status ===
    ADMIN_AUTH_STATES.TWO_FACTOR_REQUIRED
  ) {
    return {
      authorized: false,
      session: null,

      response:
        createJsonResponse(
          {
            success: false,

            message:
              "Two-factor authentication must be completed before accessing this resource.",

            code:
              "ADMIN_TWO_FACTOR_REQUIRED",
          },
          403
        ),
    };
  }

  if (
    authorization.status ===
    ADMIN_AUTH_STATES.PERMISSION_DENIED ||
    authorization.status ===
      ADMIN_AUTH_STATES.FORBIDDEN
  ) {
    return {
      authorized: false,
      session: null,

      response:
        createJsonResponse(
          {
            success: false,

            message:
              normalizeText(
                options.forbiddenMessage,
                500
              ) ||
              "You do not have permission to perform this operation.",

            code:
              normalizeText(
                options.forbiddenCode,
                120
              ) ||
              "ADMIN_PERMISSION_DENIED",
          },
          403
        ),
    };
  }

  return {
    authorized: false,
    session: null,

    response:
      createJsonResponse(
        {
          success: false,

          message:
            normalizeText(
              options.unauthorizedMessage,
              500
            ) ||
            "Administrator authentication is required.",

          code:
            normalizeText(
              options.unauthorizedCode,
              120
            ) ||
            "ADMIN_AUTH_REQUIRED",
        },
        401
      ),
  };
}