import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

function createAdminToken() {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SECRET is missing.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update("obsidian-admin-session")
    .digest("hex");
}

export async function requireAdminAuth() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("obsidian-admin");

  if (!adminCookie || adminCookie.value !== createAdminToken()) {
    redirect("/admin/login");
  }
}