"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ImageUploader from "./ImageUploader";

const DEFAULT_SETTINGS = {
  store: {
    name: "OBSIDIAN",
    tagline: "Built under pressure. Finished with precision.",
    currency: "BDT",
  },

  contact: {
    whatsappNumber: "8801814455199",
    email: "hello@obsidianwear.com",
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

  createdAt: null,
  updatedAt: null,
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

function normalizeText(value, fallback = "") {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || fallback;
}

function normalizeOptionalText(value) {
  return String(value ?? "").trim();
}

function normalizeNumberString(value, fallback = "0") {
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

  return String(Math.max(0, numericValue));
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

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

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((keyword) => String(keyword || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return normalizeOptionalText(value);
}

function normalizeSettings(settings = {}) {
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
        DEFAULT_SETTINGS.contact.whatsappNumber
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

      instagramUrl: normalizeOptionalText(
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
      insideDhaka: normalizeNumberString(
        settings.delivery?.insideDhaka,
        DEFAULT_SETTINGS.delivery.insideDhaka
      ),

      outsideDhaka: normalizeNumberString(
        settings.delivery?.outsideDhaka,
        DEFAULT_SETTINGS.delivery.outsideDhaka
      ),

      freeShippingOver: normalizeNumberString(
        settings.delivery?.freeShippingOver,
        DEFAULT_SETTINGS.delivery.freeShippingOver
      ),
    },

    seo: {
      title: normalizeText(
        settings.seo?.title,
        DEFAULT_SETTINGS.seo.title
      ),

      description: normalizeText(
        settings.seo?.description,
        DEFAULT_SETTINGS.seo.description
      ),

      keywords:
        normalizeKeywords(settings.seo?.keywords) ||
        DEFAULT_SETTINGS.seo.keywords,

      ogImage: normalizeText(
        settings.seo?.ogImage,
        DEFAULT_SETTINGS.seo.ogImage
      ),
    },

    payment: {
      cashOnDelivery: normalizeBoolean(
        settings.payment?.cashOnDelivery,
        DEFAULT_SETTINGS.payment.cashOnDelivery
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

    createdAt: settings.createdAt || null,
    updatedAt: settings.updatedAt || null,
  };
}

function createPayload(formData) {
  return {
    store: {
      name: formData.store.name.trim(),
      tagline: formData.store.tagline.trim(),
      currency: formData.store.currency
        .trim()
        .toUpperCase(),
    },

    contact: {
      whatsappNumber:
        formData.contact.whatsappNumber.replace(/\D/g, ""),

      email: formData.contact.email.trim(),
      location: formData.contact.location.trim(),
      phone: formData.contact.phone.trim(),
    },

    social: {
      facebookUrl: formData.social.facebookUrl.trim(),
      instagramUrl:
        formData.social.instagramUrl.trim(),
      tiktokUrl: formData.social.tiktokUrl.trim(),
      youtubeUrl: formData.social.youtubeUrl.trim(),
    },

    delivery: {
      insideDhaka: Number(
        formData.delivery.insideDhaka || 0
      ),

      outsideDhaka: Number(
        formData.delivery.outsideDhaka || 0
      ),

      freeShippingOver: Number(
        formData.delivery.freeShippingOver || 0
      ),
    },

    seo: {
      title: formData.seo.title.trim(),
      description: formData.seo.description.trim(),
      keywords: formData.seo.keywords.trim(),
      ogImage: formData.seo.ogImage.trim(),
    },

    payment: {
      cashOnDelivery: Boolean(
        formData.payment.cashOnDelivery
      ),

      bkash: Boolean(formData.payment.bkash),
      nagad: Boolean(formData.payment.nagad),
      rocket: Boolean(formData.payment.rocket),
    },
  };
}

function createComparableValue(formData) {
  return JSON.stringify(createPayload(formData));
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value, allowRelative = false) {
  if (!value) {
    return true;
  }

  if (allowRelative && value.startsWith("/")) {
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

function validateForm(formData) {
  const errors = {};

  const storeName = formData.store.name.trim();

  if (!storeName) {
    errors["store.name"] = "Store name is required.";
  } else if (storeName.length > 80) {
    errors["store.name"] =
      "Store name must not exceed 80 characters.";
  }

  if (formData.store.tagline.trim().length > 240) {
    errors["store.tagline"] =
      "Store tagline must not exceed 240 characters.";
  }

  const currency = formData.store.currency
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors["store.currency"] =
      "Use a three-letter currency code such as BDT.";
  }

  const whatsappDigits =
    formData.contact.whatsappNumber.replace(/\D/g, "");

  if (
    whatsappDigits &&
    (
      whatsappDigits.length < 8 ||
      whatsappDigits.length > 15
    )
  ) {
    errors["contact.whatsappNumber"] =
      "WhatsApp number must contain 8 to 15 digits.";
  }

  const email = formData.contact.email.trim();

  if (!isValidEmail(email)) {
    errors["contact.email"] =
      "Enter a valid email address.";
  }

  if (formData.contact.location.trim().length > 240) {
    errors["contact.location"] =
      "Store location must not exceed 240 characters.";
  }

  if (formData.contact.phone.trim().length > 50) {
    errors["contact.phone"] =
      "Phone number must not exceed 50 characters.";
  }

  const socialFields = [
    ["facebookUrl", "Facebook"],
    ["instagramUrl", "Instagram"],
    ["tiktokUrl", "TikTok"],
    ["youtubeUrl", "YouTube"],
  ];

  for (const [field, label] of socialFields) {
    const value = formData.social[field].trim();

    if (!isValidUrl(value)) {
      errors[`social.${field}`] =
        `${label} URL must begin with http:// or https://.`;
    }
  }

  const deliveryFields = [
    ["insideDhaka", "Inside Dhaka delivery charge"],
    ["outsideDhaka", "Outside Dhaka delivery charge"],
    ["freeShippingOver", "Free-shipping threshold"],
  ];

  for (const [field, label] of deliveryFields) {
    const value = formData.delivery[field];

    if (!validateDeliveryValue(value)) {
      errors[`delivery.${field}`] =
        `${label} must be a valid non-negative number.`;
    }
  }

  const seoTitle = formData.seo.title.trim();

  if (!seoTitle) {
    errors["seo.title"] =
      "Global SEO title is required.";
  } else if (seoTitle.length > 120) {
    errors["seo.title"] =
      "SEO title must not exceed 120 characters.";
  }

  const seoDescription =
    formData.seo.description.trim();

  if (!seoDescription) {
    errors["seo.description"] =
      "Global SEO description is required.";
  } else if (seoDescription.length > 320) {
    errors["seo.description"] =
      "SEO description must not exceed 320 characters.";
  }

  if (formData.seo.keywords.trim().length > 1000) {
    errors["seo.keywords"] =
      "SEO keywords must not exceed 1000 characters.";
  }

  const ogImage = formData.seo.ogImage.trim();

  if (!isValidUrl(ogImage, true)) {
    errors["seo.ogImage"] =
      "Use an uploaded image path or a valid http/https URL.";
  }

  return errors;
}

function formatSavedDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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
        styles[status.type] || styles.info
      }`}
    >
      {status.message}
    </div>
  );
}

export default function SettingsEditor({
  initialSettings,
}) {
  const normalizedInitialSettings = useMemo(
    () => normalizeSettings(initialSettings),
    [initialSettings]
  );

  const [formData, setFormData] = useState(
    normalizedInitialSettings
  );

  const [savedData, setSavedData] = useState(
    normalizedInitialSettings
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return (
      createComparableValue(formData) !==
      createComparableValue(savedData)
    );
  }, [formData, savedData]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }

    function handleBeforeUnload(event) {
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

  function clearFieldError(section, field) {
    const errorKey = `${section}.${field}`;

    setFieldErrors((currentErrors) => {
      if (!currentErrors[errorKey]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[errorKey];

      return nextErrors;
    });
  }

  function handleChange(section, field, value) {
    setFormData((currentData) => ({
      ...currentData,

      [section]: {
        ...currentData[section],
        [field]: value,
      },
    }));

    clearFieldError(section, field);

    if (status?.type === "success") {
      setStatus(null);
    }
  }

  function handlePaymentChange(field, checked) {
    handleChange("payment", field, checked);
  }

  function focusFirstInvalidField(errors) {
    const firstErrorKey = Object.keys(errors)[0];

    if (!firstErrorKey) {
      return;
    }

    window.requestAnimationFrame(() => {
      const field = document.querySelector(
        `[data-field="${firstErrorKey}"]`
      );

      field?.focus();
      field?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function handleReset() {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "Discard all unsaved settings changes?"
      )
    ) {
      return;
    }

    setFormData(savedData);
    setFieldErrors({});
    setStatus({
      type: "info",
      message:
        "Unsaved changes were discarded.",
    });
  }

  function handleBackClick(event) {
    if (!hasUnsavedChanges) {
      return;
    }

    const confirmed = window.confirm(
      "You have unsaved settings changes. Leave this page without saving?"
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      setStatus({
        type: "error",
        message:
          "Please correct the highlighted fields before saving.",
      });

      focusFirstInvalidField(validationErrors);
      return;
    }

    setIsSaving(true);
    setStatus({
      type: "info",
      message: "Saving settings...",
    });

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(
          createPayload(formData)
        ),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        if (response.status === 401) {
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
            "Settings could not be saved.",
        });

        return;
      }

      const normalizedSavedSettings =
        normalizeSettings(data.settings);

      setFormData(normalizedSavedSettings);
      setSavedData(normalizedSavedSettings);
      setFieldErrors({});

      setStatus({
        type: "success",
        message:
          data.message ||
          "Settings saved successfully.",
      });
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setStatus({
        type: "error",
        message:
          "Something went wrong while saving settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const lastSavedAt = formatSavedDate(
    savedData.updatedAt
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
                Manage the store identity, contact
                information, delivery charges, global SEO,
                social links, and payment availability.
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

            {lastSavedAt ? (
              <span className="text-neutral-600">
                Last saved {lastSavedAt}
              </span>
            ) : null}
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-8"
        >
          <StatusMessage status={status} />

          <Section
            title="Store Identity"
            description="Core brand information used across the storefront, checkout, navigation, footer, and system-generated customer content."
          >
            <div className="grid gap-7 md:grid-cols-2">
              <Field
                label="Store Name"
                description="The public name of the brand."
                required
                error={fieldErrors["store.name"]}
              >
                <TextInput
                  id="store.name"
                  value={formData.store.name}
                  onChange={(event) =>
                    handleChange(
                      "store",
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="OBSIDIAN"
                  maxLength={80}
                  error={fieldErrors["store.name"]}
                />
              </Field>

              <Field
                label="Currency"
                description="Three-letter currency code used for pricing."
                required
                error={fieldErrors["store.currency"]}
              >
                <TextInput
                  id="store.currency"
                  value={formData.store.currency}
                  onChange={(event) =>
                    handleChange(
                      "store",
                      "currency",
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, "")
                        .slice(0, 3)
                    )
                  }
                  placeholder="BDT"
                  maxLength={3}
                  error={
                    fieldErrors["store.currency"]
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Brand Tagline"
                  description="The main brand statement used as a store-wide fallback."
                  error={fieldErrors["store.tagline"]}
                >
                  <TextInput
                    id="store.tagline"
                    value={formData.store.tagline}
                    onChange={(event) =>
                      handleChange(
                        "store",
                        "tagline",
                        event.target.value
                      )
                    }
                    placeholder="Built under pressure. Finished with precision."
                    maxLength={240}
                    error={
                      fieldErrors["store.tagline"]
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
                    formData.contact.whatsappNumber
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
                error={fieldErrors["contact.phone"]}
              >
                <TextInput
                  id="contact.phone"
                  value={formData.contact.phone}
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
                    fieldErrors["contact.phone"]
                  }
                />
              </Field>

              <Field
                label="Store Email"
                description="Public customer-support or business email address."
                error={fieldErrors["contact.email"]}
              >
                <TextInput
                  id="contact.email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(event) =>
                    handleChange(
                      "contact",
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="hello@obsidianwear.com"
                  maxLength={254}
                  error={
                    fieldErrors["contact.email"]
                  }
                />
              </Field>

              <Field
                label="Store Location"
                description="Short public location or business address."
                error={
                  fieldErrors["contact.location"]
                }
              >
                <TextInput
                  id="contact.location"
                  value={formData.contact.location}
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
                    fieldErrors["contact.location"]
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
              <Field
                label="Facebook URL"
                error={
                  fieldErrors["social.facebookUrl"]
                }
              >
                <TextInput
                  id="social.facebookUrl"
                  type="url"
                  value={formData.social.facebookUrl}
                  onChange={(event) =>
                    handleChange(
                      "social",
                      "facebookUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://facebook.com/..."
                  maxLength={1000}
                  error={
                    fieldErrors["social.facebookUrl"]
                  }
                />
              </Field>

              <Field
                label="Instagram URL"
                error={
                  fieldErrors["social.instagramUrl"]
                }
              >
                <TextInput
                  id="social.instagramUrl"
                  type="url"
                  value={formData.social.instagramUrl}
                  onChange={(event) =>
                    handleChange(
                      "social",
                      "instagramUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://instagram.com/..."
                  maxLength={1000}
                  error={
                    fieldErrors["social.instagramUrl"]
                  }
                />
              </Field>

              <Field
                label="TikTok URL"
                error={
                  fieldErrors["social.tiktokUrl"]
                }
              >
                <TextInput
                  id="social.tiktokUrl"
                  type="url"
                  value={formData.social.tiktokUrl}
                  onChange={(event) =>
                    handleChange(
                      "social",
                      "tiktokUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://tiktok.com/@..."
                  maxLength={1000}
                  error={
                    fieldErrors["social.tiktokUrl"]
                  }
                />
              </Field>

              <Field
                label="YouTube URL"
                error={
                  fieldErrors["social.youtubeUrl"]
                }
              >
                <TextInput
                  id="social.youtubeUrl"
                  type="url"
                  value={formData.social.youtubeUrl}
                  onChange={(event) =>
                    handleChange(
                      "social",
                      "youtubeUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://youtube.com/@..."
                  maxLength={1000}
                  error={
                    fieldErrors["social.youtubeUrl"]
                  }
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Delivery Rules"
            description="Delivery charges used during checkout and coupon calculation. Enter zero to make a delivery option free."
          >
            <div className="grid gap-7 md:grid-cols-3">
              <Field
                label="Inside Dhaka"
                description="Standard delivery charge inside Dhaka."
                error={
                  fieldErrors[
                    "delivery.insideDhaka"
                  ]
                }
              >
                <TextInput
                  id="delivery.insideDhaka"
                  type="number"
                  value={
                    formData.delivery.insideDhaka
                  }
                  onChange={(event) =>
                    handleChange(
                      "delivery",
                      "insideDhaka",
                      event.target.value
                    )
                  }
                  placeholder="80"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  error={
                    fieldErrors[
                      "delivery.insideDhaka"
                    ]
                  }
                />
              </Field>

              <Field
                label="Outside Dhaka"
                description="Standard delivery charge outside Dhaka."
                error={
                  fieldErrors[
                    "delivery.outsideDhaka"
                  ]
                }
              >
                <TextInput
                  id="delivery.outsideDhaka"
                  type="number"
                  value={
                    formData.delivery.outsideDhaka
                  }
                  onChange={(event) =>
                    handleChange(
                      "delivery",
                      "outsideDhaka",
                      event.target.value
                    )
                  }
                  placeholder="130"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  error={
                    fieldErrors[
                      "delivery.outsideDhaka"
                    ]
                  }
                />
              </Field>

              <Field
                label="Free Shipping Over"
                description="Order subtotal required for free shipping. Use zero to disable it."
                error={
                  fieldErrors[
                    "delivery.freeShippingOver"
                  ]
                }
              >
                <TextInput
                  id="delivery.freeShippingOver"
                  type="number"
                  value={
                    formData.delivery
                      .freeShippingOver
                  }
                  onChange={(event) =>
                    handleChange(
                      "delivery",
                      "freeShippingOver",
                      event.target.value
                    )
                  }
                  placeholder="0"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  error={
                    fieldErrors[
                      "delivery.freeShippingOver"
                    ]
                  }
                />
              </Field>
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
                error={fieldErrors["seo.title"]}
              >
                <TextInput
                  id="seo.title"
                  value={formData.seo.title}
                  onChange={(event) =>
                    handleChange(
                      "seo",
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="OBSIDIAN | Premium Menswear Bangladesh"
                  maxLength={120}
                  error={fieldErrors["seo.title"]}
                />
              </Field>

              <Field
                label="Global SEO Description"
                description={`${formData.seo.description.length}/320 characters`}
                required
                error={
                  fieldErrors["seo.description"]
                }
              >
                <Textarea
                  id="seo.description"
                  value={formData.seo.description}
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
                    fieldErrors["seo.description"]
                  }
                />
              </Field>

              <Field
                label="SEO Keywords"
                description="Comma-separated global keywords. Page-specific SEO can override these where necessary."
                error={
                  fieldErrors["seo.keywords"]
                }
              >
                <Textarea
                  id="seo.keywords"
                  value={formData.seo.keywords}
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
                    fieldErrors["seo.keywords"]
                  }
                />
              </Field>

              <Field
                label="Open Graph Image"
                description="Default social-sharing image. Recommended size: 1200 × 630 pixels."
                error={
                  fieldErrors["seo.ogImage"]
                }
              >
                <TextInput
                  id="seo.ogImage"
                  value={formData.seo.ogImage}
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
                    fieldErrors["seo.ogImage"]
                  }
                />

                <div className="mt-5 border-t border-white/10 pt-5 [&>div>label]:hidden">
                  <ImageUploader
                    value={formData.seo.ogImage}
                    onChange={(imageUrl) =>
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
            description="Control which payment methods are enabled in the store configuration. Checkout integration can use these settings when each payment flow is activated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {PAYMENT_METHODS.map(
                ({
                  field,
                  label,
                  description,
                }) => (
                  <label
                    key={field}
                    className={`flex cursor-pointer items-start gap-4 border p-5 transition ${
                      formData.payment[field]
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        formData.payment[field]
                      }
                      onChange={(event) =>
                        handlePaymentChange(
                          field,
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-[#f1ece4]"
                    />

                    <span>
                      <span className="block text-sm text-[#f1ece4]">
                        {label}
                      </span>

                      <span className="mt-2 block text-xs leading-5 text-neutral-500">
                        {description}
                      </span>
                    </span>
                  </label>
                )
              )}
            </div>
          </Section>

          <div className="border border-white/10 bg-[#111111] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm text-neutral-300">
                  {hasUnsavedChanges
                    ? "You have unsaved settings changes."
                    : "Your settings are up to date."}
                </p>

                {lastSavedAt ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-600">
                    Last saved {lastSavedAt}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={
                    isSaving ||
                    !hasUnsavedChanges
                  }
                  className="border border-white/20 px-6 py-4 text-xs uppercase tracking-[0.28em] text-[#f1ece4] transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !hasUnsavedChanges
                  }
                  className="bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSaving
                    ? "Saving Settings..."
                    : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}