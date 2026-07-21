"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLogoutButton from "./AdminLogoutButton";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/admin",
    description: "Overview",
    icon: "01",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    description: "Sales",
    icon: "02",
  },
  {
    label: "Products",
    href: "/admin/products",
    description: "Catalog",
    icon: "03",
  },
  {
    label: "Collections",
    href: "/admin/collections",
    description: "Merchandising",
    icon: "04",
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    description: "Promotions",
    icon: "05",
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    description: "Subscribers",
    icon: "06",
  },
  {
    label: "Homepage CMS",
    href: "/admin/content/homepage",
    description: "Storefront Content",
    icon: "07",
  },
  {
    label: "Navbar CMS",
    href: "/admin/content/navbar",
    description: "Navigation Content",
    icon: "08",
  },
  {
    label: "About CMS",
    href: "/admin/content/about",
    description: "Brand Story",
    icon: "09",
  },
  {
    label: "Contact CMS",
    href: "/admin/content/contact",
    description: "Support Content",
    icon: "10",
  },
  {
    label: "Journal CMS",
    href: "/admin/content/journal",
    description: "Stories & Editorial",
    icon: "11",
  },
  {
    label: "Collections CMS",
    href: "/admin/content/collections",
    description: "Page Content",
    icon: "12",
  },
  {
    label: "Shop CMS",
    href: "/admin/content/shop",
    description: "Shop Page Content",
    icon: "13",
  },
  {
    label: "Footer CMS",
    href: "/admin/content/footer",
    description: "Footer Content",
    icon: "14",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    description: "Configuration",
    icon: "15",
  },
];

function isNavigationItemActive(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isMobileMenuOpen]);

  const currentNavigationItem =
    navigationItems.find((item) =>
      isNavigationItemActive(
        pathname,
        item.href
      )
    ) || navigationItems[0];

  return (
    <div className="min-h-screen bg-[#080808] text-[#f1ece4]">
      <div className="min-h-screen lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#0b0b0b] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="border-b border-white/10 px-7 py-8">
            <Link
              href="/admin"
              className="block"
            >
              <p className="text-[10px] uppercase tracking-[0.45em] text-neutral-500">
                Commerce Platform
              </p>

              <h1 className="mt-4 font-heading text-4xl font-light tracking-wide">
                OBSIDIAN
              </h1>
            </Link>
          </div>

          <nav
            aria-label="Admin navigation"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <p className="px-3 text-[9px] uppercase tracking-[0.4em] text-neutral-600">
              Workspace
            </p>

            <div className="mt-4 space-y-2">
              {navigationItems.map(
                (item) => {
                  const isActive =
                    isNavigationItemActive(
                      pathname,
                      item.href
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        isActive
                          ? "page"
                          : undefined
                      }
                      className={`group grid grid-cols-[34px_1fr_auto] items-center gap-3 border px-4 py-4 transition ${
                        isActive
                          ? "border-white/15 bg-[#f1ece4] text-[#0b0b0b]"
                          : "border-transparent text-neutral-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-[#f1ece4]"
                      }`}
                    >
                      <span
                        className={`text-[9px] tracking-[0.25em] ${
                          isActive
                            ? "text-neutral-500"
                            : "text-neutral-600"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span>
                        <span className="block text-xs uppercase tracking-[0.25em]">
                          {item.label}
                        </span>

                        <span
                          className={`mt-1 block text-[10px] ${
                            isActive
                              ? "text-neutral-600"
                              : "text-neutral-600"
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className={`text-sm transition group-hover:translate-x-1 ${
                          isActive
                            ? "opacity-100"
                            : "opacity-35"
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  );
                }
              )}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between border border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.28em] text-neutral-400 transition hover:bg-white/5 hover:text-[#f1ece4]"
            >
              View Store
              <span aria-hidden="true">
                ↗
              </span>
            </Link>

            <div className="mt-3">
              <AdminLogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/90 backdrop-blur-xl">
            <div className="flex min-h-20 items-center justify-between gap-5 px-5 sm:px-7 lg:px-10">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setIsMobileMenuOpen(true)
                  }
                  aria-label="Open admin navigation"
                  className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-xs uppercase tracking-[0.2em] transition hover:bg-white/5 lg:hidden"
                >
                  Menu
                </button>

                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.35em] text-neutral-600">
                    Admin Workspace
                  </p>

                  <p className="mt-1 truncate text-sm uppercase tracking-[0.24em] text-neutral-300">
                    {
                      currentNavigationItem.label
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:bg-white/5 hover:text-[#f1ece4] sm:inline-flex"
                >
                  Store ↗
                </Link>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-heading text-lg">
                  O
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-[calc(100vh-5rem)]">
            {children}
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] flex-col border-r border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-7">
              <Link
                href="/admin"
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
              >
                <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-600">
                  Commerce Platform
                </p>

                <p className="mt-3 font-heading text-3xl font-light">
                  OBSIDIAN
                </p>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                aria-label="Close navigation"
                className="flex h-10 w-10 items-center justify-center border border-white/15 text-xl text-neutral-400 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <nav
              aria-label="Mobile admin navigation"
              className="flex-1 overflow-y-auto p-4"
            >
              <div className="space-y-2">
                {navigationItems.map(
                  (item) => {
                    const isActive =
                      isNavigationItemActive(
                        pathname,
                        item.href
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={
                          isActive
                            ? "page"
                            : undefined
                        }
                        onClick={() =>
                          setIsMobileMenuOpen(
                            false
                          )
                        }
                        className={`grid grid-cols-[34px_1fr_auto] items-center gap-3 border px-4 py-4 transition ${
                          isActive
                            ? "border-white/15 bg-[#f1ece4] text-[#0b0b0b]"
                            : "border-transparent text-neutral-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-[#f1ece4]"
                        }`}
                      >
                        <span className="text-[9px] tracking-[0.25em] opacity-50">
                          {item.icon}
                        </span>

                        <span>
                          <span className="block text-xs uppercase tracking-[0.25em]">
                            {item.label}
                          </span>

                          <span className="mt-1 block text-[10px] opacity-50">
                            {item.description}
                          </span>
                        </span>

                        <span aria-hidden="true">
                          →
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between border border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.28em] text-neutral-400 transition hover:bg-white/5 hover:text-[#f1ece4]"
              >
                View Store
                <span aria-hidden="true">
                  ↗
                </span>
              </Link>

              <div className="mt-3">
                <AdminLogoutButton />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}