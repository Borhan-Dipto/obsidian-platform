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

function normalizeFooterContent(content = {}) {
  return {
    key: "footer",
    schemaVersion: Number(content.schemaVersion || 1),
    isEnabled: content.isEnabled !== false,

    brand: {
      showLogo: content.brand?.showLogo === true,
      logoUrl: content.brand?.logoUrl || "",
      logoAlt: content.brand?.logoAlt || "OBSIDIAN",
      description:
        content.brand?.description ||
        "Built under pressure. Finished with precision.",
      showEmail: content.brand?.showEmail !== false,
      showLocation: content.brand?.showLocation !== false,
      showPhone: content.brand?.showPhone === true,
    },

    columns: Array.isArray(content.columns)
      ? cloneValue(content.columns)
      : [],

    newsletter: {
      isEnabled: content.newsletter?.isEnabled !== false,
      title: content.newsletter?.title || "Stay In Touch",
      description:
        content.newsletter?.description ||
        "Join the OBSIDIAN community for future drops, stories, and private releases.",
      placeholder:
        content.newsletter?.placeholder || "Email address",
      buttonText: content.newsletter?.buttonText || "Join",
      successMessage:
        content.newsletter?.successMessage ||
        "Thank you for joining OBSIDIAN.",
    },

    social: {
      showFacebook: content.social?.showFacebook !== false,
      showInstagram: content.social?.showInstagram !== false,
      showTikTok: content.social?.showTikTok !== false,
      showYouTube: content.social?.showYouTube !== false,
    },

    legal: {
      copyrightText:
        content.legal?.copyrightText ||
        "OBSIDIAN. All rights reserved.",
      showCurrentYear: content.legal?.showCurrentYear !== false,
      links: Array.isArray(content.legal?.links)
        ? cloneValue(content.legal.links)
        : [],
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
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
      />
    </div>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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

export default function FooterContentEditor({
  initialContent,
}) {
  const [footer, setFooter] = useState(() =>
    normalizeFooterContent(initialContent)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");

  const sortedColumns = useMemo(() => {
    return [...footer.columns].sort(
      (firstColumn, secondColumn) =>
        Number(firstColumn.order || 0) -
        Number(secondColumn.order || 0)
    );
  }, [footer.columns]);

  const sortedLegalLinks = useMemo(() => {
    return [...footer.legal.links].sort(
      (firstLink, secondLink) =>
        Number(firstLink.order || 0) -
        Number(secondLink.order || 0)
    );
  }, [footer.legal.links]);

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  function updateRootField(field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBrand(field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      brand: {
        ...current.brand,
        [field]: value,
      },
    }));
  }

  function updateNewsletter(field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      newsletter: {
        ...current.newsletter,
        [field]: value,
      },
    }));
  }

  function updateSocial(field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      social: {
        ...current.social,
        [field]: value,
      },
    }));
  }

  function updateLegal(field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      legal: {
        ...current.legal,
        [field]: value,
      },
    }));
  }

  function addColumn() {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: [
        ...current.columns,
        {
          id: createId("footer-column"),
          title: "New Column",
          order: current.columns.length + 1,
          isActive: true,
          links: [],
        },
      ],
    }));
  }

  function updateColumn(columnId, field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: current.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              [field]: value,
            }
          : column
      ),
    }));
  }

  function removeColumn(columnId) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: current.columns.filter(
        (column) => column.id !== columnId
      ),
    }));
  }

  function addColumnLink(columnId) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: current.columns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        const existingLinks = Array.isArray(column.links)
          ? column.links
          : [];

        return {
          ...column,
          links: [
            ...existingLinks,
            {
              id: createId("footer-link"),
              label: "",
              href: "",
              order: existingLinks.length + 1,
              isActive: true,
              openInNewTab: false,
            },
          ],
        };
      }),
    }));
  }

  function updateColumnLink(
    columnId,
    linkId,
    field,
    value
  ) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: current.columns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        return {
          ...column,
          links: (column.links || []).map((link) =>
            link.id === linkId
              ? {
                  ...link,
                  [field]: value,
                }
              : link
          ),
        };
      }),
    }));
  }

  function removeColumnLink(columnId, linkId) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      columns: current.columns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        return {
          ...column,
          links: (column.links || []).filter(
            (link) => link.id !== linkId
          ),
        };
      }),
    }));
  }

  function addLegalLink() {
    clearMessage();

    setFooter((current) => ({
      ...current,
      legal: {
        ...current.legal,
        links: [
          ...current.legal.links,
          {
            id: createId("legal-link"),
            label: "",
            href: "",
            order: current.legal.links.length + 1,
            isActive: true,
            openInNewTab: false,
          },
        ],
      },
    }));
  }

  function updateLegalLink(linkId, field, value) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      legal: {
        ...current.legal,
        links: current.legal.links.map((link) =>
          link.id === linkId
            ? {
                ...link,
                [field]: value,
              }
            : link
        ),
      },
    }));
  }

  function removeLegalLink(linkId) {
    clearMessage();

    setFooter((current) => ({
      ...current,
      legal: {
        ...current.legal,
        links: current.legal.links.filter(
          (link) => link.id !== linkId
        ),
      },
    }));
  }

  async function saveFooter() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage("Saving Footer...");

    try {
      const response = await fetch("/api/cms/footer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(footer),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessageType("error");
        setMessage(
          data.message || "Footer could not be saved."
        );
        return;
      }

      setFooter(
        normalizeFooterContent(data.content)
      );

      setMessageType("success");
      setMessage("Footer saved successfully.");
      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error("Footer CMS save error:", error);

      setMessageType("error");
      setMessage(
        "Something went wrong while saving the Footer."
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
        title="Footer Status"
        description="Enable or disable the public website footer."
      >
        <CheckboxInput
          label="Enable Footer"
          description="When disabled, the Footer component will not appear on public pages."
          checked={footer.isEnabled}
          onChange={(value) =>
            updateRootField("isEnabled", value)
          }
        />
      </Panel>

      <Panel
        title="Brand Area"
        description="Manage footer branding, description, logo, and contact visibility."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Uploaded Logo"
            description="When enabled and a logo exists, the uploaded logo replaces the text store name."
            checked={footer.brand.showLogo}
            onChange={(value) =>
              updateBrand("showLogo", value)
            }
          />

          <CheckboxInput
            label="Show Email"
            checked={footer.brand.showEmail}
            onChange={(value) =>
              updateBrand("showEmail", value)
            }
          />

          <CheckboxInput
            label="Show Location"
            checked={footer.brand.showLocation}
            onChange={(value) =>
              updateBrand("showLocation", value)
            }
          />

          <CheckboxInput
            label="Show Phone"
            checked={footer.brand.showPhone}
            onChange={(value) =>
              updateBrand("showPhone", value)
            }
          />
        </div>

        <TextInput
          label="Logo Alternative Text"
          value={footer.brand.logoAlt}
          onChange={(value) =>
            updateBrand("logoAlt", value)
          }
        />

        <TextareaInput
          label="Brand Description"
          value={footer.brand.description}
          onChange={(value) =>
            updateBrand("description", value)
          }
          rows={4}
        />

        <div>
          <FieldLabel>Footer Logo</FieldLabel>

          <ImageUploader
            value={footer.brand.logoUrl || ""}
            onChange={(value) =>
              updateBrand("logoUrl", value)
            }
          />
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-neutral-400">
            Store name, email, phone, location, and social
            profile URLs are managed from Admin Settings.
          </p>
        </div>
      </Panel>

      <Panel
        title="Footer Columns"
        description="Create navigation columns and manage their links, display order, and visibility."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            {sortedColumns.length} footer columns configured.
          </p>

          <button
            type="button"
            onClick={addColumn}
            className="w-fit border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
          >
            Add Column
          </button>
        </div>

        {sortedColumns.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-400">
            No footer columns have been added.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedColumns.map((column, columnIndex) => {
              const sortedLinks = [...(column.links || [])].sort(
                (firstLink, secondLink) =>
                  Number(firstLink.order || 0) -
                  Number(secondLink.order || 0)
              );

              return (
                <article
                  key={column.id}
                  className="border border-white/10 bg-white/[0.02] p-5 md:p-6"
                >
                  <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Column{" "}
                        {String(columnIndex + 1).padStart(
                          2,
                          "0"
                        )}
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {column.title || "Untitled Column"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeColumn(column.id)
                      }
                      className="w-fit text-xs uppercase tracking-[0.25em] text-red-400 transition hover:text-red-300"
                    >
                      Remove Column
                    </button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <TextInput
                      label="Column Title"
                      value={column.title}
                      onChange={(value) =>
                        updateColumn(
                          column.id,
                          "title",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Display Order"
                      type="number"
                      value={column.order}
                      onChange={(value) =>
                        updateColumn(
                          column.id,
                          "order",
                          Number(value || 0)
                        )
                      }
                    />

                    <CheckboxInput
                      label="Column Active"
                      checked={column.isActive !== false}
                      onChange={(value) =>
                        updateColumn(
                          column.id,
                          "isActive",
                          value
                        )
                      }
                    />
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Column Links
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          addColumnLink(column.id)
                        }
                        className="w-fit border border-white/15 px-4 py-3 text-[10px] uppercase tracking-[0.25em] transition hover:bg-white/5"
                      >
                        Add Link
                      </button>
                    </div>

                    {sortedLinks.length === 0 ? (
                      <div className="mt-5 border border-white/10 bg-white/[0.02] p-5 text-sm text-neutral-500">
                        No links in this column.
                      </div>
                    ) : (
                      <div className="mt-5 space-y-5">
                        {sortedLinks.map((link, linkIndex) => (
                          <div
                            key={link.id}
                            className="border border-white/10 bg-[#0b0b0b] p-5"
                          >
                            <div className="mb-5 flex items-center justify-between gap-4">
                              <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-600">
                                Link{" "}
                                {String(
                                  linkIndex + 1
                                ).padStart(2, "0")}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  removeColumnLink(
                                    column.id,
                                    link.id
                                  )
                                }
                                className="text-[10px] uppercase tracking-[0.24em] text-red-400"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <TextInput
                                label="Label"
                                value={link.label}
                                onChange={(value) =>
                                  updateColumnLink(
                                    column.id,
                                    link.id,
                                    "label",
                                    value
                                  )
                                }
                              />

                              <TextInput
                                label="URL"
                                value={link.href}
                                placeholder="/shop"
                                onChange={(value) =>
                                  updateColumnLink(
                                    column.id,
                                    link.id,
                                    "href",
                                    value
                                  )
                                }
                              />

                              <TextInput
                                label="Display Order"
                                type="number"
                                value={link.order}
                                onChange={(value) =>
                                  updateColumnLink(
                                    column.id,
                                    link.id,
                                    "order",
                                    Number(value || 0)
                                  )
                                }
                              />

                              <CheckboxInput
                                label="Active"
                                checked={link.isActive !== false}
                                onChange={(value) =>
                                  updateColumnLink(
                                    column.id,
                                    link.id,
                                    "isActive",
                                    value
                                  )
                                }
                              />

                              <CheckboxInput
                                label="Open In New Tab"
                                checked={
                                  link.openInNewTab === true
                                }
                                onChange={(value) =>
                                  updateColumnLink(
                                    column.id,
                                    link.id,
                                    "openInNewTab",
                                    value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title="Newsletter"
        description="Manage the footer newsletter heading, form labels, and success message."
      >
        <CheckboxInput
          label="Enable Newsletter"
          checked={footer.newsletter.isEnabled}
          onChange={(value) =>
            updateNewsletter("isEnabled", value)
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Newsletter Title"
            value={footer.newsletter.title}
            onChange={(value) =>
              updateNewsletter("title", value)
            }
          />

          <TextInput
            label="Email Placeholder"
            value={footer.newsletter.placeholder}
            onChange={(value) =>
              updateNewsletter("placeholder", value)
            }
          />

          <TextInput
            label="Button Text"
            value={footer.newsletter.buttonText}
            onChange={(value) =>
              updateNewsletter("buttonText", value)
            }
          />

          <TextInput
            label="Success Message"
            value={footer.newsletter.successMessage}
            onChange={(value) =>
              updateNewsletter(
                "successMessage",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="Newsletter Description"
          value={footer.newsletter.description}
          onChange={(value) =>
            updateNewsletter("description", value)
          }
          rows={4}
        />
      </Panel>

      <Panel
        title="Social Platforms"
        description="Choose which configured social profiles should appear in the footer."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Facebook"
            checked={footer.social.showFacebook}
            onChange={(value) =>
              updateSocial("showFacebook", value)
            }
          />

          <CheckboxInput
            label="Show Instagram"
            checked={footer.social.showInstagram}
            onChange={(value) =>
              updateSocial("showInstagram", value)
            }
          />

          <CheckboxInput
            label="Show TikTok"
            checked={footer.social.showTikTok}
            onChange={(value) =>
              updateSocial("showTikTok", value)
            }
          />

          <CheckboxInput
            label="Show YouTube"
            checked={footer.social.showYouTube}
            onChange={(value) =>
              updateSocial("showYouTube", value)
            }
          />
        </div>
      </Panel>

      <Panel
        title="Legal And Copyright"
        description="Manage copyright text, year visibility, and legal navigation links."
      >
        <TextInput
          label="Copyright Text"
          value={footer.legal.copyrightText}
          onChange={(value) =>
            updateLegal("copyrightText", value)
          }
        />

        <CheckboxInput
          label="Show Current Year"
          checked={footer.legal.showCurrentYear}
          onChange={(value) =>
            updateLegal("showCurrentYear", value)
          }
        />

        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Legal Links
            </p>

            <button
              type="button"
              onClick={addLegalLink}
              className="w-fit border border-white/15 px-4 py-3 text-[10px] uppercase tracking-[0.25em] transition hover:bg-white/5"
            >
              Add Legal Link
            </button>
          </div>

          {sortedLegalLinks.length === 0 ? (
            <div className="mt-5 border border-white/10 bg-white/[0.02] p-5 text-sm text-neutral-500">
              No legal links have been added.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {sortedLegalLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="border border-white/10 bg-white/[0.02] p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-600">
                      Legal Link{" "}
                      {String(index + 1).padStart(2, "0")}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removeLegalLink(link.id)
                      }
                      className="text-[10px] uppercase tracking-[0.24em] text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      label="Label"
                      value={link.label}
                      onChange={(value) =>
                        updateLegalLink(
                          link.id,
                          "label",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="URL"
                      value={link.href}
                      placeholder="/privacy-policy"
                      onChange={(value) =>
                        updateLegalLink(
                          link.id,
                          "href",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Display Order"
                      type="number"
                      value={link.order}
                      onChange={(value) =>
                        updateLegalLink(
                          link.id,
                          "order",
                          Number(value || 0)
                        )
                      }
                    />

                    <CheckboxInput
                      label="Active"
                      checked={link.isActive !== false}
                      onChange={(value) =>
                        updateLegalLink(
                          link.id,
                          "isActive",
                          value
                        )
                      }
                    />

                    <CheckboxInput
                      label="Open In New Tab"
                      checked={link.openInNewTab === true}
                      onChange={(value) =>
                        updateLegalLink(
                          link.id,
                          "openInNewTab",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
          onClick={saveFooter}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Footer..."
            : "Save Footer"}
        </button>
      </div>
    </div>
  );
}