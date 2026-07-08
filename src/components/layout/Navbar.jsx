"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [storeName, setStoreName] = useState("OBSIDIAN");
  const { cartCount } = useCart();

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (response.ok && data.success) {
          setStoreName(data.settings?.store?.name || "OBSIDIAN");
        }
      } catch {
        setStoreName("OBSIDIAN");
      }
    }

    loadSettings();
  }, []);

  const links = [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "Track Order", href: "/track-order" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f1ece4]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="text-2xl font-light uppercase tracking-[0.32em] text-[#0b0b0b]"
        >
          {storeName}
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-[0.28em] text-[#0b0b0b] transition hover:opacity-60"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          <Link
            href="/cart"
            className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
          >
            Cart ({cartCount})
          </Link>

          <Link
            href="/admin/login"
            className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
          >
            Admin
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs uppercase tracking-[0.28em] text-[#0b0b0b] lg:hidden"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-black/10 bg-[#f1ece4] px-6 py-8 lg:hidden">
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="border-t border-black/10 pt-6 text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
            >
              Cart ({cartCount})
            </Link>

            <Link
              href="/admin/login"
              onClick={() => setIsOpen(false)}
              className="text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}