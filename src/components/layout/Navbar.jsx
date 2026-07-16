"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";

const DEFAULT_NAVBAR = {
  isEnabled: true,

  branding: {
    showTextLogo: true,
    storeName: "OBSIDIAN",
    logoUrl: "",
    logoAlt: "OBSIDIAN",
    logoWidth: 180,
  },

  desktop: {
    showWishlist: true,
    showCart: true,
    showSearch: false,
    showAdminLink: false,
  },

  mobile: {
    showWishlist: true,
    showCart: true,
    showSearch: false,
  },

  items: [
    {
      id: "nav-shop",
      label: "Shop",
      href: "/shop",
      order: 1,
      isActive: true,
      openInNewTab: false,
    },
    {
      id: "nav-collections",
      label: "Collections",
      href: "/collections",
      order: 2,
      isActive: true,
      openInNewTab: false,
    },
    {
      id: "nav-track-order",
      label: "Track Order",
      href: "/track-order",
      order: 3,
      isActive: true,
      openInNewTab: false,
    },
    {
      id: "nav-about",
      label: "About",
      href: "/about",
      order: 4,
      isActive: true,
      openInNewTab: false,
    },
  ],

  announcement: {
    isEnabled: false,
    text: "",
    href: "",
    openInNewTab: false,
  },
};

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeNavbarContent(content = {}, settings = {}) {
  const navbar = content || {};

  return {
    isEnabled: navbar.isEnabled !== false,

    branding: {
      ...DEFAULT_NAVBAR.branding,
      ...(navbar.branding || {}),

      storeName: normalizeText(
        navbar.branding?.storeName,
        normalizeText(
          settings.store?.name,
          DEFAULT_NAVBAR.branding.storeName
        )
      ),

      logoWidth: normalizeNumber(
        navbar.branding?.logoWidth,
        DEFAULT_NAVBAR.branding.logoWidth
      ),
    },

    desktop: {
      ...DEFAULT_NAVBAR.desktop,
      ...(navbar.desktop || {}),
    },

    mobile: {
      ...DEFAULT_NAVBAR.mobile,
      ...(navbar.mobile || {}),
    },

    items: Array.isArray(navbar.items)
      ? navbar.items
      : DEFAULT_NAVBAR.items,

    announcement: {
      ...DEFAULT_NAVBAR.announcement,
      ...(navbar.announcement || {}),
    },
  };
}

function isExternalLink(href) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}

function NavbarLink({
  href,
  label,
  openInNewTab = false,
  isActive = false,
  onClick,
  mobile = false,
}) {
  const external = isExternalLink(href);

  const className = mobile
    ? `text-sm uppercase tracking-[0.28em] transition ${
        isActive
          ? "text-[#0b0b0b]"
          : "text-[#0b0b0b]/70 hover:text-[#0b0b0b]"
      }`
    : `relative text-xs uppercase tracking-[0.28em] transition ${
        isActive
          ? "text-[#0b0b0b]"
          : "text-[#0b0b0b]/75 hover:text-[#0b0b0b]"
      }`;

  if (external) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        onClick={onClick}
        className={className}
      >
        {label}

        {!mobile && isActive ? (
          <span className="absolute -bottom-3 left-0 h-px w-full bg-[#0b0b0b]" />
        ) : null}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className={className}
    >
      {label}

      {!mobile && isActive ? (
        <span className="absolute -bottom-3 left-0 h-px w-full bg-[#0b0b0b]" />
      ) : null}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const {
    cartCount = 0,
    wishlistCount = 0,
    openMiniCart,
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);

  const [navbar, setNavbar] = useState(() =>
    normalizeNavbarContent()
  );

  useEffect(() => {
    let isMounted = true;

    async function loadNavbar() {
      try {
        const [navbarResponse, settingsResponse] =
          await Promise.all([
            fetch("/api/cms/navbar", {
              method: "GET",
              cache: "no-store",
            }),
            fetch("/api/settings", {
              method: "GET",
              cache: "no-store",
            }),
          ]);

        const [navbarData, settingsData] =
          await Promise.all([
            navbarResponse.json(),
            settingsResponse.json(),
          ]);

        if (!isMounted) {
          return;
        }

        const navbarContent =
          navbarResponse.ok && navbarData.success
            ? navbarData.content
            : {};

        const settings =
          settingsResponse.ok && settingsData.success
            ? settingsData.settings
            : {};

        setNavbar(
          normalizeNavbarContent(
            navbarContent,
            settings
          )
        );
      } catch (error) {
        console.error(
          "Navbar content loading error:",
          error
        );

        if (isMounted) {
          setNavbar(normalizeNavbarContent());
        }
      }
    }

    loadNavbar();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);

  const navigationItems = useMemo(() => {
    return [...navbar.items]
      .filter(
        (item) =>
          item &&
          item.isActive !== false &&
          normalizeText(item.label) &&
          normalizeText(item.href)
      )
      .sort(
        (firstItem, secondItem) =>
          normalizeNumber(firstItem.order) -
          normalizeNumber(secondItem.order)
      );
  }, [navbar.items]);

  function isCurrentPath(href) {
    if (!href || isExternalLink(href)) {
      return false;
    }

    const hrefPath = href.split("?")[0].split("#")[0];

    if (hrefPath === "/") {
      return pathname === "/";
    }

    return (
      pathname === hrefPath ||
      pathname.startsWith(`${hrefPath}/`)
    );
  }

  function closeMobileMenu() {
    setIsOpen(false);
  }

  function handleMobileCart() {
    setIsOpen(false);
    openMiniCart();
  }

  if (!navbar.isEnabled) {
    return null;
  }

  const {
    branding,
    desktop,
    mobile,
    announcement,
  } = navbar;

  const storeName = normalizeText(
    branding.storeName,
    "OBSIDIAN"
  );

  const logoUrl = normalizeText(
    branding.logoUrl
  );

  const logoAlt = normalizeText(
    branding.logoAlt,
    storeName
  );

  const logoWidth = Math.min(
    Math.max(
      normalizeNumber(branding.logoWidth, 180),
      80
    ),
    320
  );

  const announcementText = normalizeText(
    announcement.text
  );

  const announcementHref = normalizeText(
    announcement.href
  );

  const showAnnouncement =
    announcement.isEnabled &&
    announcementText;

  const headerTopClass = showAnnouncement
    ? "top-0"
    : "top-0";

  return (
    <>
      <header
        className={`fixed inset-x-0 ${headerTopClass} z-50 border-b border-black/10 bg-[#f1ece4]/90 backdrop-blur-xl`}
      >
        {showAnnouncement ? (
          <div className="border-b border-black/10 bg-[#0b0b0b] px-5 py-3 text-center text-[#f1ece4]">
            {announcementHref ? (
              <NavbarLink
                href={announcementHref}
                label={announcementText}
                openInNewTab={
                  announcement.openInNewTab
                }
                mobile
              />
            ) : (
              <p className="text-[9px] uppercase tracking-[0.32em] text-[#f1ece4]">
                {announcementText}
              </p>
            )}
          </div>
        ) : null}

        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10"
        >
          <Link
            href="/"
            aria-label={`${storeName} home`}
            className="flex min-w-0 shrink-0 items-center"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                style={{
                  width: `${logoWidth}px`,
                }}
                className="h-auto max-h-12 max-w-[220px] object-contain object-left"
              />
            ) : branding.showTextLogo !== false ? (
              <span className="truncate text-2xl font-light uppercase tracking-[0.32em] text-[#0b0b0b]">
                {storeName}
              </span>
            ) : (
              <span className="text-2xl font-light uppercase tracking-[0.32em] text-[#0b0b0b]">
                {storeName}
              </span>
            )}
          </Link>

          <div className="hidden min-w-0 items-center gap-8 xl:flex">
            {navigationItems.map((item) => (
              <NavbarLink
                key={
                  item.id ||
                  `${item.label}-${item.href}`
                }
                href={item.href}
                label={item.label}
                openInNewTab={
                  item.openInNewTab
                }
                isActive={isCurrentPath(
                  item.href
                )}
              />
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-6 lg:flex">
            {desktop.showSearch ? (
              <Link
                href="/shop"
                className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
              >
                Search
              </Link>
            ) : null}

            {desktop.showWishlist ? (
              <Link
                href="/wishlist"
                className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
              >
                Wishlist ({wishlistCount})
              </Link>
            ) : null}

            {desktop.showCart ? (
              <button
                type="button"
                onClick={openMiniCart}
                className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
              >
                Cart ({cartCount})
              </button>
            ) : null}

            {desktop.showAdminLink ? (
              <Link
                href="/admin"
                className="text-xs uppercase tracking-[0.24em] text-[#0b0b0b] transition hover:opacity-60"
              >
                Admin
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-5 lg:hidden">
            {mobile.showCart ? (
              <button
                type="button"
                onClick={openMiniCart}
                aria-label={`Open cart with ${cartCount} items`}
                className="text-[10px] uppercase tracking-[0.22em] text-[#0b0b0b]"
              >
                Cart ({cartCount})
              </button>
            ) : null}

            <button
              type="button"
              onClick={() =>
                setIsOpen((current) => !current)
              }
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              className="text-xs uppercase tracking-[0.28em] text-[#0b0b0b]"
            >
              {isOpen ? "Close" : "Menu"}
            </button>
          </div>
        </nav>

        {isOpen ? (
          <div
            id="mobile-navigation"
            className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-black/10 bg-[#f1ece4] px-6 py-8 lg:hidden"
          >
            <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
              {navigationItems.map((item) => (
                <NavbarLink
                  key={
                    item.id ||
                    `${item.label}-${item.href}`
                  }
                  href={item.href}
                  label={item.label}
                  openInNewTab={
                    item.openInNewTab
                  }
                  isActive={isCurrentPath(
                    item.href
                  )}
                  onClick={closeMobileMenu}
                  mobile
                />
              ))}

              <div className="mt-2 border-t border-black/10 pt-6">
                <div className="flex flex-col gap-6">
                  {mobile.showSearch ? (
                    <Link
                      href="/shop"
                      onClick={closeMobileMenu}
                      className="text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
                    >
                      Search
                    </Link>
                  ) : null}

                  {mobile.showWishlist ? (
                    <Link
                      href="/wishlist"
                      onClick={closeMobileMenu}
                      className="text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
                    >
                      Wishlist ({wishlistCount})
                    </Link>
                  ) : null}

                  {mobile.showCart ? (
                    <button
                      type="button"
                      onClick={handleMobileCart}
                      className="text-left text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
                    >
                      Cart ({cartCount})
                    </button>
                  ) : null}

                  {desktop.showAdminLink ? (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="text-sm uppercase tracking-[0.28em] text-[#0b0b0b]"
                    >
                      Admin
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <div
        aria-hidden="true"
        className={
          showAnnouncement
            ? "h-[116px]"
            : "h-20"
        }
      />
    </>
  );
}