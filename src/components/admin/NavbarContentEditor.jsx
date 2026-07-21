"use client";

import { useMemo, useState } from "react";
import ImageUploader from "./ImageUploader";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeNavbarContent(content = {}) {
  return {
    key: "navbar",
    schemaVersion: Number(content.schemaVersion || 1),
    isEnabled: content.isEnabled !== false,

    branding: {
      showTextLogo:
        content.branding?.showTextLogo !== false,
      storeName:
        content.branding?.storeName || "OBSIDIAN",
      logoUrl: content.branding?.logoUrl || "",
      logoAlt:
        content.branding?.logoAlt || "OBSIDIAN",
      logoWidth: Number(
        content.branding?.logoWidth || 180
      ),
    },

    desktop: {
      showWishlist:
        content.desktop?.showWishlist !== false,
      showCart:
        content.desktop?.showCart !== false,
      showSearch:
        content.desktop?.showSearch === true,
      showAdminLink:
        content.desktop?.showAdminLink === true,
    },

    mobile: {
      showWishlist:
        content.mobile?.showWishlist !== false,
      showCart:
        content.mobile?.showCart !== false,
      showSearch:
        content.mobile?.showSearch === true,
    },

    items: Array.isArray(content.items)
      ? cloneValue(content.items)
      : [],

    announcement: {
      isEnabled:
        content.announcement?.isEnabled === true,
      text:
        content.announcement?.text || "",
      href:
        content.announcement?.href || "",
      openInNewTab:
        content.announcement?.openInNewTab === true,
    },
  };
}

function FieldLabel({ children }) {
  return (
    <label className="mb-3 block text-[10px] uppercase tracking-[0.32em] text-neutral-500">
      {children}
    </label>
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
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <input
        type={type}
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
      />
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
        checked={Boolean(checked)}
        onChange={(event) =>
          onChange(event.target.checked)
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

export default function NavbarContentEditor({
  initialContent,
}) {
  const [navbar, setNavbar] = useState(() =>
    normalizeNavbarContent(initialContent)
  );

  const [isSaving, setIsSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [messageType, setMessageType] =
    useState("");
  const [lastSavedAt, setLastSavedAt] =
    useState("");

  const sortedItems = useMemo(() => {
    return [...navbar.items].sort(
      (firstItem, secondItem) =>
        Number(firstItem.order || 0) -
        Number(secondItem.order || 0)
    );
  }, [navbar.items]);

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  function updateRootField(field, value) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBranding(field, value) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      branding: {
        ...current.branding,
        [field]: value,
      },
    }));
  }

  function updateDesktop(field, value) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      desktop: {
        ...current.desktop,
        [field]: value,
      },
    }));
  }

  function updateMobile(field, value) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      mobile: {
        ...current.mobile,
        [field]: value,
      },
    }));
  }

  function updateAnnouncement(field, value) {
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
          id: createId("nav-item"),
          label: "",
          href: "",
          order: current.items.length + 1,
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
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  }

  function removeNavigationItem(itemId) {
    clearMessage();

    setNavbar((current) => ({
      ...current,
      items: current.items.filter(
        (item) => item.id !== itemId
      ),
    }));
  }

  async function saveNavbar() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage("Saving Navbar...");

    try {
      const response = await fetch(
        "/api/cms/navbar",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(navbar),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessageType("error");
        setMessage(
          data.message ||
            "Navbar could not be saved."
        );
        return;
      }

      setNavbar(
        normalizeNavbarContent(data.content)
      );

      setMessageType("success");
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
      : messageType === "success"
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
          description="When disabled, the Navbar component will not appear on public pages."
          checked={navbar.isEnabled}
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
        description="Manage the navbar store name, logo, alternative text, and logo display size."
      >
        <CheckboxInput
          label="Show Text Logo"
          description="When enabled, the store name can be shown when no uploaded logo is displayed."
          checked={
            navbar.branding.showTextLogo
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
              navbar.branding.storeName
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
            value={navbar.branding.logoAlt}
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
              navbar.branding.logoWidth
            }
            onChange={(value) =>
              updateBranding(
                "logoWidth",
                Number(value || 180)
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
              navbar.branding.logoUrl || ""
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
            If a logo image is uploaded, the
            public Navbar can use it instead
            of the text store name, depending
            on the current Navbar component
            behavior.
          </p>
        </div>
      </Panel>

      <Panel
        title="Desktop Navigation Controls"
        description="Choose which utility actions should appear on desktop navigation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Wishlist"
            checked={
              navbar.desktop.showWishlist
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
              navbar.desktop.showCart
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
              navbar.desktop.showSearch
            }
            onChange={(value) =>
              updateDesktop(
                "showSearch",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Admin Link"
            description="Useful during development. Normally keep this disabled on the public storefront."
            checked={
              navbar.desktop.showAdminLink
            }
            onChange={(value) =>
              updateDesktop(
                "showAdminLink",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Mobile Navigation Controls"
        description="Choose which utility actions should appear in the mobile navigation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Wishlist"
            checked={
              navbar.mobile.showWishlist
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
              navbar.mobile.showCart
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
              navbar.mobile.showSearch
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
        description="Create, reorder, enable, disable, and manage public navigation links."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            {sortedItems.length} navigation
            items configured.
          </p>

          <button
            type="button"
            onClick={addNavigationItem}
            className="w-fit border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
          >
            Add Navigation Item
          </button>
        </div>

        {sortedItems.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-400">
            No navigation items have been
            added.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedItems.map(
              (item, index) => (
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
                        ).padStart(2, "0")}
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
                      value={item.label}
                      onChange={(value) =>
                        updateNavigationItem(
                          item.id,
                          "label",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="URL"
                      value={item.href}
                      placeholder="/shop"
                      onChange={(value) =>
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
                      value={item.order}
                      onChange={(value) =>
                        updateNavigationItem(
                          item.id,
                          "order",
                          Number(value || 0)
                        )
                      }
                    />

                    <CheckboxInput
                      label="Active"
                      checked={
                        item.isActive !== false
                      }
                      onChange={(value) =>
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
                      onChange={(value) =>
                        updateNavigationItem(
                          item.id,
                          "openInNewTab",
                          value
                        )
                      }
                    />
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="Announcement Bar"
        description="Manage an optional announcement message and destination link."
      >
        <CheckboxInput
          label="Enable Announcement"
          description="The public Navbar must support the announcement field for this message to appear."
          checked={
            navbar.announcement.isEnabled
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
              navbar.announcement.text
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
              navbar.announcement.href
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
          messageType === "success" ? (
            <span className="ml-2 opacity-70">
              Last saved at {lastSavedAt}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-5 z-20">
        <button
          type="button"
          onClick={saveNavbar}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Navbar..."
            : "Save Navbar"}
        </button>
      </div>
    </div>
  );
}