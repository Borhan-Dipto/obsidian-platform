import "server-only";

import clientPromise from "./mongodb";

export const NOTIFICATION_SETTINGS_COLLECTION_NAME =
  "notification_settings";

export const NOTIFICATION_SETTINGS_TYPE =
  "order-notifications";

export const NOTIFIABLE_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const NOTIFICATION_TEMPLATE_TOKENS = [
  "{{storeName}}",
  "{{customerName}}",
  "{{orderId}}",
  "{{status}}",
  "{{total}}",
  "{{currency}}",
  "{{trackingUrl}}",
];

export const DEFAULT_NOTIFICATION_SETTINGS = {
  type: NOTIFICATION_SETTINGS_TYPE,

  email: {
    enabled: false,

    customerOrderPlaced: true,
    adminOrderPlaced: true,
    customerStatusUpdates: true,

    adminRecipients: [],
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

    adminRecipients: [],

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

    adminRecipients: [],

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

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null
  );
}

function normalizeOptionalText(
  value,
  maximumLength = 5000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function normalizeText(
  value,
  fallback = "",
  maximumLength = 5000
) {
  const normalizedValue =
    normalizeOptionalText(
      value,
      maximumLength
    );

  return normalizedValue || fallback;
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

function normalizeListInput(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      String(entry ?? "").split(
        /[\n,;]+/
      )
    );
  }

  return String(value ?? "").split(
    /[\n,;]+/
  );
}

export function normalizeEmailRecipients(
  value
) {
  const uniqueEmails = new Set();

  for (const entry of normalizeListInput(
    value
  )) {
    const email = String(entry || "")
      .trim()
      .toLowerCase()
      .slice(0, 254);

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      continue;
    }

    uniqueEmails.add(email);

    if (uniqueEmails.size >= 20) {
      break;
    }
  }

  return Array.from(uniqueEmails);
}

export function normalizePhoneRecipients(
  value
) {
  const uniqueNumbers = new Set();

  for (const entry of normalizeListInput(
    value
  )) {
    const phone = String(entry || "")
      .replace(/\D/g, "")
      .slice(0, 15);

    if (
      phone.length < 8 ||
      phone.length > 15
    ) {
      continue;
    }

    uniqueNumbers.add(phone);

    if (uniqueNumbers.size >= 20) {
      break;
    }
  }

  return Array.from(uniqueNumbers);
}

function normalizeLanguageCode(
  value,
  fallback = "en"
) {
  const languageCode =
    normalizeOptionalText(value, 20);

  if (
    !languageCode ||
    !/^[A-Za-z]{2,3}(?:[_-][A-Za-z]{2,4})?$/.test(
      languageCode
    )
  ) {
    return fallback;
  }

  return languageCode;
}

function normalizeTemplateName(value) {
  const templateName =
    normalizeOptionalText(
      value,
      512
    ).toLowerCase();

  if (
    !templateName ||
    !/^[a-z0-9_]+$/.test(
      templateName
    )
  ) {
    return "";
  }

  return templateName;
}

function normalizeStatusEvents(value) {
  const source = isPlainObject(value)
    ? value
    : {};

  return Object.fromEntries(
    NOTIFIABLE_ORDER_STATUSES.map(
      (status) => [
        status,

        normalizeBoolean(
          source[status],
          DEFAULT_NOTIFICATION_SETTINGS
            .statusEvents[status]
        ),
      ]
    )
  );
}

function cloneDefaultEmailSettings() {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS.email,

    adminRecipients: [
      ...DEFAULT_NOTIFICATION_SETTINGS
        .email.adminRecipients,
    ],
  };
}

function cloneDefaultSmsSettings() {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS.sms,

    adminRecipients: [
      ...DEFAULT_NOTIFICATION_SETTINGS
        .sms.adminRecipients,
    ],
  };
}

function cloneDefaultWhatsAppSettings() {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS
      .whatsapp,

    adminRecipients: [
      ...DEFAULT_NOTIFICATION_SETTINGS
        .whatsapp.adminRecipients,
    ],

    templates: {
      ...DEFAULT_NOTIFICATION_SETTINGS
        .whatsapp.templates,
    },
  };
}

export function createDefaultNotificationSettingsDocument(
  now = new Date()
) {
  return {
    type: NOTIFICATION_SETTINGS_TYPE,

    email:
      cloneDefaultEmailSettings(),

    sms: cloneDefaultSmsSettings(),

    whatsapp:
      cloneDefaultWhatsAppSettings(),

    statusEvents: {
      ...DEFAULT_NOTIFICATION_SETTINGS
        .statusEvents,
    },

    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeNotificationSettings(
  data = {}
) {
  const source = isPlainObject(data)
    ? data
    : {};

  const email = isPlainObject(
    source.email
  )
    ? source.email
    : {};

  const sms = isPlainObject(source.sms)
    ? source.sms
    : {};

  const whatsapp = isPlainObject(
    source.whatsapp
  )
    ? source.whatsapp
    : {};

  const whatsappTemplates =
    isPlainObject(whatsapp.templates)
      ? whatsapp.templates
      : {};

  return {
    type: NOTIFICATION_SETTINGS_TYPE,

    email: {
      enabled: normalizeBoolean(
        email.enabled,
        DEFAULT_NOTIFICATION_SETTINGS.email
          .enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          email.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          email.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          email.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .email.customerStatusUpdates
        ),

      adminRecipients:
        normalizeEmailRecipients(
          email.adminRecipients
        ),

      replyTo:
        normalizeEmailRecipients(
          email.replyTo
        )[0] || "",

      orderPlacedSubject: normalizeText(
        email.orderPlacedSubject,
        DEFAULT_NOTIFICATION_SETTINGS.email
          .orderPlacedSubject,
        300
      ),

      orderPlacedMessage: normalizeText(
        email.orderPlacedMessage,
        DEFAULT_NOTIFICATION_SETTINGS.email
          .orderPlacedMessage,
        5000
      ),

      adminOrderPlacedSubject:
        normalizeText(
          email.adminOrderPlacedSubject,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .adminOrderPlacedSubject,
          300
        ),

      adminOrderPlacedMessage:
        normalizeText(
          email.adminOrderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS
            .email
            .adminOrderPlacedMessage,
          5000
        ),

      statusUpdateSubject: normalizeText(
        email.statusUpdateSubject,
        DEFAULT_NOTIFICATION_SETTINGS.email
          .statusUpdateSubject,
        300
      ),

      statusUpdateMessage: normalizeText(
        email.statusUpdateMessage,
        DEFAULT_NOTIFICATION_SETTINGS.email
          .statusUpdateMessage,
        5000
      ),
    },

    sms: {
      enabled: normalizeBoolean(
        sms.enabled,
        DEFAULT_NOTIFICATION_SETTINGS.sms
          .enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          sms.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          sms.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          sms.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .sms.customerStatusUpdates
        ),

      adminRecipients:
        normalizePhoneRecipients(
          sms.adminRecipients
        ),

      orderPlacedMessage: normalizeText(
        sms.orderPlacedMessage,
        DEFAULT_NOTIFICATION_SETTINGS.sms
          .orderPlacedMessage,
        1000
      ),

      adminOrderPlacedMessage:
        normalizeText(
          sms.adminOrderPlacedMessage,
          DEFAULT_NOTIFICATION_SETTINGS.sms
            .adminOrderPlacedMessage,
          1000
        ),

      statusUpdateMessage: normalizeText(
        sms.statusUpdateMessage,
        DEFAULT_NOTIFICATION_SETTINGS.sms
          .statusUpdateMessage,
        1000
      ),
    },

    whatsapp: {
      enabled: normalizeBoolean(
        whatsapp.enabled,
        DEFAULT_NOTIFICATION_SETTINGS
          .whatsapp.enabled
      ),

      customerOrderPlaced:
        normalizeBoolean(
          whatsapp.customerOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp
            .customerOrderPlaced
        ),

      adminOrderPlaced:
        normalizeBoolean(
          whatsapp.adminOrderPlaced,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp.adminOrderPlaced
        ),

      customerStatusUpdates:
        normalizeBoolean(
          whatsapp.customerStatusUpdates,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp
            .customerStatusUpdates
        ),

      adminRecipients:
        normalizePhoneRecipients(
          whatsapp.adminRecipients
        ),

      languageCode:
        normalizeLanguageCode(
          whatsapp.languageCode,
          DEFAULT_NOTIFICATION_SETTINGS
            .whatsapp.languageCode
        ),

      templates: {
        orderPlaced:
          normalizeTemplateName(
            whatsappTemplates.orderPlaced
          ),

        adminOrderPlaced:
          normalizeTemplateName(
            whatsappTemplates
              .adminOrderPlaced
          ),

        statusUpdate:
          normalizeTemplateName(
            whatsappTemplates.statusUpdate
          ),
      },
    },

    statusEvents: normalizeStatusEvents(
      source.statusEvents
    ),

    createdAt:
      firstDefined(
        source.createdAt,
        null
      ),

    updatedAt:
      firstDefined(
        source.updatedAt,
        null
      ),
  };
}

export function mergeNotificationSettings(
  existingSettings = {},
  incomingSettings = {}
) {
  const currentSettings =
    normalizeNotificationSettings(
      existingSettings
    );

  const incoming = isPlainObject(
    incomingSettings
  )
    ? incomingSettings
    : {};

  const incomingEmail = isPlainObject(
    incoming.email
  )
    ? incoming.email
    : {};

  const incomingSms = isPlainObject(
    incoming.sms
  )
    ? incoming.sms
    : {};

  const incomingWhatsApp =
    isPlainObject(incoming.whatsapp)
      ? incoming.whatsapp
      : {};

  const incomingTemplates =
    isPlainObject(
      incomingWhatsApp.templates
    )
      ? incomingWhatsApp.templates
      : {};

  const incomingStatusEvents =
    isPlainObject(
      incoming.statusEvents
    )
      ? incoming.statusEvents
      : {};

  return normalizeNotificationSettings({
    ...currentSettings,
    ...incoming,

    email: {
      ...currentSettings.email,
      ...incomingEmail,
    },

    sms: {
      ...currentSettings.sms,
      ...incomingSms,
    },

    whatsapp: {
      ...currentSettings.whatsapp,
      ...incomingWhatsApp,

      templates: {
        ...currentSettings.whatsapp
          .templates,
        ...incomingTemplates,
      },
    },

    statusEvents: {
      ...currentSettings.statusEvents,
      ...incomingStatusEvents,
    },

    createdAt:
      incoming.createdAt ||
      currentSettings.createdAt,

    updatedAt:
      incoming.updatedAt ||
      currentSettings.updatedAt,
  });
}

export function serializeNotificationSettings(
  settings
) {
  return JSON.parse(
    JSON.stringify(
      normalizeNotificationSettings(
        settings
      )
    )
  );
}

export function getNotificationProviderStatus() {
  return {
    email: {
      provider: "resend",

      configured: Boolean(
        process.env.RESEND_API_KEY &&
          process.env
            .NOTIFICATION_EMAIL_FROM
      ),
    },

    sms: {
      provider: "twilio",

      configured: Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          (
            process.env
              .TWILIO_MESSAGING_SERVICE_SID ||
            process.env.TWILIO_SMS_FROM
          )
      ),
    },

    whatsapp: {
      provider:
        "whatsapp-cloud-api",

      configured: Boolean(
        process.env
          .WHATSAPP_PHONE_NUMBER_ID &&
          process.env
            .WHATSAPP_ACCESS_TOKEN &&
          process.env
            .WHATSAPP_API_VERSION
      ),
    },
  };
}

export async function getNotificationSettingsCollection() {
  const client = await clientPromise;

  const database = client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );

  return database.collection(
    NOTIFICATION_SETTINGS_COLLECTION_NAME
  );
}

export async function getNotificationSettings() {
  const collection =
    await getNotificationSettingsCollection();

  let settings =
    await collection.findOne({
      type: NOTIFICATION_SETTINGS_TYPE,
    });

  if (!settings) {
    const defaultDocument =
      createDefaultNotificationSettingsDocument();

    await collection.updateOne(
      {
        type: NOTIFICATION_SETTINGS_TYPE,
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
        type: NOTIFICATION_SETTINGS_TYPE,
      })) || defaultDocument;
  }

  return normalizeNotificationSettings(
    settings
  );
}