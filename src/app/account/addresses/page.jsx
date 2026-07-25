"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPTY_ADDRESS_FORM = {
  label: "Home",
  addressType: "home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Bangladesh",
  deliveryInstructions: "",
  isDefault: false,
};

const ADDRESS_TYPE_OPTIONS = [
  {
    value: "home",
    label: "Home",
  },
  {
    value: "office",
    label: "Office",
  },
  {
    value: "other",
    label: "Other",
  },
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getInitials(name) {
  const normalizedName =
    normalizeText(name);

  if (!normalizedName) {
    return "OB";
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function getAddressTypeLabel(type) {
  const normalizedType =
    normalizeText(type).toLowerCase();

  const matchingType =
    ADDRESS_TYPE_OPTIONS.find(
      (option) =>
        option.value ===
        normalizedType
    );

  return (
    matchingType?.label || "Address"
  );
}

function getAddressDisplayLabel(address) {
  return (
    normalizeText(address?.label) ||
    getAddressTypeLabel(
      address?.addressType
    )
  );
}

function buildAddressSummary(address) {
  return [
    address?.addressLine1,
    address?.addressLine2,
    address?.area,
    address?.city,
    address?.state,
    address?.postalCode,
    address?.country,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(", ");
}

function createFormFromAddress(address) {
  return {
    label:
      normalizeText(address?.label) ||
      getAddressTypeLabel(
        address?.addressType
      ),

    addressType:
      normalizeText(
        address?.addressType
      ).toLowerCase() || "home",

    fullName: normalizeText(
      address?.fullName
    ),

    phone: normalizeText(
      address?.phone
    ),

    addressLine1: normalizeText(
      address?.addressLine1
    ),

    addressLine2: normalizeText(
      address?.addressLine2
    ),

    area: normalizeText(
      address?.area
    ),

    city: normalizeText(
      address?.city
    ),

    state: normalizeText(
      address?.state
    ),

    postalCode: normalizeText(
      address?.postalCode
    ),

    country:
      normalizeText(
        address?.country
      ) || "Bangladesh",

    deliveryInstructions:
      normalizeText(
        address?.deliveryInstructions
      ),

    isDefault: Boolean(
      address?.isDefault
    ),
  };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function readJsonResponse(
  response
) {
  const responseText =
    await response.text();

  if (!responseText) {
    return null;
  }

  return safeJsonParse(
    responseText
  );
}

function IconArrowLeft({
  size = 18,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function IconPlus({
  size = 18,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function IconHome({
  size = 22,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M3.75 10.25L12 3.75L20.25 10.25V19.25C20.25 19.8023 19.8023 20.25 19.25 20.25H4.75C4.19772 20.25 3.75 19.8023 3.75 19.25V10.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />

      <path
        d="M9 20.25V14.25H15V20.25"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconOffice({
  size = 22,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M5 20.25V5.75C5 5.19772 5.44772 4.75 6 4.75H14C14.5523 4.75 15 5.19772 15 5.75V20.25"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />

      <path
        d="M15 9.75H18C18.5523 9.75 19 10.1977 19 10.75V20.25"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />

      <path
        d="M3.5 20.25H20.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />

      <path
        d="M8 8H12M8 11.5H12M8 15H12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconPin({
  size = 22,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M19 10C19 15.25 12 20.25 12 20.25C12 20.25 5 15.25 5 10C5 6.13401 8.13401 3 12 3C15.866 3 19 6.13401 19 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />

      <circle
        cx="12"
        cy="10"
        r="2.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconEdit({
  size = 17,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M14.25 5.25L18.75 9.75M4 20L7.75 19.25L19 8C19.8284 7.17157 19.8284 5.82843 19 5C18.1716 4.17157 16.8284 4.17157 16 5L4.75 16.25L4 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconTrash({
  size = 17,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M4 7H20M9 7V4.75C9 4.33579 9.33579 4 9.75 4H14.25C14.6642 4 15 4.33579 15 4.75V7M6.5 7L7.25 19.25C7.28344 19.7963 7.7364 20.2222 8.28375 20.2222H15.7163C16.2636 20.2222 16.7166 19.7963 16.75 19.25L17.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />

      <path
        d="M10 11V16M14 11V16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconClose({
  size = 20,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function IconCheck({
  size = 16,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconAlert({
  size = 20,
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M12 7.75V12.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="16.25"
        fill="currentColor"
        r="1"
      />
    </svg>
  );
}

function IconLoader({
  size = 20,
}) {
  return (
    <svg
      aria-hidden="true"
      className="address-spinner"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <circle
        cx="12"
        cy="12"
        opacity="0.22"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M21 12C21 7.02944 16.9706 3 12 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function AddressTypeIcon({
  type,
  size = 22,
}) {
  if (type === "office") {
    return (
      <IconOffice size={size} />
    );
  }

  if (type === "other") {
    return (
      <IconPin size={size} />
    );
  }

  return <IconHome size={size} />;
}

function FieldError({
  message,
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className="address-field-error"
      role="alert"
    >
      {message}
    </p>
  );
}

function FormField({
  children,
  error,
  htmlFor,
  label,
  required = false,
}) {
  return (
    <div className="address-form-field">
      <label
        className="address-field-label"
        htmlFor={htmlFor}
      >
        {label}

        {required ? (
          <span
            aria-hidden="true"
            className="address-required"
          >
            *
          </span>
        ) : null}
      </label>

      {children}

      <FieldError
        message={error}
      />
    </div>
  );
}


export default function AccountAddressesPage() {
  const [addresses, setAddresses] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingAddressId, setDeletingAddressId] =
    useState("");

  const [defaultAddressId, setDefaultAddressId] =
    useState("");

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [editingAddressId, setEditingAddressId] =
    useState("");

  const [formData, setFormData] =
    useState({
      ...EMPTY_ADDRESS_FORM,
    });

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [pageError, setPageError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [deleteConfirmation, setDeleteConfirmation] =
    useState(null);

  const [customerName, setCustomerName] =
    useState("");

  const [customerEmail, setCustomerEmail] =
    useState("");

  const isEditing = Boolean(
    editingAddressId
  );

  const selectedAddressType =
    useMemo(() => {
      return (
        ADDRESS_TYPE_OPTIONS.find(
          (option) =>
            option.value ===
            formData.addressType
        ) || ADDRESS_TYPE_OPTIONS[0]
      );
    }, [formData.addressType]);

  const clearMessages =
    useCallback(() => {
      setPageError("");
      setSuccessMessage("");
    }, []);

  const loadAddresses =
    useCallback(async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const response = await fetch(
          "/api/account/addresses",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const data =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "We could not load your saved addresses."
          );
        }

        const loadedAddresses =
          Array.isArray(data?.addresses)
            ? data.addresses
            : [];

        setAddresses(
          loadedAddresses
        );

        const currentDefault =
          loadedAddresses.find(
            (address) =>
              address.isDefault
          );

        setDefaultAddressId(
          currentDefault?.id || ""
        );

        setCustomerName(
          normalizeText(
            data?.customer?.name ||
              data?.customer?.fullName ||
              data?.profile?.name
          )
        );

        setCustomerEmail(
          normalizeText(
            data?.customer?.email ||
              data?.profile?.email
          )
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "We could not load your saved addresses."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        void loadAddresses();
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [loadAddresses]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [successMessage]);

  useEffect(() => {
    if (
      !isFormOpen &&
      !deleteConfirmation
    ) {
      document.body.style.overflow =
        "";
      return undefined;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    isFormOpen,
    deleteConfirmation,
  ]);

  function resetForm() {
    setFormData({
      ...EMPTY_ADDRESS_FORM,
      isDefault:
        addresses.length === 0,
    });

    setEditingAddressId("");
    setFieldErrors({});
  }

  function openCreateForm() {
    clearMessages();

    setFormData({
      ...EMPTY_ADDRESS_FORM,
      isDefault:
        addresses.length === 0,
    });

    setEditingAddressId("");
    setFieldErrors({});
    setIsFormOpen(true);
  }

  function openEditForm(address) {
    clearMessages();

    setFormData(
      createFormFromAddress(
        address
      )
    );

    setEditingAddressId(
      normalizeText(address?.id)
    );

    setFieldErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    resetForm();
  }

  function updateFormField(
    field,
    value
  ) {
    setFormData(
      (currentFormData) => ({
        ...currentFormData,
        [field]: value,
      })
    );

    setFieldErrors(
      (currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors[field];

        return nextErrors;
      }
    );

    setPageError("");
  }

  function handleAddressTypeChange(
    nextType
  ) {
    const matchingOption =
      ADDRESS_TYPE_OPTIONS.find(
        (option) =>
          option.value === nextType
      );

    setFormData(
      (currentFormData) => {
        const currentDefaultLabel =
          getAddressTypeLabel(
            currentFormData.addressType
          );

        const shouldReplaceLabel =
          !normalizeText(
            currentFormData.label
          ) ||
          normalizeText(
            currentFormData.label
          ) === currentDefaultLabel;

        return {
          ...currentFormData,
          addressType: nextType,
          label: shouldReplaceLabel
            ? matchingOption?.label ||
              "Address"
            : currentFormData.label,
        };
      }
    );

    setFieldErrors(
      (currentErrors) => {
        if (
          !currentErrors.addressType
        ) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors.addressType;

        return nextErrors;
      }
    );
  }

  function validateForm() {
    const nextErrors = {};

    if (
      !normalizeText(
        formData.fullName
      )
    ) {
      nextErrors.fullName =
        "Please enter the recipient's full name.";
    }

    if (
      !normalizeText(
        formData.phone
      )
    ) {
      nextErrors.phone =
        "Please enter a phone number.";
    }

    if (
      !normalizeText(
        formData.addressLine1
      )
    ) {
      nextErrors.addressLine1 =
        "Please enter the street address.";
    }

    if (
      !normalizeText(
        formData.city
      )
    ) {
      nextErrors.city =
        "Please enter the city or district.";
    }

    if (
      !normalizeText(
        formData.country
      )
    ) {
      nextErrors.country =
        "Please enter the country.";
    }

    setFieldErrors(
      nextErrors
    );

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = isEditing
        ? `/api/account/addresses/${encodeURIComponent(
            editingAddressId
          )}`
        : "/api/account/addresses";

      const response = await fetch(
        endpoint,
        {
          method: isEditing
            ? "PATCH"
            : "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            formData
          ),
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        if (data?.field) {
          setFieldErrors({
            [data.field]:
              data.message,
          });
        }

        throw new Error(
          data?.message ||
            "We could not save this address."
        );
      }

      const updatedAddresses =
        Array.isArray(
          data?.addresses
        )
          ? data.addresses
          : [];

      setAddresses(
        updatedAddresses
      );

      const currentDefault =
        updatedAddresses.find(
          (address) =>
            address.isDefault
        );

      setDefaultAddressId(
        currentDefault?.id || ""
      );

      setSuccessMessage(
        data?.message ||
          (isEditing
            ? "Your address has been updated."
            : "Your address has been added.")
      );

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "We could not save this address."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateDefaultAddress(
    address
  ) {
    const addressId =
      normalizeText(address?.id);

    if (
      !addressId ||
      address.isDefault ||
      defaultAddressId === addressId
    ) {
      return;
    }

    clearMessages();
    setDefaultAddressId(
      addressId
    );

    try {
      const response = await fetch(
        `/api/account/addresses/${encodeURIComponent(
          addressId
        )}`,
        {
          method: "PATCH",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...createFormFromAddress(
              address
            ),
            isDefault: true,
          }),
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "We could not update your default address."
        );
      }

      const updatedAddresses =
        Array.isArray(
          data?.addresses
        )
          ? data.addresses
          : [];

      setAddresses(
        updatedAddresses
      );

      const currentDefault =
        updatedAddresses.find(
          (item) =>
            item.isDefault
        );

      setDefaultAddressId(
        currentDefault?.id || ""
      );

      setSuccessMessage(
        "Your default address has been updated."
      );
    } catch (error) {
      setDefaultAddressId(
        addresses.find(
          (item) =>
            item.isDefault
        )?.id || ""
      );

      setPageError(
        error instanceof Error
          ? error.message
          : "We could not update your default address."
      );
    }
  }

  function requestDeleteAddress(
    address
  ) {
    clearMessages();

    setDeleteConfirmation(
      address
    );
  }

  function closeDeleteConfirmation() {
    if (deletingAddressId) {
      return;
    }

    setDeleteConfirmation(
      null
    );
  }

  async function confirmDeleteAddress() {
    const addressId =
      normalizeText(
        deleteConfirmation?.id
      );

    if (!addressId) {
      setDeleteConfirmation(
        null
      );
      return;
    }

    clearMessages();

    setDeletingAddressId(
      addressId
    );

    try {
      const response = await fetch(
        `/api/account/addresses/${encodeURIComponent(
          addressId
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "We could not delete this address."
        );
      }

      const updatedAddresses =
        Array.isArray(
          data?.addresses
        )
          ? data.addresses
          : [];

      setAddresses(
        updatedAddresses
      );

      const currentDefault =
        updatedAddresses.find(
          (address) =>
            address.isDefault
        );

      setDefaultAddressId(
        currentDefault?.id || ""
      );

      setDeleteConfirmation(
        null
      );

      setSuccessMessage(
        data?.message ||
          "Your address has been deleted."
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "We could not delete this address."
      );
    } finally {
      setDeletingAddressId("");
    }
  }

  const customerInitials =
    getInitials(
      customerName ||
        customerEmail
    );


      return (
    <main className="address-page">
      <section className="address-shell">
        <div className="address-topbar">
          <Link
            className="address-back-link"
            href="/account"
          >
            <IconArrowLeft />

            <span>Back to account</span>
          </Link>

          <div className="address-customer">
            <div
              aria-hidden="true"
              className="address-customer-avatar"
            >
              {customerInitials}
            </div>

            <div className="address-customer-copy">
              <p className="address-customer-name">
                {customerName ||
                  "Your account"}
              </p>

              {customerEmail ? (
                <p className="address-customer-email">
                  {customerEmail}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <header className="address-header">
          <div className="address-header-copy">
            <p className="address-eyebrow">
              Customer account
            </p>

            <h1 className="address-title">
              Address book
            </h1>

            <p className="address-description">
              Manage your delivery
              addresses and choose which
              address should be used by
              default at checkout.
            </p>
          </div>

          <button
            className="address-primary-button"
            disabled={isLoading}
            onClick={openCreateForm}
            type="button"
          >
            <IconPlus />

            <span>Add new address</span>
          </button>
        </header>

        {successMessage ? (
          <div
            className="address-notice address-notice-success"
            role="status"
          >
            <span className="address-notice-icon">
              <IconCheck />
            </span>

            <p>{successMessage}</p>
          </div>
        ) : null}

        {pageError ? (
          <div
            className="address-notice address-notice-error"
            role="alert"
          >
            <span className="address-notice-icon">
              <IconAlert />
            </span>

            <p>{pageError}</p>

            {isLoading ? null : (
              <button
                className="address-notice-action"
                onClick={loadAddresses}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        ) : null}

        {isLoading ? (
          <div className="address-loading-state">
            <IconLoader size={28} />

            <p>
              Loading your saved
              addresses...
            </p>
          </div>
        ) : addresses.length === 0 ? (
          <section className="address-empty-state">
            <div className="address-empty-icon">
              <IconPin size={32} />
            </div>

            <p className="address-empty-eyebrow">
              No saved addresses
            </p>

            <h2 className="address-empty-title">
              Add your first delivery
              address
            </h2>

            <p className="address-empty-description">
              Save an address now to make
              future checkout faster and
              easier.
            </p>

            <button
              className="address-primary-button address-empty-button"
              onClick={openCreateForm}
              type="button"
            >
              <IconPlus />

              <span>Add an address</span>
            </button>
          </section>
        ) : (
          <section
            aria-label="Saved addresses"
            className="address-grid"
          >
            {addresses.map(
              (address) => {
                const addressId =
                  normalizeText(
                    address?.id
                  );

                const isUpdatingDefault =
                  defaultAddressId ===
                    addressId &&
                  !address.isDefault;

                const isDeleting =
                  deletingAddressId ===
                  addressId;

                return (
                  <article
                    className={`address-card${
                      address.isDefault
                        ? " address-card-default"
                        : ""
                    }`}
                    key={addressId}
                  >
                    <div className="address-card-top">
                      <div className="address-card-heading">
                        <span className="address-card-icon">
                          <AddressTypeIcon
                            type={
                              address.addressType
                            }
                          />
                        </span>

                        <div>
                          <div className="address-label-row">
                            <h2 className="address-card-label">
                              {getAddressDisplayLabel(
                                address
                              )}
                            </h2>

                            {address.isDefault ? (
                              <span className="address-default-badge">
                                Default
                              </span>
                            ) : null}
                          </div>

                          <p className="address-card-type">
                            {getAddressTypeLabel(
                              address.addressType
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="address-card-actions">
                        <button
                          aria-label={`Edit ${getAddressDisplayLabel(
                            address
                          )} address`}
                          className="address-icon-button"
                          disabled={
                            isDeleting ||
                            isUpdatingDefault
                          }
                          onClick={() =>
                            openEditForm(
                              address
                            )
                          }
                          title="Edit address"
                          type="button"
                        >
                          <IconEdit />
                        </button>

                        <button
                          aria-label={`Delete ${getAddressDisplayLabel(
                            address
                          )} address`}
                          className="address-icon-button address-delete-button"
                          disabled={
                            isDeleting ||
                            isUpdatingDefault
                          }
                          onClick={() =>
                            requestDeleteAddress(
                              address
                            )
                          }
                          title="Delete address"
                          type="button"
                        >
                          {isDeleting ? (
                            <IconLoader
                              size={17}
                            />
                          ) : (
                            <IconTrash />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="address-card-body">
                      <p className="address-recipient">
                        {address.fullName}
                      </p>

                      <p className="address-phone">
                        {address.phone}
                      </p>

                      <p className="address-summary">
                        {buildAddressSummary(
                          address
                        )}
                      </p>

                      {address.deliveryInstructions ? (
                        <div className="address-instructions">
                          <span>
                            Delivery note
                          </span>

                          <p>
                            {
                              address.deliveryInstructions
                            }
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="address-card-footer">
                      <label className="address-default-control">
                        <input
                          checked={Boolean(
                            address.isDefault
                          )}
                          disabled={
                            address.isDefault ||
                            isUpdatingDefault ||
                            isDeleting
                          }
                          name="defaultAddress"
                          onChange={() =>
                            updateDefaultAddress(
                              address
                            )
                          }
                          type="radio"
                          value={addressId}
                        />

                        <span className="address-radio">
                          {address.isDefault ? (
                            <IconCheck
                              size={13}
                            />
                          ) : null}
                        </span>

                        <span>
                          {isUpdatingDefault
                            ? "Updating..."
                            : address.isDefault
                              ? "Default delivery address"
                              : "Set as default"}
                        </span>
                      </label>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </section>

            {isFormOpen ? (
        <div
          aria-labelledby="address-form-title"
          aria-modal="true"
          className="address-modal-backdrop"
          role="dialog"
        >
          <div className="address-modal">
            <div className="address-modal-header">
              <div>
                <p className="address-modal-eyebrow">
                  {isEditing
                    ? "Edit saved address"
                    : "New delivery address"}
                </p>

                <h2
                  className="address-modal-title"
                  id="address-form-title"
                >
                  {isEditing
                    ? "Update address"
                    : "Add an address"}
                </h2>

                <p className="address-modal-description">
                  Enter the details exactly
                  as they should appear for
                  delivery.
                </p>
              </div>

              <button
                aria-label="Close address form"
                className="address-modal-close"
                disabled={isSaving}
                onClick={closeForm}
                type="button"
              >
                <IconClose />
              </button>
            </div>

            <form
              className="address-form"
              onSubmit={handleSubmit}
            >
              <fieldset
                className="address-type-fieldset"
                disabled={isSaving}
              >
                <legend className="address-field-label">
                  Address type
                </legend>

                <div className="address-type-grid">
                  {ADDRESS_TYPE_OPTIONS.map(
                    (option) => {
                      const isSelected =
                        selectedAddressType.value ===
                        option.value;

                      return (
                        <label
                          className={`address-type-option${
                            isSelected
                              ? " address-type-option-selected"
                              : ""
                          }`}
                          key={option.value}
                        >
                          <input
                            checked={isSelected}
                            name="addressType"
                            onChange={() =>
                              handleAddressTypeChange(
                                option.value
                              )
                            }
                            type="radio"
                            value={
                              option.value
                            }
                          />

                          <span className="address-type-option-icon">
                            <AddressTypeIcon
                              size={21}
                              type={
                                option.value
                              }
                            />
                          </span>

                          <span>
                            {option.label}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </fieldset>

              <div className="address-form-grid">
                <FormField
                  error={fieldErrors.label}
                  htmlFor="address-label"
                  label="Address label"
                >
                  <input
                    className={`address-input${
                      fieldErrors.label
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-label"
                    maxLength={30}
                    onChange={(event) =>
                      updateFormField(
                        "label",
                        event.target.value
                      )
                    }
                    placeholder="Home, Office or another label"
                    type="text"
                    value={formData.label}
                  />
                </FormField>

                <FormField
                  error={
                    fieldErrors.fullName
                  }
                  htmlFor="address-full-name"
                  label="Recipient name"
                  required
                >
                  <input
                    autoComplete="name"
                    className={`address-input${
                      fieldErrors.fullName
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-full-name"
                    maxLength={80}
                    onChange={(event) =>
                      updateFormField(
                        "fullName",
                        event.target.value
                      )
                    }
                    placeholder="Full name"
                    type="text"
                    value={
                      formData.fullName
                    }
                  />
                </FormField>

                <FormField
                  error={fieldErrors.phone}
                  htmlFor="address-phone"
                  label="Phone number"
                  required
                >
                  <input
                    autoComplete="tel"
                    className={`address-input${
                      fieldErrors.phone
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-phone"
                    inputMode="tel"
                    maxLength={30}
                    onChange={(event) =>
                      updateFormField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="+880 1XXXXXXXXX"
                    type="tel"
                    value={formData.phone}
                  />
                </FormField>

                <div className="address-form-field address-form-field-full">
                  <FormField
                    error={
                      fieldErrors.addressLine1
                    }
                    htmlFor="address-line-1"
                    label="Street address"
                    required
                  >
                    <input
                      autoComplete="address-line1"
                      className={`address-input${
                        fieldErrors.addressLine1
                          ? " address-input-error"
                          : ""
                      }`}
                      disabled={isSaving}
                      id="address-line-1"
                      maxLength={160}
                      onChange={(event) =>
                        updateFormField(
                          "addressLine1",
                          event.target.value
                        )
                      }
                      placeholder="House, road, street or building"
                      type="text"
                      value={
                        formData.addressLine1
                      }
                    />
                  </FormField>
                </div>

                <div className="address-form-field address-form-field-full">
                  <FormField
                    error={
                      fieldErrors.addressLine2
                    }
                    htmlFor="address-line-2"
                    label="Apartment, suite or unit"
                  >
                    <input
                      autoComplete="address-line2"
                      className={`address-input${
                        fieldErrors.addressLine2
                          ? " address-input-error"
                          : ""
                      }`}
                      disabled={isSaving}
                      id="address-line-2"
                      maxLength={160}
                      onChange={(event) =>
                        updateFormField(
                          "addressLine2",
                          event.target.value
                        )
                      }
                      placeholder="Optional"
                      type="text"
                      value={
                        formData.addressLine2
                      }
                    />
                  </FormField>
                </div>

                <FormField
                  error={fieldErrors.area}
                  htmlFor="address-area"
                  label="Area or locality"
                >
                  <input
                    autoComplete="address-level3"
                    className={`address-input${
                      fieldErrors.area
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-area"
                    maxLength={80}
                    onChange={(event) =>
                      updateFormField(
                        "area",
                        event.target.value
                      )
                    }
                    placeholder="Area, suburb or locality"
                    type="text"
                    value={formData.area}
                  />
                </FormField>

                <FormField
                  error={fieldErrors.city}
                  htmlFor="address-city"
                  label="City or district"
                  required
                >
                  <input
                    autoComplete="address-level2"
                    className={`address-input${
                      fieldErrors.city
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-city"
                    maxLength={80}
                    onChange={(event) =>
                      updateFormField(
                        "city",
                        event.target.value
                      )
                    }
                    placeholder="City or district"
                    type="text"
                    value={formData.city}
                  />
                </FormField>

                <FormField
                  error={fieldErrors.state}
                  htmlFor="address-state"
                  label="Division or state"
                >
                  <input
                    autoComplete="address-level1"
                    className={`address-input${
                      fieldErrors.state
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-state"
                    maxLength={80}
                    onChange={(event) =>
                      updateFormField(
                        "state",
                        event.target.value
                      )
                    }
                    placeholder="Division or state"
                    type="text"
                    value={formData.state}
                  />
                </FormField>

                <FormField
                  error={
                    fieldErrors.postalCode
                  }
                  htmlFor="address-postal-code"
                  label="Postal code"
                >
                  <input
                    autoComplete="postal-code"
                    className={`address-input${
                      fieldErrors.postalCode
                        ? " address-input-error"
                        : ""
                    }`}
                    disabled={isSaving}
                    id="address-postal-code"
                    maxLength={20}
                    onChange={(event) =>
                      updateFormField(
                        "postalCode",
                        event.target.value
                      )
                    }
                    placeholder="Postal code"
                    type="text"
                    value={
                      formData.postalCode
                    }
                  />
                </FormField>

                <div className="address-form-field address-form-field-full">
                  <FormField
                    error={
                      fieldErrors.country
                    }
                    htmlFor="address-country"
                    label="Country"
                    required
                  >
                    <input
                      autoComplete="country-name"
                      className={`address-input${
                        fieldErrors.country
                          ? " address-input-error"
                          : ""
                      }`}
                      disabled={isSaving}
                      id="address-country"
                      maxLength={80}
                      onChange={(event) =>
                        updateFormField(
                          "country",
                          event.target.value
                        )
                      }
                      placeholder="Country"
                      type="text"
                      value={
                        formData.country
                      }
                    />
                  </FormField>
                </div>

                <div className="address-form-field address-form-field-full">
                  <FormField
                    error={
                      fieldErrors.deliveryInstructions
                    }
                    htmlFor="address-instructions"
                    label="Delivery instructions"
                  >
                    <textarea
                      className={`address-input address-textarea${
                        fieldErrors.deliveryInstructions
                          ? " address-input-error"
                          : ""
                      }`}
                      disabled={isSaving}
                      id="address-instructions"
                      maxLength={300}
                      onChange={(event) =>
                        updateFormField(
                          "deliveryInstructions",
                          event.target.value
                        )
                      }
                      placeholder="Landmark, gate instructions or any useful note"
                      rows={4}
                      value={
                        formData.deliveryInstructions
                      }
                    />
                  </FormField>
                </div>
              </div>

              <label className="address-default-checkbox">
                <input
                  checked={
                    formData.isDefault
                  }
                  disabled={
                    isSaving ||
                    (isEditing &&
                      addresses.find(
                        (address) =>
                          address.id ===
                          editingAddressId
                      )?.isDefault)
                  }
                  onChange={(event) =>
                    updateFormField(
                      "isDefault",
                      event.target.checked
                    )
                  }
                  type="checkbox"
                />

                <span className="address-checkbox-box">
                  {formData.isDefault ? (
                    <IconCheck
                      size={13}
                    />
                  ) : null}
                </span>

                <span className="address-default-checkbox-copy">
                  <strong>
                    Use as default address
                  </strong>

                  <small>
                    This address will be
                    selected automatically
                    during checkout.
                  </small>
                </span>
              </label>

              <div className="address-modal-actions">
                <button
                  className="address-secondary-button"
                  disabled={isSaving}
                  onClick={closeForm}
                  type="button"
                >
                  Cancel
                </button>

                <button
                  className="address-primary-button"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? (
                    <>
                      <IconLoader />

                      <span>
                        Saving...
                      </span>
                    </>
                  ) : (
                    <>
                      <IconCheck />

                                            <span>
                        {isEditing
                          ? "Save changes"
                          : "Save address"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteConfirmation ? (
        <div
          aria-labelledby="delete-address-title"
          aria-modal="true"
          className="address-modal-backdrop address-delete-backdrop"
          role="dialog"
        >
          <div className="address-delete-modal">
            <div className="address-delete-symbol">
              <IconTrash size={22} />
            </div>

            <div className="address-delete-copy">
              <p className="address-modal-eyebrow">
                Remove saved address
              </p>

              <h2
                className="address-delete-title"
                id="delete-address-title"
              >
                Delete this address?
              </h2>

              <p className="address-delete-description">
                This will permanently remove{" "}
                <strong>
                  {getAddressDisplayLabel(
                    deleteConfirmation
                  )}
                </strong>{" "}
                from your address book.
              </p>

              <div className="address-delete-preview">
                <p className="address-delete-name">
                  {deleteConfirmation.fullName}
                </p>

                <p>
                  {buildAddressSummary(
                    deleteConfirmation
                  )}
                </p>
              </div>
            </div>

            <div className="address-delete-actions">
              <button
                className="address-secondary-button"
                disabled={Boolean(
                  deletingAddressId
                )}
                onClick={
                  closeDeleteConfirmation
                }
                type="button"
              >
                Keep address
              </button>

              <button
                className="address-danger-button"
                disabled={Boolean(
                  deletingAddressId
                )}
                onClick={
                  confirmDeleteAddress
                }
                type="button"
              >
                {deletingAddressId ? (
                  <>
                    <IconLoader />

                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <IconTrash />

                    <span>
                      Delete address
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          background: #f4efe6;
          color: #16130f;
        }

        :global(button),
        :global(input),
        :global(textarea) {
          font: inherit;
        }

        .address-page {
          min-height: 100vh;
          padding: 34px 24px 72px;
          background:
            radial-gradient(
              circle at top right,
              rgba(255, 255, 255, 0.82),
              transparent 36%
            ),
            #f4efe6;
        }

        .address-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .address-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 28px;
          border-bottom: 1px solid
            rgba(22, 19, 15, 0.14);
        }

        .address-back-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #403a32;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition:
            color 180ms ease,
            transform 180ms ease;
        }

        .address-back-link:hover {
          color: #11100d;
          transform: translateX(-2px);
        }

        .address-customer {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .address-customer-avatar {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid
            rgba(22, 19, 15, 0.18);
          border-radius: 50%;
          background: #17140f;
          color: #fffaf2;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .address-customer-copy {
          min-width: 0;
          text-align: right;
        }

        .address-customer-name,
        .address-customer-email {
          margin: 0;
        }

        .address-customer-name {
          color: #17140f;
          font-size: 14px;
          font-weight: 700;
        }

        .address-customer-email {
          margin-top: 3px;
          color: #766f65;
          font-size: 12px;
        }

        .address-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;
          padding: 66px 0 38px;
        }

        .address-header-copy {
          max-width: 650px;
        }

        .address-eyebrow,
        .address-empty-eyebrow,
        .address-modal-eyebrow {
          margin: 0 0 12px;
          color: #71695f;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .address-title {
          margin: 0;
          color: #17140f;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: clamp(
            44px,
            7vw,
            76px
          );
          font-weight: 400;
          letter-spacing: -0.045em;
          line-height: 0.96;
        }

        .address-description {
          max-width: 600px;
          margin: 22px 0 0;
          color: #696157;
          font-size: 15px;
          line-height: 1.8;
        }

        .address-primary-button,
        .address-secondary-button,
        .address-danger-button {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 20px;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease,
            transform 180ms ease,
            opacity 180ms ease;
        }

        .address-primary-button {
          border: 1px solid #17140f;
          background: #17140f;
          color: #fffaf2;
        }

        .address-primary-button:hover:not(
            :disabled
          ) {
          background: #2a251f;
          transform: translateY(-1px);
        }

        .address-secondary-button {
          border: 1px solid
            rgba(22, 19, 15, 0.22);
          background: transparent;
          color: #17140f;
        }

        .address-secondary-button:hover:not(
            :disabled
          ) {
          border-color: #17140f;
          background: #f7f3eb;
        }

        .address-danger-button {
          border: 1px solid #8b2f25;
          background: #8b2f25;
          color: #fff;
        }

        .address-danger-button:hover:not(
            :disabled
          ) {
          background: #70251d;
          border-color: #70251d;
        }

        .address-primary-button:disabled,
        .address-secondary-button:disabled,
        .address-danger-button:disabled {
          cursor: not-allowed;
          opacity: 0.58;
          transform: none;
        }

        .address-notice {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 15px 17px;
          border: 1px solid;
          background: rgba(
            255,
            255,
            255,
            0.52
          );
        }

        .address-notice p {
          flex: 1;
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .address-notice-success {
          border-color: rgba(
            45,
            103,
            74,
            0.35
          );
          color: #25583e;
        }

        .address-notice-error {
          border-color: rgba(
            139,
            47,
            37,
            0.38
          );
          color: #7c2b22;
        }

        .address-notice-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .address-notice-action {
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 12px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        .address-loading-state,
        .address-empty-state {
          display: flex;
          min-height: 330px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(22, 19, 15, 0.13);
          background: rgba(
            255,
            255,
            255,
            0.42
          );
          text-align: center;
        }

        .address-loading-state {
          gap: 14px;
          color: #6f685e;
          font-size: 14px;
        }

        .address-loading-state p {
          margin: 0;
        }

        .address-empty-state {
          padding: 56px 24px;
        }

        .address-empty-icon {
          display: grid;
          width: 64px;
          height: 64px;
          place-items: center;
          margin-bottom: 22px;
          border: 1px solid
            rgba(22, 19, 15, 0.18);
          border-radius: 50%;
          color: #373129;
        }

        .address-empty-title {
          max-width: 480px;
          margin: 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: clamp(
            30px,
            5vw,
            44px
          );
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .address-empty-description {
          max-width: 460px;
          margin: 18px 0 26px;
          color: #71695f;
          font-size: 14px;
          line-height: 1.7;
        }

        .address-empty-button {
          min-width: 190px;
        }

        .address-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .address-card {
          display: flex;
          min-height: 330px;
          flex-direction: column;
          border: 1px solid
            rgba(22, 19, 15, 0.14);
          background: rgba(
            255,
            255,
            255,
            0.48
          );
          transition:
            border-color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .address-card:hover {
          transform: translateY(-2px);
          border-color: rgba(
            22,
            19,
            15,
            0.28
          );
          box-shadow:
            0 18px 38px
            rgba(33, 27, 20, 0.07);
        }

        .address-card-default {
          border-color: #17140f;
        }

        .address-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 23px 23px 20px;
          border-bottom: 1px solid
            rgba(22, 19, 15, 0.1);
        }

        .address-card-heading {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-width: 0;
        }

        .address-card-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid
            rgba(22, 19, 15, 0.16);
          border-radius: 50%;
          color: #40392f;
        }

        .address-label-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
        }

        .address-card-label {
          margin: 0;
          color: #17140f;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 24px;
          font-weight: 400;
          letter-spacing: -0.025em;
        }

        .address-default-badge {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 8px;
          border: 1px solid
            rgba(22, 19, 15, 0.2);
          border-radius: 999px;
          background: #17140f;
          color: #fffaf2;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .address-card-type {
          margin: 5px 0 0;
          color: #81796f;
          font-size: 11px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .address-card-actions {
          display: flex;
          gap: 7px;
        }

        .address-icon-button,
        .address-modal-close {
          display: inline-grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 1px solid
            rgba(22, 19, 15, 0.16);
          background: transparent;
          color: #4b443b;
          cursor: pointer;
          transition:
            color 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .address-icon-button:hover:not(
            :disabled
          ),
        .address-modal-close:hover:not(
            :disabled
          ) {
          border-color: #17140f;
          background: #f2ede4;
          color: #17140f;
        }

        .address-delete-button:hover:not(
            :disabled
          ) {
          border-color: rgba(
            139,
            47,
            37,
            0.55
          );
          color: #8b2f25;
        }

        .address-icon-button:disabled,
        .address-modal-close:disabled {
          cursor: not-allowed;
          opacity: 0.48;
        }

        .address-card-body {
          flex: 1;
          padding: 22px 23px;
        }

        .address-recipient {
          margin: 0;
          color: #17140f;
          font-size: 15px;
          font-weight: 700;
        }

        .address-phone {
          margin: 7px 0 0;
          color: #5f584f;
          font-size: 13px;
        }

        .address-summary {
          margin: 17px 0 0;
          color: #6d655b;
          font-size: 14px;
          line-height: 1.7;
        }

        .address-instructions {
          margin-top: 19px;
          padding: 13px 14px;
          border-left: 2px solid
            rgba(22, 19, 15, 0.3);
          background: rgba(
            22,
            19,
            15,
            0.035
          );
        }

        .address-instructions span {
          color: #857d72;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .address-instructions p {
          margin: 6px 0 0;
          color: #575046;
          font-size: 12px;
          line-height: 1.6;
        }

        .address-card-footer {
          padding: 18px 23px;
          border-top: 1px solid
            rgba(22, 19, 15, 0.1);
        }

        .address-default-control {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #514a41;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .address-default-control input,
        .address-default-checkbox input,
        .address-type-option input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        .address-radio {
          display: grid;
          width: 19px;
          height: 19px;
          place-items: center;
          border: 1px solid
            rgba(22, 19, 15, 0.35);
          border-radius: 50%;
          color: #fff;
          background: transparent;
        }

        .address-default-control
          input:checked
          + .address-radio {
          border-color: #17140f;
          background: #17140f;
        }

        .address-default-control
          input:disabled
          ~ span {
          cursor: default;
        }

        .address-modal-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(
            18,
            15,
            11,
            0.58
          );
          backdrop-filter: blur(7px);
        }

        .address-modal {
          width: min(820px, 100%);
          max-height: calc(
            100vh - 48px
          );
          overflow-y: auto;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          background: #f8f4ec;
          box-shadow:
            0 30px 90px
            rgba(0, 0, 0, 0.28);
        }

        .address-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          padding: 28px 30px 24px;
          border-bottom: 1px solid
            rgba(22, 19, 15, 0.13);
        }

        .address-modal-title {
          margin: 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 36px;
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .address-modal-description {
          max-width: 520px;
          margin: 12px 0 0;
          color: #70685e;
          font-size: 13px;
          line-height: 1.65;
        }

        .address-form {
          padding: 28px 30px 30px;
        }

        .address-type-fieldset {
          margin: 0 0 24px;
          padding: 0;
          border: 0;
        }

        .address-type-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .address-type-option {
          display: flex;
          min-height: 58px;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          border: 1px solid
            rgba(22, 19, 15, 0.17);
          background: rgba(
            255,
            255,
            255,
            0.45
          );
          color: #5b544b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            color 180ms ease;
        }

        .address-type-option:hover,
        .address-type-option-selected {
          border-color: #17140f;
          background: #17140f;
          color: #fffaf2;
        }

        .address-type-option-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .address-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .address-form-field {
          min-width: 0;
        }

        .address-form-field-full {
          grid-column: 1 / -1;
        }

        .address-field-label {
          display: block;
          margin-bottom: 8px;
          color: #4f483f;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .address-required {
          margin-left: 3px;
          color: #8b2f25;
        }

        .address-input {
          width: 100%;
          min-height: 48px;
          padding: 0 14px;
          border: 1px solid
            rgba(22, 19, 15, 0.19);
          border-radius: 0;
          outline: none;
          background: rgba(
            255,
            255,
            255,
            0.62
          );
          color: #17140f;
          font-size: 13px;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .address-input::placeholder {
          color: #9a9287;
        }

        .address-input:focus {
          border-color: #17140f;
          background: #fffdf8;
          box-shadow:
            0 0 0 2px
            rgba(22, 19, 15, 0.08);
        }

        .address-input:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .address-input-error {
          border-color: #9b3429;
        }

        .address-textarea {
          min-height: 112px;
          padding-top: 13px;
          padding-bottom: 13px;
          resize: vertical;
          line-height: 1.6;
        }

        .address-field-error {
          margin: 6px 0 0;
          color: #8b2f25;
          font-size: 11px;
          line-height: 1.45;
        }

        .address-default-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 22px;
          padding: 16px;
          border: 1px solid
            rgba(22, 19, 15, 0.14);
          background: rgba(
            255,
            255,
            255,
            0.38
          );
          cursor: pointer;
        }

        .address-checkbox-box {
          display: grid;
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid
            rgba(22, 19, 15, 0.38);
          background: transparent;
          color: #fff;
        }

        .address-default-checkbox
          input:checked
          + .address-checkbox-box {
          border-color: #17140f;
          background: #17140f;
        }

        .address-default-checkbox-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .address-default-checkbox-copy
          strong {
          color: #231f1a;
          font-size: 13px;
        }

        .address-default-checkbox-copy
          small {
          color: #7d756b;
          font-size: 11px;
          line-height: 1.5;
        }

        .address-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid
            rgba(22, 19, 15, 0.13);
        }

        .address-delete-backdrop {
          z-index: 1100;
        }

        .address-delete-modal {
          width: min(500px, 100%);
          padding: 30px;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          background: #f8f4ec;
          box-shadow:
            0 30px 90px
            rgba(0, 0, 0, 0.3);
        }

        .address-delete-symbol {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          margin-bottom: 20px;
          border: 1px solid
            rgba(139, 47, 37, 0.3);
          border-radius: 50%;
          background: rgba(
            139,
            47,
            37,
            0.07
          );
          color: #8b2f25;
        }

        .address-delete-title {
          margin: 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 34px;
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .address-delete-description {
          margin: 14px 0 0;
          color: #6b6359;
          font-size: 13px;
          line-height: 1.7;
        }

        .address-delete-preview {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid
            rgba(22, 19, 15, 0.13);
          background: rgba(
            255,
            255,
            255,
            0.42
          );
        }

        .address-delete-preview p {
          margin: 0;
          color: #6b6359;
          font-size: 12px;
          line-height: 1.6;
        }

        .address-delete-preview
          .address-delete-name {
          margin-bottom: 5px;
          color: #17140f;
          font-size: 13px;
          font-weight: 700;
        }

        .address-delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 26px;
        }

        .address-spinner {
          animation:
            address-spin 780ms linear
            infinite;
        }

        @keyframes address-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .address-page {
            padding: 26px 18px 56px;
          }

          .address-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 48px 0 30px;
          }

          .address-grid {
            grid-template-columns: 1fr;
          }

          .address-modal {
            width: min(760px, 100%);
          }
        }

        @media (max-width: 680px) {
          .address-page {
            padding: 20px 14px 44px;
          }

          .address-topbar {
            align-items: flex-start;
            gap: 16px;
          }

          .address-customer {
            max-width: 58%;
          }

          .address-customer-copy {
            overflow: hidden;
          }

          .address-customer-name,
          .address-customer-email {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .address-customer-email {
            display: none;
          }

          .address-header {
            padding: 40px 0 26px;
          }

          .address-title {
            font-size: clamp(
              42px,
              15vw,
              60px
            );
          }

          .address-description {
            margin-top: 18px;
            font-size: 14px;
          }

          .address-header
            .address-primary-button {
            width: 100%;
          }

          .address-card {
            min-height: 0;
          }

          .address-card-top {
            padding: 19px;
          }

          .address-card-body {
            padding: 19px;
          }

          .address-card-footer {
            padding: 16px 19px;
          }

          .address-card-label {
            font-size: 22px;
          }

          .address-modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .address-modal {
            width: 100%;
            max-height: 94vh;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
          }

          .address-modal-header {
            padding: 24px 18px 20px;
          }

          .address-modal-title {
            font-size: 31px;
          }

          .address-form {
            padding: 22px 18px 24px;
          }

          .address-type-grid {
            grid-template-columns: 1fr;
          }

          .address-form-grid {
            grid-template-columns: 1fr;
          }

          .address-form-field-full {
            grid-column: auto;
          }

          .address-modal-actions,
          .address-delete-actions {
            flex-direction: column-reverse;
          }

          .address-modal-actions
            .address-primary-button,
          .address-modal-actions
            .address-secondary-button,
          .address-delete-actions
            .address-danger-button,
          .address-delete-actions
            .address-secondary-button {
            width: 100%;
          }

          .address-delete-modal {
            width: 100%;
            padding: 26px 18px 22px;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
          }

          .address-delete-title {
            font-size: 31px;
          }
        }

        @media (max-width: 430px) {
          .address-topbar {
            align-items: center;
          }

          .address-back-link span {
            display: none;
          }

          .address-customer {
            max-width: calc(
              100% - 50px
            );
          }

          .address-header {
            padding-top: 34px;
          }

          .address-card-top {
            gap: 12px;
          }

          .address-card-heading {
            gap: 11px;
          }

          .address-card-icon {
            width: 38px;
            height: 38px;
          }

          .address-card-actions {
            flex-direction: column;
          }

          .address-label-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .address-default-control {
            align-items: flex-start;
          }

          .address-notice {
            align-items: flex-start;
          }

          .address-notice-action {
            flex: 0 0 auto;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          *,
          *::before,
          *::after {
            scroll-behavior:
              auto !important;
            animation-duration:
              0.01ms !important;
            animation-iteration-count:
              1 !important;
            transition-duration:
              0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

      