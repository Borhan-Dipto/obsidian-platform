import {
  createLegalCmsDefaults,
} from "./legalDefaults";

const CMS_SCHEMA_VERSION = 1;

const LEGAL_CMS_DEFAULTS =
  createLegalCmsDefaults(
    CMS_SCHEMA_VERSION
  );

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

  developer: {
    isEnabled: true,
    label: "Developed by",
    name: "Borhan Dipto",
    linkedinUrl:
      "https://www.linkedin.com/in/borhandipto",
    openInNewTab: true,
  },

  legal: {
    copyrightText: "OBSIDIAN. All rights reserved.",
    showCurrentYear: true,

    links: [
      {
        id: "footer-privacy",
        label: "Privacy",
        href: "/privacy",
        order: 1,
        isActive: true,
        openInNewTab: false,
      },
      {
        id: "footer-terms",
        label: "Terms",
        href: "/terms",
        order: 2,
        isActive: true,
        openInNewTab: false,
      },
      {
        id: "footer-terms-of-sale",
        label: "Terms of Sale",
        href: "/terms-of-sale",
        order: 3,
        isActive: true,
        openInNewTab: false,
      },
      {
        id: "footer-delivery-policy",
        label: "Delivery",
        href: "/delivery-policy",
        order: 4,
        isActive: true,
        openInNewTab: false,
      },
      {
        id: "footer-exchange-return-policy",
        label: "Exchange & Return",
        href: "/exchange-return-policy",
        order: 5,
        isActive: true,
        openInNewTab: false,
      },
      {
        id: "footer-refund-policy",
        label: "Refund",
        href: "/refund-policy",
        order: 6,
        isActive: true,
        openInNewTab: false,
      },
    ],
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

    posts: [
      {
        id: "meaning-of-obsidian",
        title: "The Meaning Of Obsidian",
        description:
          "A reflection on pressure, resilience, and the identity behind the OBSIDIAN brand.",
        category: "Brand Story",
        readingTime: "3 Min Read",
        href: "",
        order: 1,
        isActive: true,
      },
      {
        id: "artifact-series",
        title: "The Artifact Series",
        description:
          "How ancient visual language became the foundation of our first collection.",
        category: "Collection Notes",
        readingTime: "4 Min Read",
        href: "",
        order: 2,
        isActive: true,
      },
      {
        id: "built-under-pressure",
        title: "Built Under Pressure",
        description:
          "Why we believe character, design, and purpose are formed slowly.",
        category: "Philosophy",
        readingTime: "3 Min Read",
        href: "",
        order: 3,
        isActive: true,
      },
    ],

    emptyStateTitle: "No journal stories yet.",
    emptyStateDescription:
      "New stories about design, collections, and the OBSIDIAN philosophy will appear here.",

    ctaEyebrow: "Explore Obsidian",
    ctaTitle: "Discover The Pieces Behind The Stories",
    ctaDescription:
      "Explore garments shaped by restraint, structure, and quiet confidence.",
    ctaText: "Explore Shop",
    ctaHref: "/shop",
  },
};

const DEFAULT_COLLECTIONS_PAGE = {
  key: "collections",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Collections",
  slug: "collections",

  seo: {
    title: "Collections",
    description:
      "Explore OBSIDIAN collections shaped around pressure, precision, minimal form, and quiet strength.",
    keywords:
      "obsidian collections, premium fashion Bangladesh, menswear collections",
    ogImage: "/images/collection-artifact.jpeg",
    canonical: "/collections",
    index: true,
  },

  content: {
    breadcrumbHomeLabel: "Home",
    breadcrumbCurrentLabel: "Collections",

    eyebrow: "Collections",
    title: "All Collections",
    description:
      "Explore the core OBSIDIAN series—each shaped around pressure, precision, restraint, and quiet strength.",

    metaLabel: "Built Under Pressure",

    showCollectionCount: true,
    collectionCountSingular: "Collection",
    collectionCountPlural: "Collections",

    showSeriesIndex: true,
    showFeaturedBadge: true,
    showDescription: true,

    seriesLabelPrefix: "Series",
    featuredBadgeText: "Featured",
    cardHoverButtonText: "View Products",
    cardFooterText: "Explore Collection",

    emptyStateEyebrow: "Collections",
    emptyStateTitle: "No collections are available right now.",
    emptyStateDescription:
      "New OBSIDIAN collections are being prepared. Explore the current product selection while the next series takes shape.",
    emptyStateButtonText: "Explore Shop",
    emptyStateButtonHref: "/shop",
  },
};

const DEFAULT_SHOP_PAGE = {
  key: "shop",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Shop",
  slug: "shop",

  seo: {
    title: "Shop",
    description:
      "Discover premium OBSIDIAN menswear and engineered essentials built under pressure and finished with precision.",
    keywords:
      "OBSIDIAN shop, premium menswear Bangladesh, oversized t-shirts Bangladesh",
    ogImage: "/images/collection-artifact.jpeg",
    canonical: "/shop",
    index: true,

    searchTitleTemplate: "Search Results for “{query}”",
    seriesTitleTemplate: "{series} Collection",
    colorTitleTemplate: "{color} Products",

    searchDescriptionTemplate:
      "Browse OBSIDIAN products matching “{query}”. Explore premium menswear built with precision and purpose.",

    seriesDescriptionTemplate:
      "Explore the {series} from OBSIDIAN—premium pieces shaped by pressure, precision, and quiet confidence.",

    colorDescriptionTemplate:
      "Explore {color} OBSIDIAN pieces designed with structure, comfort, and precision.",
  },

  content: {
    breadcrumbHomeLabel: "Home",
    breadcrumbShopLabel: "Shop",

    eyebrow: "Shop",

    defaultTitleLineOne: "Engineered",
    defaultTitleLineTwo: "Essentials",

    searchTitleLineOne: "Search",
    searchTitleLineTwo: "Results",

    defaultDescription:
      "Search, filter, and discover OBSIDIAN pieces built under pressure and finished with precision.",

    searchDescriptionTemplate:
      "Showing OBSIDIAN pieces matching “{query}”.",

    seriesDescriptionTemplate:
      "Explore the {series}, built with pressure, precision, and purpose.",

    activeFiltersLabel: "Active Filters",
    searchFilterPrefix: "Search:",

    searchPlaceholder: "Search product, color, series...",

    searchAriaLabel: "Search products",
    seriesAriaLabel: "Filter by series",
    colorAriaLabel: "Filter by color",
    sortAriaLabel: "Sort products",

    allLabel: "All",
    newestLabel: "Newest",
    priceLowLabel: "Price Low",
    priceHighLabel: "Price High",
    nameAzLabel: "Name A–Z",

    applyButtonText: "Apply",

    productSingularLabel: "Product",
    productPluralLabel: "Products",

    inStockLabel: "In Stock",
    soldOutLabel: "Sold Out",

    wishlistButtonText: "Wishlist",
    resetButtonText: "Reset",

    emptyStateEyebrow: "No Results",
    emptyStateTitle: "No products found.",
    emptyStateDescription:
      "Try adjusting your search, series, color, availability, or sorting option.",
    emptyStateButtonText: "Reset Shop",

    productFallbackName: "OBSIDIAN Product",
    productFallbackSeries: "OBSIDIAN",
    productFallbackColor: "Obsidian Black",

    viewProductAriaTemplate: "View {product}",

    lowStockTemplate: "Only {stock} Left",
    stockCountTemplate: "{stock} In Stock",
    outOfStockText: "Out of Stock",
  },
};

const DEFAULT_PRODUCT_PAGE = {
  key: "product",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Product Details",
  slug: "product",

  seo: {
    fallbackTitle: "OBSIDIAN Product",
    fallbackDescription:
      "A refined OBSIDIAN essential built with pressure, precision, and purpose.",
    fallbackImage: "/images/collection-artifact.jpeg",

    notFoundTitle: "Product Not Found",
    notFoundDescription:
      "The requested OBSIDIAN product could not be found or is no longer available.",

    titleTemplate: "{product}",
    openGraphTitleTemplate: "{product} | {site}",
    twitterTitleTemplate: "{product} | {site}",

    canonicalTemplate: "/product/{id}",
    index: true,
  },

  content: {
    breadcrumbHomeLabel: "Home",
    breadcrumbShopLabel: "Shop",
    breadcrumbAriaLabel: "Breadcrumb",

    productFallbackName: "OBSIDIAN Product",
    productFallbackSeries: "OBSIDIAN",
    productFallbackColor: "Obsidian Black",

    productImageAltTemplate: "{product} by {site}",

    colorLabel: "Color",
    availabilityLabel: "Availability",
    seriesLabel: "Series",
    productCodeLabel: "Product Code",

    availableTemplate: "{stock} Available",
    outOfStockText: "Out of Stock",

    currencySymbol: "৳",
    currencyLocale: "en-BD",

    featureHighlights: [
      {
        id: "product-highlight-cotton",
        text: "Premium Cotton",
        order: 1,
        isActive: true,
      },
      {
        id: "product-highlight-fit",
        text: "Oversized Fit",
        order: 2,
        isActive: true,
      },
      {
        id: "product-highlight-cod",
        text: "Cash On Delivery",
        order: 3,
        isActive: true,
      },
      {
        id: "product-highlight-exchange",
        text: "Easy Exchange",
        order: 4,
        isActive: true,
      },
      {
        id: "product-highlight-delivery",
        text: "Delivery in 1–5 Days",
        order: 5,
        isActive: true,
      },
    ],

    productDetailsTitle: "Product Details",
    productDetailsFallback:
      "A premium everyday essential designed for structure, comfort, and quiet confidence.",

    deliveryTitle: "Delivery",
    deliveryDescription:
      "Delivery is available across Bangladesh. Every order is reviewed and confirmed after checkout before dispatch.",

    exchangeTitle: "Exchange Support",
    exchangeDescription:
      "Exchange assistance is available according to the OBSIDIAN exchange policy. Keep the product unused and retain its original packaging and tags.",

    notFoundEyebrow: "Product",
    notFoundTitle: "Product not found.",
    notFoundDescription:
      "This piece may have been removed, renamed, or is no longer available in the current collection.",
    notFoundButtonText: "Back To Shop",
    notFoundButtonHref: "/shop",
  },
};

const DEFAULT_SIZE_GUIDE_PAGE = {
  key: "size-guide",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Size Guide",
  slug: "size-guide",

  seo: {
    title: "Size Guide",
    description:
      "Find your ideal OBSIDIAN fit with our size guide for oversized and relaxed silhouettes.",
    keywords:
      "OBSIDIAN size guide, oversized t-shirt size chart, clothing size guide Bangladesh",
    ogImage: "/images/collection-artifact.jpeg",
    canonical: "/size-guide",
    index: true,
  },

  content: {
    eyebrow: "Size Guide",
    title: "Find Your Fit",
    description:
      "Our pieces are designed with a relaxed oversized fit. Use the guide below to choose your preferred silhouette.",

    tableAriaLabel: "OBSIDIAN clothing size guide",

    sizeColumnLabel: "Size",
    chestColumnLabel: "Chest",
    lengthColumnLabel: "Length",
    shoulderColumnLabel: "Shoulder",

    measurementUnit: "in",

    sizes: [
      {
        id: "size-medium",
        size: "M",
        chest: "40",
        length: "27",
        shoulder: "18",
        order: 1,
        isActive: true,
      },
      {
        id: "size-large",
        size: "L",
        chest: "42",
        length: "28",
        shoulder: "19",
        order: 2,
        isActive: true,
      },
      {
        id: "size-extra-large",
        size: "XL",
        chest: "44",
        length: "29",
        shoulder: "20",
        order: 3,
        isActive: true,
      },
    ],

    note:
      "Measurements may vary slightly due to fabric, wash, and production process.",

    emptyStateTitle: "No size information is available.",
    emptyStateDescription:
      "Please contact OBSIDIAN support for assistance with choosing the right size.",
  },
};

const DEFAULT_TRACK_ORDER_PAGE = {
  key: "track-order",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Track Order",
  slug: "track-order",

  seo: {
    title: "Track Order",
    description:
      "Track your OBSIDIAN order securely using your tracking ID and checkout phone number to view the latest status and order details.",
    keywords:
      "OBSIDIAN order tracking, track order Bangladesh, order status",
    ogImage: "/images/collection-artifact.jpeg",
    canonical: "/track-order",
    index: true,
  },

  content: {
    eyebrow: "Order Tracking",
    title: "Track Order",
    description:
      "Enter your tracking ID and checkout phone number to securely check your order status.",

    trackingIdLabel: "Tracking ID",
    trackingIdPlaceholder: "Example: OBS-123456789",
    trackingInputAriaLabel: "Enter your tracking ID",

    trackButtonText: "Track",
    loadingButtonText: "Checking...",

    emptyTrackingMessage: "Please enter your tracking ID.",
    orderNotFoundMessage: "Order not found.",
    genericErrorMessage:
      "Something went wrong. Please try again.",

    orderStatusLabel: "Order Status",
    trackingIdPrefix: "Tracking ID:",
    totalLabel: "Total:",

    customerSectionTitle: "Customer",
    customerEmptyMessage:
      "Customer information is unavailable.",

    itemsSectionTitle: "Items",
    itemSizeLabel: "Size",
    itemsEmptyMessage:
      "No item information is available for this order.",

    backToShopText: "Back To Shop",
    backToShopHref: "/shop",

    currencySymbol: "৳",
    currencyLocale: "en-BD",

    statusLabels: {
      pending: "Pending",
      confirmed: "Confirmed",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      fallback: "Pending",
    },
  },
};

const DEFAULT_SUCCESS_PAGE = {
  key: "success",
  schemaVersion: CMS_SCHEMA_VERSION,
  status: "published",

  title: "Order Success",
  slug: "success",

  seo: {
    title: "Order Submitted",
    description:
      "Your OBSIDIAN order has been successfully submitted. Save your tracking ID to follow the latest order status.",
    keywords:
      "OBSIDIAN order success, order submitted, tracking ID Bangladesh",
    ogImage: "/images/collection-artifact.jpeg",
    canonical: "/success",
    index: false,
  },

  content: {
    eyebrow: "Order Submitted",
    title: "Thank You",
    description:
      "Your order has been received. We will confirm it manually through WhatsApp or phone.",

    trackingIdLabel: "Tracking ID",
    trackingIdDescription:
      "Save this ID to track your order status later.",

    continueShoppingText: "Continue Shopping",
    continueShoppingHref: "/shop",

    backToHomeText: "Back To Home",
    backToHomeHref: "/",
  },
};

const CMS_DEFAULTS = {
  navbar: DEFAULT_NAVBAR,
  footer: DEFAULT_FOOTER,
  homepage: DEFAULT_HOMEPAGE,
  about: DEFAULT_ABOUT_PAGE,
  contact: DEFAULT_CONTACT_PAGE,
  journal: DEFAULT_JOURNAL_PAGE,
  collections: DEFAULT_COLLECTIONS_PAGE,
  shop: DEFAULT_SHOP_PAGE,
  product: DEFAULT_PRODUCT_PAGE,
  "size-guide": DEFAULT_SIZE_GUIDE_PAGE,
  "track-order": DEFAULT_TRACK_ORDER_PAGE,
  success: DEFAULT_SUCCESS_PAGE,

  ...LEGAL_CMS_DEFAULTS,
};

const PUBLIC_CMS_KEYS = Object.freeze(
  Object.keys(CMS_DEFAULTS)
);

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

    const savedObject = isPlainObject(savedValue)
      ? savedValue
      : {};

    const keys = new Set([
      ...Object.keys(defaultValue),
      ...Object.keys(savedObject),
    ]);

    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(
          savedObject,
          key
        )
      ) {
        mergedValue[key] = deepMerge(
          defaultValue[key],
          savedObject[key]
        );
      } else {
        mergedValue[key] = cloneValue(
          defaultValue[key]
        );
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

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function normalizeActiveItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [...items]
    .filter(
      (item) =>
        item &&
        item.isActive !== false
    )
    .sort(
      (firstItem, secondItem) =>
        normalizeOrder(firstItem.order) -
        normalizeOrder(secondItem.order)
    );
}

function getCmsDefault(key) {
  const normalizedKey = String(key || "")
    .trim()
    .toLowerCase();

  if (!PUBLIC_CMS_KEYS.includes(normalizedKey)) {
    return null;
  }

  return cloneValue(
    CMS_DEFAULTS[normalizedKey]
  );
}

function mergeRequiredFooterLegalLinks(
  storedLinks = []
) {
  const savedLinks =
    Array.isArray(storedLinks)
      ? storedLinks
      : [];

  const requiredLinks =
    DEFAULT_FOOTER.legal.links;

  const requiredIds =
    new Set(
      requiredLinks.map(
        (link) => link.id
      )
    );

  const requiredHrefs =
    new Set(
      requiredLinks.map(
        (link) => link.href
      )
    );

  const mergedRequiredLinks =
    requiredLinks.map(
      (requiredLink) => {
        const savedLink =
          savedLinks.find(
            (link) =>
              link &&
              (
                link.id ===
                  requiredLink.id ||
                link.href ===
                  requiredLink.href
              )
          ) || {};

        return {
          ...requiredLink,
          ...savedLink,

          id:
            requiredLink.id,

          href:
            requiredLink.href,

          isActive: true,

          openInNewTab:
            false,
        };
      }
    );

  const additionalLinks =
    savedLinks
      .filter(
        (link) =>
          link &&
          !requiredIds.has(
            link.id
          ) &&
          !requiredHrefs.has(
            link.href
          )
      )
      .map(cloneValue);

  return [
    ...mergedRequiredLinks,
    ...additionalLinks,
  ];
}

function mergeCmsContent(
  key,
  storedContent = {}
) {
  const normalizedKey = String(key || "")
    .trim()
    .toLowerCase();

  const defaultContent =
    getCmsDefault(normalizedKey);

  if (!defaultContent) {
    return null;
  }

  const mergedContent = deepMerge(
    defaultContent,
    storedContent
  );

  if (
    normalizedKey ===
    "footer"
  ) {
    mergedContent.legal = {
      ...(mergedContent.legal ||
        {}),

      links:
        mergeRequiredFooterLegalLinks(
          storedContent?.legal
            ?.links
        ),
    };
  }

  return {
    ...mergedContent,
    key: normalizedKey,
    schemaVersion: CMS_SCHEMA_VERSION,
  };
}

function isSupportedCmsKey(key) {
  const normalizedKey = String(key || "")
    .trim()
    .toLowerCase();

  return PUBLIC_CMS_KEYS.includes(
    normalizedKey
  );
}

function createCmsDocument(
  key,
  content = {}
) {
  const normalizedKey = String(key || "")
    .trim()
    .toLowerCase();

  const mergedContent = mergeCmsContent(
    normalizedKey,
    content
  );

  if (!mergedContent) {
    return null;
  }

  const now = new Date();

  return {
    ...mergedContent,
    key: normalizedKey,
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
  DEFAULT_COLLECTIONS_PAGE,
  DEFAULT_SHOP_PAGE,
  DEFAULT_PRODUCT_PAGE,
  DEFAULT_SIZE_GUIDE_PAGE,
  DEFAULT_TRACK_ORDER_PAGE,
  DEFAULT_SUCCESS_PAGE,
  LEGAL_CMS_DEFAULTS,
  cloneValue,
  deepMerge,
  normalizeActiveItems,
  getCmsDefault,
  mergeCmsContent,
  isSupportedCmsKey,
  createCmsDocument,
};