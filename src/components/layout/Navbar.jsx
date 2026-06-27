"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount } = useCart();

  const links = [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections/artifact" },
    { label: "Journal", href: "/journal" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-black/5 bg-[#f1ece4]/80 backdrop-blur-md">
      <nav className="container-custom flex h-20 items-center justify-between px-6">
        <a
          href="/"
          className="text-[28px] font-light tracking-[0.28em] md:text-[32px]"
        >
          OBSIDIAN
        </a>

        <div className="hidden items-center gap-12 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-[0.25em] transition-opacity hover:opacity-60"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
          >
            Search
          </a>

          <a
            href="#"
            className="text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
          >
            Account
          </a>

          <a
            href="/cart"
            className="text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
          >
            Cart ({cartCount})
          </a>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs uppercase tracking-[0.25em] md:hidden"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-black/5 bg-[#f1ece4] px-6 py-8 md:hidden">
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm uppercase tracking-[0.28em]"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-4 border-t border-black/10 pt-6">
              <a
                href="#"
                className="block py-2 text-sm uppercase tracking-[0.25em]"
              >
                Search
              </a>

              <a
                href="#"
                className="block py-2 text-sm uppercase tracking-[0.25em]"
              >
                Account
              </a>

              <a
                href="/cart"
                className="block py-2 text-sm uppercase tracking-[0.25em]"
              >
                Cart ({cartCount})
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}