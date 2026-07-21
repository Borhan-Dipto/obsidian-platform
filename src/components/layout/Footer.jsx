"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  },

  contact: {
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
};

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeOrder(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function isExternalLink(href = "") {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeFooterContent(
  content = {},
  settings = {}
) {
  return {
    isEnabled: content.isEnabled !== false,

    brand: {
      ...DEFAULT_FOOTER.brand,
      ...(content.brand || {}),
    },

    columns: Array.isArray(content.columns)
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
    },
  };
}

function FooterLink({
  href,
  label,
  openInNewTab = false,
  className = "",
}) {
  const safeHref = normalizeText(href);
  const safeLabel = normalizeText(label);

  if (!safeHref || !safeLabel) {
    return null;
  }

  const target = openInNewTab
    ? "_blank"
    : undefined;

  const rel = openInNewTab
    ? "noopener noreferrer"
    : undefined;

  if (isExternalLink(safeHref)) {
    return (
      <a
        href={safeHref}
        target={target}
        rel={rel}
        className={className}
      >
        {safeLabel}
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
      {safeLabel}
    </Link>
  );
}

export default function Footer() {
  const [footer, setFooter] = useState(() =>
    normalizeFooterContent()
  );

  const [email, setEmail] = useState("");

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

  const visibleColumns = useMemo(() => {
    return [...footer.columns]
      .filter(
        (column) =>
          column &&
          column.isActive !== false &&
          normalizeText(column.title)
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

  const legalLinks = useMemo(() => {
    return [...footer.legal.links]
      .filter(
        (link) =>
          link &&
          link.isActive !== false &&
          normalizeText(link.label) &&
          normalizeText(link.href)
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

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setNewsletterStatus("error");
      setNewsletterMessage(
        "Please enter your email address."
      );
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
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
        data = await response.json();
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

      setNewsletterStatus("success");

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

  function handleEmailChange(event) {
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

  const socialItems = [
    {
      id: "facebook",
      label: "Facebook",
      href: normalizeText(
        settings.social?.facebookUrl
      ),
      isVisible:
        social.showFacebook !== false,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: normalizeText(
        settings.social?.instagramUrl
      ),
      isVisible:
        social.showInstagram !== false,
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
        settings.social?.youtubeUrl
      ),
      isVisible:
        social.showYouTube !== false,
    },
  ].filter(
    (item) =>
      item.isVisible && item.href
  );

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
    <footer className="bg-[#0b0b0b] px-6 py-16 text-[#f1ece4] md:py-20">
      <div className="container-custom">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label={`${storeName} home`}
              className="inline-flex"
            >
              {brand.showLogo &&
              logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className="max-h-14 max-w-[220px] object-contain object-left"
                />
              ) : (
                <h2 className="text-3xl font-light uppercase tracking-[0.3em]">
                  {storeName}
                </h2>
              )}
            </Link>

            {brandDescription ? (
              <p className="mt-6 max-w-xs text-sm leading-7 text-neutral-400">
                {brandDescription}
              </p>
            ) : null}

            <div className="mt-6 space-y-3 text-sm text-neutral-500">
              {brand.showEmail &&
              contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="block break-all transition hover:text-white"
                >
                  {contactEmail}
                </a>
              ) : null}

              {brand.showPhone &&
              contactPhone ? (
                <a
                  href={`tel:${contactPhone}`}
                  className="block transition hover:text-white"
                >
                  {contactPhone}
                </a>
              ) : null}

              {brand.showLocation &&
              contactLocation ? (
                <p>
                  {contactLocation}
                </p>
              ) : null}
            </div>

            {socialItems.length >
            0 ? (
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
                {socialItems.map(
                  (item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 transition hover:text-white"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </div>
            ) : null}
          </div>

          {visibleColumns.map(
            (column) => (
              <div
                key={
                  column.id ||
                  column.title
                }
              >
                <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
                  {column.title}
                </h3>

                {column.links.length >
                0 ? (
                  <ul className="space-y-3 text-sm text-neutral-300">
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
                            className="transition hover:text-white"
                          />
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-600">
                    No links
                    available.
                  </p>
                )}
              </div>
            )
          )}

          {newsletter.isEnabled !==
          false ? (
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
                {normalizeText(
                  newsletter.title,
                  "Stay In Touch"
                )}
              </h3>

              <p className="mb-6 max-w-sm text-sm leading-7 text-neutral-400">
                {normalizeText(
                  newsletter.description,
                  `Join the ${storeName} community for future drops and stories.`
                )}
              </p>

              <form
                onSubmit={
                  handleNewsletterSubmit
                }
                noValidate
              >
                <div
                  className={`flex border transition ${
                    isNewsletterError
                      ? "border-red-400/70"
                      : isNewsletterSuccess
                        ? "border-emerald-400/60"
                        : "border-white/20"
                  }`}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={
                      handleEmailChange
                    }
                    placeholder={normalizeText(
                      newsletter.placeholder,
                      "Email address"
                    )}
                    aria-label="Email address"
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
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="submit"
                    disabled={
                      isNewsletterLoading
                    }
                    className="shrink-0 border-l border-white/20 px-4 text-xs uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#f1ece4]"
                  >
                    {isNewsletterLoading
                      ? "Joining..."
                      : normalizeText(
                          newsletter.buttonText,
                          "Join"
                        )}
                  </button>
                </div>

                {newsletterMessage ? (
                  <p
                    id="footer-newsletter-message"
                    className={`mt-4 text-xs leading-6 ${
                      isNewsletterError
                        ? "text-red-300"
                        : isNewsletterSuccess
                          ? "text-emerald-300"
                          : "text-neutral-400"
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

        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.22em] text-neutral-600 md:mt-16 md:flex-row md:items-center md:justify-between md:text-xs md:tracking-[0.25em]">
          <p>
            {legal.showCurrentYear !==
            false
              ? `© ${currentYear} `
              : "© "}
            {copyrightText}
          </p>

          {legalLinks.length > 0 ? (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                    className="transition hover:text-white"
                  />
                )
              )}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
