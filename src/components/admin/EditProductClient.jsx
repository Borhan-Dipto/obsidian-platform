"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "./ImageUploader";

export default function EditProductClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    series: "",
    color: "",
    price: "",
    stock: "",
    image: "",
    description: "",
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(
          `/api/products/${productId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setNotFound(true);
          return;
        }

        setFormData({
          id: data.product.id || "",
          name: data.product.name || "",
          series: data.product.series || "",
          color: data.product.color || "",
          price: String(data.product.price || ""),
          stock: String(data.product.stock || ""),
          image: data.product.image || "",
          description: data.product.description || "",
        });
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  function handleChange(event) {
    setErrorMessage("");

    setFormData((currentFormData) => ({
      ...currentFormData,
      [event.target.name]: event.target.value,
    }));
  }

  function handleImageChange(imageUrl) {
    setErrorMessage("");

    setFormData((currentFormData) => ({
      ...currentFormData,
      image: imageUrl,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.image) {
      setErrorMessage(
        "Please upload or provide a product image."
      );

      return;
    }

    setIsSubmitting(true);

    const productData = {
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim(),
      series: formData.series.trim(),
      color: formData.color.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
    };

    try {
      const response = await fetch(
        `/api/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.message ||
            "Product could not be updated."
        );

        setIsSubmitting(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setErrorMessage(
        "Something went wrong while updating product."
      );

      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="mx-auto max-w-3xl">
          <p className="text-neutral-400">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-neutral-400">
            Product not found.
          </p>

          <Link
            href="/admin/products"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back To Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Products / Edit
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Edit Product
            </h1>
          </div>

          <Link
            href="/admin/products"
            className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        {errorMessage ? (
          <div className="mb-6 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <input
            name="id"
            placeholder="Product ID"
            value={formData.id}
            onChange={handleChange}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <input
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <input
            name="series"
            placeholder="Series"
            value={formData.series}
            onChange={handleChange}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <input
            name="color"
            placeholder="Color"
            value={formData.color}
            onChange={handleChange}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
            />

            <input
              type="number"
              name="stock"
              placeholder="Stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
            />
          </div>

          <ImageUploader
            value={formData.image}
            onChange={handleImageChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#f1ece4] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Updating Product..."
              : "Update Product"}
          </button>
        </form>
      </div>
    </main>
  );
}