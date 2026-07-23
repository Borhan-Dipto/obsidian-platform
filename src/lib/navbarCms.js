const MAX_NAVIGATION_ITEMS = 30;
const MAX_LABEL_LENGTH = 80;
const MAX_TEXT_LENGTH = 160;
const MAX_URL_LENGTH = 2048;
const MAX_LOGO_WIDTH = 500;
const MIN_LOGO_WIDTH = 40;

const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/api/admin",
];

const ALLOWED_EXTERNAL_PROTOCOLS =
  new Set(["http:", "https:"]);

const DEFAULT_NAVBAR_ACCOUNT = Object.freeze({
  showDesktop: true,
  showMobile: true,
  label: "Account",
});

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) ===
        Object.prototype
  );
}

function normalizeText(
  value,
  fallback = "",
  maximumLength = MAX_TEXT_LENGTH
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value
    .normalize("NFKC")
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ""
    )
    .trim()
    .slice(0, maximumLength);

  return normalizedValue || fallback;
}

function normalizeBoolean(
  value,
  fallback = false
) {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function normalizeNumber(
  value,
  fallback,
  minimum,
  maximum
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    Math.max(numericValue, minimum),
    maximum
  );
}

function repeatedlyDecodePath(value) {
  let currentValue = String(value || "");

  for (
    let attempt = 0;
    attempt < 3;
    attempt += 1
  ) {
    try {
      const decodedValue =
        decodeURIComponent(currentValue);

      if (decodedValue === currentValue) {
        break;
      }

      currentValue = decodedValue;
    } catch {
      break;
    }
  }

  return currentValue;
}

function normalizePathForSecurity(pathname) {
  const decodedPath =
    repeatedlyDecodePath(pathname);

  const normalizedPath = decodedPath
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .trim()
    .toLowerCase();

  if (!normalizedPath) {
    return "/";
  }

  return normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;
}

function isPrivatePublicPath(pathname) {
  const normalizedPath =
    normalizePathForSecurity(pathname);

  return PRIVATE_PATH_PREFIXES.some(
    (privatePrefix) =>
      normalizedPath === privatePrefix ||
      normalizedPath.startsWith(
        `${privatePrefix}/`
      )
  );
}

function inspectPublicNavigationHref(value) {
  if (typeof value !== "string") {
    return {
      valid: false,
      href: "",
      code: "INVALID_URL_TYPE",
      message:
        "Navigation URL must be valid text.",
    };
  }

  const href = value
    .normalize("NFKC")
    .trim()
    .slice(0, MAX_URL_LENGTH);

  if (!href) {
    return {
      valid: false,
      href: "",
      code: "EMPTY_URL",
      message:
        "Navigation URL is required.",
    };
  }

  if (
    /[\u0000-\u001F\u007F]/.test(href)
  ) {
    return {
      valid: false,
      href: "",
      code: "CONTROL_CHARACTER",
      message:
        "Navigation URL contains unsupported characters.",
    };
  }

  if (href.includes("\\")) {
    return {
      valid: false,
      href: "",
      code: "BACKSLASH_URL",
      message:
        "Navigation URL cannot contain backslashes.",
    };
  }

  if (href.startsWith("//")) {
    return {
      valid: false,
      href: "",
      code: "PROTOCOL_RELATIVE_URL",
      message:
        "Protocol-relative URLs are not allowed.",
    };
  }

  if (href.startsWith("/")) {
    let parsedUrl;

    try {
      parsedUrl = new URL(
        href,
        "https://obsidian.invalid"
      );
    } catch {
      return {
        valid: false,
        href: "",
        code: "MALFORMED_INTERNAL_URL",
        message:
          "Navigation URL is malformed.",
      };
    }

    if (
      isPrivatePublicPath(
        parsedUrl.pathname
      )
    ) {
      return {
        valid: false,
        href: "",
        code: "PRIVATE_ROUTE",
        message:
          "Admin and private routes cannot be added to the public Navbar.",
      };
    }

    return {
      valid: true,
      href,
      code: "",
      message: "",
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(href);
  } catch {
    return {
      valid: false,
      href: "",
      code: "UNSUPPORTED_URL_FORMAT",
      message:
        "Use an internal URL beginning with / or a complete https:// URL.",
    };
  }

  if (
    !ALLOWED_EXTERNAL_PROTOCOLS.has(
      parsedUrl.protocol
    )
  ) {
    return {
      valid: false,
      href: "",
      code: "UNSAFE_PROTOCOL",
      message:
        "Only http:// and https:// external URLs are allowed.",
    };
  }

  if (
    parsedUrl.username ||
    parsedUrl.password
  ) {
    return {
      valid: false,
      href: "",
      code: "URL_CREDENTIALS",
      message:
        "URLs containing embedded credentials are not allowed.",
    };
  }

  if (
    isPrivatePublicPath(
      parsedUrl.pathname
    )
  ) {
    return {
      valid: false,
      href: "",
      code: "PRIVATE_ROUTE",
      message:
        "Admin and private routes cannot be added to the public Navbar.",
    };
  }

  return {
    valid: true,
    href: parsedUrl.toString(),
    code: "",
    message: "",
  };
}

function isSafePublicNavigationHref(value) {
  return inspectPublicNavigationHref(
    value
  ).valid;
}

function createNavigationItemId(
  item,
  index
) {
  const suppliedId = normalizeText(
    item?.id,
    "",
    120
  );

  if (
    suppliedId &&
    /^[A-Za-z0-9._:-]+$/.test(
      suppliedId
    )
  ) {
    return suppliedId;
  }

  return `nav-item-${index + 1}`;
}

function sanitizeNavigationItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const usedIds = new Set();

  return items
    .slice(0, MAX_NAVIGATION_ITEMS)
    .map((item, index) => {
      if (!isPlainObject(item)) {
        return null;
      }

      const label = normalizeText(
        item.label,
        "",
        MAX_LABEL_LENGTH
      );

      const hrefInspection =
        inspectPublicNavigationHref(
          item.href
        );

      if (
        !label ||
        !hrefInspection.valid
      ) {
        return null;
      }

      let id = createNavigationItemId(
        item,
        index
      );

      if (usedIds.has(id)) {
        id = `${id}-${index + 1}`;
      }

      usedIds.add(id);

      return {
        id,
        label,
        href: hrefInspection.href,

        order: normalizeNumber(
          item.order,
          index + 1,
          -1000,
          1000
        ),

        isActive:
          item.isActive !== false,

        openInNewTab:
          item.openInNewTab === true,
      };
    })
    .filter(Boolean);
}

function sanitizeAnnouncement(
  announcement = {}
) {
  const safeAnnouncement =
    isPlainObject(announcement)
      ? announcement
      : {};

  const text = normalizeText(
    safeAnnouncement.text,
    "",
    MAX_TEXT_LENGTH
  );

  const rawHref = normalizeText(
    safeAnnouncement.href,
    "",
    MAX_URL_LENGTH
  );

  const hrefInspection = rawHref
    ? inspectPublicNavigationHref(
        rawHref
      )
    : {
        valid: true,
        href: "",
      };

  return {
    isEnabled:
      safeAnnouncement.isEnabled ===
        true && Boolean(text),

    text,

    href: hrefInspection.valid
      ? hrefInspection.href
      : "",

    openInNewTab:
      hrefInspection.valid &&
      Boolean(hrefInspection.href) &&
      safeAnnouncement.openInNewTab ===
        true,
  };
}

function sanitizeNavbarContent(
  content = {},
  options = {}
) {
  const source = isPlainObject(content)
    ? content
    : {};

  const branding = isPlainObject(
    source.branding
  )
    ? source.branding
    : {};

  const desktop = isPlainObject(
    source.desktop
  )
    ? source.desktop
    : {};

  const mobile = isPlainObject(
    source.mobile
  )
    ? source.mobile
    : {};

  const account = isPlainObject(
    source.account
  )
    ? source.account
    : {};

  const schemaVersion = normalizeNumber(
    options.schemaVersion ??
      source.schemaVersion,
    1,
    1,
    1000
  );

  return {
    key: "navbar",
    schemaVersion,

    isEnabled:
      source.isEnabled !== false,

    branding: {
      showTextLogo:
        branding.showTextLogo !== false,

      storeName: normalizeText(
        branding.storeName,
        "OBSIDIAN",
        MAX_LABEL_LENGTH
      ),

      logoUrl: normalizeText(
        branding.logoUrl,
        "",
        MAX_URL_LENGTH
      ),

      logoAlt: normalizeText(
        branding.logoAlt,
        "OBSIDIAN",
        MAX_TEXT_LENGTH
      ),

      logoWidth: normalizeNumber(
        branding.logoWidth,
        180,
        MIN_LOGO_WIDTH,
        MAX_LOGO_WIDTH
      ),
    },

    desktop: {
      showWishlist:
        desktop.showWishlist !== false,

      showCart:
        desktop.showCart !== false,

      showSearch:
        desktop.showSearch === true,
    },

    mobile: {
      showWishlist:
        mobile.showWishlist !== false,

      showCart:
        mobile.showCart !== false,

      showSearch:
        mobile.showSearch === true,
    },

    account: {
      showDesktop:
        account.showDesktop !== false,

      showMobile:
        account.showMobile !== false,

      label: normalizeText(
        account.label ||
          account.accountLabel,
        DEFAULT_NAVBAR_ACCOUNT.label,
        MAX_LABEL_LENGTH
      ),
    },

    items: sanitizeNavigationItems(
      source.items
    ),

    announcement:
      sanitizeAnnouncement(
        source.announcement
      ),
  };
}

function validateNavbarContentInput(
  content
) {
  const errors = [];

  if (!isPlainObject(content)) {
    return {
      valid: false,

      errors: [
        {
          field: "navbar",
          code: "INVALID_NAVBAR",
          message:
            "Navbar content must be a valid object.",
        },
      ],
    };
  }

  if (
    content.items !== undefined &&
    !Array.isArray(content.items)
  ) {
    errors.push({
      field: "items",
      code: "INVALID_ITEMS",
      message:
        "Navigation items must be an array.",
    });
  }

  if (
    Array.isArray(content.items) &&
    content.items.length >
      MAX_NAVIGATION_ITEMS
  ) {
    errors.push({
      field: "items",
      code: "TOO_MANY_ITEMS",
      message: `A maximum of ${MAX_NAVIGATION_ITEMS} navigation items is allowed.`,
    });
  }

  if (Array.isArray(content.items)) {
    content.items.forEach(
      (item, index) => {
        if (!isPlainObject(item)) {
          errors.push({
            field: `items.${index}`,
            code: "INVALID_ITEM",
            message:
              "Each navigation item must be a valid object.",
          });

          return;
        }

        const label = normalizeText(
          item.label,
          "",
          MAX_LABEL_LENGTH
        );

        if (!label) {
          errors.push({
            field: `items.${index}.label`,
            code: "EMPTY_LABEL",
            message:
              "Every active navigation item requires a label.",
          });
        }

        const hrefInspection =
          inspectPublicNavigationHref(
            item.href
          );

        if (!hrefInspection.valid) {
          errors.push({
            field: `items.${index}.href`,
            code:
              hrefInspection.code,
            message:
              hrefInspection.message,
          });
        }
      }
    );
  }

  const announcement =
    isPlainObject(
      content.announcement
    )
      ? content.announcement
      : null;

  if (
    announcement &&
    normalizeText(
      announcement.href,
      "",
      MAX_URL_LENGTH
    )
  ) {
    const hrefInspection =
      inspectPublicNavigationHref(
        announcement.href
      );

    if (!hrefInspection.valid) {
      errors.push({
        field:
          "announcement.href",

        code:
          hrefInspection.code,

        message:
          hrefInspection.message,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export {
  DEFAULT_NAVBAR_ACCOUNT,
  MAX_NAVIGATION_ITEMS,
  inspectPublicNavigationHref,
  isPrivatePublicPath,
  isSafePublicNavigationHref,
  sanitizeNavbarContent,
  validateNavbarContentInput,
};