"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

function normalizeShopContent(content = {}) {
  return {
    key: "shop",
    schemaVersion: Number(content.schemaVersion || 1),
    status: content.status || "published",
    title: content.title || "Shop",
    slug: content.slug || "shop",

    seo: {
      title: content.seo?.title || "Shop",

      description:
        content.seo?.description ||
        "Discover premium OBSIDIAN menswear and engineered essentials built under pressure and finished with precision.",

      keywords:
        content.seo?.keywords ||
        "OBSIDIAN shop, premium menswear Bangladesh, oversized t-shirts Bangladesh",

      ogImage:
        content.seo?.ogImage ||
        "/images/collection-artifact.jpeg",

      canonical:
        content.seo?.canonical || "/shop",

      index:
        content.seo?.index !== false,

      searchTitleTemplate:
        content.seo?.searchTitleTemplate ||
        "Search Results for “{query}”",

      seriesTitleTemplate:
        content.seo?.seriesTitleTemplate ||
        "{series} Collection",

      colorTitleTemplate:
        content.seo?.colorTitleTemplate ||
        "{color} Products",

      searchDescriptionTemplate:
        content.seo?.searchDescriptionTemplate ||
        "Browse OBSIDIAN products matching “{query}”. Explore premium menswear built with precision and purpose.",

      seriesDescriptionTemplate:
        content.seo?.seriesDescriptionTemplate ||
        "Explore the {series} from OBSIDIAN—premium pieces shaped by pressure, precision, and quiet confidence.",

      colorDescriptionTemplate:
        content.seo?.colorDescriptionTemplate ||
        "Explore {color} OBSIDIAN pieces designed with structure, comfort, and precision.",
    },

    content: {
      breadcrumbHomeLabel:
        content.content?.breadcrumbHomeLabel ||
        "Home",

      breadcrumbShopLabel:
        content.content?.breadcrumbShopLabel ||
        "Shop",

      eyebrow:
        content.content?.eyebrow ||
        "Shop",

      defaultTitleLineOne:
        content.content?.defaultTitleLineOne ||
        "Engineered",

      defaultTitleLineTwo:
        content.content?.defaultTitleLineTwo ||
        "Essentials",

      searchTitleLineOne:
        content.content?.searchTitleLineOne ||
        "Search",

      searchTitleLineTwo:
        content.content?.searchTitleLineTwo ||
        "Results",

      defaultDescription:
        content.content?.defaultDescription ||
        "Search, filter, and discover OBSIDIAN pieces built under pressure and finished with precision.",

      searchDescriptionTemplate:
        content.content?.searchDescriptionTemplate ||
        "Showing OBSIDIAN pieces matching “{query}”.",

      seriesDescriptionTemplate:
        content.content?.seriesDescriptionTemplate ||
        "Explore the {series}, built with pressure, precision, and purpose.",

      activeFiltersLabel:
        content.content?.activeFiltersLabel ||
        "Active Filters",

      searchFilterPrefix:
        content.content?.searchFilterPrefix ||
        "Search:",

      searchPlaceholder:
        content.content?.searchPlaceholder ||
        "Search product, color, series...",

      searchAriaLabel:
        content.content?.searchAriaLabel ||
        "Search products",

      seriesAriaLabel:
        content.content?.seriesAriaLabel ||
        "Filter by series",

      colorAriaLabel:
        content.content?.colorAriaLabel ||
        "Filter by color",

      sortAriaLabel:
        content.content?.sortAriaLabel ||
        "Sort products",

      allLabel:
        content.content?.allLabel ||
        "All",

      newestLabel:
        content.content?.newestLabel ||
        "Newest",

      priceLowLabel:
        content.content?.priceLowLabel ||
        "Price Low",

      priceHighLabel:
        content.content?.priceHighLabel ||
        "Price High",

      nameAzLabel:
        content.content?.nameAzLabel ||
        "Name A–Z",

      applyButtonText:
        content.content?.applyButtonText ||
        "Apply",

      productSingularLabel:
        content.content?.productSingularLabel ||
        "Product",

      productPluralLabel:
        content.content?.productPluralLabel ||
        "Products",

      inStockLabel:
        content.content?.inStockLabel ||
        "In Stock",

      soldOutLabel:
        content.content?.soldOutLabel ||
        "Sold Out",

      wishlistButtonText:
        content.content?.wishlistButtonText ||
        "Wishlist",

      resetButtonText:
        content.content?.resetButtonText ||
        "Reset",

      emptyStateEyebrow:
        content.content?.emptyStateEyebrow ||
        "No Results",

      emptyStateTitle:
        content.content?.emptyStateTitle ||
        "No products found.",

      emptyStateDescription:
        content.content?.emptyStateDescription ||
        "Try adjusting your search, series, color, availability, or sorting option.",

      emptyStateButtonText:
        content.content?.emptyStateButtonText ||
        "Reset Shop",

      productFallbackName:
        content.content?.productFallbackName ||
        "OBSIDIAN Product",

      productFallbackSeries:
        content.content?.productFallbackSeries ||
        "OBSIDIAN",

      productFallbackColor:
        content.content?.productFallbackColor ||
        "Obsidian Black",

      viewProductAriaTemplate:
        content.content?.viewProductAriaTemplate ||
        "View {product}",

      lowStockTemplate:
        content.content?.lowStockTemplate ||
        "Only {stock} Left",

      stockCountTemplate:
        content.content?.stockCountTemplate ||
        "{stock} In Stock",

      outOfStockText:
        content.content?.outOfStockText ||
        "Out of Stock",
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

export default function ShopContentEditor({
  initialContent,
}) {
  const [shopPage, setShopPage] =
    useState(() =>
      normalizeShopContent(initialContent)
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

    setShopPage((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSeo(field, value) {
    clearMessage();

    setShopPage((current) => ({
      ...current,

      seo: {
        ...current.seo,
        [field]: value,
      },
    }));
  }

  function updateContent(field, value) {
    clearMessage();

    setShopPage((current) => ({
      ...current,

      content: {
        ...current.content,
        [field]: value,
      },
    }));
  }

  async function saveShopPage() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessageType("loading");
    setMessage("Saving Shop page...");

    try {
      const response = await fetch(
        "/api/cms/shop",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(shopPage),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessageType("error");

        setMessage(
          data.message ||
            "Shop page could not be saved."
        );

        return;
      }

      setShopPage(
        normalizeShopContent(data.content)
      );

      setMessageType("success");

      setMessage(
        "Shop page saved successfully."
      );

      setLastSavedAt(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Shop CMS save error:",
        error
      );

      setMessageType("error");

      setMessage(
        "Something went wrong while saving the Shop page."
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
        description="Control the internal Shop page identity and publication status."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page Title"
            value={shopPage.title}
            onChange={(value) =>
              updateRootField(
                "title",
                value
              )
            }
          />

          <TextInput
            label="Slug"
            value={shopPage.slug}
            onChange={(value) =>
              updateRootField(
                "slug",
                value
              )
            }
            placeholder="shop"
          />

          <SelectInput
            label="Publish Status"
            value={shopPage.status}
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
        description="Control the navigation labels displayed above the Shop page heading."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Home Label"
            value={
              shopPage.content
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
              shopPage.content
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
        </div>
      </Panel>

      <Panel
        title="Shop Page Header"
        description="Manage the main Shop page heading and introductory description."
      >
        <TextInput
          label="Eyebrow"
          value={
            shopPage.content.eyebrow
          }
          onChange={(value) =>
            updateContent(
              "eyebrow",
              value
            )
          }
          placeholder="Shop"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Default Title Line One"
            value={
              shopPage.content
                .defaultTitleLineOne
            }
            onChange={(value) =>
              updateContent(
                "defaultTitleLineOne",
                value
              )
            }
            placeholder="Engineered"
          />

          <TextInput
            label="Default Title Line Two"
            value={
              shopPage.content
                .defaultTitleLineTwo
            }
            onChange={(value) =>
              updateContent(
                "defaultTitleLineTwo",
                value
              )
            }
            placeholder="Essentials"
          />

          <TextInput
            label="Search Title Line One"
            value={
              shopPage.content
                .searchTitleLineOne
            }
            onChange={(value) =>
              updateContent(
                "searchTitleLineOne",
                value
              )
            }
            placeholder="Search"
          />

          <TextInput
            label="Search Title Line Two"
            value={
              shopPage.content
                .searchTitleLineTwo
            }
            onChange={(value) =>
              updateContent(
                "searchTitleLineTwo",
                value
              )
            }
            placeholder="Results"
          />
        </div>

        <TextareaInput
          label="Default Description"
          value={
            shopPage.content
              .defaultDescription
          }
          onChange={(value) =>
            updateContent(
              "defaultDescription",
              value
            )
          }
          rows={5}
        />
      </Panel>

      <Panel
        title="Dynamic Page Descriptions"
        description="Use template placeholders to control descriptions shown for active searches and collection filters."
      >
        <TextareaInput
          label="Search Description Template"
          value={
            shopPage.content
              .searchDescriptionTemplate
          }
          onChange={(value) =>
            updateContent(
              "searchDescriptionTemplate",
              value
            )
          }
          placeholder="Showing products matching “{query}”."
          rows={4}
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholder:{" "}
          <span className="text-neutral-300">
            {"{query}"}
          </span>
        </p>

        <TextareaInput
          label="Series Description Template"
          value={
            shopPage.content
              .seriesDescriptionTemplate
          }
          onChange={(value) =>
            updateContent(
              "seriesDescriptionTemplate",
              value
            )
          }
          placeholder="Explore the {series}."
          rows={4}
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholder:{" "}
          <span className="text-neutral-300">
            {"{series}"}
          </span>
        </p>
      </Panel>

      <Panel
        title="Search And Filters"
        description="Manage the search field, filter headings, option labels, and accessible descriptions."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Active Filters Label"
            value={
              shopPage.content
                .activeFiltersLabel
            }
            onChange={(value) =>
              updateContent(
                "activeFiltersLabel",
                value
              )
            }
            placeholder="Active Filters"
          />

          <TextInput
            label="Search Filter Prefix"
            value={
              shopPage.content
                .searchFilterPrefix
            }
            onChange={(value) =>
              updateContent(
                "searchFilterPrefix",
                value
              )
            }
            placeholder="Search:"
          />

          <TextInput
            label="Search Placeholder"
            value={
              shopPage.content
                .searchPlaceholder
            }
            onChange={(value) =>
              updateContent(
                "searchPlaceholder",
                value
              )
            }
            placeholder="Search product, color, series..."
          />

          <TextInput
            label="Apply Button Text"
            value={
              shopPage.content
                .applyButtonText
            }
            onChange={(value) =>
              updateContent(
                "applyButtonText",
                value
              )
            }
            placeholder="Apply"
          />

          <TextInput
            label="All Option Label"
            value={
              shopPage.content.allLabel
            }
            onChange={(value) =>
              updateContent(
                "allLabel",
                value
              )
            }
            placeholder="All"
          />

          <TextInput
            label="Reset Button Text"
            value={
              shopPage.content
                .resetButtonText
            }
            onChange={(value) =>
              updateContent(
                "resetButtonText",
                value
              )
            }
            placeholder="Reset"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Search Accessibility Label"
            value={
              shopPage.content
                .searchAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "searchAriaLabel",
                value
              )
            }
          />

          <TextInput
            label="Series Accessibility Label"
            value={
              shopPage.content
                .seriesAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "seriesAriaLabel",
                value
              )
            }
          />

          <TextInput
            label="Color Accessibility Label"
            value={
              shopPage.content
                .colorAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "colorAriaLabel",
                value
              )
            }
          />

          <TextInput
            label="Sort Accessibility Label"
            value={
              shopPage.content
                .sortAriaLabel
            }
            onChange={(value) =>
              updateContent(
                "sortAriaLabel",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Sorting Labels"
        description="Control the text displayed inside the Shop sorting menu."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Newest"
            value={
              shopPage.content
                .newestLabel
            }
            onChange={(value) =>
              updateContent(
                "newestLabel",
                value
              )
            }
          />

          <TextInput
            label="Price Low"
            value={
              shopPage.content
                .priceLowLabel
            }
            onChange={(value) =>
              updateContent(
                "priceLowLabel",
                value
              )
            }
          />

          <TextInput
            label="Price High"
            value={
              shopPage.content
                .priceHighLabel
            }
            onChange={(value) =>
              updateContent(
                "priceHighLabel",
                value
              )
            }
          />

          <TextInput
            label="Name A–Z"
            value={
              shopPage.content
                .nameAzLabel
            }
            onChange={(value) =>
              updateContent(
                "nameAzLabel",
                value
              )
            }
          />
        </div>
      </Panel>

      <Panel
        title="Product Count And Availability"
        description="Manage product count labels and availability filter text."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Product Singular Label"
            value={
              shopPage.content
                .productSingularLabel
            }
            onChange={(value) =>
              updateContent(
                "productSingularLabel",
                value
              )
            }
            placeholder="Product"
          />

          <TextInput
            label="Product Plural Label"
            value={
              shopPage.content
                .productPluralLabel
            }
            onChange={(value) =>
              updateContent(
                "productPluralLabel",
                value
              )
            }
            placeholder="Products"
          />

          <TextInput
            label="In Stock Label"
            value={
              shopPage.content
                .inStockLabel
            }
            onChange={(value) =>
              updateContent(
                "inStockLabel",
                value
              )
            }
            placeholder="In Stock"
          />

          <TextInput
            label="Sold Out Label"
            value={
              shopPage.content
                .soldOutLabel
            }
            onChange={(value) =>
              updateContent(
                "soldOutLabel",
                value
              )
            }
            placeholder="Sold Out"
          />
        </div>
      </Panel>

      <Panel
        title="Product Card Labels"
        description="Control reusable text and fallback values displayed on product cards."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Wishlist Button Text"
            value={
              shopPage.content
                .wishlistButtonText
            }
            onChange={(value) =>
              updateContent(
                "wishlistButtonText",
                value
              )
            }
            placeholder="Wishlist"
          />

          <TextInput
            label="Fallback Product Name"
            value={
              shopPage.content
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
              shopPage.content
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
              shopPage.content
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
          label="View Product Accessibility Template"
          value={
            shopPage.content
              .viewProductAriaTemplate
          }
          onChange={(value) =>
            updateContent(
              "viewProductAriaTemplate",
              value
            )
          }
          placeholder="View {product}"
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholder:{" "}
          <span className="text-neutral-300">
            {"{product}"}
          </span>
        </p>
      </Panel>

      <Panel
        title="Product Stock Labels"
        description="Manage reusable stock messages shown on product cards."
      >
        <TextInput
          label="Low Stock Template"
          value={
            shopPage.content
              .lowStockTemplate
          }
          onChange={(value) =>
            updateContent(
              "lowStockTemplate",
              value
            )
          }
          placeholder="Only {stock} Left"
        />

        <TextInput
          label="Stock Count Template"
          value={
            shopPage.content
              .stockCountTemplate
          }
          onChange={(value) =>
            updateContent(
              "stockCountTemplate",
              value
            )
          }
          placeholder="{stock} In Stock"
        />

        <TextInput
          label="Out Of Stock Text"
          value={
            shopPage.content
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

        <p className="text-xs leading-6 text-neutral-500">
          Stock templates support the placeholder{" "}
          <span className="text-neutral-300">
            {"{stock}"}
          </span>
          .
        </p>
      </Panel>

      <Panel
        title="Empty State"
        description="This content appears when no products match the current search or filters."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Empty State Eyebrow"
            value={
              shopPage.content
                .emptyStateEyebrow
            }
            onChange={(value) =>
              updateContent(
                "emptyStateEyebrow",
                value
              )
            }
            placeholder="No Results"
          />

          <TextInput
            label="Empty State Title"
            value={
              shopPage.content
                .emptyStateTitle
            }
            onChange={(value) =>
              updateContent(
                "emptyStateTitle",
                value
              )
            }
            placeholder="No products found."
          />
        </div>

        <TextareaInput
          label="Empty State Description"
          value={
            shopPage.content
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

        <TextInput
          label="Empty State Button Text"
          value={
            shopPage.content
              .emptyStateButtonText
          }
          onChange={(value) =>
            updateContent(
              "emptyStateButtonText",
              value
            )
          }
          placeholder="Reset Shop"
        />
      </Panel>

      <Panel
        title="Default Shop SEO"
        description="Manage the default metadata used when no dynamic Shop filter is active."
      >
        <TextInput
          label="SEO Title"
          value={shopPage.seo.title}
          onChange={(value) =>
            updateSeo("title", value)
          }
        />

        <TextareaInput
          label="SEO Description"
          value={
            shopPage.seo.description
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
            shopPage.seo.keywords
          }
          onChange={(value) =>
            updateSeo(
              "keywords",
              value
            )
          }
          placeholder="OBSIDIAN shop, premium menswear Bangladesh"
        />

        <TextInput
          label="Canonical URL"
          value={
            shopPage.seo.canonical
          }
          onChange={(value) =>
            updateSeo(
              "canonical",
              value
            )
          }
          placeholder="/shop"
        />

        <div>
          <FieldLabel>
            Open Graph Image
          </FieldLabel>

          <ImageUploader
            value={
              shopPage.seo.ogImage ||
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
          description="Disable this only when the Shop page should not appear in search engine results."
          checked={
            shopPage.seo.index !==
            false
          }
          onChange={(value) =>
            updateSeo("index", value)
          }
        />
      </Panel>

      <Panel
        title="Dynamic SEO Titles"
        description="Control metadata titles generated for active search, series, and color filters."
      >
        <TextInput
          label="Search Title Template"
          value={
            shopPage.seo
              .searchTitleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "searchTitleTemplate",
              value
            )
          }
          placeholder="Search Results for “{query}”"
        />

        <TextInput
          label="Series Title Template"
          value={
            shopPage.seo
              .seriesTitleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "seriesTitleTemplate",
              value
            )
          }
          placeholder="{series} Collection"
        />

        <TextInput
          label="Color Title Template"
          value={
            shopPage.seo
              .colorTitleTemplate
          }
          onChange={(value) =>
            updateSeo(
              "colorTitleTemplate",
              value
            )
          }
          placeholder="{color} Products"
        />

        <p className="text-xs leading-6 text-neutral-500">
          Available placeholders:{" "}
          <span className="text-neutral-300">
            {"{query}"}, {"{series}"},{" "}
            {"{color}"}
          </span>
        </p>
      </Panel>

      <Panel
        title="Dynamic SEO Descriptions"
        description="Control metadata descriptions generated for active search, series, and color filters."
      >
        <TextareaInput
          label="Search Description Template"
          value={
            shopPage.seo
              .searchDescriptionTemplate
          }
          onChange={(value) =>
            updateSeo(
              "searchDescriptionTemplate",
              value
            )
          }
          rows={5}
        />

        <TextareaInput
          label="Series Description Template"
          value={
            shopPage.seo
              .seriesDescriptionTemplate
          }
          onChange={(value) =>
            updateSeo(
              "seriesDescriptionTemplate",
              value
            )
          }
          rows={5}
        />

        <TextareaInput
          label="Color Description Template"
          value={
            shopPage.seo
              .colorDescriptionTemplate
          }
          onChange={(value) =>
            updateSeo(
              "colorDescriptionTemplate",
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
          onClick={saveShopPage}
          disabled={isSaving}
          className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#0b0b0b] shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving Shop Page..."
            : "Save Shop Page"}
        </button>
      </div>
    </div>
  );
}