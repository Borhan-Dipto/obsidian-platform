"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const DEFAULT_FOOTER = {
  isEnabled: true,

  brand: {
    showLogo: false,
    logoUrl: "",
    logoAlt: "OBSIDIAN",
    description:
      "Built under pressure. Finished with precision.",
    showEmail: true,
    showLocation: true,
    showPhone: false,
  },

  columns: [
    {
      id: "footer-shop",
      title: "Shop",
      order: 1,
      isActive: true,
      links: [
        {
          id: "footer-all-products",
          label: "All Products",
          href: "/shop",
          order: 1,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-collections",
          label: "Collections",
          href: "/collections",
          order: 2,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-new-drop",
          label: "New Drop",
          href: "/shop",
          order: 3,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-track-order",
          label: "Track Order",
          href: "/track-order",
          order: 4,
          isActive: true,
          openInNewTab: false,
        },
      ],
    },
    {
      id: "footer-support",
      title: "Support",
      order: 2,
      isActive: true,
      links: [
        {
          id: "footer-contact",
          label: "Contact",
          href: "/contact",
          order: 1,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-size-guide",
          label: "Size Guide",
          href: "/size-guide",
          order: 2,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-order-status",
          label: "Order Status",
          href: "/track-order",
          order: 3,
          isActive: true,
          openInNewTab: false,
        },
        {
          id: "footer-about",
          label: "About",
          href: "/about",
          order: 4,
          isActive: true,
          openInNewTab: false,
        },
      ],
    },
  ],

  newsletter: {
    isEnabled: true,
    title: "Stay In Touch",
    description:
      "Join the OBSIDIAN community for future drops, stories, and private releases.",
    placeholder: "Email address",
    buttonText: "Join",
    successMessage:
      "Thank you for joining OBSIDIAN.",
  },

  social: {
    showFacebook: true,
    showInstagram: true,
    showTikTok: true,
    showYouTube: true,
  },

  developer: {
    isEnabled: true,
    label: "Developed by",
    name: "Borhan Dipto",
    linkedinUrl:
      "https://www.linkedin.com/in/borhandipto",
    openInNewTab: true,
  },

  legal: {
    copyrightText:
      "OBSIDIAN. All rights reserved.",
    showCurrentYear: true,
    links: [],
  },
};

const DEFAULT_SETTINGS = {
  store: {
    name: "OBSIDIAN",
    tagline:
      "Built under pressure. Finished with precision.",
    currency: "BDT",
  },

  contact: {
    whatsappNumber: "",
    email:
      "contact@obsidianwearbd.store",
    location: "Dhaka, Bangladesh",
    phone: "",
  },

  social: {
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
  },

  delivery: {
    insideDhaka: 80,
    outsideDhaka: 130,
    freeShippingOver: 0,
  },

  payment: {
    cashOnDelivery: true,
    bkash: false,
    nagad: false,
    rocket: false,
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

function normalizeExternalUrl(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.startsWith(
      "https://"
    ) ||
    normalizedValue.startsWith(
      "http://"
    )
  ) {
    return normalizedValue;
  }

  if (
    normalizedValue.startsWith(
      "www."
    )
  ) {
    return `https://${normalizedValue}`;
  }

  return normalizedValue;
}

function normalizeOrder(
  value,
  fallback = 0
) {
  const numericValue = Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
}

function normalizeBoolean(
  value,
  fallback = false
) {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value === "string"
  ) {
    const normalizedValue =
      value.trim().toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "on",
        "enabled",
      ].includes(normalizedValue)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "off",
        "disabled",
      ].includes(normalizedValue)
    ) {
      return false;
    }
  }

  return fallback;
}

function normalizeFooterContent(
  content = {},
  settings = {}
) {
  return {
    isEnabled:
      content.isEnabled !== false,

    brand: {
      ...DEFAULT_FOOTER.brand,
      ...(content.brand || {}),
    },

    columns: Array.isArray(
      content.columns
    )
      ? content.columns
      : DEFAULT_FOOTER.columns,

    newsletter: {
      ...DEFAULT_FOOTER.newsletter,
      ...(content.newsletter || {}),
    },

    social: {
      ...DEFAULT_FOOTER.social,
      ...(content.social || {}),
    },

    developer: {
      ...DEFAULT_FOOTER.developer,
      ...(content.developer || {}),
    },

    legal: {
      ...DEFAULT_FOOTER.legal,
      ...(content.legal || {}),

      links: Array.isArray(
        content.legal?.links
      )
        ? content.legal.links
        : DEFAULT_FOOTER.legal.links,
    },

    settings: {
      store: {
        ...DEFAULT_SETTINGS.store,
        ...(settings.store || {}),
      },

      contact: {
        ...DEFAULT_SETTINGS.contact,
        ...(settings.contact || {}),
      },

      social: {
        ...DEFAULT_SETTINGS.social,
        ...(settings.social || {}),
      },

      delivery: {
        ...DEFAULT_SETTINGS.delivery,
        ...(settings.delivery || {}),
      },

      payment: {
        ...DEFAULT_SETTINGS.payment,
        ...(settings.payment || {}),
      },
    },
  };
}

function isSafeHref(value) {
  const href = normalizeText(value);

  if (!href) {
    return false;
  }

  if (
    href.startsWith("/") &&
    !href.startsWith("//")
  ) {
    return true;
  }

  if (href.startsWith("#")) {
    return true;
  }

  return (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function isExternalLink(href = "") {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizePhoneDigits(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 15);
}

function createPhoneHref(value) {
  const normalizedValue =
    String(value || "")
      .replace(/[^\d+]/g, "")
      .trim();

  return normalizedValue
    ? `tel:${normalizedValue}`
    : "";
}

function getCurrencySymbol(
  currency
) {
  const normalizedCurrency =
    normalizeText(
      currency,
      "BDT"
    ).toUpperCase();

  if (
    normalizedCurrency === "BDT"
  ) {
    return "৳";
  }

  if (
    normalizedCurrency === "USD"
  ) {
    return "$";
  }

  if (
    normalizedCurrency === "AUD"
  ) {
    return "A$";
  }

  if (
    normalizedCurrency === "EUR"
  ) {
    return "€";
  }

  if (
    normalizedCurrency === "GBP"
  ) {
    return "£";
  }

  return normalizedCurrency;
}

function formatMoney(
  value,
  currencySymbol
) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return "";
  }

  return `${currencySymbol}${new Intl.NumberFormat(
    "en-BD",
    {
      maximumFractionDigits: 0,
    }
  ).format(numericValue)}`;
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
        d="M3.5 10h12"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      <path
        d="m11.5 5.8 4.2 4.2-4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalArrowIcon({
  className = "h-3.5 w-3.5",
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
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      <path
        d="M8 6h6v6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon({
  className = "h-[17px] w-[17px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.15"
      />

      <path
        d="m4.5 7 7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon({
  className = "h-[17px] w-[17px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.15"
      />
    </svg>
  );
}

function PhoneIcon({
  className = "h-[17px] w-[17px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M7.1 3.8 9.7 8l-2 2a16.2 16.2 0 0 0 6.3 6.3l2-2 4.2 2.6-.7 3.2c-.2.8-.9 1.4-1.8 1.4C9.4 21.2 2.8 14.6 2.5 6.3c0-.9.6-1.6 1.4-1.8l3.2-.7Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon({
  className = "h-[17px] w-[17px]",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.1-4A8.2 8.2 0 1 1 20.2 11.7Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />

      <path
        d="M8.3 7.8c.4-.4.8-.3 1 .1l1 2-1.1 1.1a7.3 7.3 0 0 0 3.7 3.7l1.1-1.1 2 1c.4.2.5.6.1 1-.7.8-1.7 1.1-2.8.8-3.2-.9-5.8-3.5-6.7-6.7-.3-1.1 0-2.1.8-2.8Z"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FooterLink({
  href,
  label,
  openInNewTab = false,
  className = "",
  children,
}) {
  const safeHref = normalizeText(href);
  const safeLabel = normalizeText(label);

  if (
    !safeHref ||
    !safeLabel ||
    !isSafeHref(safeHref)
  ) {
    return null;
  }

  const target = openInNewTab
    ? "_blank"
    : undefined;

  const rel = openInNewTab
    ? "noopener noreferrer"
    : undefined;

  const content =
    children || safeLabel;

  if (
    isExternalLink(safeHref) ||
    safeHref.startsWith("mailto:") ||
    safeHref.startsWith("tel:")
  ) {
    return (
      <a
        href={safeHref}
        target={target}
        rel={rel}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={safeHref}
      target={target}
      rel={rel}
      className={className}
    >
      {content}
    </Link>
  );
}

function ContactRow({
  icon,
  eyebrow,
  value,
  href = "",
}) {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.025] text-white/54 transition-all duration-500 group-hover:border-white/22 group-hover:bg-white/[0.06] group-hover:text-white">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-[8px] font-semibold uppercase tracking-[0.25em] text-white/28">
          {eyebrow}
        </span>

        <span className="mt-1 block break-words text-[12px] leading-5 text-white/62 transition-colors duration-300 group-hover:text-white">
          {value}
        </span>
      </span>
    </>
  );

  if (
    href &&
    isSafeHref(href)
  ) {
    return (
      <a
        href={href}
        className="group flex items-center gap-3"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="group flex items-center gap-3">
      {content}
    </div>
  );
}

function TrustItem({
  number,
  title,
  description,
}) {
  return (
    <div className="group relative min-w-0 border-l border-white/10 pl-5">
      <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/24">
        {number}
      </span>

      <p className="mt-3 font-heading text-[20px] font-medium leading-none tracking-[-0.02em] text-white/82 transition-colors duration-500 group-hover:text-white">
        {title}
      </p>

      <p className="mt-2 max-w-[240px] text-[11px] leading-5 text-white/34">
        {description}
      </p>
    </div>
  );
}

export default function Footer() {
  const [footer, setFooter] =
    useState(() =>
      normalizeFooterContent()
    );

  const [email, setEmail] =
    useState("");

  const [
    newsletterStatus,
    setNewsletterStatus,
  ] = useState("idle");

  const [
    newsletterMessage,
    setNewsletterMessage,
  ] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFooter() {
      try {
        const [
          footerResponse,
          settingsResponse,
        ] = await Promise.all([
          fetch("/api/cms/footer", {
            method: "GET",
            cache: "no-store",
          }),

          fetch("/api/settings", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const [
          footerData,
          settingsData,
        ] = await Promise.all([
          footerResponse.json(),
          settingsResponse.json(),
        ]);

        if (!isMounted) {
          return;
        }

        const footerContent =
          footerResponse.ok &&
          footerData.success
            ? footerData.content
            : {};

        const settings =
          settingsResponse.ok &&
          settingsData.success
            ? settingsData.settings
            : {};

        setFooter(
          normalizeFooterContent(
            footerContent,
            settings
          )
        );
      } catch (error) {
        console.error(
          "Footer content loading error:",
          error
        );

        if (isMounted) {
          setFooter(
            normalizeFooterContent()
          );
        }
      }
    }

    loadFooter();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleColumns =
    useMemo(() => {
      return [...footer.columns]
        .filter(
          (column) =>
            column &&
            column.isActive !==
              false &&
            normalizeText(
              column.title
            )
        )
        .sort(
          (
            firstColumn,
            secondColumn
          ) =>
            normalizeOrder(
              firstColumn.order
            ) -
            normalizeOrder(
              secondColumn.order
            )
        )
        .map((column) => ({
          ...column,

          links: Array.isArray(
            column.links
          )
            ? [...column.links]
                .filter(
                  (link) =>
                    link &&
                    link.isActive !==
                      false &&
                    normalizeText(
                      link.label
                    ) &&
                    normalizeText(
                      link.href
                    ) &&
                    isSafeHref(
                      link.href
                    )
                )
                .sort(
                  (
                    firstLink,
                    secondLink
                  ) =>
                    normalizeOrder(
                      firstLink.order
                    ) -
                    normalizeOrder(
                      secondLink.order
                    )
                )
            : [],
        }));
    }, [footer.columns]);

  const legalLinks =
    useMemo(() => {
      return [...footer.legal.links]
        .filter(
          (link) =>
            link &&
            link.isActive !==
              false &&
            normalizeText(
              link.label
            ) &&
            normalizeText(
              link.href
            ) &&
            isSafeHref(link.href)
        )
        .sort(
          (
            firstLink,
            secondLink
          ) =>
            normalizeOrder(
              firstLink.order
            ) -
            normalizeOrder(
              secondLink.order
            )
        );
    }, [footer.legal.links]);

  async function handleNewsletterSubmit(
    event
  ) {
    event.preventDefault();

    if (
      newsletterStatus === "loading"
    ) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setNewsletterStatus("error");
      setNewsletterMessage(
        "Please enter your email address."
      );
      return;
    }

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      setNewsletterStatus("error");
      setNewsletterMessage(
        "Please enter a valid email address."
      );
      return;
    }

    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      const response = await fetch(
        "/api/newsletter",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: normalizedEmail,
            source: "footer",
          }),
        }
      );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          normalizeText(
            data.message,
            "Newsletter subscription could not be completed."
          )
        );
      }

      setNewsletterStatus(
        "success"
      );

      setNewsletterMessage(
        normalizeText(
          data.message,
          normalizeText(
            footer.newsletter
              .successMessage,
            "Thank you for joining OBSIDIAN."
          )
        )
      );

      setEmail("");
    } catch (error) {
      console.error(
        "Newsletter submission error:",
        error
      );

      setNewsletterStatus("error");

      setNewsletterMessage(
        normalizeText(
          error?.message,
          "Something went wrong. Please try again."
        )
      );
    }
  }

  function handleEmailChange(
    event
  ) {
    setEmail(event.target.value);

    if (
      newsletterStatus !== "idle"
    ) {
      setNewsletterStatus("idle");
      setNewsletterMessage("");
    }
  }

  if (!footer.isEnabled) {
    return null;
  }

  const {
    brand,
    newsletter,
    social,
    developer,
    legal,
    settings,
  } = footer;

  const storeName = normalizeText(
    settings.store?.name,
    "OBSIDIAN"
  );

  const brandDescription =
    normalizeText(
      brand.description,
      normalizeText(
        settings.store?.tagline,
        DEFAULT_FOOTER.brand
          .description
      )
    );

  const logoUrl = normalizeText(
    brand.logoUrl
  );

  const logoAlt = normalizeText(
    brand.logoAlt,
    storeName
  );

  const contactEmail =
    normalizeText(
      settings.contact?.email
    );

  const contactLocation =
    normalizeText(
      settings.contact?.location
    );

  const contactPhone =
    normalizeText(
      settings.contact?.phone
    );

  const whatsappNumber =
    normalizePhoneDigits(
      settings.contact
        ?.whatsappNumber
    );

  const whatsappHref =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          `Hello ${storeName}, I would like to know more about your products.`
        )}`
      : "";

  const phoneHref =
    createPhoneHref(
      contactPhone
    );

  const socialItems = [
    {
      id: "facebook",
      label: "Facebook",
      href: normalizeText(
        settings.social
          ?.facebookUrl
      ),
      isVisible:
        social.showFacebook !==
        false,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: normalizeText(
        settings.social
          ?.instagramUrl
      ),
      isVisible:
        social.showInstagram !==
        false,
    },
    {
      id: "tiktok",
      label: "TikTok",
      href: normalizeText(
        settings.social?.tiktokUrl
      ),
      isVisible:
        social.showTikTok !== false,
    },
    {
      id: "youtube",
      label: "YouTube",
      href: normalizeText(
        settings.social
          ?.youtubeUrl
      ),
      isVisible:
        social.showYouTube !==
        false,
    },
  ].filter(
    (item) =>
      item.isVisible &&
      item.href &&
      isSafeHref(item.href)
  );

  const currencySymbol =
    getCurrencySymbol(
      settings.store?.currency
    );

  const insideDhakaCharge =
    formatMoney(
      settings.delivery
        ?.insideDhaka,
      currencySymbol
    );

  const outsideDhakaCharge =
    formatMoney(
      settings.delivery
        ?.outsideDhaka,
      currencySymbol
    );

  const freeShippingOver =
    Number(
      settings.delivery
        ?.freeShippingOver
    );

  const paymentMethods = [
    {
      id: "cod",
      label: "Cash on Delivery",
      enabled: normalizeBoolean(
        settings.payment
          ?.cashOnDelivery,
        true
      ),
    },
    {
      id: "bkash",
      label: "bKash",
      enabled: normalizeBoolean(
        settings.payment?.bkash,
        false
      ),
    },
    {
      id: "nagad",
      label: "Nagad",
      enabled: normalizeBoolean(
        settings.payment?.nagad,
        false
      ),
    },
    {
      id: "rocket",
      label: "Rocket",
      enabled: normalizeBoolean(
        settings.payment?.rocket,
        false
      ),
    },
  ].filter(
    (method) => method.enabled
  );

  const deliveryDescription =
    insideDhakaCharge &&
    outsideDhakaCharge
      ? `${insideDhakaCharge} inside Dhaka · ${outsideDhakaCharge} outside Dhaka`
      : "Delivery available across Bangladesh";

  const paymentDescription =
    paymentMethods.length > 0
      ? paymentMethods
          .map(
            (method) => method.label
          )
          .join(" · ")
      : "Secure order confirmation";

  const developerLabel =
    normalizeText(
      developer.label,
      "Developed by"
    );

  const developerName =
    normalizeText(
      developer.name,
      "Borhan Dipto"
    );

  const developerUrl =
    normalizeExternalUrl(
      developer.linkedinUrl
    );

  const showDeveloperCredit =
    developer.isEnabled !==
      false &&
    developerName &&
    developerUrl &&
    isSafeHref(developerUrl);

  const currentYear =
    new Date().getFullYear();

  const copyrightText =
    normalizeText(
      legal.copyrightText,
      `${storeName}. All rights reserved.`
    );

  const isNewsletterLoading =
    newsletterStatus === "loading";

  const isNewsletterError =
    newsletterStatus === "error";

  const isNewsletterSuccess =
    newsletterStatus === "success";

  return (
    <>
      <style jsx global>{`
        @keyframes obsidianFooterGlow {
          0%,
          100% {
            opacity: 0.28;
            transform: translate3d(
                -3%,
                0,
                0
              )
              scale(1);
          }

          50% {
            opacity: 0.5;
            transform: translate3d(
                4%,
                -2%,
                0
              )
              scale(1.06);
          }
        }

        @keyframes obsidianFooterLogoGlint {
          0%,
          70% {
            opacity: 0;
            transform: translateX(
              -140%
            );
          }

          74% {
            opacity: 0.8;
          }

          92% {
            opacity: 0.4;
          }

          100% {
            opacity: 0;
            transform: translateX(
              180%
            );
          }
        }

        .obsidian-footer-glow {
          animation:
            obsidianFooterGlow 10s
            ease-in-out infinite;
        }

        .obsidian-footer-logo-glint {
          animation:
            obsidianFooterLogoGlint
            8s ease-in-out infinite;
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .obsidian-footer-glow,
          .obsidian-footer-logo-glint {
            animation: none !important;
          }
        }
      `}</style>

      <footer className="relative overflow-hidden bg-[#080808] text-[#f1ece4]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <span className="obsidian-footer-glow absolute -left-[15%] -top-32 h-[420px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(123,210,229,0.08),rgba(255,255,255,0.025)_44%,transparent_72%)] blur-3xl" />

          <span className="absolute -right-[12%] bottom-0 h-[380px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(218,202,245,0.055),rgba(255,255,255,0.018)_44%,transparent_72%)] blur-3xl" />

          <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />

          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1640px] px-5 pb-8 pt-16 sm:px-7 sm:pt-20 lg:px-10 xl:px-12 xl:pt-24">
          <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20 lg:pb-18">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.34em] text-white/28 sm:text-[9px]">
                Private Releases · Editorial Notes
              </p>

              <h2 className="mt-5 max-w-3xl font-heading text-[2.7rem] font-medium leading-[0.92] tracking-[-0.045em] text-white sm:text-[4rem] lg:text-[5rem]">
                Stay close to
                <span className="block italic text-white/36">
                  what comes next.
                </span>
              </h2>
            </div>

            {newsletter.isEnabled !==
            false ? (
              <div className="lg:pb-1">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/32">
                      {normalizeText(
                        newsletter.title,
                        "Stay In Touch"
                      )}
                    </p>

                    <p className="mt-3 max-w-xl text-[13px] leading-6 text-white/42">
                      {normalizeText(
                        newsletter.description,
                        `Join the ${storeName} community for future drops and stories.`
                      )}
                    </p>
                  </div>

                  <span className="hidden font-heading text-4xl italic text-white/12 sm:block">
                    01
                  </span>
                </div>

                <form
                  onSubmit={
                    handleNewsletterSubmit
                  }
                  noValidate
                  className="mt-7"
                >
                  <div
                    className={`group flex items-center border-b transition-colors duration-500 ${
                      isNewsletterError
                        ? "border-red-300/70"
                        : isNewsletterSuccess
                          ? "border-emerald-300/60"
                          : "border-white/24 focus-within:border-white/70"
                    }`}
                  >
                    <label
                      htmlFor="footer-email"
                      className="sr-only"
                    >
                      Email address
                    </label>

                    <input
                      id="footer-email"
                      type="email"
                      value={email}
                      onChange={
                        handleEmailChange
                      }
                      placeholder={normalizeText(
                        newsletter.placeholder,
                        "Email address"
                      )}
                      aria-invalid={
                        isNewsletterError
                      }
                      aria-describedby={
                        newsletterMessage
                          ? "footer-newsletter-message"
                          : undefined
                      }
                      disabled={
                        isNewsletterLoading
                      }
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent py-4 pr-5 font-heading text-[20px] text-white outline-none placeholder:text-white/22 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[23px]"
                    />

                    <button
                      type="submit"
                      disabled={
                        isNewsletterLoading
                      }
                      className="group/button inline-flex shrink-0 items-center gap-3 py-4 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/68 transition-all duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isNewsletterLoading
                        ? "Joining"
                        : normalizeText(
                            newsletter.buttonText,
                            "Join"
                          )}

                      <ArrowIcon className="transition-transform duration-300 group-hover/button:translate-x-1" />
                    </button>
                  </div>

                  {newsletterMessage ? (
                    <p
                      id="footer-newsletter-message"
                      className={`mt-3 text-[11px] leading-5 ${
                        isNewsletterError
                          ? "text-red-300"
                          : isNewsletterSuccess
                            ? "text-emerald-300"
                            : "text-white/40"
                      }`}
                      role={
                        isNewsletterError
                          ? "alert"
                          : "status"
                      }
                      aria-live="polite"
                    >
                      {newsletterMessage}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}
          </div>

          <div className="grid gap-12 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20 lg:py-18">
            <div className="grid gap-12 sm:grid-cols-[1.15fr_0.85fr] sm:gap-10">
              <div>
                <Link
                  href="/"
                  aria-label={`${storeName} home`}
                  className="group inline-flex items-center gap-3"
                >
                  {brand.showLogo &&
                  logoUrl ? (
                    <span className="relative block max-w-[230px] overflow-hidden">
                      <img
                        src={logoUrl}
                        alt={logoAlt}
                        className="max-h-[58px] max-w-[230px] object-contain object-left"
                      />

                      <span
                        aria-hidden="true"
                        className="obsidian-footer-logo-glint pointer-events-none absolute inset-y-[-60%] left-0 w-[46%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
                      />
                    </span>
                  ) : (
                    <>
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
                        <img
                          src="/images/obsidian-logo-ivory.png"
                          alt=""
                          className="relative z-[1] h-full w-full object-contain"
                        />

                        <span
                          aria-hidden="true"
                          className="obsidian-footer-logo-glint absolute inset-y-[-60%] left-0 z-[2] w-[48%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
                        />
                      </span>

                      <span className="font-heading text-[31px] font-medium uppercase tracking-[0.16em] text-white">
                        {storeName}
                      </span>
                    </>
                  )}
                </Link>

                {brandDescription ? (
                  <p className="mt-7 max-w-[410px] font-heading text-[24px] font-medium leading-[1.22] tracking-[-0.015em] text-white/58 sm:text-[27px]">
                    {brandDescription}
                  </p>
                ) : null}

                {socialItems.length >
                0 ? (
                  <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                    {socialItems.map(
                      (item) => (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.24em] text-white/32 transition-colors duration-300 hover:text-white"
                        >
                          {item.label}

                          <ExternalArrowIcon className="opacity-40 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
                        </a>
                      )
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-5 sm:border-l sm:border-white/10 sm:pl-8">
                {brand.showEmail &&
                contactEmail ? (
                  <ContactRow
                    icon={<MailIcon />}
                    eyebrow="Email"
                    value={contactEmail}
                    href={`mailto:${contactEmail}`}
                  />
                ) : null}

                {brand.showPhone &&
                contactPhone &&
                phoneHref ? (
                  <ContactRow
                    icon={<PhoneIcon />}
                    eyebrow="Phone"
                    value={contactPhone}
                    href={phoneHref}
                  />
                ) : null}

                {whatsappHref ? (
                  <ContactRow
                    icon={
                      <WhatsAppIcon />
                    }
                    eyebrow="WhatsApp"
                    value="Start a conversation"
                    href={whatsappHref}
                  />
                ) : null}

                {brand.showLocation &&
                contactLocation ? (
                  <ContactRow
                    icon={
                      <LocationIcon />
                    }
                    eyebrow="Origin"
                    value={contactLocation}
                  />
                ) : null}
              </div>
            </div>

            <div
              className={`grid gap-x-8 gap-y-10 ${
                visibleColumns.length >=
                3
                  ? "sm:grid-cols-3"
                  : "grid-cols-2"
              }`}
            >
              {visibleColumns.map(
                (column, columnIndex) => (
                  <div
                    key={
                      column.id ||
                      column.title
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-semibold tracking-[0.22em] text-white/18">
                        {String(
                          columnIndex + 1
                        ).padStart(2, "0")}
                      </span>

                      <h3 className="text-[9px] font-semibold uppercase tracking-[0.27em] text-white/38">
                        {column.title}
                      </h3>
                    </div>

                    {column.links.length >
                    0 ? (
                      <ul className="mt-6 space-y-3.5">
                        {column.links.map(
                          (link) => (
                            <li
                              key={
                                link.id ||
                                `${link.label}-${link.href}`
                              }
                            >
                              <FooterLink
                                href={
                                  link.href
                                }
                                label={
                                  link.label
                                }
                                openInNewTab={
                                  link.openInNewTab
                                }
                                className="group inline-flex items-center gap-2 font-heading text-[18px] font-medium leading-none text-white/52 transition-all duration-300 hover:translate-x-1 hover:text-white"
                              >
                                <span>
                                  {
                                    link.label
                                  }
                                </span>

                                {isExternalLink(
                                  link.href
                                ) ? (
                                  <ExternalArrowIcon className="h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
                                ) : null}
                              </FooterLink>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="mt-6 text-[11px] text-white/24">
                        No links available.
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid gap-7 border-y border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <TrustItem
              number="01"
              title="Bangladesh Delivery"
              description={
                deliveryDescription
              }
            />

            <TrustItem
              number="02"
              title="Flexible Payment"
              description={
                paymentDescription
              }
            />

            <TrustItem
              number="03"
              title="Order Assistance"
              description="Support through WhatsApp, email and order tracking."
            />

            <TrustItem
              number="04"
              title={
                Number.isFinite(
                  freeShippingOver
                ) &&
                freeShippingOver > 0
                  ? "Complimentary Delivery"
                  : "Built With Precision"
              }
              description={
                Number.isFinite(
                  freeShippingOver
                ) &&
                freeShippingOver > 0
                  ? `Available on orders over ${formatMoney(
                      freeShippingOver,
                      currencySymbol
                    )}.`
                  : "Every OBSIDIAN piece is shaped by restraint, structure and purpose."
              }
            />
          </div>

          <div className="flex flex-col gap-6 py-8 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/24 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <p className="leading-5">
                {legal.showCurrentYear !==
                false
                  ? `© ${currentYear} `
                  : "© "}
                {copyrightText}
              </p>

              {showDeveloperCredit ? (
                <p className="leading-5">
                  {developerLabel}{" "}
                  <a
                    href={developerUrl}
                    target={
                      developer.openInNewTab !==
                      false
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      developer.openInNewTab !==
                      false
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group inline-flex items-center gap-1.5 text-white/55 transition-colors duration-300 hover:text-white"
                  >
                    <span>
                      {developerName}
                    </span>

                    <ExternalArrowIcon className="h-3 w-3 opacity-45 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {legalLinks.map(
                (link) => (
                  <FooterLink
                    key={
                      link.id ||
                      `${link.label}-${link.href}`
                    }
                    href={link.href}
                    label={link.label}
                    openInNewTab={
                      link.openInNewTab
                    }
                    className="transition-colors duration-300 hover:text-white"
                  />
                )
              )}

              <Link
                href="#top"
                className="group inline-flex items-center gap-2 text-white/32 transition-colors duration-300 hover:text-white"
              >
                Back To Top

                <ArrowIcon className="h-3.5 w-3.5 -rotate-90 transition-transform duration-300 group-hover:-translate-y-1" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}