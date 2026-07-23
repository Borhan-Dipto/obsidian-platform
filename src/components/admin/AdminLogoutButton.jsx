"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [hasError, setHasError] =
    useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setHasError(false);
    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/admin/logout",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let message =
          "Secure logout failed.";

        try {
          const data =
            await response.json();

          if (
            typeof data?.message ===
            "string"
          ) {
            message =
              data.message;
          }
        } catch {
          // The response did not contain JSON.
        }

        throw new Error(message);
      }

      router.replace(
        "/admin/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout failed:",
        error instanceof Error
          ? error.message
          : "Unknown logout error."
      );

      setHasError(true);
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      title={
        hasError
          ? "Logout failed. Select the button to try again."
          : "End secure Admin session"
      }
      className={`border px-5 py-3 text-xs uppercase tracking-[0.25em] transition disabled:cursor-wait disabled:opacity-50 ${
        hasError
          ? "border-amber-400/50 text-amber-300 hover:bg-amber-400 hover:text-black"
          : "border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white"
      }`}
    >
      {isLoggingOut
        ? "Logging Out..."
        : hasError
          ? "Try Again"
          : "Logout"}
    </button>
  );
}