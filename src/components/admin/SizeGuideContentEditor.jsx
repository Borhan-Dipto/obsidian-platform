"use client";

import {
  useState,
} from "react";

import ImageUploader from "./ImageUploader";

import {
  OBSIDIAN_SIZE_ORDER,
  sanitizeSizeGuideCmsContent,
  validateSizeGuideContentInput,
} from "../../lib/sizeGuide";

function FieldLabel({
  children,
}) {
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
  disabled = false,
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
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
      <FieldLabel>
        {label}
      </FieldLabel>

      <textarea
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
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
      <FieldLabel>
        {label}
      </FieldLabel>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full border border-white/10 bg-[#111] px-5 py-4 text-sm text-[#f1ece4] outline-none transition focus:border-white/30"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
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
        checked={
          Boolean(checked)
        }
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4 shrink-0 accent-white"
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

function MeasurementField({
  label,
  inchValue,
  centimetreValue,
  onInchChange,
  onCentimetreChange,
  disabled,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextInput
        label={`${label} — Inches`}
        value={inchValue}
        onChange={
          onInchChange
        }
        placeholder="Example: 42"
        disabled={disabled}
      />

      <TextInput
        label={`${label} — Centimetres`}
        value={
          centimetreValue
        }
        onChange={
          onCentimetreChange
        }
        placeholder="Example: 107"
        disabled={disabled}
      />
    </div>
  );
}

function SizeMeasurementCard({
  row,
  onUpdate,
}) {
  const isActive =
    row.isActive !== false;

  return (
    <article
      className={`border p-5 transition md:p-6 ${
        isActive
          ? "border-white/15 bg-white/[0.025]"
          : "border-white/10 bg-black/20 opacity-65"
      }`}
    >
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center border border-white/15 font-heading text-2xl font-light">
            {row.size}
          </span>

          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-500">
              Size Measurement
            </p>

            <p className="mt-2 text-sm text-neutral-300">
              Position{" "}
              {row.order}
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            {isActive
              ? "Enabled"
              : "Disabled"}
          </span>

          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              onUpdate(
                "isActive",
                event.target.checked
              )
            }
            className="h-4 w-4 accent-white"
          />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        <MeasurementField
          label="Fits Body Chest"
          inchValue={
            row.bodyChest
          }
          centimetreValue={
            row.bodyChestCm
          }
          onInchChange={(value) =>
            onUpdate(
              "bodyChest",
              value
            )
          }
          onCentimetreChange={(
            value
          ) =>
            onUpdate(
              "bodyChestCm",
              value
            )
          }
          disabled={!isActive}
        />

        <MeasurementField
          label="Garment Chest"
          inchValue={
            row.chest
          }
          centimetreValue={
            row.chestCm
          }
          onInchChange={(value) =>
            onUpdate(
              "chest",
              value
            )
          }
          onCentimetreChange={(
            value
          ) =>
            onUpdate(
              "chestCm",
              value
            )
          }
          disabled={!isActive}
        />

        <MeasurementField
          label="Garment Length"
          inchValue={
            row.length
          }
          centimetreValue={
            row.lengthCm
          }
          onInchChange={(value) =>
            onUpdate(
              "length",
              value
            )
          }
          onCentimetreChange={(
            value
          ) =>
            onUpdate(
              "lengthCm",
              value
            )
          }
          disabled={!isActive}
        />

        <MeasurementField
          label="Shoulder"
          inchValue={
            row.shoulder
          }
          centimetreValue={
            row.shoulderCm
          }
          onInchChange={(value) =>
            onUpdate(
              "shoulder",
              value
            )
          }
          onCentimetreChange={(
            value
          ) =>
            onUpdate(
              "shoulderCm",
              value
            )
          }
          disabled={!isActive}
        />
      </div>

      {!isActive ? (
        <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-6 text-neutral-500">
          This size will remain hidden from the public Size Guide. Product-level inventory controls remain independent.
        </p>
      ) : null}
    </article>
  );
}

export default function SizeGuideContentEditor({
  initialContent,
}) {
  const [
    sizeGuide,
    setSizeGuide,
  ] = useState(() =>
    sanitizeSizeGuideCmsContent(
      initialContent
    )
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("");

  const [
    lastSavedAt,
    setLastSavedAt,
  ] = useState("");

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  function updateRootField(
    field,
    value
  ) {
    clearMessage();

    setSizeGuide(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateSeo(
    field,
    value
  ) {
    clearMessage();

    setSizeGuide(
      (current) => ({
        ...current,

        seo: {
          ...current.seo,
          [field]: value,
        },
      })
    );
  }

  function updateContent(
    field,
    value
  ) {
    clearMessage();

    setSizeGuide(
      (current) => ({
        ...current,

        content: {
          ...current.content,
          [field]: value,
        },
      })
    );
  }

  function updateSizeRow(
    size,
    field,
    value
  ) {
    clearMessage();

    setSizeGuide(
      (current) => ({
        ...current,

        content: {
          ...current.content,

          sizes:
            current.content.sizes.map(
              (row) =>
                row.size === size
                  ? {
                      ...row,
                      [field]:
                        value,
                    }
                  : row
            ),
        },
      })
    );
  }

  async function saveSizeGuide() {
    if (isSaving) {
      return;
    }

    const payload =
      sanitizeSizeGuideCmsContent(
        {
          ...sizeGuide,

          content: {
            ...sizeGuide.content,

            sizes:
              OBSIDIAN_SIZE_ORDER.map(
                (
                  size,
                  index
                ) => {
                  const row =
                    sizeGuide.content
                      .sizes.find(
                        (
                          currentRow
                        ) =>
                          currentRow.size ===
                          size
                      );

                  return {
                    ...row,
                    size,
                    order:
                      index + 1,
                  };
                }
              ),
          },
        }
      );

    const validation =
      validateSizeGuideContentInput(
        payload
      );

    if (!validation.valid) {
      setMessageType("error");

      setMessage(
        validation.errors[0]
          ?.message ||
          "Size Guide content is invalid."
      );

      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage(
      "Saving Size Guide..."
    );

    try {
      const response =
        await fetch(
          "/api/cms/size-guide",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setMessageType("error");

        setMessage(
          data.message ||
            "Size Guide could not be saved."
        );

        return;
      }

      setSizeGuide(
        sanitizeSizeGuideCmsContent(
          data.content
        )
      );

      setMessageType("success");

      setMessage(
        "Size Guide saved successfully."
      );

      setLastSavedAt(
        new Date()
          .toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Size Guide CMS save error:",
        error
      );

      setMessageType("error");

      setMessage(
        "Something went wrong while saving the Size Guide."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const activeSizeCount =
    sizeGuide.content.sizes.filter(
      (row) =>
        row.isActive !== false
    ).length;

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
        title="Page Configuration"
        description="Control the Size Guide page identity and publication status."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={
              sizeGuide.title
            }
            onChange={(value) =>
              updateRootField(
                "title",
                value
              )
            }
          />

          <TextInput
            label="Slug"
            value={
              sizeGuide.slug
            }
            onChange={(value) =>
              updateRootField(
                "slug",
                value
              )
            }
            placeholder="size-guide"
          />

          <SelectInput
            label="Publish Status"
            value={
              sizeGuide.status
            }
            onChange={(value) =>
              updateRootField(
                "status",
                value
              )
            }
            options={[
              {
                value:
                  "published",

                label:
                  "Published",
              },
              {
                value:
                  "draft",

                label:
                  "Draft",
              },
            ]}
          />
        </div>
      </Panel>

      <Panel
        title="Standalone Page Introduction"
        description="Manage the heading and introduction displayed on the main Size Guide page."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={
              sizeGuide.content
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
              sizeGuide.content
                .title
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
          label="Main Description"
          value={
            sizeGuide.content
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
      </Panel>

      <Panel
        title="Product Page Size Chart"
        description="Control the title and introduction displayed above the full-width chart on product pages."
      >
        <TextInput
          label="Inline Chart Title"
          value={
            sizeGuide.content
              .inlineTitle
          }
          onChange={(value) =>
            updateContent(
              "inlineTitle",
              value
            )
          }
        />

        <TextareaInput
          label="Inline Chart Description"
          value={
            sizeGuide.content
              .inlineDescription
          }
          onChange={(value) =>
            updateContent(
              "inlineDescription",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Table Labels"
        description="Manage measurement headings, accessibility text, and the displayed unit label."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Table Accessibility Label"
            value={
              sizeGuide.content
                .tableAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "tableAriaLabel",
                value
              )
            }
          />

          <TextInput
            label="Measurement Unit"
            value={
              sizeGuide.content
                .measurementUnit
            }
            onChange={(value) =>
              updateContent(
                "measurementUnit",
                value
              )
            }
            placeholder="in / cm"
          />

          <TextInput
            label="Size Column"
            value={
              sizeGuide.content
                .sizeColumnLabel
            }
            onChange={(value) =>
              updateContent(
                "sizeColumnLabel",
                value
              )
            }
          />

          <TextInput
            label="Fits Body Chest Column"
            value={
              sizeGuide.content
                .bodyChestColumnLabel
            }
            onChange={(value) =>
              updateContent(
                "bodyChestColumnLabel",
                value
              )
            }
          />

          <TextInput
            label="Garment Chest Column"
            value={
              sizeGuide.content
                .chestColumnLabel
            }
            onChange={(value) =>
              updateContent(
                "chestColumnLabel",
                value
              )
            }
          />

          <TextInput
            label="Length Column"
            value={
              sizeGuide.content
                .lengthColumnLabel
            }
            onChange={(value) =>
              updateContent(
                "lengthColumnLabel",
                value
              )
            }
          />

          <TextInput
            label="Shoulder Column"
            value={
              sizeGuide.content
                .shoulderColumnLabel
            }
            onChange={(value) =>
              updateContent(
                "shoulderColumnLabel",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Size Measurements"
        description={`${activeSizeCount} of ${OBSIDIAN_SIZE_ORDER.length} sizes are currently visible. Product inventory size availability is managed separately from each product.`}
      >
        <div className="space-y-5">
          {sizeGuide.content
            .sizes.map(
              (row) => (
                <SizeMeasurementCard
                  key={
                    row.size
                  }
                  row={row}
                  onUpdate={(
                    field,
                    value
                  ) =>
                    updateSizeRow(
                      row.size,
                      field,
                      value
                    )
                  }
                />
              )
            )}
        </div>
      </Panel>

      <Panel
        title="Measurement Notes"
        description="Manage the guidance displayed beneath the size chart."
      >
        <TextareaInput
          label="Primary Measurement Note"
          value={
            sizeGuide.content
              .note
          }
          onChange={(value) =>
            updateContent(
              "note",
              value
            )
          }
          rows={4}
        />

        <TextareaInput
          label="Production Tolerance Note"
          value={
            sizeGuide.content
              .toleranceNote
          }
          onChange={(value) =>
            updateContent(
              "toleranceNote",
              value
            )
          }
          rows={4}
        />
      </Panel>

      <Panel
        title="Empty State"
        description="Control the fallback message shown when no active size rows are available."
      >
        <TextInput
          label="Empty State Title"
          value={
            sizeGuide.content
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
            sizeGuide.content
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
        title="Size Guide SEO"
        description="Manage search metadata and social sharing information for the standalone Size Guide page."
      >
        <TextInput
          label="SEO Title"
          value={
            sizeGuide.seo.title
          }
          onChange={(value) =>
            updateSeo(
              "title",
              value
            )
          }
        />

        <TextareaInput
          label="SEO Description"
          value={
            sizeGuide.seo
              .description
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
            sizeGuide.seo
              .keywords
          }
          onChange={(value) =>
            updateSeo(
              "keywords",
              value
            )
          }
        />

        <TextInput
          label="Canonical URL"
          value={
            sizeGuide.seo
              .canonical
          }
          onChange={(value) =>
            updateSeo(
              "canonical",
              value
            )
          }
          placeholder="/size-guide"
        />

        <div>
          <FieldLabel>
            Open Graph Image
          </FieldLabel>

          <ImageUploader
            value={
              sizeGuide.seo
                .ogImage || ""
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
          description="Disable only when the Size Guide page should not appear in search engines."
          checked={
            sizeGuide.seo.index !==
            false
          }
          onChange={(value) =>
            updateSeo(
              "index",
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
          <span>
            {message}
          </span>

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

      <div className="sticky bottom-5 z-20">
        <button
          type="button"
          onClick={
            saveSizeGuide
          }
          disabled={
            isSaving
          }
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Size Guide..."
            : "Save Size Guide"}
        </button>
      </div>
    </div>
  );
}
