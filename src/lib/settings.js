import "server-only";

import clientPromise from "./mongodb";

export const SETTINGS_COLLECTION_NAME = "settings";

export const DEFAULT_SETTINGS = {
  type: "store",

  store: {
    name: "OBSIDIAN",
    tagline: "Built under pressure. Finished with precision.",
    currency: "BDT",
  },

  contact: {
    whatsappNumber: "8801814455199",
    email: "obsidianwear.management@gmail.com",
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

  seo: {
    title: "OBSIDIAN | Premium Menswear Bangladesh",
    description:
      "Premium menswear and engineered essentials built under pressure and finished with precision.",
    keywords:
      "OBSIDIAN, OBSIDIAN Bangladesh, premium menswear Bangladesh, premium t-shirt Bangladesh, oversized t-shirt Bangladesh, mens fashion Bangladesh, streetwear Bangladesh, minimal fashion Bangladesh, premium clothing Dhaka, Obsidian Wear BD",
    ogImage: "/images/hero1.jpeg",
  },

  payment: {
    cashOnDelivery: true,
    bkash: false,
    nagad: false,
    rocket: false,
  },
};

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null
  );
}

function normalizeText(value, fallback = "") {
  const normalizedValue = String(
    value ?? ""
  ).trim();

  return normalizedValue || fallback;
}

function normalizeOptionalText(value) {
  return String(value ?? "").trim();
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((keyword) => String(keyword || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return normalizeOptionalText(value);
}

function normalizeWhatsAppNumber(value, fallback = "") {
  const normalizedValue = String(
    value ?? ""
  ).replace(/\D/g, "");

  return normalizedValue || fallback;
}

function normalizeNonNegativeNumber(value, fallback = 0) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(0, parsedValue);
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value
      .trim()
      .toLowerCase();

    if (
      ["true", "1", "yes", "on", "enabled"].includes(
        normalizedValue
      )
    ) {
      return true;
    }

    if (
      ["false", "0", "no", "off", "disabled"].includes(
        normalizedValue
      )
    ) {
      return false;
    }
  }

  return fallback;
}

function cloneDefaultSection(sectionName) {
  return {
    ...DEFAULT_SETTINGS[sectionName],
  };
}

export function createDefaultSettingsDocument(
  now = new Date()
) {
  return {
    type: "store",

    store: cloneDefaultSection("store"),
    contact: cloneDefaultSection("contact"),
    social: cloneDefaultSection("social"),
    delivery: cloneDefaultSection("delivery"),
    seo: cloneDefaultSection("seo"),
    payment: cloneDefaultSection("payment"),

    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeSettings(data = {}) {
  const source = isPlainObject(data) ? data : {};

  const store = isPlainObject(source.store)
    ? source.store
    : {};

  const contact = isPlainObject(source.contact)
    ? source.contact
    : {};

  const social = isPlainObject(source.social)
    ? source.social
    : {};

  const delivery = isPlainObject(source.delivery)
    ? source.delivery
    : {};

  const seo = isPlainObject(source.seo)
    ? source.seo
    : {};

  const payment = isPlainObject(source.payment)
    ? source.payment
    : {};

  return {
    type: "store",

    store: {
      name: normalizeText(
        firstDefined(
          store.name,
          source.storeName
        ),
        DEFAULT_SETTINGS.store.name
      ),

      tagline: normalizeText(
        firstDefined(
          store.tagline,
          source.tagline
        ),
        DEFAULT_SETTINGS.store.tagline
      ),

      currency: normalizeText(
        firstDefined(
          store.currency,
          source.currency
        ),
        DEFAULT_SETTINGS.store.currency
      ).toUpperCase(),
    },

    contact: {
      whatsappNumber: normalizeWhatsAppNumber(
        firstDefined(
          contact.whatsappNumber,
          source.whatsappNumber
        ),
        DEFAULT_SETTINGS.contact.whatsappNumber
      ),

      email: normalizeOptionalText(
        firstDefined(
          contact.email,
          source.storeEmail
        )
      ),

      location: normalizeOptionalText(
        firstDefined(
          contact.location,
          source.storeLocation
        )
      ),

      phone: normalizeOptionalText(
        contact.phone
      ),
    },

    social: {
      facebookUrl: normalizeOptionalText(
        firstDefined(
          social.facebookUrl,
          source.facebookUrl
        )
      ),

      instagramUrl: normalizeOptionalText(
        firstDefined(
          social.instagramUrl,
          source.instagramUrl
        )
      ),

      tiktokUrl: normalizeOptionalText(
        social.tiktokUrl
      ),

      youtubeUrl: normalizeOptionalText(
        social.youtubeUrl
      ),
    },

    delivery: {
      insideDhaka: normalizeNonNegativeNumber(
        firstDefined(
          delivery.insideDhaka,
          source.deliveryChargeInsideDhaka
        ),
        DEFAULT_SETTINGS.delivery.insideDhaka
      ),

      outsideDhaka: normalizeNonNegativeNumber(
        firstDefined(
          delivery.outsideDhaka,
          source.deliveryChargeOutsideDhaka
        ),
        DEFAULT_SETTINGS.delivery.outsideDhaka
      ),

      freeShippingOver:
        normalizeNonNegativeNumber(
          delivery.freeShippingOver,
          DEFAULT_SETTINGS.delivery
            .freeShippingOver
        ),
    },

    seo: {
      title: normalizeText(
        firstDefined(
          seo.title,
          source.seoTitle
        ),
        DEFAULT_SETTINGS.seo.title
      ),

      description: normalizeText(
        firstDefined(
          seo.description,
          source.seoDescription
        ),
        DEFAULT_SETTINGS.seo.description
      ),

      keywords: normalizeKeywords(
        firstDefined(
          seo.keywords,
          source.seoKeywords,
          DEFAULT_SETTINGS.seo.keywords
        )
      ),

      ogImage: normalizeText(
        firstDefined(
          seo.ogImage,
          source.ogImage
        ),
        DEFAULT_SETTINGS.seo.ogImage
      ),
    },

    payment: {
      cashOnDelivery: normalizeBoolean(
        payment.cashOnDelivery,
        DEFAULT_SETTINGS.payment.cashOnDelivery
      ),

      bkash: normalizeBoolean(
        payment.bkash,
        DEFAULT_SETTINGS.payment.bkash
      ),

      nagad: normalizeBoolean(
        payment.nagad,
        DEFAULT_SETTINGS.payment.nagad
      ),

      rocket: normalizeBoolean(
        payment.rocket,
        DEFAULT_SETTINGS.payment.rocket
      ),
    },

    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
}

export function mergeSettings(
  existingSettings = {},
  incomingSettings = {}
) {
  const currentSettings =
    normalizeSettings(existingSettings);

  const incoming = isPlainObject(
    incomingSettings
  )
    ? incomingSettings
    : {};

  return normalizeSettings({
    ...currentSettings,
    ...incoming,

    store: {
      ...currentSettings.store,
      ...(isPlainObject(incoming.store)
        ? incoming.store
        : {}),
    },

    contact: {
      ...currentSettings.contact,
      ...(isPlainObject(incoming.contact)
        ? incoming.contact
        : {}),
    },

    social: {
      ...currentSettings.social,
      ...(isPlainObject(incoming.social)
        ? incoming.social
        : {}),
    },

    delivery: {
      ...currentSettings.delivery,
      ...(isPlainObject(incoming.delivery)
        ? incoming.delivery
        : {}),
    },

    seo: {
      ...currentSettings.seo,
      ...(isPlainObject(incoming.seo)
        ? incoming.seo
        : {}),
    },

    payment: {
      ...currentSettings.payment,
      ...(isPlainObject(incoming.payment)
        ? incoming.payment
        : {}),
    },

    createdAt:
      incoming.createdAt ||
      currentSettings.createdAt,

    updatedAt:
      incoming.updatedAt ||
      currentSettings.updatedAt,
  });
}

export function serializeSettings(settings) {
  return JSON.parse(
    JSON.stringify(
      normalizeSettings(settings)
    )
  );
}

export async function getSettingsCollection() {
  const client = await clientPromise;
  const database = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  return database.collection(
    SETTINGS_COLLECTION_NAME
  );
}

export async function getSettings() {
  const collection =
    await getSettingsCollection();

  let settings = await collection.findOne({
    type: "store",
  });

  if (!settings) {
    const defaultDocument =
      createDefaultSettingsDocument();

    await collection.updateOne(
      {
        type: "store",
      },
      {
        $setOnInsert: defaultDocument,
      },
      {
        upsert: true,
      }
    );

    settings =
      (await collection.findOne({
        type: "store",
      })) || defaultDocument;
  }

  return normalizeSettings(settings);
}