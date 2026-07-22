"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
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

  account: {
    showDesktop: true,
    showMobile: true,

    loginLabel: "Login",
    registerLabel: "Register",
    accountLabel: "Account",

    loginHref: "/account/login",
    registerHref: "/account/register",
    accountHref: "/account",

    showAdminLogin: true,
    adminLoginLabel: "Admin Login",
    adminLoginHref: "/admin/login",
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

  return value.trim() || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeNavbarContent(
  content = {},
  settings = {}
) {
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

    account: {
      ...DEFAULT_NAVBAR.account,
      ...(navbar.account || {}),
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

      {!mobile && isActive ? (
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

export default function Navbar() {
  const pathname = usePathname();

  const {
    cartCount = 0,
    wishlistCount = 0,
    openMiniCart,
  } = useCart();

  const [isOpen, setIsOpen] =
    useState(false);

  const [navbar, setNavbar] = useState(
    () => normalizeNavbarContent()
  );

  const [customer, setCustomer] =
    useState(null);

  const [accountLoaded, setAccountLoaded] =
    useState(false);

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

        const [navbarData, settingsData] =
          await Promise.all([
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
          }
        );

        const data = await response.json();

        if (!active) {
          return;
        }

        if (
          response.ok &&
          data.success &&
          data.customer
        ) {
          setCustomer(data.customer);
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
      document.body.style.overflow = "";
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
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);

  const navigationItems = useMemo(
    () =>
      [...navbar.items]
        .filter(
          (item) =>
            item &&
            item.isActive !== false &&
            normalizeText(item.label) &&
            normalizeText(item.href)
        )
        .sort(
          (firstItem, secondItem) =>
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
      80
    ),
    320
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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f1ece4]/90 backdrop-blur-xl">
        {showAnnouncement ? (
          <div className="border-b border-black/10 bg-black px-5 py-3 text-center text-[#f1ece4]">
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
            ) : (
              <span className="truncate text-xl font-light uppercase tracking-[0.3em] text-black sm:text-2xl">
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
            {account.showDesktop &&
            accountLoaded ? (
              customer ? (
                <Link
                  href={account.accountHref}
                  className={`relative text-xs uppercase tracking-[0.24em] transition ${
                    isCurrentPath(
                      account.accountHref
                    )
                      ? "text-black"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  {account.accountLabel}

                  {isCurrentPath(
                    account.accountHref
                  ) ? (
                    <span className="absolute -bottom-3 left-0 h-px w-full bg-black" />
                  ) : null}
                </Link>
              ) : (
                <>
                  <Link
                    href={account.loginHref}
                    className="text-xs uppercase tracking-[0.24em] text-black/70 transition hover:text-black"
                  >
                    {account.loginLabel}
                  </Link>

                  <Link
                    href={
                      account.registerHref
                    }
                    className="border border-black px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition hover:bg-black hover:text-[#f1ece4]"
                  >
                    {account.registerLabel}
                  </Link>
                </>
              )
            ) : null}

            {account.showAdminLogin !==
            false ? (
              <Link
                href={normalizeText(
                  account.adminLoginHref,
                  "/admin/login"
                )}
                className={`relative text-[10px] uppercase tracking-[0.22em] transition ${
                  isCurrentPath(
                    normalizeText(
                      account.adminLoginHref,
                      "/admin/login"
                    )
                  )
                    ? "text-black"
                    : "text-black/50 hover:text-black"
                }`}
              >
                {normalizeText(
                  account.adminLoginLabel,
                  "Admin Login"
                )}

                {isCurrentPath(
                  normalizeText(
                    account.adminLoginHref,
                    "/admin/login"
                  )
                ) ? (
                  <span className="absolute -bottom-3 left-0 h-px w-full bg-black" />
                ) : null}
              </Link>
            ) : null}

            {desktop.showWishlist ? (
              <Link
                href="/wishlist"
                className="text-xs uppercase tracking-[0.24em] text-black transition hover:opacity-60"
              >
                Wishlist ({wishlistCount})
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

            {desktop.showAdminLink ? (
              <Link
                href="/admin"
                className="text-xs uppercase tracking-[0.24em] text-black transition hover:opacity-60"
              >
                Admin
              </Link>
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
                  (current) => !current
                )
              }
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              className="text-xs uppercase tracking-[0.26em]"
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
                <div className="flex flex-col gap-6">
                  {account.showMobile &&
                  accountLoaded ? (
                    customer ? (
                      <>
                        <Link
                          href={
                            account.accountHref
                          }
                          onClick={
                            closeMobileMenu
                          }
                          className="text-sm uppercase tracking-[0.28em]"
                        >
                          {
                            account.accountLabel
                          }
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={
                            closeMobileMenu
                          }
                          className="text-sm uppercase tracking-[0.28em]"
                        >
                          My Orders
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={
                            account.loginHref
                          }
                          onClick={
                            closeMobileMenu
                          }
                          className="text-sm uppercase tracking-[0.28em]"
                        >
                          {
                            account.loginLabel
                          }
                        </Link>

                        <Link
                          href={
                            account.registerHref
                          }
                          onClick={
                            closeMobileMenu
                          }
                          className="text-sm uppercase tracking-[0.28em]"
                        >
                          {
                            account.registerLabel
                          }
                        </Link>
                      </>
                    )
                  ) : null}

                  {account.showAdminLogin !==
                  false ? (
                    <Link
                      href={normalizeText(
                        account.adminLoginHref,
                        "/admin/login"
                      )}
                      onClick={
                        closeMobileMenu
                      }
                      className="text-sm uppercase tracking-[0.28em] text-black/60 transition hover:text-black"
                    >
                      {normalizeText(
                        account.adminLoginLabel,
                        "Admin Login"
                      )}
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
                      Wishlist ({wishlistCount})
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