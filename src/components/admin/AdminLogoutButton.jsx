"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      alert("Logout failed. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="border border-red-500/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-500 hover:text-white"
    >
      Logout
    </button>
  );
}