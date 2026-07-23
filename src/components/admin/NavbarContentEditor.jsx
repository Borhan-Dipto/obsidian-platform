"use client";

import {
  useMemo,
  useState,
} from "react";
import ImageUploader from "./ImageUploader";
import {
  inspectPublicNavigationHref,
  sanitizeNavbarContent,
  validateNavbarContentInput,
} from "../../lib/navbarCms";

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeNavbarContent(
  content = {}
) {
  return sanitizeNavbarContent(
    content,
    {
      schemaVersion: Number(
        content?.schemaVersion || 1
      ),
    }
  );
}

function FieldLabel({
  children,
}) {
  return (
    <label className="mb-3 block text-[10px] uppercase tracking-[0.32em] text-neutral-500">
      {children}
    </label>
  );
}

function FieldError({
  children,
}) {
  if (!children) {
    return null;
  }

  return (
    <p
      className="mt-2 text-xs leading-5 text-red-300"
      role="alert"
    >
      {children}
    </p>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  min,
  max,
  error = "",
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>

      <input
        type={type}
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        aria-invalid={
          Boolean(error)
        }
        className={`w-full border bg-white/[0.04] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 ${
          error
            ? "border-red-500/40 focus:border-red-400"
            : "border-white/10 focus:border-white/30"
        }`}
      />

      <FieldError>
        {error}
      </FieldError>
    </div>
  );
}

function CheckboxInput({
  label,
  description = "",
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 border border-white/10 bg-white/[0.03] px-5 py-4">
      <span>
        <span className="block text-sm text-neutral-300">
          {label}
        </span>

        {description ? (
          <span className="mt-2 block text-xs leading-6 text-neutral-500">
            {description}
          </span>
        ) : null}
      </span>

      <input
        type="checkbox"
        checked={Boolean(
          checked
        )}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4 shrink-0"
      />
    </label>
  );
}

function Panel({
  title,
  description = "",
  children,
}) {
  return (
    <section className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          {title}
        </p>

        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}

function getNavigationItemErrors(
  item
) {
  const errors = {
    label: "",
    href: "",
  };

  if (
    !String(
      item?.label || ""
    ).trim()
  ) {
    errors.label =
      "Navigation label is required.";
  }

  const hrefInspection =
    inspectPublicNavigationHref(
      item?.href
    );

  if (!hrefInspection.valid) {
    errors.href =
      hrefInspection.message;
  }

  return errors;
}

function getAnnouncementHrefError(
  announcement
) {
  const href = String(
    announcement?.href || ""
  ).trim();

  if (!href) {
    return "";
  }

  const inspection =
    inspectPublicNavigationHref(
      href
    );

  return inspection.valid
    ? ""
    : inspection.message;
}

export default function NavbarContentEditor({
  initialContent,
}) {
  const normalizedInitialContent =
    useMemo(
      () =>
        normalizeNavbarContent(
          initialContent
        ),
      [initialContent]
    );

  const [navbar, setNavbar] =
    useState(
      normalizedInitialContent
    );

  const [
    savedNavbar,
    setSavedNavbar,
  ] = useState(
    normalizedInitialContent
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("");

  const [
    lastSavedAt,
    setLastSavedAt,
  ] = useState("");

  const sortedItems = useMemo(
    () =>
      [...navbar.items].sort(
        (
          firstItem,
          secondItem
        ) =>
          Number(
            firstItem.order || 0
          ) -
          Number(
            secondItem.order || 0
          )
      ),
    [navbar.items]
  );

  const navigationErrors =
    useMemo(() => {
      return new Map(
        navbar.items.map(
          (item) => [
            item.id,
            getNavigationItemErrors(
              item
            ),
          ]
        )
      );
    }, [navbar.items]);

  const announcementHrefError =
    useMemo(
      () =>
        getAnnouncementHrefError(
          navbar.announcement
        ),
      [navbar.announcement]
    );

  const hasUnsavedChanges =
    useMemo(
      () =>
        JSON.stringify(navbar) !==
        JSON.stringify(
          savedNavbar
        ),
      [navbar, savedNavbar]
    );

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  function updateRootField(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBranding(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      branding: {
        ...current.branding,
        [field]: value,
      },
    }));
  }

  function updateDesktop(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      desktop: {
        ...current.desktop,
        [field]: value,
      },
    }));
  }

  function updateMobile(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      mobile: {
        ...current.mobile,
        [field]: value,
      },
    }));
  }

  function updateAccount(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      account: {
        ...current.account,
        [field]: value,
      },
    }));
  }

  function updateAnnouncement(
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      announcement: {
        ...current.announcement,
        [field]: value,
      },
    }));
  }

  function addNavigationItem() {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      items: [
        ...current.items,
        {
          id: createId(
            "nav-item"
          ),
          label: "",
          href: "",
          order:
            current.items.length +
            1,
          isActive: true,
          openInNewTab: false,
        },
      ],
    }));
  }

  function updateNavigationItem(
    itemId,
    field,
    value
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      items:
        current.items.map(
          (item) =>
            item.id === itemId
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  }

  function removeNavigationItem(
    itemId
  ) {
    clearMessage();

    setNavbar((current) => ({
      ...current,

      items:
        current.items.filter(
          (item) =>
            item.id !== itemId
        ),
    }));
  }

  function discardChanges() {
    if (isSaving) {
      return;
    }

    setNavbar(
      normalizeNavbarContent(
        savedNavbar
      )
    );

    setMessage("");
    setMessageType("");
  }

  async function saveNavbar() {
    if (isSaving) {
      return;
    }

    const validation =
      validateNavbarContentInput(
        navbar
      );

    if (!validation.valid) {
      setMessageType("error");

      setMessage(
        validation.errors[0]
          ?.message ||
          "Please correct the Navbar fields before saving."
      );

      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage(
      "Saving Navbar..."
    );

    try {
      const response =
        await fetch(
          "/api/cms/navbar",
          {
            method: "PATCH",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              navbar
            ),
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        setMessageType("error");

        setMessage(
          data?.message ||
            "Navbar could not be saved."
        );

        return;
      }

      const normalizedContent =
        normalizeNavbarContent(
          data.content
        );

      setNavbar(
        normalizedContent
      );

      setSavedNavbar(
        normalizedContent
      );

      setMessageType(
        "success"
      );

      setMessage(
        "Navbar saved successfully."
      );

      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Navbar CMS save error:",
        error
      );

      setMessageType("error");

      setMessage(
        "Something went wrong while saving the Navbar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const messageClasses =
    messageType === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-200"
      : messageType ===
          "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
        : "border-white/10 bg-white/[0.04] text-neutral-300";

  return (
    <div className="space-y-10">
      <Panel
        title="Navbar Status"
        description="Enable or disable the public website navigation bar."
      >
        <CheckboxInput
          label="Enable Navbar"
          description="When disabled, the Navbar will not appear on public pages."
          checked={
            navbar.isEnabled
          }
          onChange={(value) =>
            updateRootField(
              "isEnabled",
              value
            )
          }
        />
      </Panel>

      <Panel
        title="Branding"
        description="Manage the Navbar store name, logo, alternative text, and display size."
      >
        <CheckboxInput
          label="Show Text Logo"
          description="The store name is used when no uploaded logo image is available."
          checked={
            navbar.branding
              .showTextLogo
          }
          onChange={(value) =>
            updateBranding(
              "showTextLogo",
              value
            )
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Store Name"
            value={
              navbar.branding
                .storeName
            }
            onChange={(value) =>
              updateBranding(
                "storeName",
                value
              )
            }
          />

          <TextInput
            label="Logo Alternative Text"
            value={
              navbar.branding
                .logoAlt
            }
            onChange={(value) =>
              updateBranding(
                "logoAlt",
                value
              )
            }
          />

          <TextInput
            label="Logo Width"
            type="number"
            min="40"
            max="500"
            value={
              navbar.branding
                .logoWidth
            }
            onChange={(value) =>
              updateBranding(
                "logoWidth",
                Number(
                  value || 180
                )
              )
            }
          />
        </div>

        <div>
          <FieldLabel>
            Navbar Logo
          </FieldLabel>

          <ImageUploader
            value={
              navbar.branding
                .logoUrl || ""
            }
            onChange={(value) =>
              updateBranding(
                "logoUrl",
                value
              )
            }
          />
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-neutral-400">
            An uploaded logo image
            takes priority over the
            text store name on the
            public Navbar.
          </p>
        </div>
      </Panel>

      <Panel
        title="Customer Account"
        description="Control the single premium Account entry shown to customers. Login, registration, and customer dashboard routing are handled securely by the website."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Account On Desktop"
            description="Display the unified Account action in the desktop Navbar."
            checked={
              navbar.account
                .showDesktop
            }
            onChange={(value) =>
              updateAccount(
                "showDesktop",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Account On Mobile"
            description="Display the unified Account action inside the mobile menu."
            checked={
              navbar.account
                .showMobile
            }
            onChange={(value) =>
              updateAccount(
                "showMobile",
                value
              )
            }
          />
        </div>

        <TextInput
          label="Account Label"
          value={
            navbar.account.label
          }
          placeholder="Account"
          onChange={(value) =>
            updateAccount(
              "label",
              value
            )
          }
        />

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-neutral-400">
            Logged-out customers are
            taken to the customer
            authentication page, where
            they can sign in or create
            an account. Logged-in
            customers are taken to
            their account dashboard.
            Admin access is never shown
            in the public Navbar.
          </p>
        </div>
      </Panel>

      <Panel
        title="Desktop Navigation Controls"
        description="Choose which customer utility actions should appear on desktop."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Wishlist"
            checked={
              navbar.desktop
                .showWishlist
            }
            onChange={(value) =>
              updateDesktop(
                "showWishlist",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Cart"
            checked={
              navbar.desktop
                .showCart
            }
            onChange={(value) =>
              updateDesktop(
                "showCart",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Search"
            checked={
              navbar.desktop
                .showSearch
            }
            onChange={(value) =>
              updateDesktop(
                "showSearch",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Mobile Navigation Controls"
        description="Choose which customer utility actions should appear in the mobile navigation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Wishlist"
            checked={
              navbar.mobile
                .showWishlist
            }
            onChange={(value) =>
              updateMobile(
                "showWishlist",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Cart"
            checked={
              navbar.mobile
                .showCart
            }
            onChange={(value) =>
              updateMobile(
                "showCart",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Search"
            checked={
              navbar.mobile
                .showSearch
            }
            onChange={(value) =>
              updateMobile(
                "showSearch",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Navigation Items"
        description="Create, reorder, enable, disable, and manage public navigation links. Admin and private routes are blocked."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            {sortedItems.length}{" "}
            navigation items
            configured.
          </p>

          <button
            type="button"
            onClick={
              addNavigationItem
            }
            className="w-fit border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
          >
            Add Navigation Item
          </button>
        </div>

        {sortedItems.length ===
        0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-400">
            No navigation items have
            been added.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedItems.map(
              (item, index) => {
                const itemErrors =
                  navigationErrors.get(
                    item.id
                  ) || {};

                return (
                  <article
                    key={item.id}
                    className="border border-white/10 bg-white/[0.02] p-5 md:p-6"
                  >
                    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                          Navigation Item{" "}
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </p>

                        <p className="mt-2 text-sm text-neutral-300">
                          {item.label ||
                            "Untitled Link"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeNavigationItem(
                            item.id
                          )
                        }
                        className="w-fit text-xs uppercase tracking-[0.25em] text-red-400 transition hover:text-red-300"
                      >
                        Remove Item
                      </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <TextInput
                        label="Label"
                        value={
                          item.label
                        }
                        error={
                          itemErrors.label
                        }
                        onChange={(
                          value
                        ) =>
                          updateNavigationItem(
                            item.id,
                            "label",
                            value
                          )
                        }
                      />

                      <TextInput
                        label="URL"
                        value={
                          item.href
                        }
                        error={
                          itemErrors.href
                        }
                        placeholder="/shop"
                        onChange={(
                          value
                        ) =>
                          updateNavigationItem(
                            item.id,
                            "href",
                            value
                          )
                        }
                      />

                      <TextInput
                        label="Display Order"
                        type="number"
                        value={
                          item.order
                        }
                        onChange={(
                          value
                        ) =>
                          updateNavigationItem(
                            item.id,
                            "order",
                            Number(
                              value ||
                                0
                            )
                          )
                        }
                      />

                      <CheckboxInput
                        label="Active"
                        checked={
                          item.isActive !==
                          false
                        }
                        onChange={(
                          value
                        ) =>
                          updateNavigationItem(
                            item.id,
                            "isActive",
                            value
                          )
                        }
                      />

                      <CheckboxInput
                        label="Open In New Tab"
                        checked={
                          item.openInNewTab ===
                          true
                        }
                        onChange={(
                          value
                        ) =>
                          updateNavigationItem(
                            item.id,
                            "openInNewTab",
                            value
                          )
                        }
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="Announcement Bar"
        description="Manage an optional announcement message and public destination link."
      >
        <CheckboxInput
          label="Enable Announcement"
          description="Display the announcement above the main Navbar."
          checked={
            navbar.announcement
              .isEnabled
          }
          onChange={(value) =>
            updateAnnouncement(
              "isEnabled",
              value
            )
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Announcement Text"
            value={
              navbar.announcement
                .text
            }
            placeholder="Free delivery on selected orders"
            onChange={(value) =>
              updateAnnouncement(
                "text",
                value
              )
            }
          />

          <TextInput
            label="Announcement URL"
            value={
              navbar.announcement
                .href
            }
            error={
              announcementHrefError
            }
            placeholder="/shop"
            onChange={(value) =>
              updateAnnouncement(
                "href",
                value
              )
            }
          />
        </div>

        <CheckboxInput
          label="Open Announcement Link In New Tab"
          checked={
            navbar.announcement
              .openInNewTab
          }
          onChange={(value) =>
            updateAnnouncement(
              "openInNewTab",
              value
            )
          }
        />
      </Panel>

      {message ? (
        <div
          className={`border p-5 text-sm ${messageClasses}`}
          role={
            messageType === "error"
              ? "alert"
              : "status"
          }
        >
          <span>{message}</span>

          {lastSavedAt &&
          messageType ===
            "success" ? (
            <span className="ml-2 opacity-70">
              Last saved at{" "}
              {lastSavedAt}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-5 z-20 border border-white/10 bg-[#080808]/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              discardChanges
            }
            disabled={
              isSaving ||
              !hasUnsavedChanges
            }
            className="border border-white/15 px-7 py-5 text-xs uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
          >
            Discard Changes
          </button>

          <button
            type="button"
            onClick={saveNavbar}
            disabled={
              isSaving ||
              !hasUnsavedChanges
            }
            className="flex-1 bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Saving Navbar..."
              : "Save Navbar"}
          </button>
        </div>
      </div>
    </div>
  );
}