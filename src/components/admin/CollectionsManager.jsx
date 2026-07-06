"use client";

import { useMemo, useState } from "react";

const emptyForm = {
  title: "",
  slug: "",
  series: "",
  description: "",
  coverImage: "",
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
};

function createSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCollectionId(collection) {
  if (!collection?._id) return "";
  if (typeof collection._id === "string") return collection._id;
  if (collection._id.$oid) return collection._id.$oid;
  return String(collection._id);
}

export default function CollectionsManager({ initialCollections = [] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const orderA = Number(a.displayOrder || 0);
      const orderB = Number(b.displayOrder || 0);

      if (orderA !== orderB) return orderA - orderB;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }, [collections]);

  function updateForm(field, value) {
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      };

      if (field === "title" && !editingId) {
        nextForm.slug = createSlug(value);
        nextForm.series = value;
      }

      return nextForm;
    });
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId("");
    setMessage("");
  }

  function startEdit(collection) {
    const collectionId = getCollectionId(collection);

    setEditingId(collectionId);

    setForm({
      title: collection.title || "",
      slug: collection.slug || "",
      series: collection.series || "",
      description: collection.description || "",
      coverImage: collection.coverImage || "",
      displayOrder: Number(collection.displayOrder || 0),
      isActive: Boolean(collection.isActive),
      isFeatured: Boolean(collection.isFeatured),
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refreshCollections() {
    const res = await fetch("/api/collections?includeInactive=true", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setCollections(data.collections || []);
    }
  }

  async function uploadCoverImage(file) {
    if (!file) return;

    setIsUploading(true);
    setMessage("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Image upload failed.");
      }

      updateForm("coverImage", data.imageUrl);
      setMessage("Cover image uploaded successfully.");
    } catch (error) {
      setMessage(error.message || "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(editingId ? "Updating collection..." : "Creating collection...");

    try {
      const payload = {
        title: form.title.trim(),
        slug: createSlug(form.slug || form.title),
        series: form.series.trim(),
        description: form.description.trim(),
        coverImage: form.coverImage.trim(),
        displayOrder: Number(form.displayOrder || 0),
        isActive: Boolean(form.isActive),
        isFeatured: Boolean(form.isFeatured),
      };

      const endpoint = editingId
        ? `/api/collections/${editingId}`
        : "/api/collections";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save collection.");
      }

      await refreshCollections();

      const successMessage = editingId
        ? "Collection updated successfully."
        : "Collection created successfully.";

      setForm({ ...emptyForm });
      setEditingId("");
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message || "Failed to save collection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(collection) {
    const collectionId = getCollectionId(collection);

    const confirmed = window.confirm(
      `Delete "${collection.title}" collection? Products will not be deleted.`
    );

    if (!confirmed) return;

    setMessage("Deleting collection...");

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to delete collection.");
      }

      await refreshCollections();

      if (editingId === collectionId) {
        resetForm();
      }

      setMessage("Collection deleted successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to delete collection.");
    }
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="border border-white/10 bg-white/[0.03] p-6"
      >
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
            {editingId ? "Edit Collection" : "Create Collection"}
          </p>

          <h2 className="font-heading text-4xl font-light">
            {editingId ? "Update Series" : "New Series"}
          </h2>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Collection Title
            </span>

            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Artifact Series"
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Slug
            </span>

            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              placeholder="artifact-series"
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Product Series Name
            </span>

            <input
              value={form.series}
              onChange={(event) => updateForm("series", event.target.value)}
              placeholder="Artifact Series"
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
              required
            />

            <p className="mt-2 text-xs leading-6 text-neutral-500">
              এটা product-এর series name-এর সাথে exact match হতে হবে।
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Description
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Inspired by history, pressure, and ancient strength."
              rows={5}
              className="w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-7 text-[#f1ece4] outline-none transition focus:border-white/40"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Cover Image URL
            </span>

            <input
              value={form.coverImage}
              onChange={(event) => updateForm("coverImage", event.target.value)}
              placeholder="https://..."
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Upload Cover Image
            </span>

            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={(event) => uploadCoverImage(event.target.files?.[0])}
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-neutral-400 file:mr-4 file:border-0 file:bg-[#f1ece4] file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-black"
            />
          </label>

          {form.coverImage ? (
            <div className="overflow-hidden border border-white/10 bg-black">
              <img
                src={form.coverImage}
                alt="Collection cover preview"
                className="h-64 w-full object-cover"
              />
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Display Order
            </span>

            <input
              type="number"
              value={form.displayOrder}
              onChange={(event) =>
                updateForm("displayOrder", event.target.value)
              }
              className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/40"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 border border-white/10 bg-black px-4 py-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateForm("isActive", event.target.checked)
                }
              />
              Active
            </label>

            <label className="flex items-center gap-3 border border-white/10 bg-black px-4 py-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  updateForm("isFeatured", event.target.checked)
                }
              />
              Featured
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 bg-[#f1ece4] px-5 py-3 text-xs uppercase tracking-[0.28em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.28em] transition hover:bg-[#f1ece4] hover:text-black"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {message ? (
            <p className="border border-white/10 bg-black px-4 py-3 text-sm text-neutral-300">
              {message}
            </p>
          ) : null}
        </div>
      </form>

      <section className="border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Collection List
          </p>
        </div>

        {sortedCollections.length === 0 ? (
          <div className="p-8 text-neutral-400">No collections found.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {sortedCollections.map((collection) => {
              const collectionId = getCollectionId(collection);

              return (
                <div
                  key={collectionId}
                  className="grid gap-6 p-6 lg:grid-cols-[160px_1fr_auto]"
                >
                  <div className="overflow-hidden border border-white/10 bg-black">
                    {collection.coverImage ? (
                      <img
                        src={collection.coverImage}
                        alt={collection.title}
                        className="h-44 w-full object-cover lg:h-40"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-xs uppercase tracking-[0.2em] text-neutral-600">
                        No Image
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h3 className="font-heading text-3xl font-light">
                        {collection.title}
                      </h3>

                      <span
                        className={`border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          collection.isActive
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-red-500/40 text-red-300"
                        }`}
                      >
                        {collection.isActive ? "Active" : "Hidden"}
                      </span>

                      {collection.isFeatured ? (
                        <span className="border border-yellow-500/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-yellow-300">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
                      Series: {collection.series}
                    </p>

                    <p className="mb-4 text-xs uppercase tracking-[0.25em] text-neutral-600">
                      Slug: {collection.slug} / Order:{" "}
                      {collection.displayOrder || 0}
                    </p>

                    <p className="max-w-2xl text-sm leading-7 text-neutral-400">
                      {collection.description}
                    </p>
                  </div>

                  <div className="flex gap-3 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => startEdit(collection)}
                      className="border border-white/20 px-4 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-black"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(collection)}
                      className="border border-red-500/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}