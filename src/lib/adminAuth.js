import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./adminAuthCore";
import {
  hasAdminWorkspaceRole,
  normalizeAdminRoles,
} from "./adminPermissions";
import {
  ADMIN_AUDIT_EVENTS,
  ADMIN_AUDIT_SEVERITIES,
  ADMIN_AUDIT_STATUSES,
  getAdminAuditRequestContext,
  writeAdminAuditLog,
} from "./adminAuditLog";

const AUTH_STATES = Object.freeze({
  AUTHENTICATED:
    "authenticated",

  UNAUTHENTICATED:
    "unauthenticated",

  FORBIDDEN:
    "forbidden",

  TWO_FACTOR_REQUIRED:
    "two_factor_required",

  PERMISSION_DENIED:
    "permission_denied",
});

const RESOURCE_NAME_PATTERN =
  /^[a-z][a-z0-9_-]{0,79}$/;

const ACTION_NAME_PATTERN =
  /^[a-z][a-z0-9_-]{0,79}$/;

function hasAdminWorkspaceAccess(
  user
) {
  return normalizeAdminRoles(
    user?.role
  ).some(
    hasAdminWorkspaceRole
  );
}

function hasActiveBan(user) {
  if (user?.banned !== true) {
    return false;
  }

  if (!user?.banExpires) {
    return true;
  }

  const expirationTime =
    new Date(
      user.banExpires
    ).getTime();

  if (
    !Number.isFinite(
      expirationTime
    )
  ) {
    return true;
  }

  return (
    expirationTime >
    Date.now()
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function normalizePermissionMap(
  permissions
) {
  if (
    !isPlainObject(
      permissions
    )
  ) {
    return null;
  }

  const normalizedPermissions =
    {};

  const permissionEntries =
    Object.entries(
      permissions
    ).slice(0, 30);

  for (const [
    rawResource,
    rawActions,
  ] of permissionEntries) {
    const resource =
      String(
        rawResource || ""
      )
        .trim()
        .toLowerCase();

    if (
      !RESOURCE_NAME_PATTERN.test(
        resource
      )
    ) {
      continue;
    }

    const actionSource =
      Array.isArray(
        rawActions
      )
        ? rawActions
        : [rawActions];

    const actions =
      Array.from(
        new Set(
          actionSource
            .map((action) =>
              String(
                action || ""
              )
                .trim()
                .toLowerCase()
            )
            .filter((action) =>
              ACTION_NAME_PATTERN.test(
                action
              )
            )
        )
      ).slice(0, 30);

    if (
      actions.length === 0
    ) {
      continue;
    }

    normalizedPermissions[
      resource
    ] = actions;
  }

  if (
    Object.keys(
      normalizedPermissions
    ).length === 0
  ) {
    return null;
  }

  return normalizedPermissions;
}

function normalizePermissionSets(
  permissionSets
) {
  const source =
    Array.isArray(
      permissionSets
    )
      ? permissionSets
      : [permissionSets];

  return source
    .slice(0, 30)
    .map((permissions) =>
      normalizePermissionMap(
        permissions
      )
    )
    .filter(Boolean);
}

function resolvePermissionResult(
  result
) {
  if (
    result === true
  ) {
    return true;
  }

  if (
    !result ||
    typeof result !==
      "object"
  ) {
    return false;
  }

  if (
    result.success === true
  ) {
    return true;
  }

  if (
    result.data &&
    typeof result.data ===
      "object" &&
    result.data.success === true
  ) {
    return true;
  }

  return false;
}

async function resolveAdminAuthState() {
  /*
   * Keep headers() outside try/catch.
   *
   * During Next.js static analysis,
   * headers() may throw an internal
   * dynamic-rendering signal that
   * Next.js must handle itself.
   */
  const requestHeaders =
    await headers();

  let session = null;

  try {
    session =
      await adminAuth.api.getSession({
        headers:
          requestHeaders,
      });
  } catch (error) {
    console.error(
      "Admin session verification failed:",
      error instanceof Error
        ? error.message
        : "Unknown authentication error."
    );

    return {
      status:
        AUTH_STATES.UNAUTHENTICATED,

      session: null,
      requestHeaders,
    };
  }

  const user =
    session?.user;

  if (!user) {
    return {
      status:
        AUTH_STATES.UNAUTHENTICATED,

      session: null,
      requestHeaders,
    };
  }

  if (
    !hasAdminWorkspaceAccess(
      user
    ) ||
    user.emailVerified !==
      true ||
    hasActiveBan(user)
  ) {
    return {
      status:
        AUTH_STATES.FORBIDDEN,

      session: null,
      requestHeaders,
    };
  }

  if (
    user.twoFactorEnabled !==
    true
  ) {
    return {
      status:
        AUTH_STATES.TWO_FACTOR_REQUIRED,

      session,
      requestHeaders,
    };
  }

  return {
    status:
      AUTH_STATES.AUTHENTICATED,

    session,
    requestHeaders,
  };
}

async function checkSessionPermission(
  session,
  permissions
) {
  const normalizedPermissions =
    normalizePermissionMap(
      permissions
    );

  const userId =
    String(
      session?.user?.id || ""
    ).trim();

  if (
    !userId ||
    !normalizedPermissions
  ) {
    return {
      authorized: false,

      permissions:
        normalizedPermissions,
    };
  }

  try {
    const permissionResult =
      await adminAuth.api.userHasPermission(
        {
          body: {
            userId,

            permissions:
              normalizedPermissions,
          },
        }
      );

    return {
      authorized:
        resolvePermissionResult(
          permissionResult
        ),

      permissions:
        normalizedPermissions,
    };
  } catch (error) {
    console.error(
      "Admin permission verification failed:",
      error instanceof Error
        ? error.message
        : "Unknown authorization error."
    );

    return {
      authorized: false,

      permissions:
        normalizedPermissions,
    };
  }
}

async function checkSessionAnyPermission(
  session,
  permissionSets
) {
  const normalizedPermissionSets =
    normalizePermissionSets(
      permissionSets
    );

  if (
    normalizedPermissionSets.length ===
    0
  ) {
    return {
      authorized: false,

      permissionSets:
        normalizedPermissionSets,

      matchedPermissions: null,
    };
  }

  const decisions =
    await Promise.all(
      normalizedPermissionSets.map(
        (permissions) =>
          checkSessionPermission(
            session,
            permissions
          )
      )
    );

  const matchedDecision =
    decisions.find(
      (decision) =>
        decision.authorized === true
    );

  return {
    authorized: Boolean(
      matchedDecision
    ),

    permissionSets:
      normalizedPermissionSets,

    matchedPermissions:
      matchedDecision?.permissions ||
      null,
  };
}

async function recordPermissionDenial({
  session,
  requestHeaders,
  permissions = null,
  permissionSets = null,
  permissionMode = "all",
  path,
}) {
  try {
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
        "Administrator attempted to access a protected resource without the required permission.",

      actor: {
        userId:
          session?.user?.id,

        email:
          session?.user?.email,

        name:
          session?.user?.name,

        roles:
          normalizeAdminRoles(
            session?.user?.role
          ),
      },

      request:
        getAdminAuditRequestContext(
          requestHeaders,
          {
            path,
          }
        ),

      metadata: {
        permissionMode,

        requiredPermissions:
          permissions,

        requiredPermissionSets:
          permissionSets,
      },
    });
  } catch (error) {
    console.error(
      "Admin permission-denial audit failed:",
      error instanceof Error
        ? error.message
        : "Unknown audit error."
    );
  }
}

function handleAdminAuthRedirect(
  authState
) {
  if (
    authState.status ===
    AUTH_STATES.TWO_FACTOR_REQUIRED
  ) {
    redirect(
      "/admin/security/setup"
    );
  }

  if (
    authState.status !==
    AUTH_STATES.AUTHENTICATED
  ) {
    redirect(
      "/admin/login"
    );
  }
}

export async function getAdminSession() {
  const authState =
    await resolveAdminAuthState();

  if (
    authState.status !==
    AUTH_STATES.AUTHENTICATED
  ) {
    return null;
  }

  return authState.session;
}

export async function isAdminAuthenticated() {
  const session =
    await getAdminSession();

  return Boolean(session);
}

export async function getAdminAuthorization(
  permissions
) {
  const authState =
    await resolveAdminAuthState();

  if (
    authState.status !==
    AUTH_STATES.AUTHENTICATED
  ) {
    return {
      status:
        authState.status,

      authenticated: false,
      authorized: false,

      session:
        authState.session,

      permissions:
        normalizePermissionMap(
          permissions
        ),
    };
  }

  const permissionDecision =
    await checkSessionPermission(
      authState.session,
      permissions
    );

  return {
    status:
      permissionDecision.authorized
        ? AUTH_STATES.AUTHENTICATED
        : AUTH_STATES.PERMISSION_DENIED,

    authenticated: true,

    authorized:
      permissionDecision.authorized,

    session:
      authState.session,

    permissions:
      permissionDecision.permissions,
  };
}

export async function getAnyAdminAuthorization(
  permissionSets
) {
  const authState =
    await resolveAdminAuthState();

  const normalizedPermissionSets =
    normalizePermissionSets(
      permissionSets
    );

  if (
    authState.status !==
    AUTH_STATES.AUTHENTICATED
  ) {
    return {
      status:
        authState.status,

      authenticated: false,
      authorized: false,

      session:
        authState.session,

      permissionSets:
        normalizedPermissionSets,

      matchedPermissions: null,
    };
  }

  const permissionDecision =
    await checkSessionAnyPermission(
      authState.session,
      normalizedPermissionSets
    );

  return {
    status:
      permissionDecision.authorized
        ? AUTH_STATES.AUTHENTICATED
        : AUTH_STATES.PERMISSION_DENIED,

    authenticated: true,

    authorized:
      permissionDecision.authorized,

    session:
      authState.session,

    permissionSets:
      permissionDecision.permissionSets,

    matchedPermissions:
      permissionDecision.matchedPermissions,
  };
}

export async function hasAdminPermission(
  permissions
) {
  const authorization =
    await getAdminAuthorization(
      permissions
    );

  return (
    authorization.authenticated ===
      true &&
    authorization.authorized ===
      true
  );
}

export async function hasAnyAdminPermission(
  permissionSets
) {
  const authorization =
    await getAnyAdminAuthorization(
      permissionSets
    );

  return (
    authorization.authenticated ===
      true &&
    authorization.authorized ===
      true
  );
}

export async function requireAdminAuth() {
  const authState =
    await resolveAdminAuthState();

  handleAdminAuthRedirect(
    authState
  );

  return true;
}

export async function requireAdminPermission(
  permissions,
  options = {}
) {
  const authState =
    await resolveAdminAuthState();

  handleAdminAuthRedirect(
    authState
  );

  const permissionDecision =
    await checkSessionPermission(
      authState.session,
      permissions
    );

  if (
    !permissionDecision.authorized
  ) {
    await recordPermissionDenial({
      session:
        authState.session,

      requestHeaders:
        authState.requestHeaders,

      permissions:
        permissionDecision.permissions,

      permissionMode:
        "all",

      path:
        String(
          options.path || ""
        )
          .trim()
          .slice(0, 1000),
    });

    redirect(
      String(
        options.redirectTo ||
          "/admin?access=denied"
      )
    );
  }

  return authState.session;
}

export async function requireAnyAdminPermission(
  permissionSets,
  options = {}
) {
  const authState =
    await resolveAdminAuthState();

  handleAdminAuthRedirect(
    authState
  );

  const permissionDecision =
    await checkSessionAnyPermission(
      authState.session,
      permissionSets
    );

  if (
    !permissionDecision.authorized
  ) {
    await recordPermissionDenial({
      session:
        authState.session,

      requestHeaders:
        authState.requestHeaders,

      permissionSets:
        permissionDecision.permissionSets,

      permissionMode:
        "any",

      path:
        String(
          options.path || ""
        )
          .trim()
          .slice(0, 1000),
    });

    redirect(
      String(
        options.redirectTo ||
          "/admin?access=denied"
      )
    );
  }

  return authState.session;
}

export {
  AUTH_STATES as ADMIN_AUTH_STATES,
};