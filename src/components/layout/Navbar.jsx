"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCart } from "../../context/CartContext";
import {
  isSafePublicNavigationHref,
  sanitizeNavbarContent,
} from "../../lib/navbarCms";

const DEFAULT_TAGLINE =
  "Built Under Pressure. Finished With Precision.";

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

  const storeName = normalizeText(
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
        storeName,
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

function getSafeCount(value) {
  const count = Number(value);

  if (
    !Number.isFinite(count) ||
    count < 0
  ) {
    return 0;
  }

  return Math.floor(count);
}

function formatCount(value) {
  const count = getSafeCount(value);

  return count > 99
    ? "99+"
    : String(count);
}

function getFocusableElements(
  container
) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(",")
    )
  ).filter(
    (element) =>
      element.offsetParent !== null &&
      element.getAttribute(
        "aria-hidden"
      ) !== "true"
  );
}

function trapFocus(
  event,
  container
) {
  if (
    event.key !== "Tab" ||
    !container
  ) {
    return;
  }

  const elements =
    getFocusableElements(container);

  if (!elements.length) {
    event.preventDefault();
    return;
  }

  const firstElement =
    elements[0];

  const lastElement =
    elements[elements.length - 1];

  if (
    event.shiftKey &&
    document.activeElement ===
      firstElement
  ) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (
    !event.shiftKey &&
    document.activeElement ===
      lastElement
  ) {
    event.preventDefault();
    firstElement.focus();
  }
}

function SearchIcon({
  className = "h-[19px] w-[19px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle
        cx="11"
        cy="11"
        r="6.4"
        stroke="currentColor"
        strokeWidth="1.35"
      />

      <path
        d="M15.8 15.8 21 21"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AccountIcon({
  className = "h-[19px] w-[19px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.35"
      />

      <path
        d="M5.8 20c.45-3.8 2.55-5.7 6.2-5.7s5.75 1.9 6.2 5.7"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon({
  className = "h-[19px] w-[19px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 20 4.9 13.25C2.15 10.6 3.4 5.7 7.3 5.3c1.95-.2 3.5.8 4.7 2.3 1.2-1.5 2.75-2.5 4.7-2.3 3.9.4 5.15 5.3 2.4 7.95L12 20Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon({
  className = "h-[19px] w-[19px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M5.6 8.5h12.8l-.65 11.7H6.25L5.6 8.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />

      <path
        d="M8.75 8.7V6.8A3.15 3.15 0 0 1 12 3.75a3.15 3.15 0 0 1 3.25 3.05v1.9"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({
  className = "h-4 w-4",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M4 10h11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      <path
        d="m11 6 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalArrowIcon({
  className = "h-4 w-4",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M6 14 14 6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      <path
        d="M8 6h6v6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({
  open = false,
}) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-[14px] w-5"
    >
      <span
        className={`absolute left-0 top-0 h-px bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "w-5 translate-y-[6px] rotate-45"
            : "w-5"
        }`}
      />

      <span
        className={`absolute right-0 top-[6px] h-px bg-current transition-all duration-300 ${
          open
            ? "w-0 opacity-0"
            : "w-[13px] opacity-100"
        }`}
      />

      <span
        className={`absolute bottom-0 left-0 h-px bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "w-5 -translate-y-[7px] -rotate-45"
            : "w-5"
        }`}
      />
    </span>
  );
}

function CountBadge({
  value,
}) {
  return (
    <span
      key={formatCount(value)}
      className="obsidian-count-pop absolute -right-1 -top-1 flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full border border-white/55 bg-black/90 px-1 text-[7px] font-semibold leading-none text-white shadow-[0_4px_12px_rgba(0,0,0,0.24)] backdrop-blur-xl"
    >
      {formatCount(value)}
    </span>
  );
}

function BrandLockup({
  branding,
  storeName,
  logoUrl,
  logoAlt,
  logoWidth,
  compact = false,
  scrolled = false,
}) {
  const showTextLogo =
    branding.showTextLogo !== false;

  const logoSource =
    logoUrl ||
    "/images/obsidian-logo-black.png";

  const uploadedLockup =
    Boolean(logoUrl) &&
    !showTextLogo;

  const baseMarkSize = Math.min(
    Math.max(
      Math.round(logoWidth / 5.7),
      compact ? 27 : 31
    ),
    compact ? 32 : 37
  );

  const markSize =
    scrolled && !compact
      ? Math.max(
          baseMarkSize - 2,
          29
        )
      : baseMarkSize;

  const uploadedWidth = Math.min(
    Math.max(logoWidth, 90),
    compact ? 155 : 190
  );

  return (
    <Link
      href="/"
      aria-label={`${storeName} home`}
      className="obsidian-brand group inline-flex min-w-0 items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
    >
      <span
        className={`obsidian-logo-shell relative flex shrink-0 items-center justify-center overflow-hidden ${
          uploadedLockup
            ? ""
            : "aspect-square"
        }`}
        style={{
          width: `${
            uploadedLockup
              ? uploadedWidth
              : markSize
          }px`,
        }}
      >
        <Image
          src={logoSource}
          alt={
            showTextLogo
              ? ""
              : logoAlt
          }
          width={
            uploadedLockup
              ? uploadedWidth
              : markSize
          }
          height={
            uploadedLockup
              ? 36
              : markSize
          }
          sizes={`${
            uploadedLockup
              ? uploadedWidth
              : markSize
          }px`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          unoptimized={
            uploadedLockup
          }
          className={
            uploadedLockup
              ? "relative z-[1] h-auto max-h-9 w-full object-contain"
              : "relative z-[1] h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[3deg] group-hover:scale-[1.055]"
          }
        />

        {!uploadedLockup ? (
          <>
            <span
              aria-hidden="true"
              className="obsidian-logo-hologram absolute inset-y-[-60%] left-[-125%] z-[2] w-[72%] rotate-[18deg]"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(138deg,transparent_17%,rgba(255,255,255,0.24)_46%,rgba(142,226,244,0.12)_55%,transparent_74%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </>
        ) : null}
      </span>

      {showTextLogo ? (
        <span
          className={`obsidian-wordmark whitespace-nowrap font-heading font-semibold uppercase text-[#080a0b] ${
            compact
              ? "text-[20px] tracking-[0.145em] sm:text-[21px]"
              : scrolled
                ? "text-[24px] tracking-[0.16em]"
                : "text-[26px] tracking-[0.17em] 2xl:text-[27px]"
          }`}
        >
          {storeName}
        </span>
      ) : null}
    </Link>
  );
}

function DesktopNavigationLink({
  href,
  label,
  openInNewTab = false,
  isActive = false,
  index = 0,
}) {
  const external =
    isExternalLink(href);

  const className =
    "obsidian-nav-reveal group relative inline-flex items-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.205em] text-black/75 transition-colors duration-300 hover:text-black focus-visible:outline-none focus-visible:text-black 2xl:text-[11px]";

  const content = (
    <>
      <span className="obsidian-readable-text transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-px">
        {label}
      </span>

      {external ? (
        <ExternalArrowIcon className="opacity-40 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
      ) : null}

      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 h-px w-full origin-left bg-black/85 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive
            ? "scale-x-100"
            : "scale-x-0 group-hover:scale-x-100"
        }`}
      />

      <span
        aria-hidden="true"
        className={`absolute -bottom-[4px] left-0 h-[3px] w-[3px] rounded-full bg-[#8ed8e7] shadow-[0_0_7px_rgba(142,216,231,0.7)] transition-opacity duration-300 ${
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      />
    </>
  );

  const style = {
    animationDelay: `${
      140 + index * 48
    }ms`,
  };

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
        className={className}
        style={style}
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
      className={className}
      style={style}
    >
      {content}
    </Link>
  );
}

function MobileNavigationLink({
  href,
  label,
  openInNewTab = false,
  isActive = false,
  index,
  onClick,
  visible,
}) {
  const external =
    isExternalLink(href);

  const className = `group flex w-full items-center gap-4 border-b border-black/10 py-[14px] text-left transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30 ${
    visible
      ? "translate-y-0 opacity-100"
      : "translate-y-3 opacity-0"
  }`;

  const style = {
    transitionDelay: visible
      ? `${60 + index * 48}ms`
      : "0ms",
  };

  const content = (
    <>
      <span className="w-7 shrink-0 text-[11px] font-semibold tracking-[0.22em] text-black/38">
        {String(index + 1).padStart(
          2,
          "0"
        )}
      </span>

      <span
        className={`min-w-0 flex-1 font-heading text-[29px] font-semibold leading-none tracking-[-0.025em] transition-[transform,color] duration-500 sm:text-[32px] ${
          isActive
            ? "text-black"
            : "text-black/76 group-hover:translate-x-1 group-hover:text-black"
        }`}
      >
        {label}
      </span>

      {external ? (
        <ExternalArrowIcon className="h-[17px] w-[17px] text-black/40 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-black" />
      ) : (
        <ArrowIcon className="h-[17px] w-[17px] text-black/38 transition-all duration-300 group-hover:translate-x-1 group-hover:text-black" />
      )}
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
        style={style}
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
      style={style}
    >
      {content}
    </Link>
  );
}

function AnnouncementBar({
  announcement,
  text,
  href,
}) {
  const validHref =
    href &&
    isSafePublicNavigationHref(href);

  const content = (
    <span className="inline-flex max-w-full items-center gap-2.5">
      <span className="h-px w-4 shrink-0 bg-white/40" />

      <span className="truncate">
        {text}
      </span>

      {validHref ? (
        <ArrowIcon className="h-3 w-3 shrink-0 opacity-55 transition-transform duration-300 group-hover:translate-x-0.5" />
      ) : null}
    </span>
  );

  const className =
    "group max-w-full text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85 transition-colors duration-300 hover:text-white";

  return (
    <div className="relative z-[4] flex h-[26px] items-center justify-center overflow-hidden border-b border-white/10 bg-black/78 px-4 backdrop-blur-[28px]">
      <span
        aria-hidden="true"
        className="obsidian-announcement-light pointer-events-none absolute inset-y-0 left-[-35%] w-[30%] skew-x-[-18deg]"
      />

      {validHref ? (
        isExternalLink(href) ? (
          <a
            href={href}
            target={
              announcement.openInNewTab
                ? "_blank"
                : undefined
            }
            rel={
              announcement.openInNewTab
                ? "noopener noreferrer"
                : undefined
            }
            className={className}
          >
            {content}
          </a>
        ) : (
          <Link
            href={href}
            target={
              announcement.openInNewTab
                ? "_blank"
                : undefined
            }
            rel={
              announcement.openInNewTab
                ? "noopener noreferrer"
                : undefined
            }
            className={className}
          >
            {content}
          </Link>
        )
      ) : (
        <p className={className}>
          {content}
        </p>
      )}
    </div>
  );
}

function UtilityButton({
  label,
  children,
  onClick,
  active = false,
  count,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`obsidian-utility-reveal obsidian-liquid-control group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40 ${
        active
          ? "bg-black/90 text-white"
          : "text-black"
      }`}
    >
      <span className="relative z-[2] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-px group-hover:scale-[1.07]">
        {children}
      </span>

      {count !== undefined ? (
        <CountBadge value={count} />
      ) : null}
    </button>
  );
}

function UtilityLink({
  href,
  label,
  children,
  active = false,
  count,
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`obsidian-utility-reveal obsidian-liquid-control group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40 ${
        active
          ? "bg-black/90 text-white"
          : "text-black"
      }`}
    >
      <span className="relative z-[2] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-px group-hover:scale-[1.07]">
        {children}
      </span>

      {count !== undefined ? (
        <CountBadge value={count} />
      ) : null}
    </Link>
  );
}

function LoadingUtility() {
  return (
    <span
      aria-hidden="true"
      className="h-9 w-9 animate-pulse rounded-full bg-white/20"
    />
  );
}

function MobileUtility({
  children,
  visible,
  index,
}) {
  return (
    <div
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      }`}
      style={{
        transitionDelay: visible
          ? `${250 + index * 55}ms`
          : "0ms",
      }}
    >
      {children}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const currentPath =
    pathname || "/";

  const isHomepage =
    currentPath === "/";

  const {
    cartCount = 0,
    wishlistCount = 0,
    openMiniCart,
  } = useCart();

  const headerRef =
    useRef(null);

  const menuButtonRef =
    useRef(null);

  const searchInputRef =
    useRef(null);

  const mobilePanelRef =
    useRef(null);

  const searchPanelRef =
    useRef(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  const [
    isScrolled,
    setIsScrolled,
  ] = useState(false);

  const [navbar, setNavbar] =
    useState(() =>
      normalizeNavbarContent()
    );

  const [
    storeTagline,
    setStoreTagline,
  ] = useState(DEFAULT_TAGLINE);

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

        const settings =
          settingsResponse.ok &&
          settingsData.success
            ? settingsData.settings
            : {};

        setNavbar(
          normalizeNavbarContent(
            navbarResponse.ok &&
              navbarData.success
              ? navbarData.content
              : {},
            settings
          )
        );

        setStoreTagline(
          normalizeText(
            settings?.store?.tagline,
            DEFAULT_TAGLINE
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

          setStoreTagline(
            DEFAULT_TAGLINE
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
  }, [currentPath]);

  useEffect(() => {
    let animationFrame = null;

    function updateScrollState() {
      setIsScrolled(
        window.scrollY > 18
      );

      animationFrame = null;
    }

    function handleScroll() {
      if (animationFrame !== null) {
        return;
      }

      animationFrame =
        window.requestAnimationFrame(
          updateScrollState
        );
    }

    updateScrollState();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      if (animationFrame !== null) {
        window.cancelAnimationFrame(
          animationFrame
        );
      }
    };
  }, []);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        setIsOpen(false);
        setIsSearchOpen(false);
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [currentPath]);

  useEffect(() => {
    if (!isSearchOpen) {
      return undefined;
    }

    const timer =
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const overlayOpen =
      isOpen || isSearchOpen;

    if (!overlayOpen) {
      document.body.style.overflow =
        "";

      return undefined;
    }

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(event) {
      const activePanel =
        isSearchOpen
          ? searchPanelRef.current
          : mobilePanelRef.current;

      trapFocus(
        event,
        activePanel
      );

      if (event.key !== "Escape") {
        return;
      }

      if (isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }

      setIsOpen(false);

      window.setTimeout(() => {
        menuButtonRef.current?.focus();
      }, 0);
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, isSearchOpen]);

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

  function handlePointerMove(event) {
    if (
      event.pointerType === "touch" ||
      !headerRef.current
    ) {
      return;
    }

    const bounds =
      headerRef.current.getBoundingClientRect();

    const relativeX =
      (event.clientX - bounds.left) /
      bounds.width;

    const relativeY =
      (event.clientY - bounds.top) /
      Math.max(bounds.height, 1);

    const xPercent = Math.min(
      Math.max(relativeX * 100, 0),
      100
    );

    const yPercent = Math.min(
      Math.max(relativeY * 100, 0),
      100
    );

    const shiftX =
      (relativeX - 0.5) * 14;

    const shiftY =
      (relativeY - 0.5) * 6;

    headerRef.current.style.setProperty(
      "--glass-x",
      `${xPercent}%`
    );

    headerRef.current.style.setProperty(
      "--glass-y",
      `${yPercent}%`
    );

    headerRef.current.style.setProperty(
      "--glass-shift-x",
      `${shiftX.toFixed(2)}px`
    );

    headerRef.current.style.setProperty(
      "--glass-shift-y",
      `${shiftY.toFixed(2)}px`
    );

    headerRef.current.style.setProperty(
      "--glass-pointer-opacity",
      "1"
    );
  }

  function handlePointerLeave() {
    if (!headerRef.current) {
      return;
    }

    headerRef.current.style.setProperty(
      "--glass-x",
      "50%"
    );

    headerRef.current.style.setProperty(
      "--glass-y",
      "0%"
    );

    headerRef.current.style.setProperty(
      "--glass-shift-x",
      "0px"
    );

    headerRef.current.style.setProperty(
      "--glass-shift-y",
      "0px"
    );

    headerRef.current.style.setProperty(
      "--glass-pointer-opacity",
      "0.56"
    );
  }

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
      return currentPath === "/";
    }

    return (
      currentPath === hrefPath ||
      currentPath.startsWith(
        `${hrefPath}/`
      )
    );
  }

  function openSearch() {
    setIsOpen(false);
    setIsSearchOpen(true);
  }

  function closeSearch() {
    setIsSearchOpen(false);
  }

  function toggleMenu() {
    setIsSearchOpen(false);

    setIsOpen(
      (current) => !current
    );
  }

  function closeMenu() {
    setIsOpen(false);
  }

  function handleCart() {
    setIsOpen(false);
    setIsSearchOpen(false);
    openMiniCart();
  }

  function closeOverlay() {
    setIsOpen(false);
    setIsSearchOpen(false);
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
    currentPath === "/account" ||
    currentPath.startsWith(
      "/account/"
    );

  const wishlistPathActive =
    currentPath === "/wishlist" ||
    currentPath.startsWith(
      "/wishlist/"
    );

  const overlayOpen =
    isOpen || isSearchOpen;

  const transparentMaterial =
    isHomepage &&
    !isScrolled &&
    !overlayOpen;

  const mobilePanelHeight =
    showAnnouncement
      ? "calc(100dvh - 86px)"
      : "calc(100dvh - 60px)";

  const mobileUtilityCount =
    Number(
      mobile.showSearch
    ) +
    Number(
      mobile.showWishlist
    ) +
    Number(
      mobile.showCart
    ) +
    Number(Boolean(customer));

  const mobileGridClass =
    mobileUtilityCount === 1
      ? "grid-cols-1"
      : mobileUtilityCount === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  let mobileUtilityIndex = 0;

  return (
    <>
      <style jsx global>{`
        @keyframes obsidianLiquidSettle {
          from {
            opacity: 0;
            transform: translateY(-12px);
            filter: blur(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes obsidianElementReveal {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes obsidianLogoHologram {
          0%,
          2% {
            transform: translateX(0);
            opacity: 0;
          }

          4% {
            opacity: 0.98;
          }

          18% {
            opacity: 0.74;
          }

          21%,
          100% {
            transform: translateX(440%);
            opacity: 0;
          }
        }

        @keyframes obsidianAmbientRefraction {
          0%,
          2% {
            transform:
              translateX(-145%)
              skewX(-18deg);
            opacity: 0;
          }

          5% {
            opacity: 0.52;
          }

          18% {
            opacity: 0.2;
          }

          21%,
          100% {
            transform:
              translateX(155%)
              skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes obsidianEdgeBreath {
          0%,
          100% {
            opacity: 0.34;
          }

          50% {
            opacity: 0.68;
          }
        }

        @keyframes obsidianCountPop {
          from {
            opacity: 0;
            transform: scale(0.5);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes obsidianAnnouncementLight {
          0%,
          68% {
            transform: translateX(0);
            opacity: 0;
          }

          72% {
            opacity: 0.85;
          }

          100% {
            transform: translateX(520%);
            opacity: 0;
          }
        }

        .obsidian-liquid-root {
          --glass-x: 50%;
          --glass-y: 0%;
          --glass-shift-x: 0px;
          --glass-shift-y: 0px;
          --glass-pointer-opacity: 0.56;

          isolation: isolate;

          animation:
            obsidianLiquidSettle
            760ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;

          -webkit-backdrop-filter:
            blur(26px)
            saturate(185%)
            contrast(106%);

          backdrop-filter:
            blur(26px)
            saturate(185%)
            contrast(106%);

          transition:
            background 700ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            box-shadow 700ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            border-color 700ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            backdrop-filter 700ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );
        }

        .obsidian-liquid-clear {
          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                0.24
              ),
              rgba(
                242,
                245,
                243,
                0.18
              ) 44%,
              rgba(
                235,
                238,
                235,
                0.29
              )
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.54
            );

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.82
              ),
            inset 0 -1px 0
              rgba(
                11,
                22,
                27,
                0.08
              ),
            0 8px 30px
              rgba(
                8,
                20,
                25,
                0.055
              );
        }

        .obsidian-liquid-tinted {
          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                0.56
              ),
              rgba(
                238,
                242,
                239,
                0.48
              ) 46%,
              rgba(
                231,
                235,
                231,
                0.57
              )
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.78
            );

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.96
              ),
            inset 0 -1px 0
              rgba(
                11,
                22,
                27,
                0.09
              ),
            0 12px 36px
              rgba(
                8,
                20,
                25,
                0.08
              );
        }

        .obsidian-pointer-light {
          opacity:
            var(
              --glass-pointer-opacity
            );

          background:
            radial-gradient(
              360px circle at
                var(--glass-x)
                var(--glass-y),
              rgba(
                255,
                255,
                255,
                0.58
              ),
              rgba(
                255,
                255,
                255,
                0.22
              ) 28%,
              rgba(
                151,
                223,
                238,
                0.08
              ) 47%,
              transparent 70%
            );

          transform:
            translate3d(
              var(--glass-shift-x),
              var(--glass-shift-y),
              0
            );

          transition:
            opacity 280ms ease,
            transform 220ms ease-out;
        }

        .obsidian-refraction-field {
          background:
            radial-gradient(
              90% 240% at 5% -80%,
              rgba(
                255,
                255,
                255,
                0.7
              ),
              transparent 54%
            ),
            radial-gradient(
              70% 190% at 92% 150%,
              rgba(
                115,
                215,
                235,
                0.11
              ),
              transparent 58%
            ),
            linear-gradient(
              103deg,
              transparent 0%,
              rgba(
                255,
                255,
                255,
                0.05
              ) 37%,
              rgba(
                255,
                255,
                255,
                0.2
              ) 48%,
              rgba(
                154,
                219,
                232,
                0.07
              ) 55%,
              transparent 68%
            );
        }

        .obsidian-moving-refraction {
          background:
            linear-gradient(
              100deg,
              transparent 0%,
              rgba(
                255,
                255,
                255,
                0.03
              ) 28%,
              rgba(
                255,
                255,
                255,
                0.42
              ) 46%,
              rgba(
                140,
                219,
                236,
                0.18
              ) 54%,
              rgba(
                221,
                206,
                255,
                0.08
              ) 61%,
              transparent 76%
            );

          animation:
            obsidianAmbientRefraction
            11s
            0.3s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            infinite;
        }

        .obsidian-chromatic-edge {
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                174,
                231,
                243,
                0.38
              ) 28%,
              rgba(
                255,
                255,
                255,
                0.68
              ) 50%,
              rgba(
                220,
                207,
                250,
                0.25
              ) 72%,
              transparent
            );

          animation:
            obsidianEdgeBreath
            6s ease-in-out infinite;
        }

        .obsidian-brand {
          animation:
            obsidianElementReveal
            760ms
            80ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;

          transition:
            transform 600ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );
        }

        .obsidian-brand:hover {
          transform: translateY(-1px);
        }

        .obsidian-nav-reveal {
          opacity: 0;

          animation:
            obsidianElementReveal
            650ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        .obsidian-utility-reveal {
          opacity: 0;

          animation:
            obsidianElementReveal
            650ms
            300ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        .obsidian-readable-text {
          text-shadow:
            0 1px 0
              rgba(
                255,
                255,
                255,
                0.8
              ),
            0 0 12px
              rgba(
                255,
                255,
                255,
                0.22
              );
        }

        .obsidian-logo-shell {
          filter:
            drop-shadow(
              0 7px 14px
                rgba(
                  8,
                  20,
                  25,
                  0.11
                )
            );
        }

        .obsidian-logo-hologram {
          background:
            linear-gradient(
              110deg,
              transparent 0%,
              rgba(
                255,
                255,
                255,
                0.98
              ) 27%,
              rgba(
                132,
                225,
                245,
                0.94
              ) 43%,
              rgba(
                222,
                205,
                255,
                0.73
              ) 57%,
              rgba(
                255,
                255,
                255,
                0.9
              ) 70%,
              transparent 100%
            );

          mix-blend-mode: screen;

          animation:
            obsidianLogoHologram
            7s
            0.2s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            infinite;
        }

        .obsidian-wordmark {
          text-shadow:
            0 1px 0
              rgba(
                255,
                255,
                255,
                0.82
              ),
            0 3px 12px
              rgba(
                8,
                20,
                25,
                0.055
              );

          transition:
            letter-spacing 650ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            opacity 300ms ease;
        }

        .obsidian-brand:hover
          .obsidian-wordmark {
          letter-spacing: 0.19em;
          opacity: 0.76;
        }

        .obsidian-liquid-control::before {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: inherit;

          background:
            radial-gradient(
              circle at 35% 18%,
              rgba(
                255,
                255,
                255,
                0.7
              ),
              transparent 45%
            ),
            rgba(
              255,
              255,
              255,
              0.04
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.22
            );

          opacity: 0;
          transform: scale(0.76);

          transition:
            opacity 450ms ease,
            transform 550ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );
        }

        .obsidian-liquid-control:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .obsidian-liquid-control:hover {
          transform: translateY(-1px);

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.8
              ),
            0 7px 18px
              rgba(
                8,
                20,
                25,
                0.07
              );

          -webkit-backdrop-filter:
            blur(14px)
            saturate(170%);

          backdrop-filter:
            blur(14px)
            saturate(170%);
        }

        .obsidian-count-pop {
          animation:
            obsidianCountPop
            420ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }

        .obsidian-announcement-light {
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                137,
                226,
                246,
                0.18
              ),
              rgba(
                255,
                255,
                255,
                0.26
              ),
              transparent
            );

          animation:
            obsidianAnnouncementLight
            7s
            ease-in-out
            infinite;
        }

        .obsidian-liquid-panel {
          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                0.65
              ),
              rgba(
                235,
                240,
                237,
                0.57
              ) 48%,
              rgba(
                228,
                234,
                230,
                0.66
              )
            );

          -webkit-backdrop-filter:
            blur(36px)
            saturate(195%)
            contrast(106%);

          backdrop-filter:
            blur(36px)
            saturate(195%)
            contrast(106%);

          border-color:
            rgba(
              255,
              255,
              255,
              0.72
            );

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.95
              ),
            inset 0 -1px 0
              rgba(
                8,
                20,
                25,
                0.08
              ),
            0 28px 70px
              rgba(
                8,
                20,
                25,
                0.14
              );
        }

        .obsidian-panel-texture {
          background-image:
            radial-gradient(
              circle at
                var(--glass-x)
                -20%,
              rgba(
                255,
                255,
                255,
                0.62
              ),
              transparent 40%
            ),
            radial-gradient(
              circle at 95% 120%,
              rgba(
                126,
                216,
                235,
                0.1
              ),
              transparent 42%
            );
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .obsidian-liquid-root,
          .obsidian-brand,
          .obsidian-nav-reveal,
          .obsidian-utility-reveal,
          .obsidian-logo-hologram,
          .obsidian-moving-refraction,
          .obsidian-chromatic-edge,
          .obsidian-count-pop,
          .obsidian-announcement-light {
            animation: none !important;
            opacity: 1 !important;
          }

          .obsidian-brand,
          .obsidian-wordmark,
          .obsidian-liquid-control,
          .obsidian-pointer-light {
            transition: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        aria-label="Close navigation overlay"
        tabIndex={-1}
        onClick={closeOverlay}
        className={`fixed inset-0 z-40 bg-black/16 backdrop-blur-[5px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          overlayOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      />

      <header
        ref={headerRef}
        data-obsidian-nav-contrast={
          isHomepage &&
          !isScrolled &&
          !isOpen &&
          !isSearchOpen
            ? "light"
            : "dark"
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerLeave={
          handlePointerLeave
        }
        className={`obsidian-liquid-root fixed inset-x-0 top-0 z-50 overflow-visible border-b ${
          transparentMaterial
            ? "obsidian-liquid-clear"
            : "obsidian-liquid-tinted"
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <span className="obsidian-refraction-field absolute inset-0" />

          <span className="obsidian-pointer-light absolute inset-0" />

          <span className="obsidian-moving-refraction absolute inset-y-0 left-0 w-[48%]" />

          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />

          <span className="obsidian-chromatic-edge absolute inset-x-0 bottom-0 h-px" />
        </div>

        {showAnnouncement ? (
          <AnnouncementBar
            announcement={
              announcement
            }
            text={
              announcementText
            }
            href={
              announcementHref
            }
          />
        ) : null}

        <nav
          aria-label="Primary navigation"
          className={`relative z-[3] mx-auto max-w-[1640px] px-4 transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 lg:px-8 2xl:px-12 ${
            isScrolled
              ? "h-[60px] xl:h-16"
              : "h-[60px] xl:h-[72px]"
          }`}
        >
          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center xl:hidden">
            <div className="flex justify-start">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={toggleMenu}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
                aria-label={
                  isOpen
                    ? "Close menu"
                    : "Open menu"
                }
                className={`obsidian-liquid-control relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40 ${
                  isOpen
                    ? "bg-black/90 text-white"
                    : "text-black"
                }`}
              >
                <MenuIcon
                  open={isOpen}
                />
              </button>
            </div>

            <div className="min-w-0 px-2">
              <BrandLockup
                branding={branding}
                storeName={storeName}
                logoUrl={logoUrl}
                logoAlt={logoAlt}
                logoWidth={logoWidth}
                compact
                scrolled={isScrolled}
              />
            </div>

            <div className="flex justify-end gap-1">
              {mobile.showSearch ? (
                <UtilityButton
                  label="Search"
                  onClick={openSearch}
                  active={isSearchOpen}
                >
                  <SearchIcon />
                </UtilityButton>
              ) : null}

              {mobile.showCart ? (
                <UtilityButton
                  label={`Open cart with ${getSafeCount(
                    cartCount
                  )} items`}
                  onClick={handleCart}
                  count={cartCount}
                >
                  <BagIcon />
                </UtilityButton>
              ) : null}
            </div>
          </div>

          <div className="hidden h-full grid-cols-[1fr_auto_1fr] items-center xl:grid">
            <div className="flex min-w-0 items-center gap-7 2xl:gap-9">
              {navigationItems.map(
                (item, index) => (
                  <DesktopNavigationLink
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
                    index={index}
                  />
                )
              )}
            </div>

            <div className="min-w-0 px-8">
              <BrandLockup
                branding={branding}
                storeName={storeName}
                logoUrl={logoUrl}
                logoAlt={logoAlt}
                logoWidth={logoWidth}
                scrolled={isScrolled}
              />
            </div>

            <div className="flex min-w-0 items-center justify-end gap-1.5">
              {desktop.showSearch ? (
                <UtilityButton
                  label="Search"
                  onClick={openSearch}
                  active={isSearchOpen}
                >
                  <SearchIcon />
                </UtilityButton>
              ) : null}

              {account.showDesktop ? (
                accountLoaded ? (
                  <UtilityLink
                    href={accountHref}
                    label={accountLabel}
                    active={
                      accountPathActive
                    }
                  >
                    <AccountIcon />
                  </UtilityLink>
                ) : (
                  <LoadingUtility />
                )
              ) : null}

              {desktop.showWishlist ? (
                <UtilityLink
                  href="/wishlist"
                  label={`Wishlist with ${getSafeCount(
                    wishlistCount
                  )} items`}
                  active={
                    wishlistPathActive
                  }
                  count={
                    wishlistCount
                  }
                >
                  <HeartIcon />
                </UtilityLink>
              ) : null}

              {desktop.showCart ? (
                <UtilityButton
                  label={`Open cart with ${getSafeCount(
                    cartCount
                  )} items`}
                  onClick={handleCart}
                  count={cartCount}
                >
                  <BagIcon />
                </UtilityButton>
              ) : null}
            </div>
          </div>
        </nav>

        <section
          ref={searchPanelRef}
          id="navbar-search"
          role="dialog"
          aria-modal="true"
          aria-label="Search OBSIDIAN"
          aria-hidden={
            !isSearchOpen
          }
          className={`obsidian-liquid-panel absolute inset-x-0 top-full overflow-hidden border-y transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSearchOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-3 opacity-0"
          }`}
        >
          <span
            aria-hidden="true"
            className="obsidian-panel-texture pointer-events-none absolute inset-0"
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent"
          />

          <div className="relative mx-auto max-w-[1640px] px-5 py-7 sm:px-8 lg:px-12">
            <div
              className={`mx-auto max-w-4xl transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isSearchOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="mb-4 flex items-end justify-between border-b border-black/10 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/46">
                    Discover{" "}
                    {storeName}
                  </p>

                  <h2 className="mt-1 font-heading text-[30px] font-semibold tracking-[-0.025em] text-black sm:text-[36px]">
                    Search the collection
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/50 transition-colors hover:text-black"
                >
                  Close
                </button>
              </div>

              <form
                action="/shop"
                method="get"
                onSubmit={() =>
                  setIsSearchOpen(false)
                }
                className="relative"
              >
                <label
                  htmlFor="navbar-search-input"
                  className="sr-only"
                >
                  Search products
                </label>

                <input
                  ref={searchInputRef}
                  id="navbar-search-input"
                  type="search"
                  name="q"
                  autoComplete="off"
                  placeholder="Search products or collections"
                  className="h-14 w-full border-b border-black/25 bg-transparent pr-14 font-heading text-[24px] font-semibold text-black outline-none transition-colors placeholder:text-black/32 focus:border-black sm:text-[29px]"
                />

                <button
                  type="submit"
                  aria-label="Submit search"
                  className="obsidian-liquid-control group absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/90 text-white transition-all duration-500 hover:scale-[1.04]"
                >
                  <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/42">
                  Explore
                </span>

                <Link
                  href="/shop"
                  onClick={closeSearch}
                  className="text-[11px] font-semibold uppercase tracking-[0.19em] text-black/67 transition-colors hover:text-black"
                >
                  Shop All
                </Link>

                <Link
                  href="/collections"
                  onClick={closeSearch}
                  className="text-[11px] font-semibold uppercase tracking-[0.19em] text-black/67 transition-colors hover:text-black"
                >
                  Collections
                </Link>

                <Link
                  href="/size-guide"
                  onClick={closeSearch}
                  className="text-[11px] font-semibold uppercase tracking-[0.19em] text-black/67 transition-colors hover:text-black"
                >
                  Size Guide
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={mobilePanelRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          aria-hidden={!isOpen}
          style={{
            height:
              mobilePanelHeight,
          }}
          className={`obsidian-liquid-panel absolute inset-x-0 top-full overflow-y-auto border-y transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] xl:hidden ${
            isOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-3 opacity-0"
          }`}
        >
          <span
            aria-hidden="true"
            className="obsidian-panel-texture pointer-events-none absolute inset-0"
          />

          <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-5 py-5 sm:px-8 sm:py-7">
            <div className="grid gap-6 md:grid-cols-[1.32fr_0.68fr] md:gap-10">
              <div>
                <div
                  className={`mb-1 flex items-center justify-between transition-all duration-500 ${
                    isOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                    Navigation
                  </p>

                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/32">
                    {String(
                      navigationItems.length
                    ).padStart(2, "0")}{" "}
                    Links
                  </p>
                </div>

                <div>
                  {navigationItems.map(
                    (item, index) => (
                      <MobileNavigationLink
                        key={
                          item.id ||
                          `${item.label}-${item.href}`
                        }
                        href={
                          item.href
                        }
                        label={
                          item.label
                        }
                        openInNewTab={
                          item.openInNewTab
                        }
                        isActive={isCurrentPath(
                          item.href
                        )}
                        index={index}
                        onClick={closeMenu}
                        visible={isOpen}
                      />
                    )
                  )}
                </div>

                {/* Help links customers look for before buying. */}
                <div
                  className={`mt-5 flex flex-wrap gap-2 transition-all duration-700 delay-150 ${
                    isOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0"
                  }`}
                >
                  {[
                    { href: "/size-guide", label: "Size Guide" },
                    { href: "/contact", label: "Contact" },
                    { href: "/delivery-policy", label: "Delivery" },
                    { href: "/exchange-return-policy", label: "Exchange" },
                  ]
                    .filter(
                      (link) =>
                        !navigationItems.some(
                          (item) => item.href === link.href
                        )
                    )
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className="inline-flex min-h-11 items-center border border-black/12 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:border-black hover:text-black"
                      >
                        {link.label}
                      </Link>
                    ))}
                </div>
              </div>

              <aside className="space-y-3 md:border-l md:border-black/10 md:pl-7">
                {account.showMobile ? (
                  <div
                    className={`transition-[opacity,transform] duration-700 delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    }`}
                  >
                    {accountLoaded ? (
                      <Link
                        href={accountHref}
                        onClick={closeMenu}
                        className={`group flex items-center gap-3.5 border-y border-black/10 px-1 py-4 transition-all duration-500 ${
                          accountPathActive
                            ? "text-black"
                            : "text-black/82 hover:text-black"
                        }`}
                      >
                        <span className="obsidian-liquid-control relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                          <AccountIcon />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-black/42">
                            {customer
                              ? "Member Access"
                              : "Private Access"}
                          </span>

                          <span className="mt-0.5 block text-[14px] font-semibold">
                            {accountLabel}
                          </span>
                        </span>

                        <ArrowIcon className="opacity-40 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    ) : (
                      <div className="h-[68px] animate-pulse border-y border-black/10 bg-white/10" />
                    )}
                  </div>
                ) : null}

                {mobileUtilityCount >
                0 ? (
                  <div
                    className={`grid ${mobileGridClass} border-l border-t border-black/10`}
                  >
                    {mobile.showSearch ? (
                      <MobileUtility
                        visible={isOpen}
                        index={
                          mobileUtilityIndex++
                        }
                      >
                        <button
                          type="button"
                          onClick={openSearch}
                          className="group flex min-h-[76px] w-full flex-col items-start justify-between border-b border-r border-black/10 p-3.5 text-left transition-colors hover:bg-white/20"
                        >
                          <SearchIcon className="transition-transform duration-300 group-hover:scale-110" />

                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                            Search
                          </span>
                        </button>
                      </MobileUtility>
                    ) : null}

                    {mobile.showWishlist ? (
                      <MobileUtility
                        visible={isOpen}
                        index={
                          mobileUtilityIndex++
                        }
                      >
                        <Link
                          href="/wishlist"
                          onClick={closeMenu}
                          className="group flex min-h-[76px] flex-col items-start justify-between border-b border-r border-black/10 p-3.5 transition-colors hover:bg-white/20"
                        >
                          <span className="relative">
                            <HeartIcon className="transition-transform duration-300 group-hover:scale-110" />

                            <CountBadge
                              value={
                                wishlistCount
                              }
                            />
                          </span>

                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                            Wishlist
                          </span>
                        </Link>
                      </MobileUtility>
                    ) : null}

                    {mobile.showCart ? (
                      <MobileUtility
                        visible={isOpen}
                        index={
                          mobileUtilityIndex++
                        }
                      >
                        <button
                          type="button"
                          onClick={handleCart}
                          className="group flex min-h-[76px] w-full flex-col items-start justify-between border-b border-r border-black/10 p-3.5 text-left transition-colors hover:bg-white/20"
                        >
                          <span className="relative">
                            <BagIcon className="transition-transform duration-300 group-hover:scale-110" />

                            <CountBadge
                              value={
                                cartCount
                              }
                            />
                          </span>

                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                            Bag
                          </span>
                        </button>
                      </MobileUtility>
                    ) : null}

                    {customer ? (
                      <MobileUtility
                        visible={isOpen}
                        index={
                          mobileUtilityIndex++
                        }
                      >
                        <Link
                          href="/account/orders"
                          onClick={closeMenu}
                          className="flex min-h-[76px] flex-col items-start justify-between border-b border-r border-black/10 p-3.5 transition-colors hover:bg-white/20"
                        >
                          <span className="font-heading text-[18px] font-semibold">
                            01
                          </span>

                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                            Orders
                          </span>
                        </Link>
                      </MobileUtility>
                    ) : null}
                  </div>
                ) : null}
              </aside>
            </div>

            <div
              className={`mt-auto flex items-end justify-between gap-5 border-t border-black/10 pt-4 transition-[opacity,transform] duration-700 delay-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
            >
              <div>
                <p className="max-w-[280px] font-heading text-[18px] font-semibold leading-tight text-black">
                  {storeTagline}
                </p>

                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.23em] text-black/40">
                  An OBSIDIAN Standard
                </p>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/32">
                {storeName}
              </p>
            </div>
          </div>
        </section>
      </header>

      {!isHomepage ? (
        <div
          aria-hidden="true"
          className={
            showAnnouncement
              ? "h-[86px] xl:h-[98px]"
              : "h-[60px] xl:h-[72px]"
          }
        />
      ) : null}
    </>
  );
}