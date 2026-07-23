import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./adminAuthCore";

const ADMIN_ROLE = "admin";

const AUTH_STATES = {
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  FORBIDDEN: "forbidden",
  TWO_FACTOR_REQUIRED: "two_factor_required",
};

function normalizeRoles(roleValue) {
  if (Array.isArray(roleValue)) {
    return roleValue
      .map((role) =>
        String(role || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  }

  return String(roleValue || "")
    .split(",")
    .map((role) =>
      role.trim().toLowerCase()
    )
    .filter(Boolean);
}

function hasAdminRole(user) {
  return normalizeRoles(
    user?.role
  ).includes(ADMIN_ROLE);
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

async function resolveAdminAuthState() {
  /*
   * Keep headers() outside try/catch.
   *
   * During Next.js static analysis,
   * headers() may throw an internal
   * dynamic-rendering signal that Next.js
   * must receive and handle itself.
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
    };
  }

  const user = session?.user;

  if (!user) {
    return {
      status:
        AUTH_STATES.UNAUTHENTICATED,
      session: null,
    };
  }

  if (
    !hasAdminRole(user) ||
    user.emailVerified !== true ||
    hasActiveBan(user)
  ) {
    return {
      status:
        AUTH_STATES.FORBIDDEN,
      session: null,
    };
  }

  if (
    user.twoFactorEnabled !== true
  ) {
    return {
      status:
        AUTH_STATES.TWO_FACTOR_REQUIRED,
      session,
    };
  }

  return {
    status:
      AUTH_STATES.AUTHENTICATED,
    session,
  };
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

export async function requireAdminAuth() {
  const authState =
    await resolveAdminAuthState();

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
    redirect("/admin/login");
  }

  return true;
}