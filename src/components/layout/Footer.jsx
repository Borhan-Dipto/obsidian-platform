"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [settings, setSettings] = useState({
    store: {
      name: "OBSIDIAN",
      tagline: "Built under pressure. Finished with precision.",
    },
    contact: {
      email: "hello@obsidianwear.com",
      location: "Dhaka, Bangladesh",
    },
    social: {
      facebookUrl: "",
      instagramUrl: "",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (response.ok && data.success) {
          setSettings(data.settings);
        }
      } catch {
        // fallback settings will be used
      }
    }

    loadSettings();
  }, []);

  return (
    <footer className="bg-[#0b0b0b] px-6 py-16 text-[#f1ece4] md:py-20">
      <div className="container-custom">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <h2 className="text-3xl font-light uppercase tracking-[0.3em]">
              {settings.store?.name || "OBSIDIAN"}
            </h2>

            <p className="mt-6 max-w-xs text-sm leading-7 text-neutral-400">
              {settings.store?.tagline ||
                "Built under pressure. Finished with precision."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-neutral-500">
              {settings.contact?.email && <p>{settings.contact.email}</p>}
              {settings.contact?.location && <p>{settings.contact.location}</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Shop
            </h3>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li>
                <Link href="/shop" className="transition hover:text-white">
                  All Products
                </Link>
              </li>

              <li>
                <Link href="/collections" className="transition hover:text-white">
                  Collections
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?series=Artifact%20Series"
                  className="transition hover:text-white"
                >
                  New Drop
                </Link>
              </li>

              <li>
                <Link href="/track-order" className="transition hover:text-white">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Support
            </h3>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Contact
                </Link>
              </li>

              <li>
                <Link href="/size-guide" className="transition hover:text-white">
                  Size Guide
                </Link>
              </li>

              <li>
                <Link href="/track-order" className="transition hover:text-white">
                  Order Status
                </Link>
              </li>

              <li>
                <Link href="/about" className="transition hover:text-white">
                  About
                </Link>
              </li>
            </ul>

            <div className="mt-6 space-y-3 text-sm text-neutral-300">
              {settings.social?.facebookUrl && (
                <a
                  href={settings.social.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-white"
                >
                  Facebook
                </a>
              )}

              {settings.social?.instagramUrl && (
                <a
                  href={settings.social.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-white"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Stay In Touch
            </h3>

            <p className="mb-6 max-w-sm text-sm leading-7 text-neutral-400">
              Join the {settings.store?.name || "Obsidian"} community for
              future drops and stories.
            </p>

            <div className="flex border border-white/20">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600"
              />

              <button className="border-l border-white/20 px-4 text-xs uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.22em] text-neutral-600 md:mt-16 md:text-xs md:tracking-[0.25em]">
          © 2026 {settings.store?.name || "Obsidian"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}