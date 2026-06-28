import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdminAuth() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("obsidian-admin");

  if (!adminCookie || adminCookie.value !== "authenticated") {
    redirect("/admin/login");
  }
}