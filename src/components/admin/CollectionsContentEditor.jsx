"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

function normalizeCollectionsContent(content = {}) {
  return {
    key: "collections",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",
    title: content.title || "Collections",
    slug: content.slug || "collections",

    seo: {
      title: content.seo?.title || "Collections",
      description:
        content.seo?.description ||
        "Explore OBSIDIAN collections shaped around pressure, precision, minimal form, and quiet strength.",
      keywords: content.seo?.keywords || "",
      ogImage:
        content.seo?.ogImage ||
        "/images/collection-artifact.jpeg",
      canonical:
        content.seo?.canonical || "/collections",
      index: content.seo?.index !== false,
    },

    content: {
      breadcrumbHomeLabel:
        content.content?.breadcrumbHomeLabel ||
        "Home",

      breadcrumbCurrentLabel:
        content.content?.breadcrumbCurrentLabel ||
        "Collections",

      eyebrow:
        content.content?.eyebrow ||
        "Collections",

      title:
        content.content?.title ||
        "All Collections",

      description:
        content.content?.description ||
        "Explore the core OBSIDIAN series—each shaped around pressure, precision, restraint, and quiet strength.",

      metaLabel:
        content.content?.metaLabel ||
        "Built Under Pressure",

      showCollectionCount:
        content.content?.showCollectionCount !== false,

      collectionCountSingular:
        content.content?.collectionCountSingular ||
        "Collection",

      collectionCountPlural:
        content.content?.collectionCountPlural ||
        "Collections",

      showSeriesIndex:
        content.content?.showSeriesIndex !== false,

      showFeaturedBadge:
        content.content?.showFeaturedBadge !== false,

      showDescription:
        content.content?.showDescription !== false,

      seriesLabelPrefix:
        content.content?.seriesLabelPrefix ||
        "Series",

      featuredBadgeText:
        content.content?.featuredBadgeText ||
        "Featured",

      cardHoverButtonText:
        content.content?.cardHoverButtonText ||
        "View Products",

      cardFooterText:
        content.content?.cardFooterText ||
        "Explore Collection",

      emptyStateEyebrow:
        content.content?.emptyStateEyebrow ||
        "Collections",

      emptyStateTitle:
        content.content?.emptyStateTitle ||
        "No collections are available right now.",

      emptyStateDescription:
        content.content?.emptyStateDescription ||
        "New OBSIDIAN collections are being prepared. Explore the current product selection while the next series takes shape.",

      emptyStateButtonText:
        content.content?.emptyStateButtonText ||
        "Explore Shop",

      emptyStateButtonHref:
        content.content?.emptyStateButtonHref ||
        "/shop",
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
        onChange={(event) =>
          onChange(event.target.value)
        }
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border border-white/10 bg-[#111] px-5 py-4 text-sm text-[#f1ece4] outline-none transition focus:border-white/30"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
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

export default function CollectionsContentEditor({
  initialContent,
}) {
  const [collectionsPage, setCollectionsPage] =
    useState(() =>
      normalizeCollectionsContent(initialContent)
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [lastSavedAt, setLastSavedAt] =
    useState("");

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  function updateRootField(field, value) {
    clearMessage();

    setCollectionsPage((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    clearMessage();

    setCollectionsPage((current) => ({
      ...current,

      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateContent(field, value) {
    clearMessage();

    setCollectionsPage((current) => ({
      ...current,

      content: {
        ...current.content,
        [field]: value,
      },
    }));
  }

  async function saveCollectionsPage() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage("Saving Collections page...");

    try {
      const response = await fetch(
        "/api/cms/collections",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            collectionsPage
          ),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessageType("error");

        setMessage(
          data.message ||
            "Collections page could not be saved."
        );

        return;
      }

      setCollectionsPage(
        normalizeCollectionsContent(
          data.content
        )
      );

      setMessageType("success");

      setMessage(
        "Collections page saved successfully."
      );

      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Collections CMS save error:",
        error
      );

      setMessageType("error");

      setMessage(
        "Something went wrong while saving the Collections page."
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
        title="Page Configuration"
        description="Control the internal page identity and publication status."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={collectionsPage.title}
            onChange={(value) =>
              updateRootField(
                "title",
                value
              )
            }
          />

          <TextInput
            label="Slug"
            value={collectionsPage.slug}
            onChange={(value) =>
              updateRootField(
                "slug",
                value
              )
            }
            placeholder="collections"
          />

          <SelectInput
            label="Publish Status"
            value={collectionsPage.status}
            onChange={(value) =>
              updateRootField(
                "status",
                value
              )
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
        title="Breadcrumb Labels"
        description="Control the navigation labels displayed above the Collections page heading."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Home Label"
            value={
              collectionsPage.content
                .breadcrumbHomeLabel
            }
            onChange={(value) =>
              updateContent(
                "breadcrumbHomeLabel",
                value
              )
            }
            placeholder="Home"
          />

          <TextInput
            label="Current Page Label"
            value={
              collectionsPage.content
                .breadcrumbCurrentLabel
            }
            onChange={(value) =>
              updateContent(
                "breadcrumbCurrentLabel",
                value
              )
            }
            placeholder="Collections"
          />
        </div>
      </Panel>

      <Panel
        title="Collections Page Header"
        description="Manage the primary heading, description, and supporting label displayed above the collection cards."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={
              collectionsPage.content
                .eyebrow
            }
            onChange={(value) =>
              updateContent(
                "eyebrow",
                value
              )
            }
          />

          <TextInput
            label="Main Title"
            value={
              collectionsPage.content.title
            }
            onChange={(value) =>
              updateContent(
                "title",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="Description"
          value={
            collectionsPage.content
              .description
          }
          onChange={(value) =>
            updateContent(
              "description",
              value
            )
          }
          rows={5}
        />

        <TextInput
          label="Meta Label"
          value={
            collectionsPage.content
              .metaLabel
          }
          onChange={(value) =>
            updateContent(
              "metaLabel",
              value
            )
          }
          placeholder="Built Under Pressure"
        />
      </Panel>

      <Panel
        title="Collection Count"
        description="Control whether the active collection total appears and how its singular and plural labels are written."
      >
        <CheckboxInput
          label="Show Collection Count"
          description="Display the total number of active collections in the page header."
          checked={
            collectionsPage.content
              .showCollectionCount
          }
          onChange={(value) =>
            updateContent(
              "showCollectionCount",
              value
            )
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Singular Label"
            value={
              collectionsPage.content
                .collectionCountSingular
            }
            onChange={(value) =>
              updateContent(
                "collectionCountSingular",
                value
              )
            }
            placeholder="Collection"
          />

          <TextInput
            label="Plural Label"
            value={
              collectionsPage.content
                .collectionCountPlural
            }
            onChange={(value) =>
              updateContent(
                "collectionCountPlural",
                value
              )
            }
            placeholder="Collections"
          />
        </div>
      </Panel>

      <Panel
        title="Collection Card Visibility"
        description="Choose which information and labels should appear on each public collection card."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Series Index"
            description="Display Series 01, Series 02, and the numerical card index."
            checked={
              collectionsPage.content
                .showSeriesIndex
            }
            onChange={(value) =>
              updateContent(
                "showSeriesIndex",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Featured Badge"
            description="Display the featured badge on collections marked as featured."
            checked={
              collectionsPage.content
                .showFeaturedBadge
            }
            onChange={(value) =>
              updateContent(
                "showFeaturedBadge",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Description"
            description="Display each collection description underneath its title."
            checked={
              collectionsPage.content
                .showDescription
            }
            onChange={(value) =>
              updateContent(
                "showDescription",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Collection Card Labels"
        description="Control the reusable text displayed inside every collection card."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Series Label Prefix"
            value={
              collectionsPage.content
                .seriesLabelPrefix
            }
            onChange={(value) =>
              updateContent(
                "seriesLabelPrefix",
                value
              )
            }
            placeholder="Series"
          />

          <TextInput
            label="Featured Badge Text"
            value={
              collectionsPage.content
                .featuredBadgeText
            }
            onChange={(value) =>
              updateContent(
                "featuredBadgeText",
                value
              )
            }
            placeholder="Featured"
          />

          <TextInput
            label="Image Hover Button Text"
            value={
              collectionsPage.content
                .cardHoverButtonText
            }
            onChange={(value) =>
              updateContent(
                "cardHoverButtonText",
                value
              )
            }
            placeholder="View Products"
          />

          <TextInput
            label="Card Footer Text"
            value={
              collectionsPage.content
                .cardFooterText
            }
            onChange={(value) =>
              updateContent(
                "cardFooterText",
                value
              )
            }
            placeholder="Explore Collection"
          />
        </div>
      </Panel>

      <Panel
        title="Empty State"
        description="This section appears when there are no active collections in the database."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Empty State Eyebrow"
            value={
              collectionsPage.content
                .emptyStateEyebrow
            }
            onChange={(value) =>
              updateContent(
                "emptyStateEyebrow",
                value
              )
            }
          />

          <TextInput
            label="Empty State Title"
            value={
              collectionsPage.content
                .emptyStateTitle
            }
            onChange={(value) =>
              updateContent(
                "emptyStateTitle",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="Empty State Description"
          value={
            collectionsPage.content
              .emptyStateDescription
          }
          onChange={(value) =>
            updateContent(
              "emptyStateDescription",
              value
            )
          }
          rows={5}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Button Text"
            value={
              collectionsPage.content
                .emptyStateButtonText
            }
            onChange={(value) =>
              updateContent(
                "emptyStateButtonText",
                value
              )
            }
            placeholder="Explore Shop"
          />

          <TextInput
            label="Button Link"
            value={
              collectionsPage.content
                .emptyStateButtonHref
            }
            onChange={(value) =>
              updateContent(
                "emptyStateButtonHref",
                value
              )
            }
            placeholder="/shop"
          />
        </div>
      </Panel>

      <Panel
        title="Collections Page SEO"
        description="Manage search engine metadata and social sharing information."
      >
        <TextInput
          label="SEO Title"
          value={collectionsPage.seo.title}
          onChange={(value) =>
            updateSeo("title", value)
          }
        />

        <TextareaInput
          label="SEO Description"
          value={
            collectionsPage.seo.description
          }
          onChange={(value) =>
            updateSeo(
              "description",
              value
            )
          }
          rows={5}
        />

        <TextInput
          label="SEO Keywords"
          value={
            collectionsPage.seo.keywords
          }
          onChange={(value) =>
            updateSeo(
              "keywords",
              value
            )
          }
          placeholder="obsidian collections, premium menswear Bangladesh"
        />

        <TextInput
          label="Canonical URL"
          value={
            collectionsPage.seo.canonical
          }
          onChange={(value) =>
            updateSeo(
              "canonical",
              value
            )
          }
          placeholder="/collections"
        />

        <div>
          <FieldLabel>
            Open Graph Image
          </FieldLabel>

          <ImageUploader
            value={
              collectionsPage.seo.ogImage ||
              ""
            }
            onChange={(value) =>
              updateSeo(
                "ogImage",
                value
              )
            }
          />
        </div>

        <CheckboxInput
          label="Allow Search Engine Indexing"
          description="Disable this only when the page should not appear in search engine results."
          checked={
            collectionsPage.seo.index !==
            false
          }
          onChange={(value) =>
            updateSeo("index", value)
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
          onClick={saveCollectionsPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Collections Page..."
            : "Save Collections Page"}
        </button>
      </div>
    </div>
  );
}