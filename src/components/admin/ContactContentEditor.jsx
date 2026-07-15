"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

function normalizeContactContent(content = {}) {
  return {
    key: "contact",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",
    title: content.title || "Contact",
    slug: content.slug || "contact",

    seo: {
      title: content.seo?.title || "Contact",
      description: content.seo?.description || "",
      keywords: content.seo?.keywords || "",
      ogImage: content.seo?.ogImage || "",
      canonical: content.seo?.canonical || "/contact",
      index: content.seo?.index !== false,
    },

    content: {
      eyebrow: content.content?.eyebrow || "Contact",
      title: content.content?.title || "Reach Obsidian",
      description:
        content.content?.description ||
        "For product questions, order support, collaborations, or general inquiries, contact the OBSIDIAN team.",

      supportTitle:
        content.content?.supportTitle || "Order Support",

      supportDescription:
        content.content?.supportDescription ||
        "Get help with order confirmation, delivery, exchange, or product availability.",

      collaborationTitle:
        content.content?.collaborationTitle || "Collaborations",

      collaborationDescription:
        content.content?.collaborationDescription ||
        "Contact us for creative partnerships, campaigns, wholesale, and brand opportunities.",

      whatsappButtonText:
        content.content?.whatsappButtonText ||
        "Message On WhatsApp",

      emailButtonText:
        content.content?.emailButtonText || "Send An Email",

      whatsappMessage:
        content.content?.whatsappMessage ||
        "Hello OBSIDIAN, I would like to know more about your products.",
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

function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-white/10 bg-[#111] px-5 py-4 text-sm text-[#f1ece4] outline-none transition focus:border-white/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxInput({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 border border-white/10 bg-white/[0.03] px-5 py-4">
      <span className="text-sm text-neutral-300">{label}</span>

      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function Panel({ title, description = "", children }) {
  return (
    <section className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          {title}
        </p>

        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default function ContactContentEditor({ initialContent }) {
  const [contact, setContact] = useState(() =>
    normalizeContactContent(initialContent)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");

  function updateRootField(field, value) {
    setMessage("");

    setContact((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    setMessage("");

    setContact((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateContent(field, value) {
    setMessage("");

    setContact((current) => ({
      ...current,
      content: {
        ...current.content,
        [field]: value,
      },
    }));
  }

  async function saveContactPage() {
    setIsSaving(true);
    setMessage("Saving Contact page...");

    try {
      const response = await fetch("/api/cms/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Contact page could not be saved."
        );
        return;
      }

      setContact(normalizeContactContent(data.content));
      setMessage("Contact page saved successfully.");
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch {
      setMessage(
        "Something went wrong while saving the Contact page."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <Panel
        title="Page Configuration"
        description="Control the page identity and publication status."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={contact.title}
            onChange={(value) =>
              updateRootField("title", value)
            }
          />

          <TextInput
            label="Slug"
            value={contact.slug}
            onChange={(value) =>
              updateRootField("slug", value)
            }
          />

          <SelectInput
            label="Publish Status"
            value={contact.status}
            onChange={(value) =>
              updateRootField("status", value)
            }
            options={[
              {
                value: "published",
                label: "Published",
              },
              {
                value: "draft",
                label: "Draft",
              },
            ]}
          />
        </div>
      </Panel>

      <Panel
        title="Contact Page Content"
        description="Edit the main heading and introduction shown at the top of the Contact page."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={contact.content.eyebrow}
            onChange={(value) =>
              updateContent("eyebrow", value)
            }
          />

          <TextInput
            label="Main Title"
            value={contact.content.title}
            onChange={(value) =>
              updateContent("title", value)
            }
          />
        </div>

        <TextareaInput
          label="Main Description"
          value={contact.content.description}
          onChange={(value) =>
            updateContent("description", value)
          }
          rows={6}
        />
      </Panel>

      <Panel
        title="Order Support"
        description="Explain how customers can receive help with purchases, delivery, and exchanges."
      >
        <TextInput
          label="Support Title"
          value={contact.content.supportTitle}
          onChange={(value) =>
            updateContent("supportTitle", value)
          }
        />

        <TextareaInput
          label="Support Description"
          value={contact.content.supportDescription}
          onChange={(value) =>
            updateContent("supportDescription", value)
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Collaborations"
        description="Manage messaging for partnerships, wholesale, campaigns, and business opportunities."
      >
        <TextInput
          label="Collaboration Title"
          value={contact.content.collaborationTitle}
          onChange={(value) =>
            updateContent("collaborationTitle", value)
          }
        />

        <TextareaInput
          label="Collaboration Description"
          value={contact.content.collaborationDescription}
          onChange={(value) =>
            updateContent(
              "collaborationDescription",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Contact Buttons"
        description="Control the labels and default WhatsApp message used by the Contact page buttons."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="WhatsApp Button Text"
            value={contact.content.whatsappButtonText}
            onChange={(value) =>
              updateContent(
                "whatsappButtonText",
                value
              )
            }
          />

          <TextInput
            label="Email Button Text"
            value={contact.content.emailButtonText}
            onChange={(value) =>
              updateContent(
                "emailButtonText",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="Default WhatsApp Message"
          value={contact.content.whatsappMessage}
          onChange={(value) =>
            updateContent("whatsappMessage", value)
          }
          rows={4}
        />

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-neutral-400">
            Email, phone, WhatsApp number, and store location are
            managed from the main Admin Settings page.
          </p>
        </div>
      </Panel>

      <Panel
        title="Contact Page SEO"
        description="Manage search engine metadata and social sharing information."
      >
        <TextInput
          label="SEO Title"
          value={contact.seo.title}
          onChange={(value) =>
            updateSeo("title", value)
          }
        />

        <TextareaInput
          label="SEO Description"
          value={contact.seo.description}
          onChange={(value) =>
            updateSeo("description", value)
          }
          rows={5}
        />

        <TextInput
          label="SEO Keywords"
          value={contact.seo.keywords}
          onChange={(value) =>
            updateSeo("keywords", value)
          }
          placeholder="obsidian, contact, order support"
        />

        <TextInput
          label="Canonical URL"
          value={contact.seo.canonical}
          onChange={(value) =>
            updateSeo("canonical", value)
          }
          placeholder="/contact"
        />

        <div>
          <FieldLabel>Open Graph Image</FieldLabel>

          <ImageUploader
            value={contact.seo.ogImage || ""}
            onChange={(value) =>
              updateSeo("ogImage", value)
            }
          />
        </div>

        <CheckboxInput
          label="Allow Search Engine Indexing"
          checked={contact.seo.index !== false}
          onChange={(value) =>
            updateSeo("index", value)
          }
        />
      </Panel>

      {message ? (
        <div className="border border-white/10 bg-white/[0.04] p-5 text-sm text-neutral-300">
          {message}

          {lastSavedAt ? (
            <span className="ml-2 text-neutral-500">
              Last saved at {lastSavedAt}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-5 z-20">
        <button
          type="button"
          onClick={saveContactPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Contact Page..."
            : "Save Contact Page"}
        </button>
      </div>
    </div>
  );
}