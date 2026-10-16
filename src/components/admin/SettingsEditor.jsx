"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import ImageUploader from "./ImageUploader";

const DEFAULT_SETTINGS = {
  store: {
    name: "OBSIDIAN",
    tagline:
      "Built under pressure. Finished with precision.",
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
    insideDhaka: "80",
    outsideDhaka: "130",
    freeShippingOver: "0",
  },

  seo: {
    title:
      "OBSIDIAN | Premium Menswear Bangladesh",

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

  createdAt: null,
  updatedAt: null,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  email: {
    enabled: false,

    customerOrderPlaced: true,
    adminOrderPlaced: true,
    customerStatusUpdates: true,

    adminRecipients: "",
    replyTo: "",

    orderPlacedSubject:
      "Order received — {{orderId}}",

    orderPlacedMessage:
      "Hello {{customerName}}, we have received your order {{orderId}}. Our team will contact you shortly to confirm it.",

    adminOrderPlacedSubject:
      "New website order — {{orderId}}",

    adminOrderPlacedMessage:
      "A new order {{orderId}} has been placed by {{customerName}}. Order total: {{total}}.",

    statusUpdateSubject:
      "Order {{orderId}} is now {{status}}",

    statusUpdateMessage:
      "Hello {{customerName}}, your order {{orderId}} is now {{status}}. Track your order here: {{trackingUrl}}",
  },

  sms: {
    enabled: false,

    customerOrderPlaced: true,
    adminOrderPlaced: false,
    customerStatusUpdates: true,

    adminRecipients: "",

    orderPlacedMessage:
      "{{storeName}}: We received order {{orderId}}. Total {{total}}. We will contact you shortly.",

    adminOrderPlacedMessage:
      "New order {{orderId}} from {{customerName}}. Total {{total}}.",

    statusUpdateMessage:
      "{{storeName}}: Order {{orderId}} is now {{status}}. Track: {{trackingUrl}}",
  },

  whatsapp: {
    enabled: false,

    customerOrderPlaced: true,
    adminOrderPlaced: false,
    customerStatusUpdates: true,

    adminRecipients: "",

    languageCode: "en",

    templates: {
      orderPlaced: "",
      adminOrderPlaced: "",
      statusUpdate: "",
    },
  },

  statusEvents: {
    confirmed: true,
    processing: true,
    packed: true,
    shipped: true,
    delivered: true,
    cancelled: true,
  },

  createdAt: null,
  updatedAt: null,
};

const DEFAULT_NOTIFICATION_PROVIDERS = {
  email: {
    provider: "resend",
    configured: false,
  },

  sms: {
    provider: "twilio",
    configured: false,
  },

  whatsapp: {
    provider: "whatsapp-cloud-api",
    configured: false,
  },
};

const PAYMENT_METHODS = [
  {
    field: "cashOnDelivery",
    label: "Cash on Delivery",
    description:
      "Allow customers to pay when their order is delivered.",
  },

  {
    field: "bkash",
    label: "bKash",
    description:
      "Mark bKash as an available payment method for the store.",
  },

  {
    field: "nagad",
    label: "Nagad",
    description:
      "Mark Nagad as an available payment method for the store.",
  },

  {
    field: "rocket",
    label: "Rocket",
    description:
      "Mark Rocket as an available payment method for the store.",
  },
];

const STATUS_EVENTS = [
  {
    field: "confirmed",
    label: "Confirmed",
  },

  {
    field: "processing",
    label: "Processing",
  },

  {
    field: "packed",
    label: "Packed",
  },

  {
    field: "shipped",
    label: "Shipped",
  },

  {
    field: "delivered",
    label: "Delivered",
  },

  {
    field: "cancelled",
    label: "Cancelled",
  },
];

const TEMPLATE_TOKENS = [
  "{{storeName}}",
  "{{customerName}}",
  "{{orderId}}",
  "{{status}}",
  "{{total}}",
  "{{currency}}",
  "{{trackingUrl}}",
];

function normalizeText(
  value,
  fallback = ""
) {
  const normalizedValue = String(
    value ?? ""
  ).trim();

  return normalizedValue || fallback;
}

function normalizeOptionalText(value) {
  return String(value ?? "").trim();
}

function normalizeNumberString(
  value,
  fallback = "0"
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return String(
    Math.max(0, numericValue)
  );
}

function normalizeBoolean(
  value,
  fallback = false
) {
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

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((keyword) =>
        String(keyword || "").trim()
      )
      .filter(Boolean)
      .join(", ");
  }

  return normalizeOptionalText(value);
}

function normalizeRecipientText(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        String(entry || "").trim()
      )
      .filter(Boolean)
      .join("\n");
  }

  return String(value ?? "").trim();
}

function normalizeSettings(
  settings = {}
) {
  return {
    store: {
      name: normalizeText(
        settings.store?.name,
        DEFAULT_SETTINGS.store.name
      ),

      tagline: normalizeText(
        settings.store?.tagline,
        DEFAULT_SETTINGS.store.tagline
      ),

      currency: normalizeText(
        settings.store?.currency,
        DEFAULT_SETTINGS.store.currency
      ).toUpperCase(),
    },

    contact: {
      whatsappNumber: normalizeText(
        settings.contact?.whatsappNumber,
        DEFAULT_SETTINGS.contact
          .whatsappNumber
      ),

      email: normalizeOptionalText(
        settings.contact?.email ??
          DEFAULT_SETTINGS.contact.email
      ),

      location: normalizeOptionalText(
        settings.contact?.location ??
          DEFAULT_SETTINGS.contact.location
      ),

      phone: normalizeOptionalText(
        settings.contact?.phone
      ),
    },

    social: {
      facebookUrl: normalizeOptionalText(
        settings.social?.facebookUrl
      ),

      instagramUrl:
        normalizeOptionalText(
          settings.social?.instagramUrl
        ),

      tiktokUrl: normalizeOptionalText(
        settings.social?.tiktokUrl
      ),

      youtubeUrl: normalizeOptionalText(
        settings.social?.youtubeUrl
      ),
    },

    delivery: {
      insideDhaka:
        normalizeNumberString(
          settings.delivery?.insideDhaka,
          DEFAULT_SETTINGS.delivery
            .insideDhaka
        ),

      outsideDhaka:
        normalizeNumberString(
          settings.delivery
            ?.outsideDhaka,
          DEFAULT_SETTINGS.delivery
            .outsideDhaka
        ),

      freeShippingOver:
        normalizeNumberString(
          settings.delivery
            ?.freeShippingOver,
          DEFAULT_SETTINGS.delivery
            .freeShippingOver
        ),
    },

    seo: {
      title: normalizeText(
        settings.seo?.title,
        DEFAULT_SETTINGS.seo.title
      ),

      description: normalizeText(
        settings.seo?.description,
        DEFAULT_SETTINGS.seo
          .description
      ),

      keywords:
        normalizeKeywords(
          settings.seo?.keywords
        ) ||
        DEFAULT_SETTINGS.seo.keywords,

      ogImage: normalizeText(
        settings.seo?.ogImage,
        DEFAULT_SETTINGS.seo.ogImage
      ),
    },

    payment: {
      cashOnDelivery:
        normalizeBoolean(
          settings.payment
            ?.cashOnDelivery,
          DEFAULT_SETTINGS.payment
            .cashOnDelivery
        ),

      bkash: normalizeBoolean(
        settings.payment?.bkash,
        DEFAULT_SETTINGS.payment.bkash
      ),

      nagad: normalizeBoolean(
        settings.payment?.nagad,
        DEFAULT_SETTINGS.payment.nagad
      ),

      rocket: normalizeBoolean(
        settings.payment?.rocket,
        DEFAULT_SETTINGS.payment.rocket
      ),
    },

    createdAt:
      settings.createdAt || null,

    updatedAt:
      settings.updatedAt || null,
  };
}

function normalizeNotificationSettings(
  settings = {}
) {
  return {
    email: {
      enabled: normalizeBoolean(
        settings.email?.enabled,
        DEFAULT_NOTIFICATION_SETTINGS
          .email.enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          settings.email
            ?.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          settings.email
            ?.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          settings.email
            ?.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .customerStatusUpdates
        ),

      adminRecipients:
        normalizeRecipientText(
          settings.email
            ?.adminRecipients
        ),

      replyTo: normalizeOptionalText(
        settings.email?.replyTo
      ),

      orderPlacedSubject:
        normalizeText(
          settings.email
            ?.orderPlacedSubject,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.orderPlacedSubject
        ),

      orderPlacedMessage:
        normalizeText(
          settings.email
            ?.orderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.orderPlacedMessage
        ),

      adminOrderPlacedSubject:
        normalizeText(
          settings.email
            ?.adminOrderPlacedSubject,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .adminOrderPlacedSubject
        ),

      adminOrderPlacedMessage:
        normalizeText(
          settings.email
            ?.adminOrderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .adminOrderPlacedMessage
        ),

      statusUpdateSubject:
        normalizeText(
          settings.email
            ?.statusUpdateSubject,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .statusUpdateSubject
        ),

      statusUpdateMessage:
        normalizeText(
          settings.email
            ?.statusUpdateMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .statusUpdateMessage
        ),
    },

    sms: {
      enabled: normalizeBoolean(
        settings.sms?.enabled,
        DEFAULT_NOTIFICATION_SETTINGS
          .sms.enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          settings.sms
            ?.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          settings.sms
            ?.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          settings.sms
            ?.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms
            .customerStatusUpdates
        ),

      adminRecipients:
        normalizeRecipientText(
          settings.sms
            ?.adminRecipients
        ),

      orderPlacedMessage:
        normalizeText(
          settings.sms
            ?.orderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.orderPlacedMessage
        ),

      adminOrderPlacedMessage:
        normalizeText(
          settings.sms
            ?.adminOrderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms
            .adminOrderPlacedMessage
        ),

      statusUpdateMessage:
        normalizeText(
          settings.sms
            ?.statusUpdateMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.statusUpdateMessage
        ),
    },

    whatsapp: {
      enabled: normalizeBoolean(
        settings.whatsapp?.enabled,
        DEFAULT_NOTIFICATION_SETTINGS
          .whatsapp.enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          settings.whatsapp
            ?.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp
            .customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          settings.whatsapp
            ?.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          settings.whatsapp
            ?.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp
            .customerStatusUpdates
        ),

      adminRecipients:
        normalizeRecipientText(
          settings.whatsapp
            ?.adminRecipients
        ),

      languageCode: normalizeText(
        settings.whatsapp
          ?.languageCode,
        DEFAULT_NOTIFICATION_SETTINGS
          .whatsapp.languageCode
      ),

      templates: {
        orderPlaced:
          normalizeOptionalText(
            settings.whatsapp
              ?.templates?.orderPlaced
          ),

        adminOrderPlaced:
          normalizeOptionalText(
            settings.whatsapp
              ?.templates
              ?.adminOrderPlaced
          ),

        statusUpdate:
          normalizeOptionalText(
            settings.whatsapp
              ?.templates?.statusUpdate
          ),
      },
    },

    statusEvents: {
      confirmed: normalizeBoolean(
        settings.statusEvents
          ?.confirmed,
        true
      ),

      processing: normalizeBoolean(
        settings.statusEvents
          ?.processing,
        true
      ),

      packed: normalizeBoolean(
        settings.statusEvents?.packed,
        true
      ),

      shipped: normalizeBoolean(
        settings.statusEvents?.shipped,
        true
      ),

      delivered: normalizeBoolean(
        settings.statusEvents
          ?.delivered,
        true
      ),

      cancelled: normalizeBoolean(
        settings.statusEvents
          ?.cancelled,
        true
      ),
    },

    createdAt:
      settings.createdAt || null,

    updatedAt:
      settings.updatedAt || null,
  };
}

function normalizeProviderStatus(
  providers = {}
) {
  return {
    email: {
      provider: normalizeText(
        providers.email?.provider,
        DEFAULT_NOTIFICATION_PROVIDERS
          .email.provider
      ),

      configured: normalizeBoolean(
        providers.email?.configured,
        false
      ),
    },

    sms: {
      provider: normalizeText(
        providers.sms?.provider,
        DEFAULT_NOTIFICATION_PROVIDERS
          .sms.provider
      ),

      configured: normalizeBoolean(
        providers.sms?.configured,
        false
      ),
    },

    whatsapp: {
      provider: normalizeText(
        providers.whatsapp?.provider,
        DEFAULT_NOTIFICATION_PROVIDERS
          .whatsapp.provider
      ),

      configured: normalizeBoolean(
        providers.whatsapp
          ?.configured,
        false
      ),
    },
  };
}

function createStorePayload(formData) {
  return {
    store: {
      name: formData.store.name.trim(),

      tagline:
        formData.store.tagline.trim(),

      currency:
        formData.store.currency
          .trim()
          .toUpperCase(),
    },

    contact: {
      whatsappNumber:
        formData.contact.whatsappNumber.replace(
          /\D/g,
          ""
        ),

      email:
        formData.contact.email.trim(),

      location:
        formData.contact.location.trim(),

      phone:
        formData.contact.phone.trim(),
    },

    social: {
      facebookUrl:
        formData.social.facebookUrl.trim(),

      instagramUrl:
        formData.social.instagramUrl.trim(),

      tiktokUrl:
        formData.social.tiktokUrl.trim(),

      youtubeUrl:
        formData.social.youtubeUrl.trim(),
    },

    delivery: {
      insideDhaka: Number(
        formData.delivery.insideDhaka ||
          0
      ),

      outsideDhaka: Number(
        formData.delivery
          .outsideDhaka || 0
      ),

      freeShippingOver: Number(
        formData.delivery
          .freeShippingOver || 0
      ),
    },

    seo: {
      title:
        formData.seo.title.trim(),

      description:
        formData.seo.description.trim(),

      keywords:
        formData.seo.keywords.trim(),

      ogImage:
        formData.seo.ogImage.trim(),
    },

    payment: {
      cashOnDelivery: Boolean(
        formData.payment
          .cashOnDelivery
      ),

      bkash: Boolean(
        formData.payment.bkash
      ),

      nagad: Boolean(
        formData.payment.nagad
      ),

      rocket: Boolean(
        formData.payment.rocket
      ),
    },
  };
}

function createNotificationPayload(
  formData
) {
  return {
    email: {
      enabled: Boolean(
        formData.email.enabled
      ),

      customerOrderPlaced: Boolean(
        formData.email
          .customerOrderPlaced
      ),

      adminOrderPlaced: Boolean(
        formData.email
          .adminOrderPlaced
      ),

      customerStatusUpdates:
        Boolean(
          formData.email
            .customerStatusUpdates
        ),

      adminRecipients:
        formData.email.adminRecipients.trim(),

      replyTo:
        formData.email.replyTo.trim(),

      orderPlacedSubject:
        formData.email
          .orderPlacedSubject.trim(),

      orderPlacedMessage:
        formData.email
          .orderPlacedMessage.trim(),

      adminOrderPlacedSubject:
        formData.email
          .adminOrderPlacedSubject.trim(),

      adminOrderPlacedMessage:
        formData.email
          .adminOrderPlacedMessage.trim(),

      statusUpdateSubject:
        formData.email
          .statusUpdateSubject.trim(),

      statusUpdateMessage:
        formData.email
          .statusUpdateMessage.trim(),
    },

    sms: {
      enabled: Boolean(
        formData.sms.enabled
      ),

      customerOrderPlaced: Boolean(
        formData.sms
          .customerOrderPlaced
      ),

      adminOrderPlaced: Boolean(
        formData.sms
          .adminOrderPlaced
      ),

      customerStatusUpdates:
        Boolean(
          formData.sms
            .customerStatusUpdates
        ),

      adminRecipients:
        formData.sms.adminRecipients.trim(),

      orderPlacedMessage:
        formData.sms
          .orderPlacedMessage.trim(),

      adminOrderPlacedMessage:
        formData.sms
          .adminOrderPlacedMessage.trim(),

      statusUpdateMessage:
        formData.sms
          .statusUpdateMessage.trim(),
    },

    whatsapp: {
      enabled: Boolean(
        formData.whatsapp.enabled
      ),

      customerOrderPlaced: Boolean(
        formData.whatsapp
          .customerOrderPlaced
      ),

      adminOrderPlaced: Boolean(
        formData.whatsapp
          .adminOrderPlaced
      ),

      customerStatusUpdates:
        Boolean(
          formData.whatsapp
            .customerStatusUpdates
        ),

      adminRecipients:
        formData.whatsapp
          .adminRecipients.trim(),

      languageCode:
        formData.whatsapp
          .languageCode.trim(),

      templates: {
        orderPlaced:
          formData.whatsapp.templates
            .orderPlaced.trim(),

        adminOrderPlaced:
          formData.whatsapp.templates
            .adminOrderPlaced.trim(),

        statusUpdate:
          formData.whatsapp.templates
            .statusUpdate.trim(),
      },
    },

    statusEvents: {
      confirmed: Boolean(
        formData.statusEvents
          .confirmed
      ),

      processing: Boolean(
        formData.statusEvents
          .processing
      ),

      packed: Boolean(
        formData.statusEvents.packed
      ),

      shipped: Boolean(
        formData.statusEvents.shipped
      ),

      delivered: Boolean(
        formData.statusEvents
          .delivered
      ),

      cancelled: Boolean(
        formData.statusEvents
          .cancelled
      ),
    },
  };
}

function createStoreComparableValue(
  formData
) {
  return JSON.stringify(
    createStorePayload(formData)
  );
}

function createNotificationComparableValue(
  formData
) {
  return JSON.stringify(
    createNotificationPayload(
      formData
    )
  );
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function isValidUrl(
  value,
  allowRelative = false
) {
  if (!value) {
    return true;
  }

  if (
    allowRelative &&
    value.startsWith("/")
  ) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validateDeliveryValue(value) {
  if (value === "") {
    return true;
  }

  const numericValue = Number(value);

  return (
    Number.isFinite(numericValue) &&
    numericValue >= 0 &&
    numericValue <= 10000000
  );
}

function splitRecipientEntries(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function validateEmailRecipientList(
  value
) {
  const entries =
    splitRecipientEntries(value);

  if (entries.length > 20) {
    return false;
  }

  return entries.every(isValidEmail);
}

function validatePhoneRecipientList(
  value
) {
  const entries =
    splitRecipientEntries(value);

  if (entries.length > 20) {
    return false;
  }

  return entries.every((entry) => {
    const phone = entry.replace(
      /\D/g,
      ""
    );

    return (
      phone.length >= 8 &&
      phone.length <= 15
    );
  });
}

function validateStoreForm(formData) {
  const errors = {};

  const storeName =
    formData.store.name.trim();

  if (!storeName) {
    errors["store.name"] =
      "Store name is required.";
  } else if (
    storeName.length > 80
  ) {
    errors["store.name"] =
      "Store name must not exceed 80 characters.";
  }

  if (
    formData.store.tagline.trim()
      .length > 240
  ) {
    errors["store.tagline"] =
      "Store tagline must not exceed 240 characters.";
  }

  const currency =
    formData.store.currency
      .trim()
      .toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors["store.currency"] =
      "Use a three-letter currency code such as BDT.";
  }

  const whatsappDigits =
    formData.contact.whatsappNumber.replace(
      /\D/g,
      ""
    );

  if (
    whatsappDigits &&
    (whatsappDigits.length < 8 ||
      whatsappDigits.length > 15)
  ) {
    errors[
      "contact.whatsappNumber"
    ] =
      "WhatsApp number must contain 8 to 15 digits.";
  }

  const email =
    formData.contact.email.trim();

  if (!isValidEmail(email)) {
    errors["contact.email"] =
      "Enter a valid email address.";
  }

  if (
    formData.contact.location.trim()
      .length > 240
  ) {
    errors["contact.location"] =
      "Store location must not exceed 240 characters.";
  }

  if (
    formData.contact.phone.trim()
      .length > 50
  ) {
    errors["contact.phone"] =
      "Phone number must not exceed 50 characters.";
  }

  const socialFields = [
    ["facebookUrl", "Facebook"],
    ["instagramUrl", "Instagram"],
    ["tiktokUrl", "TikTok"],
    ["youtubeUrl", "YouTube"],
  ];

  for (const [
    field,
    label,
  ] of socialFields) {
    const value =
      formData.social[field].trim();

    if (!isValidUrl(value)) {
      errors[`social.${field}`] =
        `${label} URL must begin with http:// or https://.`;
    }
  }

  const deliveryFields = [
    [
      "insideDhaka",
      "Inside Dhaka delivery charge",
    ],

    [
      "outsideDhaka",
      "Outside Dhaka delivery charge",
    ],

    [
      "freeShippingOver",
      "Free-shipping threshold",
    ],
  ];

  for (const [
    field,
    label,
  ] of deliveryFields) {
    const value =
      formData.delivery[field];

    if (
      !validateDeliveryValue(value)
    ) {
      errors[`delivery.${field}`] =
        `${label} must be a valid non-negative number.`;
    }
  }

  const seoTitle =
    formData.seo.title.trim();

  if (!seoTitle) {
    errors["seo.title"] =
      "Global SEO title is required.";
  } else if (
    seoTitle.length > 120
  ) {
    errors["seo.title"] =
      "SEO title must not exceed 120 characters.";
  }

  const seoDescription =
    formData.seo.description.trim();

  if (!seoDescription) {
    errors["seo.description"] =
      "Global SEO description is required.";
  } else if (
    seoDescription.length > 320
  ) {
    errors["seo.description"] =
      "SEO description must not exceed 320 characters.";
  }

  if (
    formData.seo.keywords.trim()
      .length > 1000
  ) {
    errors["seo.keywords"] =
      "SEO keywords must not exceed 1000 characters.";
  }

  const ogImage =
    formData.seo.ogImage.trim();

  if (
    !isValidUrl(ogImage, true)
  ) {
    errors["seo.ogImage"] =
      "Use an uploaded image path or a valid http/https URL.";
  }

  return errors;
}

function validateNotificationForm(
  formData,
  providers
) {
  const errors = {};

  if (
    formData.email.enabled &&
    !providers.email.configured
  ) {
    errors[
      "notification.email.enabled"
    ] =
      "Configure the Resend environment variables before enabling email notifications.";
  }

  if (
    formData.sms.enabled &&
    !providers.sms.configured
  ) {
    errors[
      "notification.sms.enabled"
    ] =
      "Configure the Twilio environment variables before enabling SMS notifications.";
  }

  if (
    formData.whatsapp.enabled &&
    !providers.whatsapp.configured
  ) {
    errors[
      "notification.whatsapp.enabled"
    ] =
      "Configure the WhatsApp Cloud API environment variables before enabling WhatsApp notifications.";
  }

  if (
    !validateEmailRecipientList(
      formData.email.adminRecipients
    )
  ) {
    errors[
      "notification.email.adminRecipients"
    ] =
      "Enter valid email addresses, with a maximum of 20 recipients.";
  }

  if (
    formData.email.replyTo &&
    !isValidEmail(
      formData.email.replyTo.trim()
    )
  ) {
    errors[
      "notification.email.replyTo"
    ] =
      "Enter a valid reply-to email address.";
  }

  if (
    formData.email.enabled &&
    formData.email
      .adminOrderPlaced &&
    splitRecipientEntries(
      formData.email.adminRecipients
    ).length === 0
  ) {
    errors[
      "notification.email.adminRecipients"
    ] =
      "Add at least one admin email recipient.";
  }

  const emailFields = [
    [
      "orderPlacedSubject",
      300,
      "Customer email subject",
    ],

    [
      "orderPlacedMessage",
      5000,
      "Customer email message",
    ],

    [
      "adminOrderPlacedSubject",
      300,
      "Admin email subject",
    ],

    [
      "adminOrderPlacedMessage",
      5000,
      "Admin email message",
    ],

    [
      "statusUpdateSubject",
      300,
      "Status email subject",
    ],

    [
      "statusUpdateMessage",
      5000,
      "Status email message",
    ],
  ];

  for (const [
    field,
    maximumLength,
    label,
  ] of emailFields) {
    const value =
      formData.email[field].trim();

    if (!value) {
      errors[
        `notification.email.${field}`
      ] = `${label} is required.`;
    } else if (
      value.length > maximumLength
    ) {
      errors[
        `notification.email.${field}`
      ] =
        `${label} must not exceed ${maximumLength} characters.`;
    }
  }

  if (
    !validatePhoneRecipientList(
      formData.sms.adminRecipients
    )
  ) {
    errors[
      "notification.sms.adminRecipients"
    ] =
      "Enter valid international phone numbers, with a maximum of 20 recipients.";
  }

  if (
    formData.sms.enabled &&
    formData.sms.adminOrderPlaced &&
    splitRecipientEntries(
      formData.sms.adminRecipients
    ).length === 0
  ) {
    errors[
      "notification.sms.adminRecipients"
    ] =
      "Add at least one admin SMS recipient.";
  }

  const smsFields = [
    [
      "orderPlacedMessage",
      "Customer order SMS",
    ],

    [
      "adminOrderPlacedMessage",
      "Admin order SMS",
    ],

    [
      "statusUpdateMessage",
      "Status update SMS",
    ],
  ];

  for (const [
    field,
    label,
  ] of smsFields) {
    const value =
      formData.sms[field].trim();

    if (!value) {
      errors[
        `notification.sms.${field}`
      ] = `${label} is required.`;
    } else if (
      value.length > 1000
    ) {
      errors[
        `notification.sms.${field}`
      ] =
        `${label} must not exceed 1000 characters.`;
    }
  }

  if (
    !validatePhoneRecipientList(
      formData.whatsapp
        .adminRecipients
    )
  ) {
    errors[
      "notification.whatsapp.adminRecipients"
    ] =
      "Enter valid international phone numbers, with a maximum of 20 recipients.";
  }

  if (
    formData.whatsapp.enabled &&
    formData.whatsapp
      .adminOrderPlaced &&
    splitRecipientEntries(
      formData.whatsapp
        .adminRecipients
    ).length === 0
  ) {
    errors[
      "notification.whatsapp.adminRecipients"
    ] =
      "Add at least one admin WhatsApp recipient.";
  }

  const languageCode =
    formData.whatsapp
      .languageCode.trim();

  if (
    !/^[A-Za-z]{2,3}(?:[_-][A-Za-z]{2,4})?$/.test(
      languageCode
    )
  ) {
    errors[
      "notification.whatsapp.languageCode"
    ] =
      "Use a language code such as en or en_US.";
  }

  const whatsappTemplates = [
    [
      "orderPlaced",
      "Customer order template",
    ],

    [
      "adminOrderPlaced",
      "Admin order template",
    ],

    [
      "statusUpdate",
      "Status update template",
    ],
  ];

  for (const [
    field,
    label,
  ] of whatsappTemplates) {
    const value =
      formData.whatsapp
        .templates[field].trim();

    if (
      value &&
      !/^[a-z0-9_]+$/.test(value)
    ) {
      errors[
        `notification.whatsapp.templates.${field}`
      ] =
        `${label} may contain only lowercase letters, numbers, and underscores.`;
    }
  }

  if (
    formData.whatsapp.enabled &&
    formData.whatsapp
      .customerOrderPlaced &&
    !formData.whatsapp.templates
      .orderPlaced.trim()
  ) {
    errors[
      "notification.whatsapp.templates.orderPlaced"
    ] =
      "The approved customer order template name is required.";
  }

  if (
    formData.whatsapp.enabled &&
    formData.whatsapp
      .adminOrderPlaced &&
    !formData.whatsapp.templates
      .adminOrderPlaced.trim()
  ) {
    errors[
      "notification.whatsapp.templates.adminOrderPlaced"
    ] =
      "The approved admin order template name is required.";
  }

  if (
    formData.whatsapp.enabled &&
    formData.whatsapp
      .customerStatusUpdates &&
    !formData.whatsapp.templates
      .statusUpdate.trim()
  ) {
    errors[
      "notification.whatsapp.templates.statusUpdate"
    ] =
      "The approved status update template name is required.";
  }

  const statusUpdatesEnabled =
    (
      formData.email.enabled &&
      formData.email
        .customerStatusUpdates
    ) ||
    (
      formData.sms.enabled &&
      formData.sms
        .customerStatusUpdates
    ) ||
    (
      formData.whatsapp.enabled &&
      formData.whatsapp
        .customerStatusUpdates
    );

  if (
    statusUpdatesEnabled &&
    !Object.values(
      formData.statusEvents
    ).some(Boolean)
  ) {
    errors[
      "notification.statusEvents"
    ] =
      "Enable at least one order status event.";
  }

  return errors;
}

function formatSavedDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date.toLocaleString();
}

function Section({
  title,
  description,
  children,
}) {
  return (
    <section className="border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-6 py-6 md:px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          {title}
        </p>

        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="p-6 md:p-8">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  description,
  error,
  required = false,
  children,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs uppercase tracking-[0.24em] text-neutral-400">
          {label}

          {required ? (
            <span className="ml-1 text-red-400">
              *
            </span>
          ) : null}
        </label>

        {description ? (
          <p className="mt-2 text-xs leading-5 text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>

      {children}

      {error ? (
        <p className="text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  maxLength,
  inputMode,
  min,
  step,
}) {
  return (
    <input
      id={id}
      data-field={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      min={min}
      step={step}
      aria-invalid={Boolean(error)}
      className={`w-full border bg-white/5 px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 ${
        error
          ? "border-red-500/60 focus:border-red-400"
          : "border-white/10 focus:border-white/30"
      }`}
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  error,
  rows = 5,
  maxLength,
}) {
  return (
    <textarea
      id={id}
      data-field={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      className={`w-full resize-y border bg-white/5 px-5 py-4 text-sm leading-7 text-[#f1ece4] outline-none transition placeholder:text-neutral-700 ${
        error
          ? "border-red-500/60 focus:border-red-400"
          : "border-white/10 focus:border-white/30"
      }`}
    />
  );
}

function StatusMessage({ status }) {
  if (!status?.message) {
    return null;
  }

  const styles = {
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",

    error:
      "border-red-500/30 bg-red-500/10 text-red-200",

    info:
      "border-white/10 bg-white/5 text-neutral-300",
  };

  return (
    <div
      role="status"
      className={`border px-5 py-4 text-sm leading-6 ${
        styles[status.type] ||
        styles.info
      }`}
    >
      {status.message}
    </div>
  );
}

function ToggleCard({
  id,
  checked,
  onChange,
  label,
  description,
  error,
  disabled = false,
}) {
  return (
    <div>
      <label
        className={`flex items-start gap-4 border p-5 transition ${
          checked
            ? "border-white/30 bg-white/10"
            : "border-white/10 bg-white/[0.03]"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-white/20"
        }`}
      >
        <input
          id={id}
          data-field={id}
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked
            )
          }
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="mt-1 h-4 w-4 accent-[#f1ece4]"
        />

        <span>
          <span className="block text-sm text-[#f1ece4]">
            {label}
          </span>

          {description ? (
            <span className="mt-2 block text-xs leading-5 text-neutral-500">
              {description}
            </span>
          ) : null}
        </span>
      </label>

      {error ? (
        <p className="mt-2 text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ProviderCard({
  title,
  provider,
  configured,
  description,
}) {
  return (
    <div className="border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#f1ece4]">
            {title}
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-600">
            {provider}
          </p>
        </div>

        <span
          className={`border px-3 py-2 text-[10px] uppercase tracking-[0.2em] ${
            configured
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {configured
            ? "Configured"
            : "Not Configured"}
        </span>
      </div>

      <p className="mt-4 text-xs leading-6 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

export default function SettingsEditor({
  initialSettings,
  initialNotificationSettings,
  initialNotificationProviders,
}) {
  const normalizedInitialSettings =
    useMemo(
      () =>
        normalizeSettings(
          initialSettings
        ),
      [initialSettings]
    );

  const normalizedInitialNotifications =
    useMemo(
      () =>
        normalizeNotificationSettings(
          initialNotificationSettings
        ),
      [initialNotificationSettings]
    );

  const [
    notificationProviders,
    setNotificationProviders,
  ] = useState(() =>
    normalizeProviderStatus(
      initialNotificationProviders
    )
  );

  const [formData, setFormData] =
    useState(
      normalizedInitialSettings
    );

  const [savedData, setSavedData] =
    useState(
      normalizedInitialSettings
    );

  const [
    notificationData,
    setNotificationData,
  ] = useState(
    normalizedInitialNotifications
  );

  const [
    savedNotificationData,
    setSavedNotificationData,
  ] = useState(
    normalizedInitialNotifications
  );

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  const [
    notificationErrors,
    setNotificationErrors,
  ] = useState({});

  const [status, setStatus] =
    useState(null);

  const [
    notificationStatus,
    setNotificationStatus,
  ] = useState(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    isSavingNotifications,
    setIsSavingNotifications,
  ] = useState(false);

  const hasStoreUnsavedChanges =
    useMemo(() => {
      return (
        createStoreComparableValue(
          formData
        ) !==
        createStoreComparableValue(
          savedData
        )
      );
    }, [formData, savedData]);

  const hasNotificationUnsavedChanges =
    useMemo(() => {
      return (
        createNotificationComparableValue(
          notificationData
        ) !==
        createNotificationComparableValue(
          savedNotificationData
        )
      );
    }, [
      notificationData,
      savedNotificationData,
    ]);

  const hasUnsavedChanges =
    hasStoreUnsavedChanges ||
    hasNotificationUnsavedChanges;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }

    function handleBeforeUnload(
      event
    ) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [hasUnsavedChanges]);

  function clearStoreFieldError(
    section,
    field
  ) {
    const errorKey =
      `${section}.${field}`;

    setFieldErrors(
      (currentErrors) => {
        if (
          !currentErrors[errorKey]
        ) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors[errorKey];

        return nextErrors;
      }
    );
  }

  function clearNotificationError(
    errorKey
  ) {
    setNotificationErrors(
      (currentErrors) => {
        if (
          !currentErrors[errorKey]
        ) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors[errorKey];

        return nextErrors;
      }
    );
  }

  function handleChange(
    section,
    field,
    value
  ) {
    setFormData(
      (currentData) => ({
        ...currentData,

        [section]: {
          ...currentData[section],
          [field]: value,
        },
      })
    );

    clearStoreFieldError(
      section,
      field
    );

    if (
      status?.type === "success"
    ) {
      setStatus(null);
    }
  }

  function handlePaymentChange(
    field,
    checked
  ) {
    handleChange(
      "payment",
      field,
      checked
    );
  }

  function handleNotificationChange(
    section,
    field,
    value
  ) {
    setNotificationData(
      (currentData) => ({
        ...currentData,

        [section]: {
          ...currentData[section],
          [field]: value,
        },
      })
    );

    clearNotificationError(
      `notification.${section}.${field}`
    );

    if (
      notificationStatus?.type ===
      "success"
    ) {
      setNotificationStatus(null);
    }
  }

  function handleWhatsAppTemplateChange(
    field,
    value
  ) {
    setNotificationData(
      (currentData) => ({
        ...currentData,

        whatsapp: {
          ...currentData.whatsapp,

          templates: {
            ...currentData.whatsapp
              .templates,

            [field]: value,
          },
        },
      })
    );

    clearNotificationError(
      `notification.whatsapp.templates.${field}`
    );

    if (
      notificationStatus?.type ===
      "success"
    ) {
      setNotificationStatus(null);
    }
  }

  function handleStatusEventChange(
    field,
    checked
  ) {
    setNotificationData(
      (currentData) => ({
        ...currentData,

        statusEvents: {
          ...currentData.statusEvents,
          [field]: checked,
        },
      })
    );

    clearNotificationError(
      "notification.statusEvents"
    );

    if (
      notificationStatus?.type ===
      "success"
    ) {
      setNotificationStatus(null);
    }
  }

  function focusFirstInvalidField(
    errors
  ) {
    const firstErrorKey =
      Object.keys(errors)[0];

    if (!firstErrorKey) {
      return;
    }

    window.requestAnimationFrame(
      () => {
        const field =
          document.querySelector(
            `[data-field="${firstErrorKey}"]`
          );

        field?.focus();

        field?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    );
  }

  function handleStoreReset() {
    if (
      hasStoreUnsavedChanges &&
      !window.confirm(
        "Discard all unsaved store settings changes?"
      )
    ) {
      return;
    }

    setFormData(savedData);
    setFieldErrors({});

    setStatus({
      type: "info",
      message:
        "Unsaved store settings changes were discarded.",
    });
  }

  function handleNotificationReset() {
    if (
      hasNotificationUnsavedChanges &&
      !window.confirm(
        "Discard all unsaved notification settings changes?"
      )
    ) {
      return;
    }

    setNotificationData(
      savedNotificationData
    );

    setNotificationErrors({});

    setNotificationStatus({
      type: "info",
      message:
        "Unsaved notification settings changes were discarded.",
    });
  }

  function handleBackClick(event) {
    if (!hasUnsavedChanges) {
      return;
    }

    const confirmed =
      window.confirm(
        "You have unsaved settings changes. Leave this page without saving?"
      );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  async function handleStoreSubmit(
    event
  ) {
    event.preventDefault();

    const validationErrors =
      validateStoreForm(formData);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setFieldErrors(
        validationErrors
      );

      setStatus({
        type: "error",
        message:
          "Please correct the highlighted store settings fields before saving.",
      });

      focusFirstInvalidField(
        validationErrors
      );

      return;
    }

    setIsSaving(true);

    setStatus({
      type: "info",
      message:
        "Saving store settings...",
    });

    try {
      const response = await fetch(
        "/api/settings",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            createStorePayload(
              formData
            )
          ),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {
        if (
          response.status === 401
        ) {
          setStatus({
            type: "error",
            message:
              "Your admin session has expired. Sign in again and retry.",
          });

          return;
        }

        setStatus({
          type: "error",
          message:
            data.message ||
            "Store settings could not be saved.",
        });

        return;
      }

      const normalizedSavedSettings =
        normalizeSettings(
          data.settings
        );

      setFormData(
        normalizedSavedSettings
      );

      setSavedData(
        normalizedSavedSettings
      );

      setFieldErrors({});

      setStatus({
        type: "success",
        message:
          data.message ||
          "Store settings saved successfully.",
      });
    } catch (error) {
      console.error(
        "Store settings save error:",
        error
      );

      setStatus({
        type: "error",
        message:
          "Something went wrong while saving store settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNotificationSubmit(
    event
  ) {
    event.preventDefault();

    const validationErrors =
      validateNotificationForm(
        notificationData,
        notificationProviders
      );

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setNotificationErrors(
        validationErrors
      );

      setNotificationStatus({
        type: "error",
        message:
          "Please correct the highlighted notification settings fields before saving.",
      });

      focusFirstInvalidField(
        validationErrors
      );

      return;
    }

    setIsSavingNotifications(true);

    setNotificationStatus({
      type: "info",
      message:
        "Saving notification settings...",
    });

    try {
      const response = await fetch(
        "/api/admin/notification-settings",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            createNotificationPayload(
              notificationData
            )
          ),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {
        if (
          response.status === 401
        ) {
          setNotificationStatus({
            type: "error",
            message:
              "Your admin session has expired. Sign in again and retry.",
          });

          return;
        }

        setNotificationStatus({
          type: "error",
          message:
            data.message ||
            "Notification settings could not be saved.",
        });

        return;
      }

      const normalizedSavedSettings =
        normalizeNotificationSettings(
          data.settings
        );

      setNotificationData(
        normalizedSavedSettings
      );

      setSavedNotificationData(
        normalizedSavedSettings
      );

      setNotificationProviders(
        normalizeProviderStatus(
          data.providers
        )
      );

      setNotificationErrors({});

      setNotificationStatus({
        type: "success",
        message:
          data.message ||
          "Notification settings saved successfully.",
      });
    } catch (error) {
      console.error(
        "Notification settings save error:",
        error
      );

      setNotificationStatus({
        type: "error",
        message:
          "Something went wrong while saving notification settings.",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  }

  const lastStoreSavedAt =
    formatSavedDate(
      savedData.updatedAt
    );

  const lastNotificationSavedAt =
    formatSavedDate(
      savedNotificationData.updatedAt
    );

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
                Admin / Settings
              </p>

              <h1 className="font-heading text-5xl font-light md:text-7xl">
                Store Settings
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
                Manage store identity,
                communication, delivery,
                SEO, payment availability,
                and automatic order
                notifications.
              </p>
            </div>

            <Link
              href="/admin"
              onClick={handleBackClick}
              className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back to Admin
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.2em]">
            <span
              className={
                hasUnsavedChanges
                  ? "text-amber-300"
                  : "text-emerald-300"
              }
            >
              {hasUnsavedChanges
                ? "Unsaved Changes"
                : "All Changes Saved"}
            </span>

            {hasStoreUnsavedChanges ? (
              <span className="text-neutral-600">
                Store settings changed
              </span>
            ) : null}

            {hasNotificationUnsavedChanges ? (
              <span className="text-neutral-600">
                Notification settings changed
              </span>
            ) : null}
          </div>
        </header>

        <form
          onSubmit={handleStoreSubmit}
          noValidate
          className="space-y-8"
        >
          <StatusMessage
            status={status}
          />

          <Section
            title="Store Identity"
            description="Core brand information used across the storefront, checkout, navigation, footer, and system-generated customer content."
          >
            <div className="grid gap-7 md:grid-cols-2">
              <Field
                label="Store Name"
                description="The public name of the brand."
                required
                error={
                  fieldErrors[
                    "store.name"
                  ]
                }
              >
                <TextInput
                  id="store.name"
                  value={
                    formData.store.name
                  }
                  onChange={(event) =>
                    handleChange(
                      "store",
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="OBSIDIAN"
                  maxLength={80}
                  error={
                    fieldErrors[
                      "store.name"
                    ]
                  }
                />
              </Field>

              <Field
                label="Currency"
                description="Three-letter currency code used for pricing."
                required
                error={
                  fieldErrors[
                    "store.currency"
                  ]
                }
              >
                <TextInput
                  id="store.currency"
                  value={
                    formData.store
                      .currency
                  }
                  onChange={(event) =>
                    handleChange(
                      "store",
                      "currency",
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z]/g,
                          ""
                        )
                        .slice(0, 3)
                    )
                  }
                  placeholder="BDT"
                  maxLength={3}
                  error={
                    fieldErrors[
                      "store.currency"
                    ]
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Brand Tagline"
                  description="The main brand statement used as a store-wide fallback."
                  error={
                    fieldErrors[
                      "store.tagline"
                    ]
                  }
                >
                  <TextInput
                    id="store.tagline"
                    value={
                      formData.store
                        .tagline
                    }
                    onChange={(event) =>
                      handleChange(
                        "store",
                        "tagline",
                        event.target
                          .value
                      )
                    }
                    placeholder="Built under pressure. Finished with precision."
                    maxLength={240}
                    error={
                      fieldErrors[
                        "store.tagline"
                      ]
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title="Contact Information"
            description="Public business contact information used by the contact page, footer, checkout, and customer communication links."
          >
            <div className="grid gap-7 md:grid-cols-2">
              <Field
                label="WhatsApp Number"
                description="Include the country code. Spaces and symbols will be removed when saved."
                error={
                  fieldErrors[
                    "contact.whatsappNumber"
                  ]
                }
              >
                <TextInput
                  id="contact.whatsappNumber"
                  value={
                    formData.contact
                      .whatsappNumber
                  }
                  onChange={(event) =>
                    handleChange(
                      "contact",
                      "whatsappNumber",
                      event.target.value
                    )
                  }
                  placeholder="8801814455199"
                  inputMode="tel"
                  maxLength={30}
                  error={
                    fieldErrors[
                      "contact.whatsappNumber"
                    ]
                  }
                />
              </Field>

              <Field
                label="Phone Number"
                description="Optional public phone number."
                error={
                  fieldErrors[
                    "contact.phone"
                  ]
                }
              >
                <TextInput
                  id="contact.phone"
                  value={
                    formData.contact.phone
                  }
                  onChange={(event) =>
                    handleChange(
                      "contact",
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="+880 1814 455199"
                  inputMode="tel"
                  maxLength={50}
                  error={
                    fieldErrors[
                      "contact.phone"
                    ]
                  }
                />
              </Field>

              <Field
                label="Store Email"
                description="Public customer-support or business email address."
                error={
                  fieldErrors[
                    "contact.email"
                  ]
                }
              >
                <TextInput
                  id="contact.email"
                  type="email"
                  value={
                    formData.contact.email
                  }
                  onChange={(event) =>
                    handleChange(
                      "contact",
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="obsidianwear.management@gmail.com"
                  maxLength={254}
                  error={
                    fieldErrors[
                      "contact.email"
                    ]
                  }
                />
              </Field>

              <Field
                label="Store Location"
                description="Short public location or business address."
                error={
                  fieldErrors[
                    "contact.location"
                  ]
                }
              >
                <TextInput
                  id="contact.location"
                  value={
                    formData.contact
                      .location
                  }
                  onChange={(event) =>
                    handleChange(
                      "contact",
                      "location",
                      event.target.value
                    )
                  }
                  placeholder="Dhaka, Bangladesh"
                  maxLength={240}
                  error={
                    fieldErrors[
                      "contact.location"
                    ]
                  }
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Social Profiles"
            description="Add complete public profile URLs. Leave a field empty when the platform is not in use."
          >
            <div className="grid gap-7 md:grid-cols-2">
              {[
                [
                  "facebookUrl",
                  "Facebook URL",
                  "https://facebook.com/...",
                ],

                [
                  "instagramUrl",
                  "Instagram URL",
                  "https://instagram.com/...",
                ],

                [
                  "tiktokUrl",
                  "TikTok URL",
                  "https://tiktok.com/@...",
                ],

                [
                  "youtubeUrl",
                  "YouTube URL",
                  "https://youtube.com/@...",
                ],
              ].map(
                ([
                  field,
                  label,
                  placeholder,
                ]) => (
                  <Field
                    key={field}
                    label={label}
                    error={
                      fieldErrors[
                        `social.${field}`
                      ]
                    }
                  >
                    <TextInput
                      id={`social.${field}`}
                      type="url"
                      value={
                        formData.social[
                          field
                        ]
                      }
                      onChange={(event) =>
                        handleChange(
                          "social",
                          field,
                          event.target
                            .value
                        )
                      }
                      placeholder={
                        placeholder
                      }
                      maxLength={1000}
                      error={
                        fieldErrors[
                          `social.${field}`
                        ]
                      }
                    />
                  </Field>
                )
              )}
            </div>
          </Section>

          <Section
            title="Delivery Rules"
            description="Delivery charges used during checkout and coupon calculation. Enter zero to make a delivery option free."
          >
            <div className="grid gap-7 md:grid-cols-3">
              {[
                [
                  "insideDhaka",
                  "Inside Dhaka",
                  "Standard delivery charge inside Dhaka.",
                  "80",
                ],

                [
                  "outsideDhaka",
                  "Outside Dhaka",
                  "Standard delivery charge outside Dhaka.",
                  "130",
                ],

                [
                  "freeShippingOver",
                  "Free Shipping Over",
                  "Order subtotal required for free shipping. Use zero to disable it.",
                  "0",
                ],
              ].map(
                ([
                  field,
                  label,
                  description,
                  placeholder,
                ]) => (
                  <Field
                    key={field}
                    label={label}
                    description={
                      description
                    }
                    error={
                      fieldErrors[
                        `delivery.${field}`
                      ]
                    }
                  >
                    <TextInput
                      id={`delivery.${field}`}
                      type="number"
                      value={
                        formData.delivery[
                          field
                        ]
                      }
                      onChange={(event) =>
                        handleChange(
                          "delivery",
                          field,
                          event.target
                            .value
                        )
                      }
                      placeholder={
                        placeholder
                      }
                      inputMode="decimal"
                      min="0"
                      step="1"
                      error={
                        fieldErrors[
                          `delivery.${field}`
                        ]
                      }
                    />
                  </Field>
                )
              )}
            </div>
          </Section>

          <Section
            title="Global SEO"
            description="Site-wide fallback metadata. Individual CMS pages can still use their own page-specific SEO settings."
          >
            <div className="grid gap-7">
              <Field
                label="Global SEO Title"
                description={`${formData.seo.title.length}/120 characters`}
                required
                error={
                  fieldErrors[
                    "seo.title"
                  ]
                }
              >
                <TextInput
                  id="seo.title"
                  value={
                    formData.seo.title
                  }
                  onChange={(event) =>
                    handleChange(
                      "seo",
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="OBSIDIAN | Premium Menswear Bangladesh"
                  maxLength={120}
                  error={
                    fieldErrors[
                      "seo.title"
                    ]
                  }
                />
              </Field>

              <Field
                label="Global SEO Description"
                description={`${formData.seo.description.length}/320 characters`}
                required
                error={
                  fieldErrors[
                    "seo.description"
                  ]
                }
              >
                <Textarea
                  id="seo.description"
                  value={
                    formData.seo
                      .description
                  }
                  onChange={(event) =>
                    handleChange(
                      "seo",
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the store for search engines and social previews."
                  rows={5}
                  maxLength={320}
                  error={
                    fieldErrors[
                      "seo.description"
                    ]
                  }
                />
              </Field>

              <Field
                label="SEO Keywords"
                description="Comma-separated global keywords. Page-specific SEO can override these where necessary."
                error={
                  fieldErrors[
                    "seo.keywords"
                  ]
                }
              >
                <Textarea
                  id="seo.keywords"
                  value={
                    formData.seo.keywords
                  }
                  onChange={(event) =>
                    handleChange(
                      "seo",
                      "keywords",
                      event.target.value
                    )
                  }
                  placeholder="OBSIDIAN, premium menswear Bangladesh, oversized t-shirt Bangladesh"
                  rows={4}
                  maxLength={1000}
                  error={
                    fieldErrors[
                      "seo.keywords"
                    ]
                  }
                />
              </Field>

              <Field
                label="Open Graph Image"
                description="Default social-sharing image. Recommended size: 1200 × 630 pixels."
                error={
                  fieldErrors[
                    "seo.ogImage"
                  ]
                }
              >
                <TextInput
                  id="seo.ogImage"
                  value={
                    formData.seo.ogImage
                  }
                  onChange={(event) =>
                    handleChange(
                      "seo",
                      "ogImage",
                      event.target.value
                    )
                  }
                  placeholder="/images/hero1.jpeg"
                  maxLength={1000}
                  error={
                    fieldErrors[
                      "seo.ogImage"
                    ]
                  }
                />

                <div className="mt-5 border-t border-white/10 pt-5 [&>div>label]:hidden">
                  <ImageUploader
                    value={
                      formData.seo
                        .ogImage
                    }
                    onChange={(
                      imageUrl
                    ) =>
                      handleChange(
                        "seo",
                        "ogImage",
                        imageUrl
                      )
                    }
                  />
                </div>
              </Field>
            </div>
          </Section>

          <Section
            title="Payment Availability"
            description="Control which payment methods are enabled in the store configuration."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {PAYMENT_METHODS.map(
                ({
                  field,
                  label,
                  description,
                }) => (
                  <ToggleCard
                    key={field}
                    id={`payment.${field}`}
                    checked={
                      formData.payment[
                        field
                      ]
                    }
                    onChange={(
                      checked
                    ) =>
                      handlePaymentChange(
                        field,
                        checked
                      )
                    }
                    label={label}
                    description={
                      description
                    }
                  />
                )
              )}
            </div>
          </Section>

          <div className="border border-white/10 bg-[#111111] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm text-neutral-300">
                  {hasStoreUnsavedChanges
                    ? "You have unsaved store settings changes."
                    : "Your store settings are up to date."}
                </p>

                {lastStoreSavedAt ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-600">
                    Last saved{" "}
                    {lastStoreSavedAt}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    handleStoreReset
                  }
                  disabled={
                    isSaving ||
                    !hasStoreUnsavedChanges
                  }
                  className="border border-white/20 px-6 py-4 text-xs uppercase tracking-[0.28em] text-[#f1ece4] transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !hasStoreUnsavedChanges
                  }
                  className="bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSaving
                    ? "Saving Store..."
                    : "Save Store Settings"}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="my-14 border-t border-white/10" />

        <form
          onSubmit={
            handleNotificationSubmit
          }
          noValidate
          className="space-y-8"
        >
          <header className="pb-3">
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Automatic Communication
            </p>

            <h2 className="font-heading text-4xl font-light md:text-6xl">
              Order Notifications
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
              Control customer and admin
              notifications for new orders
              and order status changes.
              Provider credentials remain
              protected inside environment
              variables and are never exposed
              through this page.
            </p>
          </header>

          <StatusMessage
            status={
              notificationStatus
            }
          />

          <Section
            title="Provider Status"
            description="A notification channel can only be enabled after its required environment variables are configured."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <ProviderCard
                title="Email"
                provider={
                  notificationProviders
                    .email.provider
                }
                configured={
                  notificationProviders
                    .email.configured
                }
                description="Transactional email delivery through Resend."
              />

              <ProviderCard
                title="SMS"
                provider={
                  notificationProviders
                    .sms.provider
                }
                configured={
                  notificationProviders
                    .sms.configured
                }
                description="Transactional SMS delivery through Twilio."
              />

              <ProviderCard
                title="WhatsApp"
                provider={
                  notificationProviders
                    .whatsapp.provider
                }
                configured={
                  notificationProviders
                    .whatsapp.configured
                }
                description="Approved template messages through Meta WhatsApp Cloud API."
              />
            </div>
          </Section>

          <Section
            title="Email Notifications"
            description="Configure customer and admin transactional email behaviour. Email credentials are managed through environment variables."
          >
            <div className="space-y-7">
              <ToggleCard
                id="notification.email.enabled"
                checked={
                  notificationData.email
                    .enabled
                }
                onChange={(checked) =>
                  handleNotificationChange(
                    "email",
                    "enabled",
                    checked
                  )
                }
                label="Enable Email Notifications"
                description={
                  notificationProviders
                    .email.configured
                    ? "Use Resend to deliver transactional order emails."
                    : "Resend environment variables are not configured."
                }
                error={
                  notificationErrors[
                    "notification.email.enabled"
                  ]
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <ToggleCard
                  id="notification.email.customerOrderPlaced"
                  checked={
                    notificationData.email
                      .customerOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "email",
                      "customerOrderPlaced",
                      checked
                    )
                  }
                  label="Customer Order Email"
                  description="Send an order received email when the customer provided an email address."
                />

                <ToggleCard
                  id="notification.email.adminOrderPlaced"
                  checked={
                    notificationData.email
                      .adminOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "email",
                      "adminOrderPlaced",
                      checked
                    )
                  }
                  label="Admin New Order Email"
                  description="Notify configured admin recipients when a new order is created."
                />

                <ToggleCard
                  id="notification.email.customerStatusUpdates"
                  checked={
                    notificationData.email
                      .customerStatusUpdates
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "email",
                      "customerStatusUpdates",
                      checked
                    )
                  }
                  label="Customer Status Emails"
                  description="Send emails when enabled order statuses change."
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <Field
                  label="Admin Email Recipients"
                  description="One address per line, or separate addresses with commas. Maximum 20."
                  error={
                    notificationErrors[
                      "notification.email.adminRecipients"
                    ]
                  }
                >
                  <Textarea
                    id="notification.email.adminRecipients"
                    value={
                      notificationData.email
                        .adminRecipients
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "adminRecipients",
                        event.target.value
                      )
                    }
                    placeholder="orders@obsidianwear.com"
                    rows={4}
                    maxLength={6000}
                    error={
                      notificationErrors[
                        "notification.email.adminRecipients"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Reply-To Email"
                  description="Customer replies will be directed to this address."
                  error={
                    notificationErrors[
                      "notification.email.replyTo"
                    ]
                  }
                >
                  <TextInput
                    id="notification.email.replyTo"
                    type="email"
                    value={
                      notificationData.email
                        .replyTo
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "replyTo",
                        event.target.value
                      )
                    }
                    placeholder="support@obsidianwear.com"
                    maxLength={254}
                    error={
                      notificationErrors[
                        "notification.email.replyTo"
                      ]
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-7">
                <Field
                  label="Customer Order Email Subject"
                  error={
                    notificationErrors[
                      "notification.email.orderPlacedSubject"
                    ]
                  }
                >
                  <TextInput
                    id="notification.email.orderPlacedSubject"
                    value={
                      notificationData.email
                        .orderPlacedSubject
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "orderPlacedSubject",
                        event.target.value
                      )
                    }
                    maxLength={300}
                    error={
                      notificationErrors[
                        "notification.email.orderPlacedSubject"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Customer Order Email Message"
                  error={
                    notificationErrors[
                      "notification.email.orderPlacedMessage"
                    ]
                  }
                >
                  <Textarea
                    id="notification.email.orderPlacedMessage"
                    value={
                      notificationData.email
                        .orderPlacedMessage
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "orderPlacedMessage",
                        event.target.value
                      )
                    }
                    rows={5}
                    maxLength={5000}
                    error={
                      notificationErrors[
                        "notification.email.orderPlacedMessage"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Admin New Order Email Subject"
                  error={
                    notificationErrors[
                      "notification.email.adminOrderPlacedSubject"
                    ]
                  }
                >
                  <TextInput
                    id="notification.email.adminOrderPlacedSubject"
                    value={
                      notificationData.email
                        .adminOrderPlacedSubject
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "adminOrderPlacedSubject",
                        event.target.value
                      )
                    }
                    maxLength={300}
                    error={
                      notificationErrors[
                        "notification.email.adminOrderPlacedSubject"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Admin New Order Email Message"
                  error={
                    notificationErrors[
                      "notification.email.adminOrderPlacedMessage"
                    ]
                  }
                >
                  <Textarea
                    id="notification.email.adminOrderPlacedMessage"
                    value={
                      notificationData.email
                        .adminOrderPlacedMessage
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "adminOrderPlacedMessage",
                        event.target.value
                      )
                    }
                    rows={5}
                    maxLength={5000}
                    error={
                      notificationErrors[
                        "notification.email.adminOrderPlacedMessage"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Status Update Email Subject"
                  error={
                    notificationErrors[
                      "notification.email.statusUpdateSubject"
                    ]
                  }
                >
                  <TextInput
                    id="notification.email.statusUpdateSubject"
                    value={
                      notificationData.email
                        .statusUpdateSubject
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "statusUpdateSubject",
                        event.target.value
                      )
                    }
                    maxLength={300}
                    error={
                      notificationErrors[
                        "notification.email.statusUpdateSubject"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Status Update Email Message"
                  error={
                    notificationErrors[
                      "notification.email.statusUpdateMessage"
                    ]
                  }
                >
                  <Textarea
                    id="notification.email.statusUpdateMessage"
                    value={
                      notificationData.email
                        .statusUpdateMessage
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "email",
                        "statusUpdateMessage",
                        event.target.value
                      )
                    }
                    rows={5}
                    maxLength={5000}
                    error={
                      notificationErrors[
                        "notification.email.statusUpdateMessage"
                      ]
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title="SMS Notifications"
            description="Configure customer and admin SMS behaviour. International recipient numbers should include the country code."
          >
            <div className="space-y-7">
              <ToggleCard
                id="notification.sms.enabled"
                checked={
                  notificationData.sms
                    .enabled
                }
                onChange={(checked) =>
                  handleNotificationChange(
                    "sms",
                    "enabled",
                    checked
                  )
                }
                label="Enable SMS Notifications"
                description={
                  notificationProviders
                    .sms.configured
                    ? "Use Twilio to deliver transactional SMS messages."
                    : "Twilio environment variables are not configured."
                }
                error={
                  notificationErrors[
                    "notification.sms.enabled"
                  ]
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <ToggleCard
                  id="notification.sms.customerOrderPlaced"
                  checked={
                    notificationData.sms
                      .customerOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "sms",
                      "customerOrderPlaced",
                      checked
                    )
                  }
                  label="Customer Order SMS"
                  description="Send an SMS after a new order is placed."
                />

                <ToggleCard
                  id="notification.sms.adminOrderPlaced"
                  checked={
                    notificationData.sms
                      .adminOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "sms",
                      "adminOrderPlaced",
                      checked
                    )
                  }
                  label="Admin New Order SMS"
                  description="Notify configured admin numbers about new orders."
                />

                <ToggleCard
                  id="notification.sms.customerStatusUpdates"
                  checked={
                    notificationData.sms
                      .customerStatusUpdates
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "sms",
                      "customerStatusUpdates",
                      checked
                    )
                  }
                  label="Customer Status SMS"
                  description="Send SMS messages when enabled order statuses change."
                />
              </div>

              <Field
                label="Admin SMS Recipients"
                description="One international number per line, or separate numbers with commas. Maximum 20."
                error={
                  notificationErrors[
                    "notification.sms.adminRecipients"
                  ]
                }
              >
                <Textarea
                  id="notification.sms.adminRecipients"
                  value={
                    notificationData.sms
                      .adminRecipients
                  }
                  onChange={(event) =>
                    handleNotificationChange(
                      "sms",
                      "adminRecipients",
                      event.target.value
                    )
                  }
                  placeholder="8801814455199"
                  rows={4}
                  maxLength={1000}
                  error={
                    notificationErrors[
                      "notification.sms.adminRecipients"
                    ]
                  }
                />
              </Field>

              <div className="grid gap-7">
                {[
                  [
                    "orderPlacedMessage",
                    "Customer Order SMS Message",
                  ],

                  [
                    "adminOrderPlacedMessage",
                    "Admin New Order SMS Message",
                  ],

                  [
                    "statusUpdateMessage",
                    "Status Update SMS Message",
                  ],
                ].map(
                  ([field, label]) => (
                    <Field
                      key={field}
                      label={label}
                      description={`${notificationData.sms[field].length}/1000 characters`}
                      error={
                        notificationErrors[
                          `notification.sms.${field}`
                        ]
                      }
                    >
                      <Textarea
                        id={`notification.sms.${field}`}
                        value={
                          notificationData.sms[
                            field
                          ]
                        }
                        onChange={(event) =>
                          handleNotificationChange(
                            "sms",
                            field,
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        maxLength={1000}
                        error={
                          notificationErrors[
                            `notification.sms.${field}`
                          ]
                        }
                      />
                    </Field>
                  )
                )}
              </div>
            </div>
          </Section>

          <Section
            title="WhatsApp Notifications"
            description="WhatsApp Cloud API requires approved Meta message templates. Enter only approved template names."
          >
            <div className="space-y-7">
              <ToggleCard
                id="notification.whatsapp.enabled"
                checked={
                  notificationData.whatsapp
                    .enabled
                }
                onChange={(checked) =>
                  handleNotificationChange(
                    "whatsapp",
                    "enabled",
                    checked
                  )
                }
                label="Enable WhatsApp Notifications"
                description={
                  notificationProviders
                    .whatsapp.configured
                    ? "Use Meta WhatsApp Cloud API approved templates."
                    : "WhatsApp Cloud API environment variables are not configured."
                }
                error={
                  notificationErrors[
                    "notification.whatsapp.enabled"
                  ]
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <ToggleCard
                  id="notification.whatsapp.customerOrderPlaced"
                  checked={
                    notificationData
                      .whatsapp
                      .customerOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "whatsapp",
                      "customerOrderPlaced",
                      checked
                    )
                  }
                  label="Customer Order WhatsApp"
                  description="Send the approved order template after checkout."
                />

                <ToggleCard
                  id="notification.whatsapp.adminOrderPlaced"
                  checked={
                    notificationData
                      .whatsapp
                      .adminOrderPlaced
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "whatsapp",
                      "adminOrderPlaced",
                      checked
                    )
                  }
                  label="Admin New Order WhatsApp"
                  description="Notify configured admin WhatsApp recipients."
                />

                <ToggleCard
                  id="notification.whatsapp.customerStatusUpdates"
                  checked={
                    notificationData
                      .whatsapp
                      .customerStatusUpdates
                  }
                  onChange={(checked) =>
                    handleNotificationChange(
                      "whatsapp",
                      "customerStatusUpdates",
                      checked
                    )
                  }
                  label="Customer Status WhatsApp"
                  description="Send the approved status template when order status changes."
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <Field
                  label="Admin WhatsApp Recipients"
                  description="One international number per line, or separate numbers with commas. Maximum 20."
                  error={
                    notificationErrors[
                      "notification.whatsapp.adminRecipients"
                    ]
                  }
                >
                  <Textarea
                    id="notification.whatsapp.adminRecipients"
                    value={
                      notificationData
                        .whatsapp
                        .adminRecipients
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "whatsapp",
                        "adminRecipients",
                        event.target.value
                      )
                    }
                    placeholder="8801814455199"
                    rows={4}
                    maxLength={1000}
                    error={
                      notificationErrors[
                        "notification.whatsapp.adminRecipients"
                      ]
                    }
                  />
                </Field>

                <Field
                  label="Template Language Code"
                  description="Use the exact language configured for the approved Meta templates."
                  error={
                    notificationErrors[
                      "notification.whatsapp.languageCode"
                    ]
                  }
                >
                  <TextInput
                    id="notification.whatsapp.languageCode"
                    value={
                      notificationData
                        .whatsapp
                        .languageCode
                    }
                    onChange={(event) =>
                      handleNotificationChange(
                        "whatsapp",
                        "languageCode",
                        event.target.value
                      )
                    }
                    placeholder="en"
                    maxLength={20}
                    error={
                      notificationErrors[
                        "notification.whatsapp.languageCode"
                      ]
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-7 md:grid-cols-3">
                {[
                  [
                    "orderPlaced",
                    "Customer Order Template",
                    "order_received",
                  ],

                  [
                    "adminOrderPlaced",
                    "Admin New Order Template",
                    "admin_new_order",
                  ],

                  [
                    "statusUpdate",
                    "Status Update Template",
                    "order_status_update",
                  ],
                ].map(
                  ([
                    field,
                    label,
                    placeholder,
                  ]) => (
                    <Field
                      key={field}
                      label={label}
                      description="Lowercase letters, numbers, and underscores only."
                      error={
                        notificationErrors[
                          `notification.whatsapp.templates.${field}`
                        ]
                      }
                    >
                      <TextInput
                        id={`notification.whatsapp.templates.${field}`}
                        value={
                          notificationData
                            .whatsapp
                            .templates[
                            field
                          ]
                        }
                        onChange={(event) =>
                          handleWhatsAppTemplateChange(
                            field,
                            event.target.value
                              .toLowerCase()
                              .replace(
                                /[^a-z0-9_]/g,
                                ""
                              )
                          )
                        }
                        placeholder={
                          placeholder
                        }
                        maxLength={512}
                        error={
                          notificationErrors[
                            `notification.whatsapp.templates.${field}`
                          ]
                        }
                      />
                    </Field>
                  )
                )}
              </div>
            </div>
          </Section>

          <Section
            title="Status Notification Events"
            description="Choose which order status changes should trigger enabled customer notification channels."
          >
            <div
              data-field="notification.statusEvents"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {STATUS_EVENTS.map(
                ({ field, label }) => (
                  <ToggleCard
                    key={field}
                    id={`notification.statusEvents.${field}`}
                    checked={
                      notificationData
                        .statusEvents[
                        field
                      ]
                    }
                    onChange={(
                      checked
                    ) =>
                      handleStatusEventChange(
                        field,
                        checked
                      )
                    }
                    label={label}
                    description={`Send enabled customer notifications when an order becomes ${label.toLowerCase()}.`}
                  />
                )
              )}
            </div>

            {notificationErrors[
              "notification.statusEvents"
            ] ? (
              <p className="mt-3 text-xs leading-5 text-red-400">
                {
                  notificationErrors[
                    "notification.statusEvents"
                  ]
                }
              </p>
            ) : null}
          </Section>

          <Section
            title="Available Template Tokens"
            description="These tokens are replaced automatically with trusted order and store information."
          >
            <div className="flex flex-wrap gap-3">
              {TEMPLATE_TOKENS.map(
                (token) => (
                  <code
                    key={token}
                    className="border border-white/10 bg-black/30 px-4 py-3 text-xs text-neutral-300"
                  >
                    {token}
                  </code>
                )
              )}
            </div>
          </Section>

          <div className="border border-white/10 bg-[#111111] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm text-neutral-300">
                  {hasNotificationUnsavedChanges
                    ? "You have unsaved notification settings changes."
                    : "Your notification settings are up to date."}
                </p>

                {lastNotificationSavedAt ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-600">
                    Last saved{" "}
                    {
                      lastNotificationSavedAt
                    }
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    handleNotificationReset
                  }
                  disabled={
                    isSavingNotifications ||
                    !hasNotificationUnsavedChanges
                  }
                  className="border border-white/20 px-6 py-4 text-xs uppercase tracking-[0.28em] text-[#f1ece4] transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={
                    isSavingNotifications ||
                    !hasNotificationUnsavedChanges
                  }
                  className="bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSavingNotifications
                    ? "Saving Notifications..."
                    : "Save Notification Settings"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}