import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "obsidian-admin";
const ADMIN_TOKEN_PAYLOAD = "obsidian-admin-session";

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SECRET is missing.");
  }

  return secret;
}

function createAdminToken() {
  return crypto
    .createHmac("sha256", getAdminSecret())
    .update(ADMIN_TOKEN_PAYLOAD)
    .digest("hex");
}

function safeCompareTokens(receivedToken, expectedToken) {
  if (
    typeof receivedToken !== "string" ||
    typeof expectedToken !== "string"
  ) {
    return false;
  }

  const receivedBuffer = Buffer.from(receivedToken, "utf8");
  const expectedBuffer = Buffer.from(expectedToken, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!adminCookie?.value) {
    return false;
  }

  return safeCompareTokens(adminCookie.value, createAdminToken());
}

export async function requireAdminAuth() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return true;
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}

export function generateAdminSessionToken() {
  return createAdminToken();
}