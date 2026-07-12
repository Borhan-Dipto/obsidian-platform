const CMS_SCHEMA_VERSION = 1;

const DEFAULT_NAVBAR = {
  key: "navbar",
  schemaVersion: CMS_SCHEMA_VERSION,
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

const DEFAULT_FOOTER = {
  key: "footer",
  schemaVersion: CMS_SCHEMA_VERSION,
  isEnabled: true,

  brand: {
    showLogo: false,
    logoUrl: "",
    logoAlt: "OBSIDIAN",
    description: "Built under pressure. Finished with precision.",
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
    successMessage: "Thank you for joining OBSIDIAN.",
  },

  social: {
    showFacebook: true,
    showInstagram: true,
    showTikTok: true,
    showYouTube: true,
  },

  legal: {
    copyrightText: "OBSIDIAN. All rights reserved.",
    showCurrentYear: true,
    links: [],
  },
};

const DEFAULT_HOMEPAGE = {
  key: "homepage",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  seo: {
    title: "Premium Menswear Bangladesh",
    description:
      "Premium menswear and engineered essentials built under pressure and finished with precision.",
    keywords: "",
    ogImage: "/images/hero1.jpeg",
    canonical: "/",
    index: true,
  },

  sections: [
    {
      id: "homepage-hero",
      type: "hero",
      order: 1,
      isEnabled: true,

      content: {
        eyebrow: "Built Under Pressure",
        title: "Where pressure meets precision",
        subtitle:
          "Engineered essentials shaped by pressure, precision, and quiet confidence.",

        desktopImage: "/images/hero-obsidian-editorial.png",
        mobileImage: "/images/hero-obsidian-editorial.png",
        imageAlt: "OBSIDIAN editorial campaign",

        mediaType: "image",
        videoUrl: "",

        primaryCta: {
          isEnabled: true,
          label: "Explore Collection",
          href: "/collections",
          openInNewTab: false,
        },

        secondaryCta: {
          isEnabled: true,
          label: "Shop All",
          href: "/shop",
          openInNewTab: false,
        },

        overlayOpacity: 20,
        contentAlignment: "left",
        backgroundPosition: "62% top",

        featuredCard: {
          isEnabled: true,
          eyebrow: "New Drop",
          title: "Artifact Series",
          image: "/images/collection-artifact.jpeg",
          imageAlt: "Artifact Series",
          href: "/shop?series=Artifact%20Series",
          buttonText: "View",
        },

        sideCard: {
          isEnabled: true,
          title: "Obsidian System",
          description:
            "A refined uniform for discipline, strength, and intentional everyday presence.",
          href: "/collections",
          buttonText: "Discover",
        },

        metaLabel: {
          isEnabled: true,
          lineOne: "OBS / 01",
          lineTwo: "Bangladesh",
        },
      },
    },

    {
      id: "homepage-collections",
      type: "collections",
      order: 2,
      isEnabled: true,

      content: {
        eyebrow: "Collections",
        title: "Designed to endure.",
        description:
          "Explore the first OBSIDIAN fashion drops—oversized T-shirts, graphic essentials, and future-ready collection stories.",
        buttonText: "View All",
        buttonHref: "/collections",
        maximumItems: 3,
        source: "featured",
      },
    },

    {
      id: "homepage-brand-story",
      type: "brandStory",
      order: 3,
      isEnabled: true,

      content: {
        eyebrow: "Our Direction",
        title: "Starting with T-shirts. Building a fashion label.",

        paragraphs: [
          "OBSIDIAN begins with graphic and oversized T-shirts, but the vision is bigger than one product. We are building a fashion brand around dark essentials, structured silhouettes, and quiet visual strength.",
          "As the brand grows, OBSIDIAN can expand into shirts, polos, hoodies, jackets, pants, accessories, and future seasonal collections—all under one consistent identity system.",
        ],

        featureCards: [
          {
            id: "story-launch-product",
            number: "01",
            title: "Launch Product",
            description:
              "We start focused with T-shirts—oversized fits, graphic drops, washed textures, and everyday wearable essentials.",
            order: 1,
            isActive: true,
          },
          {
            id: "story-brand-expansion",
            number: "02",
            title: "Brand Expansion",
            description:
              "The platform is ready for more fashion items—from shirts and hoodies to pants, accessories, and complete outfit categories.",
            order: 2,
            isActive: true,
          },
          {
            id: "story-future-collections",
            number: "03",
            title: "Future Collections",
            description:
              "Every new product line can be released through curated drops, collection stories, and the same OBSIDIAN visual language.",
            order: 3,
            isActive: true,
          },
        ],

        systemBlock: {
          eyebrow: "Fashion System",
          title: "One brand. Many future categories.",

          categories: [
            {
              id: "category-tshirts",
              title: "T-Shirts",
              description:
                "The first product line—oversized, graphic, minimal, and built around the core OBSIDIAN identity.",
              order: 1,
              isActive: true,
            },
            {
              id: "category-tops",
              title: "Tops",
              description:
                "Future shirts, polos, long sleeves, hoodies, and outerwear can be added as the brand grows.",
              order: 2,
              isActive: true,
            },
            {
              id: "category-bottoms",
              title: "Bottoms",
              description:
                "Pants, cargos, shorts, and everyday bottomwear can become part of future OBSIDIAN drops.",
              order: 3,
              isActive: true,
            },
            {
              id: "category-accessories",
              title: "Accessories",
              description:
                "Caps, bags, small goods, and lifestyle pieces can complete the fashion ecosystem later.",
              order: 4,
              isActive: true,
            },
          ],
        },
      },
    },

    {
      id: "homepage-featured-product",
      type: "featuredProduct",
      order: 4,
      isEnabled: true,

      content: {
        eyebrow: "Featured Product",
        productId: "artifact-001",
        customTitle: "",
        customDescription: "",
        imageOverride: "",
        imageAlt: "",
        buttonText: "View Product",
        showPrice: true,
        showSeries: true,
        showColor: true,
        showStock: false,
      },
    },
  ],
};

const DEFAULT_ABOUT_PAGE = {
  key: "about",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "About",
  slug: "about",

  seo: {
    title: "About",
    description:
      "Discover the story, philosophy, and origin of OBSIDIAN—a premium menswear brand from Bangladesh built around resilience, craftsmanship, and timeless design.",
    keywords: "",
    ogImage: "/images/hero1.jpeg",
    canonical: "/about",
    index: true,
  },

  sections: [
    {
      id: "about-hero",
      type: "heroText",
      order: 1,
      isEnabled: true,
      content: {
        eyebrow: "About Obsidian",
        title: "Built Under Pressure. Finished With Precision.",
        description:
          "OBSIDIAN is a modern essentials brand inspired by resilience, craftsmanship, and timeless design. We create garments that feel intentional, enduring, and quietly confident.",
      },
    },
    {
      id: "about-philosophy",
      type: "splitText",
      order: 2,
      isEnabled: true,
      content: {
        eyebrow: "Our Philosophy",
        title: "Substance Over Noise",
        description:
          "We believe true character is formed slowly—not through trends, but through pressure, patience, and purpose. Every collection is designed to reflect those values through materials, silhouettes, and visual storytelling.",
      },
    },
    {
      id: "about-meaning",
      type: "darkText",
      order: 3,
      isEnabled: true,
      content: {
        eyebrow: "Why Obsidian",
        title: "Formed By Nature. Refined By Pressure.",
        description:
          "Obsidian is volcanic glass created under intense heat and pressure. That idea sits at the heart of our brand. We believe meaningful things are forged, not rushed. Every piece carries that philosophy forward.",
      },
    },
    {
      id: "about-origin",
      type: "text",
      order: 4,
      isEnabled: true,
      content: {
        eyebrow: "Origin",
        title: "Designed In Bangladesh",
        description:
          "OBSIDIAN was founded with a simple idea: create garments that feel premium, intentional, and timeless. Rooted in Bangladesh's deep manufacturing heritage, we aim to combine thoughtful design with quality craftsmanship.",
      },
    },
  ],
};

const DEFAULT_CONTACT_PAGE = {
  key: "contact",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Contact",
  slug: "contact",

  seo: {
    title: "Contact",
    description:
      "Contact OBSIDIAN for product questions, order support, collaborations, and general inquiries.",
    keywords: "",
    ogImage: "/images/hero1.jpeg",
    canonical: "/contact",
    index: true,
  },

  content: {
    eyebrow: "Contact",
    title: "Reach Obsidian",
    description:
      "For product questions, order support, collaborations, or general inquiries, contact the OBSIDIAN team.",

    supportTitle: "Order Support",
    supportDescription:
      "Get help with order confirmation, delivery, exchange, or product availability.",

    collaborationTitle: "Collaborations",
    collaborationDescription:
      "Contact us for creative partnerships, campaigns, wholesale, and brand opportunities.",

    whatsappButtonText: "Message On WhatsApp",
    emailButtonText: "Send An Email",

    whatsappMessage:
      "Hello OBSIDIAN, I would like to know more about your products.",
  },
};

const DEFAULT_JOURNAL_PAGE = {
  key: "journal",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Journal",
  slug: "journal",

  seo: {
    title: "Journal",
    description:
      "Explore stories from OBSIDIAN about pressure, resilience, craftsmanship, design, and the ideas behind each collection.",
    keywords: "",
    ogImage: "/images/hero1.jpeg",
    canonical: "/journal",
    index: true,
  },

  content: {
    eyebrow: "Journal",
    title: "Stories Of Pressure",
    description:
      "Reflections on design, resilience, craftsmanship, and the ideas that shape every OBSIDIAN collection.",

    ctaEyebrow: "Explore Obsidian",
    ctaTitle: "Discover The Pieces Behind The Stories",
    ctaDescription:
      "Explore garments shaped by restraint, structure, and quiet confidence.",
    ctaText: "Explore Shop",
    ctaHref: "/shop",
  },
};

const CMS_DEFAULTS = {
  navbar: DEFAULT_NAVBAR,
  footer: DEFAULT_FOOTER,
  homepage: DEFAULT_HOMEPAGE,
  about: DEFAULT_ABOUT_PAGE,
  contact: DEFAULT_CONTACT_PAGE,
  journal: DEFAULT_JOURNAL_PAGE,
};

const PUBLIC_CMS_KEYS = Object.freeze(Object.keys(CMS_DEFAULTS));

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        cloneValue(nestedValue),
      ])
    );
  }

  return value;
}

function deepMerge(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue)
      ? savedValue.map(cloneValue)
      : defaultValue.map(cloneValue);
  }

  if (isPlainObject(defaultValue)) {
    const mergedValue = {};

    const savedObject = isPlainObject(savedValue) ? savedValue : {};

    const keys = new Set([
      ...Object.keys(defaultValue),
      ...Object.keys(savedObject),
    ]);

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(savedObject, key)) {
        mergedValue[key] = deepMerge(defaultValue[key], savedObject[key]);
      } else {
        mergedValue[key] = cloneValue(defaultValue[key]);
      }
    }

    return mergedValue;
  }

  return savedValue === undefined
    ? cloneValue(defaultValue)
    : cloneValue(savedValue);
}

function normalizeOrder(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeActiveItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [...items]
    .filter((item) => item && item.isActive !== false)
    .sort(
      (firstItem, secondItem) =>
        normalizeOrder(firstItem.order) - normalizeOrder(secondItem.order)
    );
}

function getCmsDefault(key) {
  if (!PUBLIC_CMS_KEYS.includes(key)) {
    return null;
  }

  return cloneValue(CMS_DEFAULTS[key]);
}

function mergeCmsContent(key, storedContent = {}) {
  const defaultContent = getCmsDefault(key);

  if (!defaultContent) {
    return null;
  }

  const mergedContent = deepMerge(defaultContent, storedContent);

  return {
    ...mergedContent,
    key,
    schemaVersion: CMS_SCHEMA_VERSION,
  };
}

function isSupportedCmsKey(key) {
  return PUBLIC_CMS_KEYS.includes(String(key || "").trim());
}

function createCmsDocument(key, content = {}) {
  const mergedContent = mergeCmsContent(key, content);

  if (!mergedContent) {
    return null;
  }

  const now = new Date();

  return {
    ...mergedContent,
    key,
    schemaVersion: CMS_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

export {
  CMS_SCHEMA_VERSION,
  CMS_DEFAULTS,
  PUBLIC_CMS_KEYS,
  DEFAULT_NAVBAR,
  DEFAULT_FOOTER,
  DEFAULT_HOMEPAGE,
  DEFAULT_ABOUT_PAGE,
  DEFAULT_CONTACT_PAGE,
  DEFAULT_JOURNAL_PAGE,
  cloneValue,
  deepMerge,
  normalizeActiveItems,
  getCmsDefault,
  mergeCmsContent,
  isSupportedCmsKey,
  createCmsDocument,
};