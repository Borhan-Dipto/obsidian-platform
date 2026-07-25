"use client";

import { useMemo, useState } from "react";
import ImageUploader from "./ImageUploader";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeHomepage(content = {}) {
  return {
    key: "homepage",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",

    seo: {
      title: content.seo?.title || "",
      description: content.seo?.description || "",
      keywords: content.seo?.keywords || "",
      ogImage: content.seo?.ogImage || "",
      canonical: content.seo?.canonical || "/",
      index: content.seo?.index !== false,
    },

    sections: Array.isArray(content.sections)
      ? cloneValue(content.sections)
      : [],
  };
}

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
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

          <div>
            <label className="sr-only">{title} order</label>

            <input
              type="number"
              value={order ?? 0}
              onChange={(event) =>
                onOrderChange(Number(event.target.value || 0))
              }
              className="w-24 border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">{children}</div>
    </section>
  );
}

function ArrayItemHeader({ title, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        {title}
      </p>

      <button
        type="button"
        onClick={onRemove}
        className="text-xs uppercase tracking-[0.25em] text-red-400 transition hover:text-red-300"
      >
        Remove
      </button>
    </div>
  );
}

export default function HomepageContentEditor({ initialContent }) {
  const [homepage, setHomepage] = useState(() =>
    normalizeHomepage(initialContent)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sortedSections = useMemo(() => {
    return [...homepage.sections].sort(
      (firstSection, secondSection) =>
        Number(firstSection.order || 0) -
        Number(secondSection.order || 0)
    );
  }, [homepage.sections]);

  function updateSeo(field, value) {
    setMessage("");

    setHomepage((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateSection(sectionId, updater) {
    setMessage("");

    setHomepage((current) => ({
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

  function updateNestedContentField(
    sectionId,
    parentField,
    childField,
    value
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      content: {
        ...(section.content || {}),
        [parentField]: {
          ...(section.content?.[parentField] || {}),
          [childField]: value,
        },
      },
    }));
  }

  function updateArrayItem(
    sectionId,
    field,
    itemIndex,
    itemField,
    value
  ) {
    updateSection(sectionId, (section) => {
      const items = Array.isArray(section.content?.[field])
        ? cloneValue(section.content[field])
        : [];

      items[itemIndex] = {
        ...items[itemIndex],
        [itemField]: value,
      };

      return {
        ...section,
        content: {
          ...(section.content || {}),
          [field]: items,
        },
      };
    });
  }

  function addArrayItem(sectionId, field, item) {
    updateSection(sectionId, (section) => {
      const items = Array.isArray(section.content?.[field])
        ? cloneValue(section.content[field])
        : [];

      return {
        ...section,
        content: {
          ...(section.content || {}),
          [field]: [...items, item],
        },
      };
    });
  }

  function removeArrayItem(sectionId, field, itemIndex) {
    updateSection(sectionId, (section) => {
      const items = Array.isArray(section.content?.[field])
        ? cloneValue(section.content[field])
        : [];

      return {
        ...section,
        content: {
          ...(section.content || {}),
          [field]: items.filter((_, index) => index !== itemIndex),
        },
      };
    });
  }

  function updateParagraph(sectionId, index, value) {
    updateSection(sectionId, (section) => {
      const paragraphs = Array.isArray(section.content?.paragraphs)
        ? [...section.content.paragraphs]
        : [];

      paragraphs[index] = value;

      return {
        ...section,
        content: {
          ...(section.content || {}),
          paragraphs,
        },
      };
    });
  }

  function addParagraph(sectionId) {
    updateSection(sectionId, (section) => {
      const paragraphs = Array.isArray(section.content?.paragraphs)
        ? [...section.content.paragraphs]
        : [];

      return {
        ...section,
        content: {
          ...(section.content || {}),
          paragraphs: [...paragraphs, ""],
        },
      };
    });
  }

  function removeParagraph(sectionId, paragraphIndex) {
    updateSection(sectionId, (section) => {
      const paragraphs = Array.isArray(section.content?.paragraphs)
        ? [...section.content.paragraphs]
        : [];

      return {
        ...section,
        content: {
          ...(section.content || {}),
          paragraphs: paragraphs.filter(
            (_, index) => index !== paragraphIndex
          ),
        },
      };
    });
  }

  function updateSystemCategory(
    sectionId,
    itemIndex,
    itemField,
    value
  ) {
    updateSection(sectionId, (section) => {
      const systemBlock = {
        ...(section.content?.systemBlock || {}),
      };

      const categories = Array.isArray(systemBlock.categories)
        ? cloneValue(systemBlock.categories)
        : [];

      categories[itemIndex] = {
        ...categories[itemIndex],
        [itemField]: value,
      };

      return {
        ...section,
        content: {
          ...(section.content || {}),
          systemBlock: {
            ...systemBlock,
            categories,
          },
        },
      };
    });
  }

  function addSystemCategory(sectionId) {
    updateSection(sectionId, (section) => {
      const systemBlock = {
        ...(section.content?.systemBlock || {}),
      };

      const categories = Array.isArray(systemBlock.categories)
        ? cloneValue(systemBlock.categories)
        : [];

      const nextOrder = categories.length + 1;

      return {
        ...section,
        content: {
          ...(section.content || {}),
          systemBlock: {
            ...systemBlock,
            categories: [
              ...categories,
              {
                id: createId("category"),
                title: "",
                description: "",
                order: nextOrder,
                isActive: true,
              },
            ],
          },
        },
      };
    });
  }

  function removeSystemCategory(sectionId, categoryIndex) {
    updateSection(sectionId, (section) => {
      const systemBlock = {
        ...(section.content?.systemBlock || {}),
      };

      const categories = Array.isArray(systemBlock.categories)
        ? cloneValue(systemBlock.categories)
        : [];

      return {
        ...section,
        content: {
          ...(section.content || {}),
          systemBlock: {
            ...systemBlock,
            categories: categories.filter(
              (_, index) => index !== categoryIndex
            ),
          },
        },
      };
    });
  }

  async function saveHomepage() {
    setIsSaving(true);
    setMessage("Saving homepage content...");

    try {
      const response = await fetch("/api/cms/homepage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homepage),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Homepage content could not be saved."
        );
        return;
      }

      setHomepage(normalizeHomepage(data.content));
      setMessage("Homepage content saved successfully.");
    } catch {
      setMessage(
        "Something went wrong while saving homepage content."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderHeroEditor(section) {
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
          label="Subtitle"
          value={content.subtitle}
          onChange={(value) =>
            updateContentField(section.id, "subtitle", value)
          }
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <FieldLabel>Desktop Hero Image</FieldLabel>

            <ImageUploader
              value={content.desktopImage || ""}
              onChange={(value) =>
                updateContentField(
                  section.id,
                  "desktopImage",
                  value
                )
              }
            />
          </div>

          <div>
            <FieldLabel>Mobile Hero Image</FieldLabel>

            <ImageUploader
              value={content.mobileImage || ""}
              onChange={(value) =>
                updateContentField(
                  section.id,
                  "mobileImage",
                  value
                )
              }
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Image Alt Text"
            value={content.imageAlt}
            onChange={(value) =>
              updateContentField(section.id, "imageAlt", value)
            }
          />

          <SelectInput
            label="Media Type"
            value={content.mediaType || "image"}
            onChange={(value) =>
              updateContentField(section.id, "mediaType", value)
            }
            options={[
              {
                value: "image",
                label: "Image",
              },
              {
                value: "video",
                label: "Video",
              },
            ]}
          />

          <TextInput
            label="Video URL"
            value={content.videoUrl}
            onChange={(value) =>
              updateContentField(section.id, "videoUrl", value)
            }
          />

          <TextInput
            label="Background Position"
            value={content.backgroundPosition}
            onChange={(value) =>
              updateContentField(
                section.id,
                "backgroundPosition",
                value
              )
            }
          />

          <TextInput
            label="Overlay Opacity"
            type="number"
            min="0"
            max="90"
            value={content.overlayOpacity}
            onChange={(value) =>
              updateContentField(
                section.id,
                "overlayOpacity",
                Number(value || 0)
              )
            }
          />

          <SelectInput
            label="Content Alignment"
            value={content.contentAlignment || "left"}
            onChange={(value) =>
              updateContentField(
                section.id,
                "contentAlignment",
                value
              )
            }
            options={[
              {
                value: "left",
                label: "Left",
              },
              {
                value: "center",
                label: "Center",
              },
              {
                value: "right",
                label: "Right",
              },
            ]}
          />
        </div>

        <div className="border border-white/10 p-5">
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Primary CTA
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <TextInput
              label="Button Text"
              value={content.primaryCta?.label}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "primaryCta",
                  "label",
                  value
                )
              }
            />

            <TextInput
              label="Button Link"
              value={content.primaryCta?.href}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "primaryCta",
                  "href",
                  value
                )
              }
            />

            <CheckboxInput
              label="Show Button"
              checked={content.primaryCta?.isEnabled !== false}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "primaryCta",
                  "isEnabled",
                  value
                )
              }
            />

            <CheckboxInput
              label="Open In New Tab"
              checked={
                content.primaryCta?.openInNewTab === true
              }
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "primaryCta",
                  "openInNewTab",
                  value
                )
              }
            />
          </div>
        </div>

        <div className="border border-white/10 p-5">
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Secondary CTA
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <TextInput
              label="Button Text"
              value={content.secondaryCta?.label}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "secondaryCta",
                  "label",
                  value
                )
              }
            />

            <TextInput
              label="Button Link"
              value={content.secondaryCta?.href}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "secondaryCta",
                  "href",
                  value
                )
              }
            />

            <CheckboxInput
              label="Show Button"
              checked={content.secondaryCta?.isEnabled !== false}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "secondaryCta",
                  "isEnabled",
                  value
                )
              }
            />

            <CheckboxInput
              label="Open In New Tab"
              checked={
                content.secondaryCta?.openInNewTab === true
              }
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "secondaryCta",
                  "openInNewTab",
                  value
                )
              }
            />
          </div>
        </div>

        <div className="border border-white/10 p-5">
          <div className="mb-6 flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Featured Card
            </p>

            <input
              type="checkbox"
              checked={content.featuredCard?.isEnabled !== false}
              onChange={(event) =>
                updateNestedContentField(
                  section.id,
                  "featuredCard",
                  "isEnabled",
                  event.target.checked
                )
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TextInput
              label="Eyebrow"
              value={content.featuredCard?.eyebrow}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "featuredCard",
                  "eyebrow",
                  value
                )
              }
            />

            <TextInput
              label="Title"
              value={content.featuredCard?.title}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "featuredCard",
                  "title",
                  value
                )
              }
            />

            <TextInput
              label="Link"
              value={content.featuredCard?.href}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "featuredCard",
                  "href",
                  value
                )
              }
            />

            <TextInput
              label="Button Text"
              value={content.featuredCard?.buttonText}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "featuredCard",
                  "buttonText",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <FieldLabel>Card Image</FieldLabel>

              <ImageUploader
                value={content.featuredCard?.image || ""}
                onChange={(value) =>
                  updateNestedContentField(
                    section.id,
                    "featuredCard",
                    "image",
                    value
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="border border-white/10 p-5">
          <div className="mb-6 flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Side Card
            </p>

            <input
              type="checkbox"
              checked={content.sideCard?.isEnabled !== false}
              onChange={(event) =>
                updateNestedContentField(
                  section.id,
                  "sideCard",
                  "isEnabled",
                  event.target.checked
                )
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TextInput
              label="Title"
              value={content.sideCard?.title}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "sideCard",
                  "title",
                  value
                )
              }
            />

            <TextInput
              label="Button Text"
              value={content.sideCard?.buttonText}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "sideCard",
                  "buttonText",
                  value
                )
              }
            />

            <TextInput
              label="Button Link"
              value={content.sideCard?.href}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "sideCard",
                  "href",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <TextareaInput
                label="Description"
                value={content.sideCard?.description}
                onChange={(value) =>
                  updateNestedContentField(
                    section.id,
                    "sideCard",
                    "description",
                    value
                  )
                }
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderCollectionsEditor(section) {
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

          <TextInput
            label="Maximum Items"
            type="number"
            min="1"
            max="12"
            value={content.maximumItems}
            onChange={(value) =>
              updateContentField(
                section.id,
                "maximumItems",
                Number(value || 1)
              )
            }
          />

          <SelectInput
            label="Collection Source"
            value={content.source || "featured"}
            onChange={(value) =>
              updateContentField(section.id, "source", value)
            }
            options={[
              {
                value: "featured",
                label: "Featured Collections",
              },
              {
                value: "all",
                label: "All Active Collections",
              },
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Description"
            checked={content.showDescription !== false}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showDescription",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Collection Index"
            checked={content.showIndex !== false}
            onChange={(value) =>
              updateContentField(section.id, "showIndex", value)
            }
          />

          <CheckboxInput
            label="Show Featured Badge"
            checked={content.showFeaturedBadge !== false}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showFeaturedBadge",
                value
              )
            }
          />
        </div>
      </>
    );
  }

  function renderBrandStoryEditor(section) {
    const content = section.content || {};

    const paragraphs = Array.isArray(content.paragraphs)
      ? content.paragraphs
      : [];

    const featureCards = Array.isArray(content.featureCards)
      ? content.featureCards
      : [];

    const categories = Array.isArray(
      content.systemBlock?.categories
    )
      ? content.systemBlock.categories
      : [];

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

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Story Paragraphs
            </p>

            <button
              type="button"
              onClick={() => addParagraph(section.id)}
              className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
            >
              Add Paragraph
            </button>
          </div>

          {paragraphs.map((paragraph, index) => (
            <div
              key={`${index}-${paragraph.slice(0, 10)}`}
              className="border border-white/10 p-5"
            >
              <ArrayItemHeader
                title={`Paragraph ${index + 1}`}
                onRemove={() =>
                  removeParagraph(section.id, index)
                }
              />

              <div className="mt-5">
                <TextareaInput
                  label="Text"
                  value={paragraph}
                  onChange={(value) =>
                    updateParagraph(section.id, index, value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Feature Cards
            </p>

            <button
              type="button"
              onClick={() =>
                addArrayItem(section.id, "featureCards", {
                  id: createId("feature"),
                  number: String(
                    featureCards.length + 1
                  ).padStart(2, "0"),
                  title: "",
                  description: "",
                  order: featureCards.length + 1,
                  isActive: true,
                })
              }
              className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
            >
              Add Card
            </button>
          </div>

          {featureCards.map((card, index) => (
            <div
              key={card.id || index}
              className="border border-white/10 p-5"
            >
              <ArrayItemHeader
                title={`Feature Card ${index + 1}`}
                onRemove={() =>
                  removeArrayItem(
                    section.id,
                    "featureCards",
                    index
                  )
                }
              />

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <TextInput
                  label="Number"
                  value={card.number}
                  onChange={(value) =>
                    updateArrayItem(
                      section.id,
                      "featureCards",
                      index,
                      "number",
                      value
                    )
                  }
                />

                <TextInput
                  label="Title"
                  value={card.title}
                  onChange={(value) =>
                    updateArrayItem(
                      section.id,
                      "featureCards",
                      index,
                      "title",
                      value
                    )
                  }
                />

                <TextInput
                  label="Order"
                  type="number"
                  value={card.order}
                  onChange={(value) =>
                    updateArrayItem(
                      section.id,
                      "featureCards",
                      index,
                      "order",
                      Number(value || 0)
                    )
                  }
                />

                <CheckboxInput
                  label="Active"
                  checked={card.isActive !== false}
                  onChange={(value) =>
                    updateArrayItem(
                      section.id,
                      "featureCards",
                      index,
                      "isActive",
                      value
                    )
                  }
                />

                <div className="md:col-span-2">
                  <TextareaInput
                    label="Description"
                    value={card.description}
                    onChange={(value) =>
                      updateArrayItem(
                        section.id,
                        "featureCards",
                        index,
                        "description",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-white/10 p-5">
          <div className="mb-6 flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Fashion System Block
            </p>

            <input
              type="checkbox"
              checked={
                content.systemBlock?.isEnabled !== false
              }
              onChange={(event) =>
                updateNestedContentField(
                  section.id,
                  "systemBlock",
                  "isEnabled",
                  event.target.checked
                )
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TextInput
              label="Eyebrow"
              value={content.systemBlock?.eyebrow}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "systemBlock",
                  "eyebrow",
                  value
                )
              }
            />

            <TextInput
              label="Title"
              value={content.systemBlock?.title}
              onChange={(value) =>
                updateNestedContentField(
                  section.id,
                  "systemBlock",
                  "title",
                  value
                )
              }
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Future Categories
            </p>

            <button
              type="button"
              onClick={() => addSystemCategory(section.id)}
              className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-white/5"
            >
              Add Category
            </button>
          </div>

          {categories.map((category, index) => (
            <div
              key={category.id || index}
              className="border border-white/10 p-5"
            >
              <ArrayItemHeader
                title={`Category ${index + 1}`}
                onRemove={() =>
                  removeSystemCategory(section.id, index)
                }
              />

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <TextInput
                  label="Title"
                  value={category.title}
                  onChange={(value) =>
                    updateSystemCategory(
                      section.id,
                      index,
                      "title",
                      value
                    )
                  }
                />

                <TextInput
                  label="Order"
                  type="number"
                  value={category.order}
                  onChange={(value) =>
                    updateSystemCategory(
                      section.id,
                      index,
                      "order",
                      Number(value || 0)
                    )
                  }
                />

                <CheckboxInput
                  label="Active"
                  checked={category.isActive !== false}
                  onChange={(value) =>
                    updateSystemCategory(
                      section.id,
                      index,
                      "isActive",
                      value
                    )
                  }
                />

                <div className="md:col-span-2">
                  <TextareaInput
                    label="Description"
                    value={category.description}
                    onChange={(value) =>
                      updateSystemCategory(
                        section.id,
                        index,
                        "description",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderFeaturedProductEditor(section) {
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
            label="Product ID"
            value={content.productId}
            onChange={(value) =>
              updateContentField(section.id, "productId", value)
            }
          />

          <TextInput
            label="Custom Title"
            value={content.customTitle}
            onChange={(value) =>
              updateContentField(
                section.id,
                "customTitle",
                value
              )
            }
          />

          <TextInput
            label="Button Text"
            value={content.buttonText}
            onChange={(value) =>
              updateContentField(
                section.id,
                "buttonText",
                value
              )
            }
          />
        </div>

        <TextareaInput
          label="Custom Description"
          value={content.customDescription}
          onChange={(value) =>
            updateContentField(
              section.id,
              "customDescription",
              value
            )
          }
        />

        <div>
          <FieldLabel>Image Override</FieldLabel>

          <ImageUploader
            value={content.imageOverride || ""}
            onChange={(value) =>
              updateContentField(
                section.id,
                "imageOverride",
                value
              )
            }
          />
        </div>

        <TextInput
          label="Image Alt Text"
          value={content.imageAlt}
          onChange={(value) =>
            updateContentField(section.id, "imageAlt", value)
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <CheckboxInput
            label="Show Price"
            checked={content.showPrice !== false}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showPrice",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Series"
            checked={content.showSeries !== false}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showSeries",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Color"
            checked={content.showColor !== false}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showColor",
                value
              )
            }
          />

          <CheckboxInput
            label="Show Stock"
            checked={content.showStock === true}
            onChange={(value) =>
              updateContentField(
                section.id,
                "showStock",
                value
              )
            }
          />
        </div>
      </>
    );
  }

  function renderSectionEditor(section) {
    if (section.type === "hero") {
      return renderHeroEditor(section);
    }

    if (section.type === "collections") {
      return renderCollectionsEditor(section);
    }

    if (section.type === "brandStory") {
      return renderBrandStoryEditor(section);
    }

    if (section.type === "featuredProduct") {
      return renderFeaturedProductEditor(section);
    }

    return (
      <p className="text-sm text-neutral-500">
        No visual editor is available for this section type yet.
      </p>
    );
  }

  function getSectionTitle(section) {
    if (section.type === "brandStory") {
      return "Brand Story";
    }

    if (section.type === "featuredProduct") {
      return "Featured Product";
    }

    if (section.type === "collections") {
      return "Collections";
    }

    if (section.type === "hero") {
      return "Hero";
    }

    return section.type || "Homepage Section";
  }

  return (
    <div className="space-y-10">
      <section className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
            Homepage SEO
          </p>

          <SelectInput
            label="Publish Status"
            value={homepage.status}
            onChange={(value) =>
              setHomepage((current) => ({
                ...current,
                status: value,
              }))
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

        <div className="grid gap-6">
          <TextInput
            label="SEO Title"
            value={homepage.seo.title}
            onChange={(value) => updateSeo("title", value)}
          />

          <TextareaInput
            label="SEO Description"
            value={homepage.seo.description}
            onChange={(value) =>
              updateSeo("description", value)
            }
          />

          <TextInput
            label="SEO Keywords"
            value={homepage.seo.keywords}
            onChange={(value) =>
              updateSeo("keywords", value)
            }
          />

          <TextInput
            label="Canonical URL"
            value={homepage.seo.canonical}
            onChange={(value) =>
              updateSeo("canonical", value)
            }
          />

          <div>
            <FieldLabel>Open Graph Image</FieldLabel>

            <ImageUploader
              value={homepage.seo.ogImage || ""}
              onChange={(value) =>
                updateSeo("ogImage", value)
              }
            />
          </div>

          <CheckboxInput
            label="Allow Search Engine Indexing"
            checked={homepage.seo.index !== false}
            onChange={(value) =>
              updateSeo("index", value)
            }
          />
        </div>
      </section>

      {sortedSections.map((section) => (
        <SectionCard
          key={section.id}
          title={getSectionTitle(section)}
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
            updateSectionField(section.id, "order", value)
          }
        >
          {renderSectionEditor(section)}
        </SectionCard>
      ))}

      {homepage.sections.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.03] p-8 text-sm text-neutral-400">
          No homepage sections were found. Reload the CMS defaults
          before editing.
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
          onClick={saveHomepage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving Homepage..." : "Save Homepage"}
        </button>
      </div>
    </div>
  );
}