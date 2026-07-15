  "use client";

import { useMemo, useState } from "react";
import ImageUploader from "./ImageUploader";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeAboutContent(content = {}) {
  return {
    key: "about",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",
    title: content.title || "About",
    slug: content.slug || "about",

    seo: {
      title: content.seo?.title || "About",
      description: content.seo?.description || "",
      keywords: content.seo?.keywords || "",
      ogImage: content.seo?.ogImage || "",
      canonical: content.seo?.canonical || "/about",
      index: content.seo?.index !== false,
    },

    sections: Array.isArray(content.sections)
      ? cloneValue(content.sections)
      : [],
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

function SectionCard({
  title,
  subtitle,
  enabled,
  order,
  onEnabledChange,
  onOrderChange,
  children,
}) {
  return (
    <section className="border border-white/10 bg-[#0d0d0d]">
      <div className="flex flex-col gap-5 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light">{title}</h2>

          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-neutral-400">
            <input
              type="checkbox"
              checked={enabled !== false}
              onChange={(event) =>
                onEnabledChange(event.target.checked)
              }
            />
            Enabled
          </label>

          <input
            type="number"
            value={order ?? 0}
            onChange={(event) =>
              onOrderChange(Number(event.target.value || 0))
            }
            className="w-24 border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm outline-none"
            aria-label={`${title} display order`}
          />
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">{children}</div>
    </section>
  );
}

function getSectionTitle(type) {
  if (type === "heroText") return "Hero";
  if (type === "splitText") return "Philosophy";
  if (type === "darkText") return "Why Obsidian";
  if (type === "text") return "Origin";
  if (type === "cta") return "Call To Action";

  return "About Section";
}

export default function AboutContentEditor({ initialContent }) {
  const [about, setAbout] = useState(() =>
    normalizeAboutContent(initialContent)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sortedSections = useMemo(() => {
    return [...about.sections].sort(
      (firstSection, secondSection) =>
        Number(firstSection.order || 0) -
        Number(secondSection.order || 0)
    );
  }, [about.sections]);

  function updateRootField(field, value) {
    setMessage("");

    setAbout((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    setMessage("");

    setAbout((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateSection(sectionId, updater) {
    setMessage("");

    setAbout((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return updater(section);
      }),
    }));
  }

  function updateSectionField(sectionId, field, value) {
    updateSection(sectionId, (section) => ({
      ...section,
      [field]: value,
    }));
  }

  function updateContentField(sectionId, field, value) {
    updateSection(sectionId, (section) => ({
      ...section,
      content: {
        ...(section.content || {}),
        [field]: value,
      },
    }));
  }

  async function saveAboutPage() {
    setIsSaving(true);
    setMessage("Saving About page...");

    try {
      const response = await fetch("/api/cms/about", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(about),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "About page could not be saved."
        );
        return;
      }

      setAbout(normalizeAboutContent(data.content));
      setMessage("About page saved successfully.");
    } catch {
      setMessage(
        "Something went wrong while saving the About page."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderTextSectionEditor(section) {
    const content = section.content || {};

    return (
      <>
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.eyebrow}
            onChange={(value) =>
              updateContentField(section.id, "eyebrow", value)
            }
          />

          <TextInput
            label="Title"
            value={content.title}
            onChange={(value) =>
              updateContentField(section.id, "title", value)
            }
          />
        </div>

        <TextareaInput
          label="Description"
          value={content.description}
          onChange={(value) =>
            updateContentField(section.id, "description", value)
          }
          rows={6}
        />
      </>
    );
  }

  function renderCtaEditor(section) {
    const content = section.content || {};

    return (
      <>
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.eyebrow}
            onChange={(value) =>
              updateContentField(section.id, "eyebrow", value)
            }
          />

          <TextInput
            label="Title"
            value={content.title}
            onChange={(value) =>
              updateContentField(section.id, "title", value)
            }
          />
        </div>

        <TextareaInput
          label="Description"
          value={content.description}
          onChange={(value) =>
            updateContentField(section.id, "description", value)
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Button Text"
            value={content.buttonText}
            onChange={(value) =>
              updateContentField(section.id, "buttonText", value)
            }
          />

          <TextInput
            label="Button Link"
            value={content.buttonHref}
            onChange={(value) =>
              updateContentField(section.id, "buttonHref", value)
            }
          />
        </div>
      </>
    );
  }

  function renderSectionEditor(section) {
    if (section.type === "cta") {
      return renderCtaEditor(section);
    }

    return renderTextSectionEditor(section);
  }

  return (
    <div className="space-y-10">
      <section className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
        <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
          Page Configuration
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={about.title}
            onChange={(value) =>
              updateRootField("title", value)
            }
          />

          <TextInput
            label="Slug"
            value={about.slug}
            onChange={(value) =>
              updateRootField("slug", value)
            }
          />

          <SelectInput
            label="Publish Status"
            value={about.status}
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
      </section>

      <section className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
        <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
          About Page SEO
        </p>

        <div className="grid gap-6">
          <TextInput
            label="SEO Title"
            value={about.seo.title}
            onChange={(value) =>
              updateSeo("title", value)
            }
          />

          <TextareaInput
            label="SEO Description"
            value={about.seo.description}
            onChange={(value) =>
              updateSeo("description", value)
            }
          />

          <TextInput
            label="SEO Keywords"
            value={about.seo.keywords}
            onChange={(value) =>
              updateSeo("keywords", value)
            }
          />

          <TextInput
            label="Canonical URL"
            value={about.seo.canonical}
            onChange={(value) =>
              updateSeo("canonical", value)
            }
          />

          <div>
            <FieldLabel>Open Graph Image</FieldLabel>

            <ImageUploader
              value={about.seo.ogImage || ""}
              onChange={(value) =>
                updateSeo("ogImage", value)
              }
            />
          </div>

          <CheckboxInput
            label="Allow Search Engine Indexing"
            checked={about.seo.index !== false}
            onChange={(value) =>
              updateSeo("index", value)
            }
          />
        </div>
      </section>

      {sortedSections.map((section) => (
        <SectionCard
          key={section.id}
          title={getSectionTitle(section.type)}
          subtitle={`Section type: ${section.type}`}
          enabled={section.isEnabled}
          order={section.order}
          onEnabledChange={(value) =>
            updateSectionField(
              section.id,
              "isEnabled",
              value
            )
          }
          onOrderChange={(value) =>
            updateSectionField(
              section.id,
              "order",
              value
            )
          }
        >
          {renderSectionEditor(section)}
        </SectionCard>
      ))}

      {about.sections.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.03] p-8 text-sm text-neutral-400">
          No About page sections were found.
        </div>
      ) : null}

      {message ? (
        <div className="border border-white/10 bg-white/[0.04] p-5 text-sm text-neutral-300">
          {message}
        </div>
      ) : null}

      <div className="sticky bottom-5 z-20">
        <button
          type="button"
          onClick={saveAboutPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving About Page..."
            : "Save About Page"}
        </button>
      </div>
    </div>
  );
}