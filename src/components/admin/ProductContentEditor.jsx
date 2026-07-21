"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

function createHighlightId() {
  return `product-highlight-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeFeatureHighlights(highlights) {
  if (!Array.isArray(highlights)) {
    return [];
  }

  return highlights
    .map((highlight, index) => ({
      id:
        highlight?.id ||
        `product-highlight-${index + 1}`,
      text: highlight?.text || "",
      order: Number(
        highlight?.order || index + 1
      ),
      isActive:
        highlight?.isActive !== false,
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeProductContent(content = {}) {
  return {
    key: "product",
    schemaVersion: Number(
      content.schemaVersion || 1
    ),
    status:
      content.status || "published",
    title:
      content.title || "Product Details",
    slug: content.slug || "product",

    seo: {
      fallbackTitle:
        content.seo?.fallbackTitle ||
        "OBSIDIAN Product",

      fallbackDescription:
        content.seo?.fallbackDescription ||
        "A refined OBSIDIAN essential built with pressure, precision, and purpose.",

      fallbackImage:
        content.seo?.fallbackImage ||
        "/images/collection-artifact.jpeg",

      notFoundTitle:
        content.seo?.notFoundTitle ||
        "Product Not Found",

      notFoundDescription:
        content.seo
          ?.notFoundDescription ||
        "The requested OBSIDIAN product could not be found or is no longer available.",

      titleTemplate:
        content.seo?.titleTemplate ||
        "{product}",

      openGraphTitleTemplate:
        content.seo
          ?.openGraphTitleTemplate ||
        "{product} | {site}",

      twitterTitleTemplate:
        content.seo
          ?.twitterTitleTemplate ||
        "{product} | {site}",

      canonicalTemplate:
        content.seo?.canonicalTemplate ||
        "/product/{id}",

      index:
        content.seo?.index !== false,
    },

    content: {
      breadcrumbHomeLabel:
        content.content
          ?.breadcrumbHomeLabel ||
        "Home",

      breadcrumbShopLabel:
        content.content
          ?.breadcrumbShopLabel ||
        "Shop",

      breadcrumbAriaLabel:
        content.content
          ?.breadcrumbAriaLabel ||
        "Breadcrumb",

      productFallbackName:
        content.content
          ?.productFallbackName ||
        "OBSIDIAN Product",

      productFallbackSeries:
        content.content
          ?.productFallbackSeries ||
        "OBSIDIAN",

      productFallbackColor:
        content.content
          ?.productFallbackColor ||
        "Obsidian Black",

      productImageAltTemplate:
        content.content
          ?.productImageAltTemplate ||
        "{product} by {site}",

      colorLabel:
        content.content?.colorLabel ||
        "Color",

      availabilityLabel:
        content.content
          ?.availabilityLabel ||
        "Availability",

      seriesLabel:
        content.content?.seriesLabel ||
        "Series",

      productCodeLabel:
        content.content
          ?.productCodeLabel ||
        "Product Code",

      availableTemplate:
        content.content
          ?.availableTemplate ||
        "{stock} Available",

      outOfStockText:
        content.content
          ?.outOfStockText ||
        "Out of Stock",

      currencySymbol:
        content.content
          ?.currencySymbol || "৳",

      currencyLocale:
        content.content
          ?.currencyLocale || "en-BD",

      featureHighlights:
        normalizeFeatureHighlights(
          content.content
            ?.featureHighlights
        ),

      productDetailsTitle:
        content.content
          ?.productDetailsTitle ||
        "Product Details",

      productDetailsFallback:
        content.content
          ?.productDetailsFallback ||
        "A premium everyday essential designed for structure, comfort, and quiet confidence.",

      deliveryTitle:
        content.content
          ?.deliveryTitle ||
        "Delivery",

      deliveryDescription:
        content.content
          ?.deliveryDescription ||
        "Delivery is available across Bangladesh. Every order is reviewed and confirmed after checkout before dispatch.",

      exchangeTitle:
        content.content
          ?.exchangeTitle ||
        "Exchange Support",

      exchangeDescription:
        content.content
          ?.exchangeDescription ||
        "Exchange assistance is available according to the OBSIDIAN exchange policy. Keep the product unused and retain its original packaging and tags.",

      notFoundEyebrow:
        content.content
          ?.notFoundEyebrow ||
        "Product",

      notFoundTitle:
        content.content?.notFoundTitle ||
        "Product not found.",

      notFoundDescription:
        content.content
          ?.notFoundDescription ||
        "This piece may have been removed, renamed, or is no longer available in the current collection.",

      notFoundButtonText:
        content.content
          ?.notFoundButtonText ||
        "Back To Shop",

      notFoundButtonHref:
        content.content
          ?.notFoundButtonHref ||
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

export default function ProductContentEditor({
  initialContent,
}) {
  const [productPage, setProductPage] =
    useState(() =>
      normalizeProductContent(
        initialContent
      )
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

  function updateRootField(
    field,
    value
  ) {
    clearMessage();

    setProductPage((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    clearMessage();

    setProductPage((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateContent(
    field,
    value
  ) {
    clearMessage();

    setProductPage((current) => ({
      ...current,
      content: {
        ...current.content,
        [field]: value,
      },
    }));
  }

  function addFeatureHighlight() {
    clearMessage();

    setProductPage((current) => {
      const currentHighlights =
        current.content
          .featureHighlights || [];

      const nextOrder =
        currentHighlights.length + 1;

      return {
        ...current,
        content: {
          ...current.content,
          featureHighlights: [
            ...currentHighlights,
            {
              id: createHighlightId(),
              text: "",
              order: nextOrder,
              isActive: true,
            },
          ],
        },
      };
    });
  }

  function updateFeatureHighlight(
    id,
    field,
    value
  ) {
    clearMessage();

    setProductPage((current) => ({
      ...current,
      content: {
        ...current.content,
        featureHighlights:
          current.content.featureHighlights.map(
            (highlight) =>
              highlight.id === id
                ? {
                    ...highlight,
                    [field]:
                      field === "order"
                        ? Number(
                            value || 0
                          )
                        : value,
                  }
                : highlight
          ),
      },
    }));
  }

  function removeFeatureHighlight(id) {
    clearMessage();

    setProductPage((current) => {
      const nextHighlights =
        current.content.featureHighlights
          .filter(
            (highlight) =>
              highlight.id !== id
          )
          .map(
            (highlight, index) => ({
              ...highlight,
              order: index + 1,
            })
          );

      return {
        ...current,
        content: {
          ...current.content,
          featureHighlights:
            nextHighlights,
        },
      };
    });
  }

  function moveFeatureHighlight(
    index,
    direction
  ) {
    clearMessage();

    setProductPage((current) => {
      const highlights = [
        ...current.content
          .featureHighlights,
      ];

      const targetIndex =
        index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= highlights.length
      ) {
        return current;
      }

      const [movedHighlight] =
        highlights.splice(index, 1);

      highlights.splice(
        targetIndex,
        0,
        movedHighlight
      );

      const reorderedHighlights =
        highlights.map(
          (highlight, itemIndex) => ({
            ...highlight,
            order: itemIndex + 1,
          })
        );

      return {
        ...current,
        content: {
          ...current.content,
          featureHighlights:
            reorderedHighlights,
        },
      };
    });
  }

  async function saveProductPage() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage(
      "Saving Product page..."
    );

    try {
      const payload = {
        ...productPage,
        content: {
          ...productPage.content,
          featureHighlights:
            productPage.content.featureHighlights
              .map(
                (
                  highlight,
                  index
                ) => ({
                  ...highlight,
                  order: index + 1,
                })
              )
              .filter(
                (highlight) =>
                  highlight.text.trim()
              ),
        },
      };

      const response = await fetch(
        "/api/cms/product",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
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
            "Product page could not be saved."
        );

        return;
      }

      setProductPage(
        normalizeProductContent(
          data.content
        )
      );

      setMessageType("success");

      setMessage(
        "Product page saved successfully."
      );

      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Product CMS save error:",
        error
      );

      setMessageType("error");

      setMessage(
        "Something went wrong while saving the Product page."
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
        description="Control the internal Product page identity and publication status."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={productPage.title}
            onChange={(value) =>
              updateRootField(
                "title",
                value
              )
            }
          />

          <TextInput
            label="Slug"
            value={productPage.slug}
            onChange={(value) =>
              updateRootField(
                "slug",
                value
              )
            }
            placeholder="product"
          />

          <SelectInput
            label="Publish Status"
            value={productPage.status}
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
        description="Manage the breadcrumb text and accessibility label displayed on product pages."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Home Label"
            value={
              productPage.content
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
            label="Shop Label"
            value={
              productPage.content
                .breadcrumbShopLabel
            }
            onChange={(value) =>
              updateContent(
                "breadcrumbShopLabel",
                value
              )
            }
            placeholder="Shop"
          />

          <TextInput
            label="Breadcrumb Accessibility Label"
            value={
              productPage.content
                .breadcrumbAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "breadcrumbAriaLabel",
                value
              )
            }
            placeholder="Breadcrumb"
          />
        </div>
      </Panel>

      <Panel
        title="Product Fallback Content"
        description="These values are used when product-specific information is missing."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Fallback Product Name"
            value={
              productPage.content
                .productFallbackName
            }
            onChange={(value) =>
              updateContent(
                "productFallbackName",
                value
              )
            }
            placeholder="OBSIDIAN Product"
          />

          <TextInput
            label="Fallback Series"
            value={
              productPage.content
                .productFallbackSeries
            }
            onChange={(value) =>
              updateContent(
                "productFallbackSeries",
                value
              )
            }
            placeholder="OBSIDIAN"
          />

          <TextInput
            label="Fallback Color"
            value={
              productPage.content
                .productFallbackColor
            }
            onChange={(value) =>
              updateContent(
                "productFallbackColor",
                value
              )
            }
            placeholder="Obsidian Black"
          />
        </div>

        <TextInput
          label="Product Image Alt Template"
          value={
            productPage.content
              .productImageAltTemplate
          }
          onChange={(value) =>
            updateContent(
              "productImageAltTemplate",
              value
            )
          }
          placeholder="{product} by {site}"
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholders:{" "}
          <span className="text-neutral-300">
            {"{product}"}, {"{site}"}
          </span>
        </p>
      </Panel>

      <Panel
        title="Product Information Labels"
        description="Control the labels displayed beside product information and inventory data."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Color Label"
            value={
              productPage.content
                .colorLabel
            }
            onChange={(value) =>
              updateContent(
                "colorLabel",
                value
              )
            }
            placeholder="Color"
          />

          <TextInput
            label="Availability Label"
            value={
              productPage.content
                .availabilityLabel
            }
            onChange={(value) =>
              updateContent(
                "availabilityLabel",
                value
              )
            }
            placeholder="Availability"
          />

          <TextInput
            label="Series Label"
            value={
              productPage.content
                .seriesLabel
            }
            onChange={(value) =>
              updateContent(
                "seriesLabel",
                value
              )
            }
            placeholder="Series"
          />

          <TextInput
            label="Product Code Label"
            value={
              productPage.content
                .productCodeLabel
            }
            onChange={(value) =>
              updateContent(
                "productCodeLabel",
                value
              )
            }
            placeholder="Product Code"
          />
        </div>
      </Panel>

      <Panel
        title="Stock And Currency"
        description="Manage inventory messages and price formatting settings."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Available Stock Template"
            value={
              productPage.content
                .availableTemplate
            }
            onChange={(value) =>
              updateContent(
                "availableTemplate",
                value
              )
            }
            placeholder="{stock} Available"
          />

          <TextInput
            label="Out Of Stock Text"
            value={
              productPage.content
                .outOfStockText
            }
            onChange={(value) =>
              updateContent(
                "outOfStockText",
                value
              )
            }
            placeholder="Out of Stock"
          />

          <TextInput
            label="Currency Symbol"
            value={
              productPage.content
                .currencySymbol
            }
            onChange={(value) =>
              updateContent(
                "currencySymbol",
                value
              )
            }
            placeholder="৳"
          />

          <TextInput
            label="Currency Locale"
            value={
              productPage.content
                .currencyLocale
            }
            onChange={(value) =>
              updateContent(
                "currencyLocale",
                value
              )
            }
            placeholder="en-BD"
          />
        </div>

        <p className="text-xs leading-6 text-neutral-500">
          The availability template supports{" "}
          <span className="text-neutral-300">
            {"{stock}"}
          </span>
          .
        </p>
      </Panel>

      <Panel
        title="Feature Highlights"
        description="Create and arrange the reusable product benefits displayed on product pages."
      >
        <div className="space-y-4">
          {productPage.content
            .featureHighlights.length ? (
            productPage.content.featureHighlights.map(
              (highlight, index) => (
                <div
                  key={highlight.id}
                  className="border border-white/10 bg-white/[0.025] p-5"
                >
                  <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_130px]">
                    <TextInput
                      label={`Highlight ${index + 1}`}
                      value={
                        highlight.text
                      }
                      onChange={(value) =>
                        updateFeatureHighlight(
                          highlight.id,
                          "text",
                          value
                        )
                      }
                      placeholder="Premium Cotton"
                    />

                    <TextInput
                      label="Order"
                      type="number"
                      value={
                        highlight.order
                      }
                      onChange={(value) =>
                        updateFeatureHighlight(
                          highlight.id,
                          "order",
                          value
                        )
                      }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                    <CheckboxInput
                      label="Active"
                      description="Show this highlight on product pages."
                      checked={
                        highlight.isActive
                      }
                      onChange={(value) =>
                        updateFeatureHighlight(
                          highlight.id,
                          "isActive",
                          value
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        moveFeatureHighlight(
                          index,
                          -1
                        )
                      }
                      disabled={index === 0}
                      className="border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Move Up
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveFeatureHighlight(
                          index,
                          1
                        )
                      }
                      disabled={
                        index ===
                        productPage.content
                          .featureHighlights
                          .length -
                          1
                      }
                      className="border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Move Down
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeFeatureHighlight(
                          highlight.id
                        )
                      }
                      className="border border-red-500/20 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
              No feature highlights have been added.
            </div>
          )}

          <button
            type="button"
            onClick={addFeatureHighlight}
            className="w-full border border-white/15 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Add Feature Highlight
          </button>
        </div>
      </Panel>

      <Panel
        title="Product Details"
        description="Manage the product details section heading and fallback description."
      >
        <TextInput
          label="Section Title"
          value={
            productPage.content
              .productDetailsTitle
          }
          onChange={(value) =>
            updateContent(
              "productDetailsTitle",
              value
            )
          }
          placeholder="Product Details"
        />

        <TextareaInput
          label="Fallback Description"
          value={
            productPage.content
              .productDetailsFallback
          }
          onChange={(value) =>
            updateContent(
              "productDetailsFallback",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Delivery Content"
        description="Control the delivery information displayed on product pages."
      >
        <TextInput
          label="Delivery Title"
          value={
            productPage.content
              .deliveryTitle
          }
          onChange={(value) =>
            updateContent(
              "deliveryTitle",
              value
            )
          }
          placeholder="Delivery"
        />

        <TextareaInput
          label="Delivery Description"
          value={
            productPage.content
              .deliveryDescription
          }
          onChange={(value) =>
            updateContent(
              "deliveryDescription",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Exchange Support"
        description="Control the exchange support information displayed on product pages."
      >
        <TextInput
          label="Exchange Title"
          value={
            productPage.content
              .exchangeTitle
          }
          onChange={(value) =>
            updateContent(
              "exchangeTitle",
              value
            )
          }
          placeholder="Exchange Support"
        />

        <TextareaInput
          label="Exchange Description"
          value={
            productPage.content
              .exchangeDescription
          }
          onChange={(value) =>
            updateContent(
              "exchangeDescription",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Product Not Found State"
        description="Manage the content shown when a requested product cannot be found."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={
              productPage.content
                .notFoundEyebrow
            }
            onChange={(value) =>
              updateContent(
                "notFoundEyebrow",
                value
              )
            }
            placeholder="Product"
          />

          <TextInput
            label="Title"
            value={
              productPage.content
                .notFoundTitle
            }
            onChange={(value) =>
              updateContent(
                "notFoundTitle",
                value
              )
            }
            placeholder="Product not found."
          />
        </div>

        <TextareaInput
          label="Description"
          value={
            productPage.content
              .notFoundDescription
          }
          onChange={(value) =>
            updateContent(
              "notFoundDescription",
              value
            )
          }
          rows={5}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Button Text"
            value={
              productPage.content
                .notFoundButtonText
            }
            onChange={(value) =>
              updateContent(
                "notFoundButtonText",
                value
              )
            }
            placeholder="Back To Shop"
          />

          <TextInput
            label="Button URL"
            value={
              productPage.content
                .notFoundButtonHref
            }
            onChange={(value) =>
              updateContent(
                "notFoundButtonHref",
                value
              )
            }
            placeholder="/shop"
          />
        </div>
      </Panel>

      <Panel
        title="Default Product SEO"
        description="Manage fallback metadata used when product-specific metadata is unavailable."
      >
        <TextInput
          label="Fallback SEO Title"
          value={
            productPage.seo
              .fallbackTitle
          }
          onChange={(value) =>
            updateSeo(
              "fallbackTitle",
              value
            )
          }
          placeholder="OBSIDIAN Product"
        />

        <TextareaInput
          label="Fallback SEO Description"
          value={
            productPage.seo
              .fallbackDescription
          }
          onChange={(value) =>
            updateSeo(
              "fallbackDescription",
              value
            )
          }
          rows={5}
        />

        <div>
          <FieldLabel>
            Fallback Social Image
          </FieldLabel>

          <ImageUploader
            value={
              productPage.seo
                .fallbackImage || ""
            }
            onChange={(value) =>
              updateSeo(
                "fallbackImage",
                value
              )
            }
          />
        </div>

        <CheckboxInput
          label="Allow Search Engine Indexing"
          description="Disable this only when product pages should not appear in search engine results."
          checked={
            productPage.seo.index !==
            false
          }
          onChange={(value) =>
            updateSeo("index", value)
          }
        />
      </Panel>

      <Panel
        title="Product SEO Templates"
        description="Control metadata titles and canonical URLs generated for individual products."
      >
        <TextInput
          label="Page Title Template"
          value={
            productPage.seo
              .titleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "titleTemplate",
              value
            )
          }
          placeholder="{product}"
        />

        <TextInput
          label="Open Graph Title Template"
          value={
            productPage.seo
              .openGraphTitleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "openGraphTitleTemplate",
              value
            )
          }
          placeholder="{product} | {site}"
        />

        <TextInput
          label="Twitter Title Template"
          value={
            productPage.seo
              .twitterTitleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "twitterTitleTemplate",
              value
            )
          }
          placeholder="{product} | {site}"
        />

        <TextInput
          label="Canonical URL Template"
          value={
            productPage.seo
              .canonicalTemplate
          }
          onChange={(value) =>
            updateSeo(
              "canonicalTemplate",
              value
            )
          }
          placeholder="/product/{id}"
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholders:{" "}
          <span className="text-neutral-300">
            {"{product}"}, {"{site}"},{" "}
            {"{id}"}
          </span>
        </p>
      </Panel>

      <Panel
        title="Not Found SEO"
        description="Manage metadata returned when a product does not exist."
      >
        <TextInput
          label="Not Found SEO Title"
          value={
            productPage.seo
              .notFoundTitle
          }
          onChange={(value) =>
            updateSeo(
              "notFoundTitle",
              value
            )
          }
          placeholder="Product Not Found"
        />

        <TextareaInput
          label="Not Found SEO Description"
          value={
            productPage.seo
              .notFoundDescription
          }
          onChange={(value) =>
            updateSeo(
              "notFoundDescription",
              value
            )
          }
          rows={5}
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
          onClick={saveProductPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Product Page..."
            : "Save Product Page"}
        </button>
      </div>
    </div>
  );
}