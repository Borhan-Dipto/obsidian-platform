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

function normalizeJournalContent(content = {}) {
  return {
    key: "journal",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",
    title: content.title || "Journal",
    slug: content.slug || "journal",

    seo: {
      title: content.seo?.title || "Journal",
      description: content.seo?.description || "",
      keywords: content.seo?.keywords || "",
      ogImage: content.seo?.ogImage || "",
      canonical: content.seo?.canonical || "/journal",
      index: content.seo?.index !== false,
    },

    content: {
      eyebrow: content.content?.eyebrow || "Journal",
      title: content.content?.title || "Stories Of Pressure",
      description:
        content.content?.description ||
        "Reflections on design, resilience, craftsmanship, and the ideas that shape every OBSIDIAN collection.",

      posts: Array.isArray(content.content?.posts)
        ? cloneValue(content.content.posts)
        : [],

      emptyStateTitle:
        content.content?.emptyStateTitle ||
        "No journal stories yet.",

      emptyStateDescription:
        content.content?.emptyStateDescription ||
        "New stories about design, collections, and the OBSIDIAN philosophy will appear here.",

      ctaEyebrow:
        content.content?.ctaEyebrow ||
        "Explore Obsidian",

      ctaTitle:
        content.content?.ctaTitle ||
        "Discover The Pieces Behind The Stories",

      ctaDescription:
        content.content?.ctaDescription ||
        "Explore garments shaped by restraint, structure, and quiet confidence.",

      ctaText:
        content.content?.ctaText ||
        "Explore Shop",

      ctaHref:
        content.content?.ctaHref ||
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
  min,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <input
        type={type}
        min={min}
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
        onChange={(event) => onChange(event.target.value)}
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
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 border border-white/10 bg-white/[0.03] px-5 py-4">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4"
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
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
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

export default function JournalContentEditor({
  initialContent,
}) {
  const [journal, setJournal] = useState(() =>
    normalizeJournalContent(initialContent)
  );

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [lastSavedAt, setLastSavedAt] =
    useState("");

  const sortedPosts = useMemo(() => {
    return [...journal.content.posts].sort(
      (firstPost, secondPost) =>
        Number(firstPost.order || 0) -
        Number(secondPost.order || 0)
    );
  }, [journal.content.posts]);

  function updateRootField(field, value) {
    setMessage("");

    setJournal((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    setMessage("");

    setJournal((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateContent(field, value) {
    setMessage("");

    setJournal((current) => ({
      ...current,
      content: {
        ...current.content,
        [field]: value,
      },
    }));
  }

  function updatePost(postId, field, value) {
    setMessage("");

    setJournal((current) => ({
      ...current,
      content: {
        ...current.content,

        posts: current.content.posts.map(
          (post) =>
            post.id === postId
              ? {
                  ...post,
                  [field]: value,
                }
              : post
        ),
      },
    }));
  }

  function addPost() {
    setMessage("");

    setJournal((current) => {
      const nextOrder =
        current.content.posts.length + 1;

      return {
        ...current,

        content: {
          ...current.content,

          posts: [
            ...current.content.posts,

            {
              id: createId("journal"),
              title: "",
              description: "",
              category: "Journal",
              readingTime: "3 Min Read",
              href: "",
              order: nextOrder,
              isActive: true,
            },
          ],
        },
      };
    });
  }

  function removePost(postId) {
    setMessage("");

    setJournal((current) => ({
      ...current,

      content: {
        ...current.content,

        posts: current.content.posts.filter(
          (post) => post.id !== postId
        ),
      },
    }));
  }

  async function saveJournalPage() {
    setIsSaving(true);
    setMessage("Saving Journal page...");

    try {
      const response = await fetch(
        "/api/cms/journal",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(journal),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Journal page could not be saved."
        );

        return;
      }

      setJournal(
        normalizeJournalContent(
          data.content
        )
      );

      setMessage(
        "Journal page saved successfully."
      );

      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch {
      setMessage(
        "Something went wrong while saving the Journal page."
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
            value={journal.title}
            onChange={(value) =>
              updateRootField(
                "title",
                value
              )
            }
          />

          <TextInput
            label="Slug"
            value={journal.slug}
            onChange={(value) =>
              updateRootField(
                "slug",
                value
              )
            }
          />

          <SelectInput
            label="Publish Status"
            value={journal.status}
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
        title="Journal Hero"
        description="Edit the Journal page heading and introductory content."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={
              journal.content.eyebrow
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
            value={journal.content.title}
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
            journal.content.description
          }
          onChange={(value) =>
            updateContent(
              "description",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Journal Stories"
        description="Create, edit, order, activate, or remove story cards."
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            {sortedPosts.length} journal
            stories configured.
          </p>

          <button
            type="button"
            onClick={addPost}
            className="border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
          >
            Add Story
          </button>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-400">
            No journal stories have been
            added yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedPosts.map(
              (post, index) => (
                <article
                  key={post.id}
                  className="border border-white/10 bg-white/[0.02] p-5 md:p-6"
                >
                  <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Story{" "}
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {post.title ||
                          "Untitled Story"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removePost(post.id)
                      }
                      className="w-fit text-xs uppercase tracking-[0.25em] text-red-400 transition hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <TextInput
                      label="Story Title"
                      value={post.title}
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "title",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Category"
                      value={post.category}
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "category",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Reading Time"
                      value={
                        post.readingTime
                      }
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "readingTime",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Story Link"
                      value={post.href}
                      placeholder="/journal/story-slug"
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "href",
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Display Order"
                      type="number"
                      min="0"
                      value={post.order}
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "order",
                          Number(value || 0)
                        )
                      }
                    />

                    <CheckboxInput
                      label="Active"
                      checked={
                        post.isActive !==
                        false
                      }
                      onChange={(value) =>
                        updatePost(
                          post.id,
                          "isActive",
                          value
                        )
                      }
                    />

                    <div className="md:col-span-2">
                      <TextareaInput
                        label="Story Description"
                        value={
                          post.description
                        }
                        onChange={(value) =>
                          updatePost(
                            post.id,
                            "description",
                            value
                          )
                        }
                        rows={5}
                      />
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="Empty State"
        description="This content appears when no active journal stories are available."
      >
        <TextInput
          label="Empty State Title"
          value={
            journal.content
              .emptyStateTitle
          }
          onChange={(value) =>
            updateContent(
              "emptyStateTitle",
              value
            )
          }
        />

        <TextareaInput
          label="Empty State Description"
          value={
            journal.content
              .emptyStateDescription
          }
          onChange={(value) =>
            updateContent(
              "emptyStateDescription",
              value
            )
          }
          rows={4}
        />
      </Panel>

      <Panel
        title="Call To Action"
        description="Manage the dark call-to-action section displayed below the journal stories."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="CTA Eyebrow"
            value={
              journal.content.ctaEyebrow
            }
            onChange={(value) =>
              updateContent(
                "ctaEyebrow",
                value
              )
            }
          />

          <TextInput
            label="CTA Title"
            value={
              journal.content.ctaTitle
            }
            onChange={(value) =>
              updateContent(
                "ctaTitle",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="CTA Description"
          value={
            journal.content
              .ctaDescription
          }
          onChange={(value) =>
            updateContent(
              "ctaDescription",
              value
            )
          }
          rows={4}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="CTA Button Text"
            value={
              journal.content.ctaText
            }
            onChange={(value) =>
              updateContent(
                "ctaText",
                value
              )
            }
          />

          <TextInput
            label="CTA Button Link"
            value={
              journal.content.ctaHref
            }
            onChange={(value) =>
              updateContent(
                "ctaHref",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Journal SEO"
        description="Manage search engine and social sharing metadata."
      >
        <TextInput
          label="SEO Title"
          value={journal.seo.title}
          onChange={(value) =>
            updateSeo("title", value)
          }
        />

        <TextareaInput
          label="SEO Description"
          value={
            journal.seo.description
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
          value={journal.seo.keywords}
          placeholder="obsidian, journal, design"
          onChange={(value) =>
            updateSeo(
              "keywords",
              value
            )
          }
        />

        <TextInput
          label="Canonical URL"
          value={journal.seo.canonical}
          placeholder="/journal"
          onChange={(value) =>
            updateSeo(
              "canonical",
              value
            )
          }
        />

        <div>
          <FieldLabel>
            Open Graph Image
          </FieldLabel>

          <ImageUploader
            value={
              journal.seo.ogImage || ""
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
          checked={
            journal.seo.index !== false
          }
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
              Last saved at{" "}
              {lastSavedAt}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-5 z-20">
        <button
          type="button"
          onClick={saveJournalPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Journal Page..."
            : "Save Journal Page"}
        </button>
      </div>
    </div>
  );
}