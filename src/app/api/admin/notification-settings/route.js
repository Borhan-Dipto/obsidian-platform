import {
  isAdminAuthenticated,
} from "../../../../lib/adminAuth";

import {
  NOTIFIABLE_ORDER_STATUSES,
  NOTIFICATION_SETTINGS_TYPE,
  getNotificationProviderStatus,
  getNotificationSettings,
  getNotificationSettingsCollection,
  mergeNotificationSettings,
  normalizeEmailRecipients,
  normalizePhoneRecipients,
  serializeNotificationSettings,
} from "../../../../lib/notificationSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_SIZE = 100_000;

const EMAIL_FIELDS = [
  "enabled",
  "customerOrderPlaced",
  "adminOrderPlaced",
  "customerStatusUpdates",
  "adminRecipients",
  "replyTo",
  "orderPlacedSubject",
  "orderPlacedMessage",
  "adminOrderPlacedSubject",
  "adminOrderPlacedMessage",
  "statusUpdateSubject",
  "statusUpdateMessage",
];

const SMS_FIELDS = [
  "enabled",
  "customerOrderPlaced",
  "adminOrderPlaced",
  "customerStatusUpdates",
  "adminRecipients",
  "orderPlacedMessage",
  "adminOrderPlacedMessage",
  "statusUpdateMessage",
];

const WHATSAPP_FIELDS = [
  "enabled",
  "customerOrderPlaced",
  "adminOrderPlaced",
  "customerStatusUpdates",
  "adminRecipients",
  "languageCode",
  "templates",
];

const WHATSAPP_TEMPLATE_FIELDS = [
  "orderPlaced",
  "adminOrderPlaced",
  "statusUpdate",
];

function jsonResponse(
  body,
  status = 200
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function createErrorResponse(
  message,
  status = 500
) {
  return jsonResponse(
    {
      success: false,
      message,
    },
    status
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function copyAllowedFields(
  source,
  allowedFields
) {
  if (!isPlainObject(source)) {
    return null;
  }

  const result = {};

  for (const field of allowedFields) {
    if (hasOwn(source, field)) {
      result[field] = source[field];
    }
  }

  return result;
}

async function readJsonBody(request) {
  const contentLength = Number(
    request.headers.get(
      "content-length"
    ) || 0
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_SIZE
  ) {
    throw new Error(
      "REQUEST_TOO_LARGE"
    );
  }

  const rawBody =
    await request.text();

  if (
    rawBody.length >
    MAX_REQUEST_SIZE
  ) {
    throw new Error(
      "REQUEST_TOO_LARGE"
    );
  }

  let body;

  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new Error("INVALID_JSON");
  }

  if (!isPlainObject(body)) {
    throw new Error(
      "INVALID_REQUEST_BODY"
    );
  }

  return body;
}

function sanitizeIncomingSettings(data) {
  const sanitizedSettings = {};

  if (hasOwn(data, "email")) {
    const email = copyAllowedFields(
      data.email,
      EMAIL_FIELDS
    );

    if (email) {
      sanitizedSettings.email = email;
    }
  }

  if (hasOwn(data, "sms")) {
    const sms = copyAllowedFields(
      data.sms,
      SMS_FIELDS
    );

    if (sms) {
      sanitizedSettings.sms = sms;
    }
  }

  if (hasOwn(data, "whatsapp")) {
    const whatsapp =
      copyAllowedFields(
        data.whatsapp,
        WHATSAPP_FIELDS
      );

    if (whatsapp) {
      if (
        hasOwn(
          whatsapp,
          "templates"
        )
      ) {
        const templates =
          copyAllowedFields(
            whatsapp.templates,
            WHATSAPP_TEMPLATE_FIELDS
          );

        whatsapp.templates =
          templates || {};
      }

      sanitizedSettings.whatsapp =
        whatsapp;
    }
  }

  if (hasOwn(data, "statusEvents")) {
    const statusEvents =
      copyAllowedFields(
        data.statusEvents,
        NOTIFIABLE_ORDER_STATUSES
      );

    if (statusEvents) {
      sanitizedSettings.statusEvents =
        statusEvents;
    }
  }

  return sanitizedSettings;
}

function validateBoolean(
  value,
  fieldName
) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "boolean") {
    return `${fieldName} must be enabled or disabled.`;
  }

  return null;
}

function validateText(
  value,
  fieldName,
  maximumLength,
  {
    required = false,
  } = {}
) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be text.`;
  }

  const normalizedValue =
    value.trim();

  if (
    required &&
    !normalizedValue
  ) {
    return `${fieldName} is required.`;
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    return `${fieldName} must not exceed ${maximumLength} characters.`;
  }

  return null;
}

function validateEmailRecipients(
  value,
  fieldName
) {
  if (value === undefined) {
    return null;
  }

  const source = Array.isArray(value)
    ? value
    : String(value || "").split(
        /[\n,;]+/
      );

  if (source.length > 20) {
    return `${fieldName} cannot contain more than 20 recipients.`;
  }

  const normalizedRecipients =
    normalizeEmailRecipients(value);

  const nonEmptyEntries = source
    .map((entry) =>
      String(entry || "").trim()
    )
    .filter(Boolean);

  if (
    normalizedRecipients.length !==
    nonEmptyEntries.length
  ) {
    return `${fieldName} contains an invalid email address.`;
  }

  return null;
}

function validatePhoneRecipients(
  value,
  fieldName
) {
  if (value === undefined) {
    return null;
  }

  const source = Array.isArray(value)
    ? value
    : String(value || "").split(
        /[\n,;]+/
      );

  if (source.length > 20) {
    return `${fieldName} cannot contain more than 20 recipients.`;
  }

  const normalizedRecipients =
    normalizePhoneRecipients(value);

  const nonEmptyEntries = source
    .map((entry) =>
      String(entry || "")
        .replace(/\D/g, "")
    )
    .filter(Boolean);

  if (
    normalizedRecipients.length !==
    new Set(nonEmptyEntries).size
  ) {
    return `${fieldName} contains an invalid phone number.`;
  }

  return null;
}

function validateLanguageCode(
  value
) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return "WhatsApp language code must be text.";
  }

  const languageCode =
    value.trim();

  if (
    !languageCode ||
    !/^[A-Za-z]{2,3}(?:[_-][A-Za-z]{2,4})?$/.test(
      languageCode
    )
  ) {
    return "WhatsApp language code must look like en or en_US.";
  }

  return null;
}

function validateTemplateName(
  value,
  fieldName
) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be text.`;
  }

  const templateName =
    value.trim();

  if (!templateName) {
    return null;
  }

  if (
    templateName.length > 512 ||
    !/^[a-z0-9_]+$/.test(
      templateName
    )
  ) {
    return `${fieldName} may contain only lowercase letters, numbers, and underscores.`;
  }

  return null;
}

function validateEmailSettings(
  email
) {
  if (!email) {
    return [];
  }

  return [
    validateBoolean(
      email.enabled,
      "Email notifications"
    ),

    validateBoolean(
      email.customerOrderPlaced,
      "Customer order email"
    ),

    validateBoolean(
      email.adminOrderPlaced,
      "Admin order email"
    ),

    validateBoolean(
      email.customerStatusUpdates,
      "Customer status email"
    ),

    validateEmailRecipients(
      email.adminRecipients,
      "Email admin recipients"
    ),

    validateEmailRecipients(
      email.replyTo,
      "Reply-to email"
    ),

    validateText(
      email.orderPlacedSubject,
      "Customer order email subject",
      300,
      {
        required: true,
      }
    ),

    validateText(
      email.orderPlacedMessage,
      "Customer order email message",
      5000,
      {
        required: true,
      }
    ),

    validateText(
      email.adminOrderPlacedSubject,
      "Admin order email subject",
      300,
      {
        required: true,
      }
    ),

    validateText(
      email.adminOrderPlacedMessage,
      "Admin order email message",
      5000,
      {
        required: true,
      }
    ),

    validateText(
      email.statusUpdateSubject,
      "Status email subject",
      300,
      {
        required: true,
      }
    ),

    validateText(
      email.statusUpdateMessage,
      "Status email message",
      5000,
      {
        required: true,
      }
    ),
  ].filter(Boolean);
}

function validateSmsSettings(sms) {
  if (!sms) {
    return [];
  }

  return [
    validateBoolean(
      sms.enabled,
      "SMS notifications"
    ),

    validateBoolean(
      sms.customerOrderPlaced,
      "Customer order SMS"
    ),

    validateBoolean(
      sms.adminOrderPlaced,
      "Admin order SMS"
    ),

    validateBoolean(
      sms.customerStatusUpdates,
      "Customer status SMS"
    ),

    validatePhoneRecipients(
      sms.adminRecipients,
      "SMS admin recipients"
    ),

    validateText(
      sms.orderPlacedMessage,
      "Customer order SMS message",
      1000,
      {
        required: true,
      }
    ),

    validateText(
      sms.adminOrderPlacedMessage,
      "Admin order SMS message",
      1000,
      {
        required: true,
      }
    ),

    validateText(
      sms.statusUpdateMessage,
      "Status SMS message",
      1000,
      {
        required: true,
      }
    ),
  ].filter(Boolean);
}

function validateWhatsAppSettings(
  whatsapp
) {
  if (!whatsapp) {
    return [];
  }

  const templates =
    isPlainObject(
      whatsapp.templates
    )
      ? whatsapp.templates
      : {};

  return [
    validateBoolean(
      whatsapp.enabled,
      "WhatsApp notifications"
    ),

    validateBoolean(
      whatsapp.customerOrderPlaced,
      "Customer order WhatsApp"
    ),

    validateBoolean(
      whatsapp.adminOrderPlaced,
      "Admin order WhatsApp"
    ),

    validateBoolean(
      whatsapp.customerStatusUpdates,
      "Customer status WhatsApp"
    ),

    validatePhoneRecipients(
      whatsapp.adminRecipients,
      "WhatsApp admin recipients"
    ),

    validateLanguageCode(
      whatsapp.languageCode
    ),

    validateTemplateName(
      templates.orderPlaced,
      "WhatsApp order template"
    ),

    validateTemplateName(
      templates.adminOrderPlaced,
      "WhatsApp admin template"
    ),

    validateTemplateName(
      templates.statusUpdate,
      "WhatsApp status template"
    ),
  ].filter(Boolean);
}

function validateStatusEvents(
  statusEvents
) {
  if (!statusEvents) {
    return [];
  }

  return NOTIFIABLE_ORDER_STATUSES
    .map((status) =>
      validateBoolean(
        statusEvents[status],
        `${status} status notification`
      )
    )
    .filter(Boolean);
}

function validateSettingsPayload(
  settings
) {
  return [
    ...validateEmailSettings(
      settings.email
    ),

    ...validateSmsSettings(
      settings.sms
    ),

    ...validateWhatsAppSettings(
      settings.whatsapp
    ),

    ...validateStatusEvents(
      settings.statusEvents
    ),
  ];
}

function hasSupportedChanges(
  settings
) {
  return Object.values(
    settings
  ).some(
    (section) =>
      isPlainObject(section) &&
      Object.keys(section).length > 0
  );
}

export async function GET() {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return createErrorResponse(
        "Admin authentication required.",
        401
      );
    }

    const settings =
      await getNotificationSettings();

    return jsonResponse({
      success: true,

      settings:
        serializeNotificationSettings(
          settings
        ),

      providers:
        getNotificationProviderStatus(),
    });
  } catch (error) {
    console.error(
      "GET notification settings error:",
      error
    );

    return createErrorResponse(
      "Failed to load notification settings."
    );
  }
}

export async function PATCH(request) {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return createErrorResponse(
        "Admin authentication required.",
        401
      );
    }

    let requestBody;

    try {
      requestBody =
        await readJsonBody(request);
    } catch (error) {
      if (
        error.message ===
        "REQUEST_TOO_LARGE"
      ) {
        return createErrorResponse(
          "Request body is too large.",
          413
        );
      }

      return createErrorResponse(
        "A valid JSON request body is required.",
        400
      );
    }

    const incomingSettings =
      sanitizeIncomingSettings(
        requestBody
      );

    if (
      !hasSupportedChanges(
        incomingSettings
      )
    ) {
      return createErrorResponse(
        "No supported notification settings were provided.",
        400
      );
    }

    const validationErrors =
      validateSettingsPayload(
        incomingSettings
      );

    if (
      validationErrors.length > 0
    ) {
      return createErrorResponse(
        validationErrors[0],
        400
      );
    }

    const existingSettings =
      await getNotificationSettings();

    const mergedSettings =
      mergeNotificationSettings(
        existingSettings,
        incomingSettings
      );

    const collection =
      await getNotificationSettingsCollection();

    const now = new Date();

    await collection.updateOne(
      {
        type:
          NOTIFICATION_SETTINGS_TYPE,
      },
      {
        $set: {
          email:
            mergedSettings.email,

          sms:
            mergedSettings.sms,

          whatsapp:
            mergedSettings.whatsapp,

          statusEvents:
            mergedSettings.statusEvents,

          createdAt:
            existingSettings.createdAt ||
            now,

          updatedAt: now,
        },

        $setOnInsert: {
          type:
            NOTIFICATION_SETTINGS_TYPE,
        },
      },
      {
        upsert: true,
      }
    );

    const updatedSettings =
      await getNotificationSettings();

    return jsonResponse({
      success: true,

      message:
        "Notification settings updated successfully.",

      settings:
        serializeNotificationSettings(
          updatedSettings
        ),

      providers:
        getNotificationProviderStatus(),
    });
  } catch (error) {
    console.error(
      "PATCH notification settings error:",
      error
    );

    return createErrorResponse(
      "Failed to update notification settings."
    );
  }
}

export const PUT = PATCH;