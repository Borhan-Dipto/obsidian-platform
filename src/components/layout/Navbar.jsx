"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCart } from "../../context/CartContext";
import {
  isSafePublicNavigationHref,
  sanitizeNavbarContent,
} from "../../lib/navbarCms";

const DEFAULT_NAVBAR = {
  key: "navbar",
  schemaVersion: 1,
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
  },

  mobile: {
    showWishlist: true,
    showCart: true,
    showSearch: false,
  },

  account: {
    showDesktop: true,
    showMobile: true,
    label: "Account",
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

function normalizeText(
  value,
  fallback = ""
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
}

function normalizeNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeNavbarContent(
  content = {},
  settings = {}
) {
  const source =
    content &&
    typeof content === "object" &&
    !Array.isArray(content)
      ? content
      : {};

  const configuredStoreName =
    normalizeText(
      source.branding?.storeName,
      normalizeText(
        settings.store?.name,
        DEFAULT_NAVBAR.branding.storeName
      )
    );

  return sanitizeNavbarContent(
    {
      ...DEFAULT_NAVBAR,
      ...source,

      branding: {
        ...DEFAULT_NAVBAR.branding,
        ...(source.branding || {}),
        storeName: configuredStoreName,
      },

      desktop: {
        ...DEFAULT_NAVBAR.desktop,
        ...(source.desktop || {}),
      },

      mobile: {
        ...DEFAULT_NAVBAR.mobile,
        ...(source.mobile || {}),
      },

      account: {
        ...DEFAULT_NAVBAR.account,
        ...(source.account || {}),
      },

      items: Array.isArray(source.items)
        ? source.items
        : DEFAULT_NAVBAR.items,

      announcement: {
        ...DEFAULT_NAVBAR.announcement,
        ...(source.announcement || {}),
      },
    },
    {
      schemaVersion: Number(
        source.schemaVersion || 1
      ),
    }
  );
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
  announcement = false,
}) {
  const external =
    isExternalLink(href);

  const className = announcement
    ? "text-[9px] uppercase tracking-[0.32em] text-[#f1ece4]/90 transition hover:text-[#f1ece4]"
    : mobile
      ? `text-sm uppercase tracking-[0.28em] transition ${
          isActive
            ? "text-black"
            : "text-black/70 hover:text-black"
        }`
      : `relative text-xs uppercase tracking-[0.26em] transition ${
          isActive
            ? "text-black"
            : "text-black/70 hover:text-black"
        }`;

  const content = (
    <>
      {label}

      {!mobile &&
      !announcement &&
      isActive ? (
        <span className="absolute -bottom-3 left-0 h-px w-full bg-black" />
      ) : null}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target={
          openInNewTab
            ? "_blank"
            : undefined
        }
        rel={
          openInNewTab
            ? "noopener noreferrer"
            : undefined
        }
        onClick={onClick}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={
        openInNewTab
          ? "_blank"
          : undefined
      }
      rel={
        openInNewTab
          ? "noopener noreferrer"
          : undefined
      }
      onClick={onClick}
      className={className}
    >
      {content}
    </Link>
  );
}

function AccountButton({
  href,
  label,
  isActive,
  onClick,
  mobile = false,
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center justify-between border px-5 py-4 text-sm uppercase tracking-[0.28em] transition ${
          isActive
            ? "border-black bg-black text-[#f1ece4]"
            : "border-black/20 text-black hover:border-black hover:bg-black hover:text-[#f1ece4]"
        }`}
      >
        <span>{label}</span>

        <span
          aria-hidden="true"
          className="text-base font-light"
        >
          ↗
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`border px-4 py-2.5 text-[10px] uppercase tracking-[0.24em] transition ${
        isActive
          ? "border-black bg-black text-[#f1ece4]"
          : "border-black/30 text-black hover:border-black hover:bg-black hover:text-[#f1ece4]"
      }`}
    >
      {label}
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

  const [isOpen, setIsOpen] =
    useState(false);

  const [navbar, setNavbar] =
    useState(() =>
      normalizeNavbarContent()
    );

  const [customer, setCustomer] =
    useState(null);

  const [
    accountLoaded,
    setAccountLoaded,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNavbar() {
      try {
        const [
          navbarResponse,
          settingsResponse,
        ] = await Promise.all([
          fetch("/api/cms/navbar", {
            cache: "no-store",
          }),

          fetch("/api/settings", {
            cache: "no-store",
          }),
        ]);

        const [
          navbarData,
          settingsData,
        ] = await Promise.all([
          navbarResponse.json(),
          settingsResponse.json(),
        ]);

        if (!active) {
          return;
        }

        setNavbar(
          normalizeNavbarContent(
            navbarResponse.ok &&
              navbarData.success
              ? navbarData.content
              : {},

            settingsResponse.ok &&
              settingsData.success
              ? settingsData.settings
              : {}
          )
        );
      } catch (error) {
        console.error(
          "Navbar loading error:",
          error
        );

        if (active) {
          setNavbar(
            normalizeNavbarContent()
          );
        }
      }
    }

    loadNavbar();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      setAccountLoaded(false);

      try {
        const response = await fetch(
          "/api/account/profile",
          {
            cache: "no-store",
            credentials: "same-origin",
          }
        );

        let data = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!active) {
          return;
        }

        if (
          response.ok &&
          data?.success &&
          data.customer
        ) {
          setCustomer(
            data.customer
          );
        } else {
          setCustomer(null);
        }
      } catch {
        if (active) {
          setCustomer(null);
        }
      } finally {
        if (active) {
          setAccountLoaded(true);
        }
      }
    }

    loadCustomer();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow =
        "";

      return undefined;
    }

    document.body.style.overflow =
      "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);

  const navigationItems =
    useMemo(
      () =>
        [...navbar.items]
          .filter(
            (item) =>
              item &&
              item.isActive !==
                false &&
              normalizeText(
                item.label
              ) &&
              normalizeText(
                item.href
              ) &&
              isSafePublicNavigationHref(
                item.href
              )
          )
          .sort(
            (
              firstItem,
              secondItem
            ) =>
              normalizeNumber(
                firstItem.order
              ) -
              normalizeNumber(
                secondItem.order
              )
          ),
      [navbar.items]
    );

  function isCurrentPath(href) {
    if (
      !href ||
      isExternalLink(href)
    ) {
      return false;
    }

    const hrefPath = href
      .split("?")[0]
      .split("#")[0];

    if (hrefPath === "/") {
      return pathname === "/";
    }

    return (
      pathname === hrefPath ||
      pathname.startsWith(
        `${hrefPath}/`
      )
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
    account,
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
      normalizeNumber(
        branding.logoWidth,
        180
      ),
      40
    ),
    500
  );

  const announcementText =
    normalizeText(
      announcement.text
    );

  const announcementHref =
    normalizeText(
      announcement.href
    );

  const showAnnouncement =
    announcement.isEnabled &&
    announcementText;

  const accountLabel =
    normalizeText(
      account.label,
      "Account"
    );

  const accountHref = customer
    ? "/account"
    : "/account/login";

  const accountPathActive =
    pathname === "/account" ||
    pathname.startsWith(
      "/account/"
    );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f1ece4]/90 backdrop-blur-xl">
        {showAnnouncement ? (
          <div className="border-b border-black/10 bg-black px-5 py-3 text-center text-[#f1ece4]">
            {announcementHref &&
            isSafePublicNavigationHref(
              announcementHref
            ) ? (
              <NavbarLink
                href={
                  announcementHref
                }
                label={
                  announcementText
                }
                openInNewTab={
                  announcement.openInNewTab
                }
                announcement
              />
            ) : (
              <p className="text-[9px] uppercase tracking-[0.32em]">
                {announcementText}
              </p>
            )}
          </div>
        ) : null}

        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-6 lg:px-10"
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
            ) : branding.showTextLogo ? (
              <span className="truncate text-xl font-light uppercase tracking-[0.3em] text-black sm:text-2xl">
                {storeName}
              </span>
            ) : (
              <span className="sr-only">
                {storeName}
              </span>
            )}
          </Link>

          <div className="hidden min-w-0 items-center gap-7 xl:flex">
            {navigationItems.map(
              (item) => (
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
              )
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-5 lg:flex">
            {account.showDesktop ? (
              accountLoaded ? (
                <AccountButton
                  href={accountHref}
                  label={accountLabel}
                  isActive={
                    accountPathActive
                  }
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="h-[38px] w-[102px] animate-pulse border border-black/10 bg-black/[0.03]"
                />
              )
            ) : null}

            {desktop.showSearch ? (
              <Link
                href="/shop"
                className="text-xs uppercase tracking-[0.24em] text-black/70 transition hover:text-black"
              >
                Search
              </Link>
            ) : null}

            {desktop.showWishlist ? (
              <Link
                href="/wishlist"
                className="text-xs uppercase tracking-[0.24em] text-black transition hover:opacity-60"
              >
                Wishlist (
                {wishlistCount})
              </Link>
            ) : null}

            {desktop.showCart ? (
              <button
                type="button"
                onClick={openMiniCart}
                className="text-xs uppercase tracking-[0.24em] text-black transition hover:opacity-60"
              >
                Cart ({cartCount})
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-4 lg:hidden">
            {mobile.showCart ? (
              <button
                type="button"
                onClick={openMiniCart}
                aria-label={`Open cart with ${cartCount} items`}
                className="text-[10px] uppercase tracking-[0.2em]"
              >
                Cart ({cartCount})
              </button>
            ) : null}

            <button
              type="button"
              onClick={() =>
                setIsOpen(
                  (current) =>
                    !current
                )
              }
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              className="text-xs uppercase tracking-[0.26em]"
            >
              {isOpen
                ? "Close"
                : "Menu"}
            </button>
          </div>
        </nav>

        {isOpen ? (
          <div
            id="mobile-navigation"
            className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-black/10 bg-[#f1ece4] px-6 py-8 lg:hidden"
          >
            <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
              {navigationItems.map(
                (item) => (
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
                    onClick={
                      closeMobileMenu
                    }
                    mobile
                  />
                )
              )}

              <div className="mt-2 border-t border-black/10 pt-6">
                <div className="flex flex-col gap-5">
                  {account.showMobile ? (
                    accountLoaded ? (
                      <AccountButton
                        href={
                          accountHref
                        }
                        label={
                          accountLabel
                        }
                        isActive={
                          accountPathActive
                        }
                        onClick={
                          closeMobileMenu
                        }
                        mobile
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-[58px] animate-pulse border border-black/10 bg-black/[0.03]"
                      />
                    )
                  ) : null}

                  {customer ? (
                    <Link
                      href="/account/orders"
                      onClick={
                        closeMobileMenu
                      }
                      className="text-sm uppercase tracking-[0.28em] text-black/70 transition hover:text-black"
                    >
                      My Orders
                    </Link>
                  ) : null}

                  {mobile.showSearch ? (
                    <Link
                      href="/shop"
                      onClick={
                        closeMobileMenu
                      }
                      className="text-sm uppercase tracking-[0.28em]"
                    >
                      Search
                    </Link>
                  ) : null}

                  {mobile.showWishlist ? (
                    <Link
                      href="/wishlist"
                      onClick={
                        closeMobileMenu
                      }
                      className="text-sm uppercase tracking-[0.28em]"
                    >
                      Wishlist (
                      {wishlistCount})
                    </Link>
                  ) : null}

                  {mobile.showCart ? (
                    <button
                      type="button"
                      onClick={
                        handleMobileCart
                      }
                      className="text-left text-sm uppercase tracking-[0.28em]"
                    >
                      Cart ({cartCount})
                    </button>
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