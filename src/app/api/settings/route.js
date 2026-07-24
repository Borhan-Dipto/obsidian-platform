import {
  requireAdminApiPermission,
} from "../../../lib/adminApiAuthorization";

import {
  getSettings,
  getSettingsCollection,
  mergeSettings,
  serializeSettings,
} from "../../../lib/settings";

export const dynamic =
  "force-dynamic";

function createErrorResponse(
  message,
  status = 500
) {
  return Response.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
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

  for (
    const field
    of allowedFields
  ) {
    if (
      hasOwn(
        source,
        field
      )
    ) {
      result[field] =
        source[field];
    }
  }

  return result;
}

function sanitizeIncomingSettings(
  data
) {
  const sanitizedSettings = {};

  const sections = {
    store: [
      "name",
      "tagline",
      "currency",
    ],

    contact: [
      "whatsappNumber",
      "email",
      "location",
      "phone",
    ],

    social: [
      "facebookUrl",
      "instagramUrl",
      "tiktokUrl",
      "youtubeUrl",
    ],

    delivery: [
      "insideDhaka",
      "outsideDhaka",
      "freeShippingOver",
    ],

    seo: [
      "title",
      "description",
      "keywords",
      "ogImage",
    ],

    payment: [
      "cashOnDelivery",
      "bkash",
      "nagad",
      "rocket",
    ],
  };

  for (
    const [
      section,
      fields,
    ]
    of Object.entries(
      sections
    )
  ) {
    if (
      !hasOwn(
        data,
        section
      )
    ) {
      continue;
    }

    const sanitizedSection =
      copyAllowedFields(
        data[section],
        fields
      );

    if (sanitizedSection) {
      sanitizedSettings[
        section
      ] = sanitizedSection;
    }
  }

  return sanitizedSettings;
}

function validateText(
  value,
  fieldName,
  maximumLength,
  {
    allowEmpty = true,
  } = {}
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return `${fieldName} must be text.`;
  }

  const normalizedValue =
    value.trim();

  if (
    !allowEmpty &&
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

function validateOptionalEmail(
  value,
  fieldName
) {
  const textError =
    validateText(
      value,
      fieldName,
      254
    );

  if (textError) {
    return textError;
  }

  const normalizedValue =
    String(
      value || ""
    ).trim();

  if (!normalizedValue) {
    return null;
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      normalizedValue
    )
  ) {
    return `${fieldName} must be a valid email address.`;
  }

  return null;
}

function validateOptionalUrl(
  value,
  fieldName,
  {
    allowRelative = false,
  } = {}
) {
  const textError =
    validateText(
      value,
      fieldName,
      1000
    );

  if (textError) {
    return textError;
  }

  const normalizedValue =
    String(
      value || ""
    ).trim();

  if (!normalizedValue) {
    return null;
  }

  if (
    allowRelative &&
    normalizedValue.startsWith(
      "/"
    )
  ) {
    return null;
  }

  try {
    const url =
      new URL(
        normalizedValue
      );

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return `${fieldName} must use http or https.`;
    }
  } catch {
    return `${fieldName} must be a valid URL.`;
  }

  return null;
}

function validateDeliveryAmount(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return `${fieldName} must be a valid number.`;
  }

  if (
    numericValue < 0
  ) {
    return `${fieldName} cannot be negative.`;
  }

  if (
    numericValue >
    10000000
  ) {
    return `${fieldName} is too large.`;
  }

  return null;
}

function validateBooleanLike(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value ===
      "boolean" ||
    typeof value ===
      "number" ||
    typeof value ===
      "string"
  ) {
    return null;
  }

  return `${fieldName} must be enabled or disabled.`;
}

function validateSettingsPayload(
  settings
) {
  const errors = [];

  if (settings.store) {
    errors.push(
      validateText(
        settings.store.name,
        "Store name",
        80,
        {
          allowEmpty: false,
        }
      ),

      validateText(
        settings.store.tagline,
        "Store tagline",
        240
      ),

      validateText(
        settings.store.currency,
        "Currency",
        10,
        {
          allowEmpty: false,
        }
      )
    );

    if (
      settings.store
        .currency !==
      undefined
    ) {
      const currency =
        String(
          settings.store
            .currency || ""
        )
          .trim()
          .toUpperCase();

      if (
        currency &&
        !/^[A-Z]{3}$/.test(
          currency
        )
      ) {
        errors.push(
          "Currency must be a three-letter code such as BDT."
        );
      }
    }
  }

  if (settings.contact) {
    errors.push(
      validateText(
        settings.contact
          .whatsappNumber,
        "WhatsApp number",
        30
      ),

      validateOptionalEmail(
        settings.contact.email,
        "Store email"
      ),

      validateText(
        settings.contact
          .location,
        "Store location",
        240
      ),

      validateText(
        settings.contact.phone,
        "Phone number",
        50
      )
    );

    if (
      settings.contact
        .whatsappNumber !==
      undefined
    ) {
      const whatsappDigits =
        String(
          settings.contact
            .whatsappNumber || ""
        ).replace(
          /\D/g,
          ""
        );

      if (
        whatsappDigits &&
        (
          whatsappDigits.length <
            8 ||
          whatsappDigits.length >
            15
        )
      ) {
        errors.push(
          "WhatsApp number must contain between 8 and 15 digits."
        );
      }
    }
  }

  if (settings.social) {
    errors.push(
      validateOptionalUrl(
        settings.social
          .facebookUrl,
        "Facebook URL"
      ),

      validateOptionalUrl(
        settings.social
          .instagramUrl,
        "Instagram URL"
      ),

      validateOptionalUrl(
        settings.social
          .tiktokUrl,
        "TikTok URL"
      ),

      validateOptionalUrl(
        settings.social
          .youtubeUrl,
        "YouTube URL"
      )
    );
  }

  if (settings.delivery) {
    errors.push(
      validateDeliveryAmount(
        settings.delivery
          .insideDhaka,
        "Inside Dhaka delivery charge"
      ),

      validateDeliveryAmount(
        settings.delivery
          .outsideDhaka,
        "Outside Dhaka delivery charge"
      ),

      validateDeliveryAmount(
        settings.delivery
          .freeShippingOver,
        "Free-shipping threshold"
      )
    );
  }

  if (settings.seo) {
    errors.push(
      validateText(
        settings.seo.title,
        "SEO title",
        120
      ),

      validateText(
        settings.seo
          .description,
        "SEO description",
        320
      ),

      validateText(
        settings.seo.keywords,
        "SEO keywords",
        1000
      ),

      validateOptionalUrl(
        settings.seo.ogImage,
        "Open Graph image",
        {
          allowRelative: true,
        }
      )
    );
  }

  if (settings.payment) {
    errors.push(
      validateBooleanLike(
        settings.payment
          .cashOnDelivery,
        "Cash on delivery"
      ),

      validateBooleanLike(
        settings.payment.bkash,
        "bKash"
      ),

      validateBooleanLike(
        settings.payment.nagad,
        "Nagad"
      ),

      validateBooleanLike(
        settings.payment.rocket,
        "Rocket"
      )
    );
  }

  return errors.filter(
    Boolean
  );
}

function hasSupportedChanges(
  settings
) {
  return Object.keys(
    settings
  ).some(
    (section) =>
      isPlainObject(
        settings[section]
      ) &&
      Object.keys(
        settings[section]
      ).length > 0
  );
}

export async function GET() {
  try {
    const settings =
      await getSettings();

    return Response.json({
      success: true,

      settings:
        serializeSettings(
          settings
        ),
    });
  } catch (error) {
    console.error(
      "GET settings error:",
      error
    );

    return createErrorResponse(
      "Failed to load settings."
    );
  }
}

export async function PATCH(
  request
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          settings: [
            "update",
          ],
        },
        {
          path:
            "/api/settings",

          forbiddenMessage:
            "You do not have permission to update store settings.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return createErrorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    if (
      !isPlainObject(
        requestBody
      )
    ) {
      return createErrorResponse(
        "Settings must be a valid object.",
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
        "No supported settings were provided.",
        400
      );
    }

    const validationErrors =
      validateSettingsPayload(
        incomingSettings
      );

    if (
      validationErrors.length >
      0
    ) {
      return createErrorResponse(
        validationErrors[0],
        400
      );
    }

    const existingSettings =
      await getSettings();

    const mergedSettings =
      mergeSettings(
        existingSettings,
        incomingSettings
      );

    const collection =
      await getSettingsCollection();

    const now =
      new Date();

    const settingsToSave = {
      store:
        mergedSettings.store,

      contact:
        mergedSettings.contact,

      social:
        mergedSettings.social,

      delivery:
        mergedSettings.delivery,

      seo:
        mergedSettings.seo,

      payment:
        mergedSettings.payment,

      createdAt:
        existingSettings
          .createdAt ||
        now,

      updatedAt:
        now,
    };

    await collection.updateOne(
      {
        type: "store",
      },
      {
        $set:
          settingsToSave,

        $setOnInsert: {
          type:
            "store",
        },

        $unset: {
          homepage: "",

          storeName: "",
          tagline: "",
          currency: "",

          whatsappNumber: "",
          storeEmail: "",
          storeLocation: "",

          facebookUrl: "",
          instagramUrl: "",

          deliveryChargeInsideDhaka:
            "",

          deliveryChargeOutsideDhaka:
            "",

          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
          ogImage: "",
        },
      },
      {
        upsert: true,
      }
    );

    const updatedSettings =
      await getSettings();

    return Response.json({
      success: true,

      message:
        "Settings updated successfully.",

      settings:
        serializeSettings(
          updatedSettings
        ),
    });
  } catch (error) {
    console.error(
      "PATCH settings error:",
      error
    );

    return createErrorResponse(
      "Failed to update settings."
    );
  }
}

export async function PUT(
  request,
  context
) {
  return PATCH(
    request,
    context
  );
}