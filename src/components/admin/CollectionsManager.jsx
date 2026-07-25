"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";

const EMPTY_FORM = {
  title: "",
  slug: "",
  series: "",
  description: "",
  coverImage: "",
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "featured", label: "Featured" },
  { value: "automatic", label: "Automatic" },
  { value: "managed", label: "Managed" },
  { value: "empty", label: "Empty" },
];

const SORT_OPTIONS = [
  { value: "order", label: "Display Order" },
  { value: "title", label: "Title A–Z" },
  { value: "products", label: "Most Products" },
  { value: "updated", label: "Recently Updated" },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSeriesKey(value) {
  return normalizeText(value).toLocaleLowerCase("en");
}

function createSlug(value) {
  return normalizeText(value)
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function getCollectionId(collection) {
  if (!collection?._id) {
    return "";
  }

  if (typeof collection._id === "string") {
    return collection._id;
  }

  if (collection._id.$oid) {
    return collection._id.$oid;
  }

  return String(collection._id);
}

function getCollectionForm(collection = {}) {
  return {
    title: collection.title || "",
    slug: collection.slug || "",
    series: collection.series || "",
    description: collection.description || "",
    coverImage: collection.coverImage || "",
    displayOrder: Number(collection.displayOrder || 0),
    isActive: collection.isActive !== false,
    isFeatured: collection.isFeatured === true,
  };
}

function getComparableForm(form) {
  return {
    title: normalizeText(form.title),
    slug: createSlug(form.slug || form.title),
    series: normalizeText(form.series),
    description: normalizeText(form.description),
    coverImage: normalizeText(form.coverImage),
    displayOrder: Number(form.displayOrder || 0),
    isActive: Boolean(form.isActive),
    isFeatured: Boolean(form.isFeatured),
  };
}

function getProductCount(collection) {
  return Number(collection?.productCount || 0);
}

function getActiveProductCount(collection) {
  return Number(collection?.activeProductCount || 0);
}

function getInactiveProductCount(collection) {
  return Number(collection?.inactiveProductCount || 0);
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildSeriesOptions(collections, suppliedOptions = []) {
  const optionMap = new Map();

  for (const option of suppliedOptions) {
    const series = normalizeText(option?.series);
    const seriesKey = normalizeSeriesKey(option?.seriesKey || series);

    if (!series || !seriesKey) {
      continue;
    }

    optionMap.set(seriesKey, {
      series,
      seriesKey,
      productCount: Number(option.productCount || 0),
      activeProductCount: Number(option.activeProductCount || 0),
      inactiveProductCount: Number(option.inactiveProductCount || 0),
    });
  }

  for (const collection of collections) {
    const series = normalizeText(collection?.series);
    const seriesKey = normalizeSeriesKey(
      collection?.seriesKey || series
    );

    if (!series || !seriesKey) {
      continue;
    }

    optionMap.set(seriesKey, {
      series,
      seriesKey,
      productCount: getProductCount(collection),
      activeProductCount: getActiveProductCount(collection),
      inactiveProductCount: getInactiveProductCount(collection),
    });
  }

  return Array.from(optionMap.values()).sort((first, second) =>
    first.series.localeCompare(second.series)
  );
}

function validateForm(form) {
  const errors = {};

  const title = normalizeText(form.title);
  const slug = createSlug(form.slug || form.title);
  const series = normalizeText(form.series);
  const description = normalizeText(form.description);
  const coverImage = normalizeText(form.coverImage);
  const displayOrder = Number(form.displayOrder);

  if (!title) {
    errors.title = "Collection title is required.";
  } else if (title.length > 140) {
    errors.title = "Collection title must not exceed 140 characters.";
  }

  if (!slug) {
    errors.slug = "A valid collection slug is required.";
  } else if (slug.length > 100) {
    errors.slug = "Collection slug must not exceed 100 characters.";
  }

  if (!series) {
    errors.series = "Product series is required.";
  } else if (series.length > 120) {
    errors.series = "Product series must not exceed 120 characters.";
  }

  if (!description) {
    errors.description = "Collection description is required.";
  } else if (description.length > 5000) {
    errors.description =
      "Collection description must not exceed 5,000 characters.";
  }

  if (!coverImage) {
    errors.coverImage = "Collection cover image is required.";
  } else if (coverImage.length > 1000) {
    errors.coverImage =
      "Collection cover image URL must not exceed 1,000 characters.";
  }

  if (
    !Number.isFinite(displayOrder) ||
    !Number.isInteger(displayOrder)
  ) {
    errors.displayOrder = "Display order must be a whole number.";
  } else if (displayOrder < 0) {
    errors.displayOrder = "Display order cannot be negative.";
  } else if (displayOrder > 1000000) {
    errors.displayOrder = "Display order is too large.";
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-xs leading-5 text-red-300" role="alert">
      {message}
    </p>
  );
}

function StatusBadge({ children, variant = "neutral" }) {
  const styles = {
    active: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
    hidden: "border-red-500/35 bg-red-500/10 text-red-300",
    featured: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    automatic: "border-blue-500/35 bg-blue-500/10 text-blue-300",
    managed: "border-white/15 bg-white/5 text-neutral-300",
    neutral: "border-white/15 bg-white/5 text-neutral-400",
  };

  return (
    <span
      className={`border px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] ${
        styles[variant] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}

export default function CollectionsManager({
  initialCollections = [],
  initialSeriesOptions = [],
}) {
  const router = useRouter();
  const formSectionRef = useRef(null);

  const [collections, setCollections] = useState(initialCollections);
  const [seriesOptions, setSeriesOptions] = useState(() =>
    buildSeriesOptions(initialCollections, initialSeriesOptions)
  );

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [baselineForm, setBaselineForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState("");
  const [editingCollection, setEditingCollection] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("order");

  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [seriesWasEdited, setSeriesWasEdited] = useState(false);
  const [confirmSeriesRename, setConfirmSeriesRename] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        setCollections(
          initialCollections
        );

        setSeriesOptions(
          buildSeriesOptions(
            initialCollections,
            initialSeriesOptions
          )
        );
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [
    initialCollections,
    initialSeriesOptions,
  ]);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(getComparableForm(form)) !==
      JSON.stringify(getComparableForm(baselineForm))
    );
  }, [form, baselineForm]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!isDirty || isSaving) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, isSaving]);

  const selectedSeriesOption = useMemo(() => {
    const currentSeriesKey = normalizeSeriesKey(form.series);

    return (
      seriesOptions.find(
        (option) => option.seriesKey === currentSeriesKey
      ) || null
    );
  }, [form.series, seriesOptions]);

  const seriesHasChanged = useMemo(() => {
    if (!editingCollection) {
      return false;
    }

    return (
      normalizeSeriesKey(form.series) !==
      normalizeSeriesKey(editingCollection.series)
    );
  }, [editingCollection, form.series]);

  const linkedProductCount = editingCollection
    ? getProductCount(editingCollection)
    : Number(selectedSeriesOption?.productCount || 0);

  const filteredCollections = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm).toLocaleLowerCase("en");

    const filtered = collections.filter((collection) => {
      const isActive = collection.isActive !== false;
      const isFeatured = collection.isFeatured === true;
      const isAutomatic = collection.isAutoGenerated === true;
      const productCount = getProductCount(collection);

      const matchesSearch =
        !normalizedSearch ||
        [
          collection.title,
          collection.slug,
          collection.series,
          collection.description,
        ].some((value) =>
          normalizeText(value)
            .toLocaleLowerCase("en")
            .includes(normalizedSearch)
        );

      if (!matchesSearch) {
        return false;
      }

      if (statusFilter === "active") {
        return isActive;
      }

      if (statusFilter === "hidden") {
        return !isActive;
      }

      if (statusFilter === "featured") {
        return isFeatured;
      }

      if (statusFilter === "automatic") {
        return isAutomatic;
      }

      if (statusFilter === "managed") {
        return !isAutomatic;
      }

      if (statusFilter === "empty") {
        return productCount === 0;
      }

      return true;
    });

    return filtered.sort((first, second) => {
      if (sortMode === "title") {
        return normalizeText(first.title).localeCompare(
          normalizeText(second.title)
        );
      }

      if (sortMode === "products") {
        const countDifference =
          getProductCount(second) - getProductCount(first);

        if (countDifference !== 0) {
          return countDifference;
        }

        return normalizeText(first.title).localeCompare(
          normalizeText(second.title)
        );
      }

      if (sortMode === "updated") {
        const firstTime = new Date(
          first.updatedAt || first.createdAt || 0
        ).getTime();

        const secondTime = new Date(
          second.updatedAt || second.createdAt || 0
        ).getTime();

        return secondTime - firstTime;
      }

      const firstOrder = Number(first.displayOrder || 0);
      const secondOrder = Number(second.displayOrder || 0);

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return normalizeText(first.title).localeCompare(
        normalizeText(second.title)
      );
    });
  }, [collections, searchTerm, statusFilter, sortMode]);

  function setStatus(type, text) {
    setMessage({
      type,
      text,
    });
  }

  function clearFieldError(field) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function confirmDiscardChanges() {
    if (!isDirty || isSaving) {
      return true;
    }

    return window.confirm(
      "You have unsaved collection changes. Discard them?"
    );
  }

  function updateForm(field, value) {
    clearFieldError(field);

    if (message.type === "error") {
      setStatus("", "");
    }

    if (field === "slug") {
      setSlugWasEdited(true);
    }

    if (field === "series") {
      setSeriesWasEdited(true);
      setConfirmSeriesRename(false);
    }

    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      };

      if (field === "title" && !editingId) {
        if (!slugWasEdited) {
          nextForm.slug = createSlug(value);
        }

        if (!seriesWasEdited) {
          nextForm.series = value;
        }
      }

      return nextForm;
    });
  }

  function resetForm({ preserveMessage = false } = {}) {
    setForm({ ...EMPTY_FORM });
    setBaselineForm({ ...EMPTY_FORM });
    setEditingId("");
    setEditingCollection(null);
    setFieldErrors({});
    setSlugWasEdited(false);
    setSeriesWasEdited(false);
    setConfirmSeriesRename(false);

    if (!preserveMessage) {
      setStatus("", "");
    }
  }

  function beginCreate() {
    if (!confirmDiscardChanges()) {
      return;
    }

    resetForm();

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function startEdit(collection) {
    if (!confirmDiscardChanges()) {
      return;
    }

    const collectionId = getCollectionId(collection);
    const nextForm = getCollectionForm(collection);

    setEditingId(collectionId);
    setEditingCollection(collection);
    setForm(nextForm);
    setBaselineForm(nextForm);
    setFieldErrors({});
    setSlugWasEdited(true);
    setSeriesWasEdited(true);
    setConfirmSeriesRename(false);
    setStatus("", "");

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function refreshCollections() {
    setIsRefreshing(true);

    try {
      const response = await fetch(
        "/api/collections?includeInactive=true",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {
        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Sign in again and retry."
          );
        }

        throw new Error(
          data?.message || "Collection data could not be refreshed."
        );
      }

      const nextCollections = Array.isArray(data.collections)
        ? data.collections
        : [];

      setCollections(nextCollections);
      setSeriesOptions(buildSeriesOptions(nextCollections));

      return nextCollections;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving || isUploading) {
      return;
    }

    const errors = validateForm(form);

    if (
      seriesHasChanged &&
      linkedProductCount > 0 &&
      !confirmSeriesRename
    ) {
      errors.seriesConfirmation =
        "Confirm that linked products should also move to the renamed series.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus(
        "error",
        "Review the highlighted collection fields before saving."
      );
      return;
    }

    setIsSaving(true);
    setStatus(
      "info",
      editingId ? "Updating collection..." : "Creating collection..."
    );

    const payload = {
      title: normalizeText(form.title),
      slug: createSlug(form.slug || form.title),
      series: normalizeText(form.series),
      description: normalizeText(form.description),
      coverImage: normalizeText(form.coverImage),
      displayOrder: Number(form.displayOrder),
      isActive: Boolean(form.isActive),
      isFeatured: Boolean(form.isFeatured),
    };

    const endpoint = editingId
      ? `/api/collections/${encodeURIComponent(editingId)}`
      : "/api/collections";

    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {
        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Sign in again and retry."
          );
        }

        throw new Error(
          data?.message || "Collection could not be saved."
        );
      }

      const successMessage =
        data.message ||
        (editingId
          ? "Collection updated successfully."
          : "Collection created successfully.");

      resetForm({ preserveMessage: true });
      setStatus("success", successMessage);

      await refreshCollections();
      router.refresh();
    } catch (error) {
      setStatus(
        "error",
        error?.message || "Something went wrong while saving the collection."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function requestDelete(collection) {
    if (getProductCount(collection) > 0) {
      setStatus(
        "error",
        `“${collection.title}” still contains ${formatCount(
          getProductCount(collection)
        )} product${
          getProductCount(collection) === 1 ? "" : "s"
        }. Move, draft, or delete those products first.`
      );

      return;
    }

    setDeleteCandidate(collection);
    setStatus("", "");
  }

  async function confirmDelete() {
    if (!deleteCandidate || isDeleting) {
      return;
    }

    const collectionId = getCollectionId(deleteCandidate);

    if (!collectionId) {
      setStatus("error", "Collection identifier is missing.");
      setDeleteCandidate(null);
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionId)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {
        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Sign in again and retry."
          );
        }

        throw new Error(
          data?.message || "Collection could not be deleted."
        );
      }

      const deletedId = collectionId;
      const successMessage =
        data.message || "Collection deleted successfully.";

      setDeleteCandidate(null);

      if (editingId === deletedId) {
        resetForm({ preserveMessage: true });
      }

      setStatus("success", successMessage);

      await refreshCollections();
      router.refresh();
    } catch (error) {
      setStatus(
        "error",
        error?.message ||
          "Something went wrong while deleting the collection."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const formDisabled = isSaving || isUploading;

  return (
    <>
      <div className="grid items-start gap-8 xl:grid-cols-[430px_minmax(0,1fr)]">
        <section
          ref={formSectionRef}
          className="scroll-mt-6 border border-white/10 bg-white/[0.025] xl:sticky xl:top-6"
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                    {editingId ? "Edit Collection" : "Create Collection"}
                  </p>

                  <h2 className="font-heading text-4xl font-light">
                    {editingId ? "Collection Details" : "New Collection"}
                  </h2>
                </div>

                {editingId ? (
                  <button
                    type="button"
                    onClick={beginCreate}
                    disabled={formDisabled}
                    className="border border-white/15 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-neutral-300 transition hover:border-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create New
                  </button>
                ) : null}
              </div>

              <p className="mt-4 text-xs leading-6 text-neutral-500">
                Published product series automatically create collections.
                Editing an automatic collection converts it into a managed
                collection without creating a duplicate.
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {editingCollection?.isAutoGenerated ? (
                <div className="border border-blue-500/25 bg-blue-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
                    Automatic Collection
                  </p>

                  <p className="mt-2 text-xs leading-6 text-blue-100/70">
                    Saving manual changes will convert this into a managed
                    collection. Your linked products will remain connected.
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Collection Title
                  <span className="ml-1 text-red-400" aria-hidden="true">
                    *
                  </span>
                </span>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  maxLength={140}
                  disabled={formDisabled}
                  placeholder="Artifact Series"
                  aria-invalid={Boolean(fieldErrors.title)}
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <FieldError message={fieldErrors.title} />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-neutral-500">
                  URL Slug
                  <span className="ml-1 text-red-400" aria-hidden="true">
                    *
                  </span>
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) =>
                      updateForm("slug", event.target.value)
                    }
                    maxLength={100}
                    disabled={formDisabled}
                    placeholder="artifact-series"
                    aria-invalid={Boolean(fieldErrors.slug)}
                    className="min-w-0 flex-1 border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSlugWasEdited(true);
                      updateForm("slug", createSlug(form.title));
                    }}
                    disabled={formDisabled || !normalizeText(form.title)}
                    className="border border-white/15 px-3 text-[9px] uppercase tracking-[0.18em] text-neutral-400 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Generate
                  </button>
                </div>

                <p className="mt-2 break-all text-xs leading-5 text-neutral-600">
                  /collections/{createSlug(form.slug || form.title) || "slug"}
                </p>

                <FieldError message={fieldErrors.slug} />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Product Series
                  <span className="ml-1 text-red-400" aria-hidden="true">
                    *
                  </span>
                </span>

                <input
                  type="text"
                  list="obsidian-product-series"
                  value={form.series}
                  onChange={(event) =>
                    updateForm("series", event.target.value)
                  }
                  maxLength={120}
                  disabled={formDisabled}
                  placeholder="Choose or enter a product series"
                  aria-invalid={Boolean(fieldErrors.series)}
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <datalist id="obsidian-product-series">
                  {seriesOptions.map((option) => (
                    <option
                      key={option.seriesKey}
                      value={option.series}
                    >
                      {`${formatCount(option.productCount)} products`}
                    </option>
                  ))}
                </datalist>

                <p className="mt-2 text-xs leading-6 text-neutral-500">
                  Matching ignores capitalization and extra spaces. A genuinely
                  new series will become its own collection.
                </p>

                {selectedSeriesOption ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge>
                      {formatCount(selectedSeriesOption.productCount)} Total
                    </StatusBadge>

                    <StatusBadge variant="active">
                      {formatCount(selectedSeriesOption.activeProductCount)}{" "}
                      Published
                    </StatusBadge>

                    {selectedSeriesOption.inactiveProductCount > 0 ? (
                      <StatusBadge variant="hidden">
                        {formatCount(
                          selectedSeriesOption.inactiveProductCount
                        )}{" "}
                        Draft
                      </StatusBadge>
                    ) : null}
                  </div>
                ) : null}

                <FieldError message={fieldErrors.series} />
              </label>

              {seriesHasChanged && linkedProductCount > 0 ? (
                <div className="border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
                    Linked Product Update
                  </p>

                  <p className="mt-2 text-xs leading-6 text-amber-100/70">
                    Renaming this series will also update{" "}
                    {formatCount(linkedProductCount)} linked product
                    {linkedProductCount === 1 ? "" : "s"}.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-amber-100">
                    <input
                      type="checkbox"
                      checked={confirmSeriesRename}
                      onChange={(event) => {
                        setConfirmSeriesRename(event.target.checked);
                        clearFieldError("seriesConfirmation");
                      }}
                      disabled={formDisabled}
                      className="mt-0.5"
                    />

                    <span>
                      I understand and want to rename the linked product series.
                    </span>
                  </label>

                  <FieldError message={fieldErrors.seriesConfirmation} />
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Description
                  <span className="ml-1 text-red-400" aria-hidden="true">
                    *
                  </span>
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={6}
                  maxLength={5000}
                  disabled={formDisabled}
                  placeholder="Describe the collection story, identity, and inspiration."
                  aria-invalid={Boolean(fieldErrors.description)}
                  className="w-full resize-y border border-white/10 bg-black px-4 py-3.5 text-sm leading-7 text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="mt-2 flex justify-between gap-4 text-[10px] text-neutral-600">
                  <span>Used on the public Collections page.</span>
                  <span>{normalizeText(form.description).length}/5000</span>
                </div>

                <FieldError message={fieldErrors.description} />
              </label>

              <div>
                <ImageUploader
                  value={form.coverImage}
                  onChange={(imageUrl) =>
                    updateForm("coverImage", imageUrl)
                  }
                  label="Collection Cover Image"
                  helperText="JPEG, PNG, WebP or AVIF. Maximum file size: 10 MB."
                  previewAlt={
                    normalizeText(form.title)
                      ? `${normalizeText(form.title)} collection cover preview`
                      : "Collection cover preview"
                  }
                  previewClassName="h-72 w-full object-cover"
                  required
                  disabled={isSaving}
                  onUploadingChange={setIsUploading}
                  onError={(errorMessage) => {
                    setFieldErrors((current) => ({
                      ...current,
                      coverImage: errorMessage,
                    }));

                    setStatus("error", errorMessage);
                  }}
                />

                <FieldError message={fieldErrors.coverImage} />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Display Order
                </span>

                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(event) =>
                    updateForm("displayOrder", event.target.value)
                  }
                  min="0"
                  max="1000000"
                  step="1"
                  inputMode="numeric"
                  disabled={formDisabled}
                  aria-invalid={Boolean(fieldErrors.displayOrder)}
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Lower numbers appear first on the public Collections page.
                </p>

                <FieldError message={fieldErrors.displayOrder} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-black p-4">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateForm("isActive", event.target.checked)
                    }
                    disabled={formDisabled}
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-[#f1ece4]">
                      Active
                    </span>

                    <span className="mt-2 block text-xs leading-5 text-neutral-500">
                      Show this collection publicly.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-black p-4">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) =>
                      updateForm("isFeatured", event.target.checked)
                    }
                    disabled={formDisabled}
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-[#f1ece4]">
                      Featured
                    </span>

                    <span className="mt-2 block text-xs leading-5 text-neutral-500">
                      Mark for featured placement.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={formDisabled}
                  className="flex-1 bg-[#f1ece4] px-5 py-4 text-xs uppercase tracking-[0.26em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                      ? "Update Collection"
                      : "Create Collection"}
                </button>

                {editingId || isDirty ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDiscardChanges()) {
                        resetForm();
                      }
                    }}
                    disabled={formDisabled}
                    className="border border-white/20 px-5 py-4 text-xs uppercase tracking-[0.26em] text-neutral-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              {isDirty ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">
                  Unsaved changes
                </p>
              ) : null}

              <div
                aria-live="polite"
                aria-atomic="true"
                className="min-h-5"
              >
                {message.text ? (
                  <div
                    className={`border p-4 text-sm leading-6 ${
                      message.type === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : message.type === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </section>

        <section className="min-w-0 border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Collection Directory
                </p>

                <h2 className="mt-3 font-heading text-4xl font-light">
                  Managed Catalog
                </h2>

                <p className="mt-3 text-xs leading-6 text-neutral-500">
                  Showing {formatCount(filteredCollections.length)} of{" "}
                  {formatCount(collections.length)} collections.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshCollections}
                disabled={isRefreshing || isSaving || isDeleting}
                className="w-fit border border-white/15 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-neutral-300 transition hover:border-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
              <label>
                <span className="sr-only">Search collections</span>

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search title, series, slug or description..."
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/40"
                />
              </label>

              <label>
                <span className="sr-only">Sort collections</span>

                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                  className={`border px-3 py-2 text-[9px] uppercase tracking-[0.2em] transition ${
                    statusFilter === option.value
                      ? "border-[#f1ece4] bg-[#f1ece4] text-black"
                      : "border-white/15 text-neutral-400 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              {searchTerm || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="border border-red-500/25 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500 hover:text-white"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {filteredCollections.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <p className="font-heading text-3xl font-light text-neutral-300">
                No collections found
              </p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-500">
                Adjust the search or filter, or create a new collection for a
                product series.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredCollections.map((collection) => {
                const collectionId = getCollectionId(collection);
                const productCount = getProductCount(collection);
                const activeProductCount =
                  getActiveProductCount(collection);
                const inactiveProductCount =
                  getInactiveProductCount(collection);
                const isAutomatic =
                  collection.isAutoGenerated === true;
                const canDelete = productCount === 0;

                return (
                  <article
                    key={collectionId}
                    className={`p-5 transition sm:p-6 ${
                      editingId === collectionId
                        ? "bg-white/[0.055]"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="grid gap-5 md:grid-cols-[150px_minmax(0,1fr)] 2xl:grid-cols-[170px_minmax(0,1fr)_auto]">
                      <div className="overflow-hidden border border-white/10 bg-black">
                        {collection.coverImage ? (
                          <Image
                            src={collection.coverImage}
                            alt={`${collection.title || "Collection"} cover`}
                            loading="lazy"
                            width={680}
                            height={576}
                            sizes="(min-width: 1536px) 170px, (min-width: 768px) 150px, 100vw"
                            className="h-48 w-full object-cover md:h-44"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center px-4 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                            No Cover Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="mr-1 font-heading text-3xl font-light text-[#f1ece4]">
                            {collection.title}
                          </h3>

                          <StatusBadge
                            variant={
                              collection.isActive !== false
                                ? "active"
                                : "hidden"
                            }
                          >
                            {collection.isActive !== false
                              ? "Active"
                              : "Hidden"}
                          </StatusBadge>

                          {collection.isFeatured ? (
                            <StatusBadge variant="featured">
                              Featured
                            </StatusBadge>
                          ) : null}

                          <StatusBadge
                            variant={isAutomatic ? "automatic" : "managed"}
                          >
                            {isAutomatic ? "Automatic" : "Managed"}
                          </StatusBadge>
                        </div>

                        <p className="mt-3 break-words text-xs uppercase tracking-[0.2em] text-neutral-500">
                          Series: {collection.series}
                        </p>

                        <p className="mt-2 break-all text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                          /{collection.slug} · Order{" "}
                          {Number(collection.displayOrder || 0)}
                        </p>

                        <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-7 text-neutral-400">
                          {collection.description ||
                            "No collection description has been added."}
                        </p>

                        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
                          <div className="border border-white/10 bg-black p-3">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Total
                            </p>

                            <p className="mt-2 text-lg text-[#f1ece4]">
                              {formatCount(productCount)}
                            </p>
                          </div>

                          <div className="border border-white/10 bg-black p-3">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Published
                            </p>

                            <p className="mt-2 text-lg text-emerald-300">
                              {formatCount(activeProductCount)}
                            </p>
                          </div>

                          <div className="border border-white/10 bg-black p-3">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Draft
                            </p>

                            <p className="mt-2 text-lg text-neutral-300">
                              {formatCount(inactiveProductCount)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                          Updated{" "}
                          {formatDate(
                            collection.updatedAt || collection.createdAt
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:col-start-2 2xl:col-start-auto 2xl:flex-col">
                        <button
                          type="button"
                          onClick={() => startEdit(collection)}
                          disabled={isSaving || isDeleting}
                          className="border border-white/20 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-neutral-200 transition hover:bg-[#f1ece4] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => requestDelete(collection)}
                          disabled={!canDelete || isSaving || isDeleting}
                          title={
                            canDelete
                              ? "Delete this empty collection"
                              : "Move, draft, or delete linked products first"
                          }
                          className="border border-red-500/30 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-red-300 transition enabled:hover:bg-red-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-600"
                        >
                          {canDelete ? "Delete" : "Products Linked"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {deleteCandidate ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteCandidate(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-collection-title"
            aria-describedby="delete-collection-description"
            className="w-full max-w-lg border border-white/15 bg-[#0b0b0b] p-6 shadow-2xl sm:p-8"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-red-300">
              Permanent Action
            </p>

            <h2
              id="delete-collection-title"
              className="mt-4 font-heading text-4xl font-light text-[#f1ece4]"
            >
              Delete Collection?
            </h2>

            <p
              id="delete-collection-description"
              className="mt-4 text-sm leading-7 text-neutral-400"
            >
              “{deleteCandidate.title}” has no linked products and can be
              deleted safely. This action cannot be undone.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.22em] text-neutral-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-500 px-5 py-3 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}