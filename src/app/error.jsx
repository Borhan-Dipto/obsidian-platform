"use client";

import Link from "next/link";
import { useEffect } from "react";

/* Shown when a page fails unexpectedly; keeps the customer on the site. */
export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-[#f1ece4] px-6 py-24 text-[#0b0b0b] lg:px-10">
      <div className="mx-auto w-full max-w-[1440px]">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          OBSIDIAN
        </p>

        <h1 className="mt-6 max-w-3xl font-heading text-5xl font-light leading-[0.95] sm:text-7xl">
          Something went wrong.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
          This page didn’t load properly. Please try again — your cart is
          safe. If it keeps happening, message us on WhatsApp.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex min-h-14 items-center justify-center bg-[#0b0b0b] px-8 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85"
          >
            Try again
          </button>

          <Link
            href="/shop"
            className="inline-flex min-h-14 items-center justify-center border border-[#0b0b0b] px-8 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            Go to shop
          </Link>
        </div>

        {error?.digest ? (
          <p className="mt-10 text-xs text-neutral-500">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
