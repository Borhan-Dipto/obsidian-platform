"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "./ImageUploader";
import ProductInventoryFields from "./ProductInventoryFields";
import ProductDetailsFields, {
  EMPTY_PRODUCT_DETAILS_FORM,
  formToProductDetails,
} from "./ProductDetailsFields";
import {
  OBSIDIAN_SIZE_ORDER,
  createEmptySizeStock,
} from "../../lib/productInventory";

export default function AddProductClient() {
  const router = useRouter();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    id: "",
    name: "",
    series: "",
    color: "",
    price: "",
    image: "",
    description: "",
    ...EMPTY_PRODUCT_DETAILS_FORM,
    sizes: [
      ...OBSIDIAN_SIZE_ORDER,
    ],
    sizeStock:
      createEmptySizeStock(),
  });

  function handleChange(event) {
    setErrorMessage("");

    setFormData(
      (currentFormData) => ({
        ...currentFormData,
        [event.target.name]:
          event.target.value,
      })
    );
  }

  function handleImageChange(
    imageUrl
  ) {
    setErrorMessage("");

    setFormData(
      (currentFormData) => ({
        ...currentFormData,
        image: imageUrl,
      })
    );
  }

  function handleToggleSize(
    size,
    isEnabled
  ) {
    setErrorMessage("");

    setFormData(
      (currentFormData) => {
        const nextSizes =
          isEnabled
            ? [
                ...new Set([
                  ...currentFormData.sizes,
                  size,
                ]),
              ]
            : currentFormData.sizes.filter(
                (item) =>
                  item !== size
              );

        return {
          ...currentFormData,
          sizes:
            OBSIDIAN_SIZE_ORDER.filter(
              (item) =>
                nextSizes.includes(
                  item
                )
            ),

          sizeStock: {
            ...currentFormData.sizeStock,
            [size]:
              isEnabled
                ? currentFormData
                    .sizeStock[size] ??
                  0
                : 0,
          },
        };
      }
    );
  }

  function handleSizeStockChange(
    size,
    value
  ) {
    setErrorMessage("");

    setFormData(
      (currentFormData) => ({
        ...currentFormData,

        sizeStock: {
          ...currentFormData.sizeStock,
          [size]: value,
        },
      })
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.image) {
      setErrorMessage(
        "Please upload a product image first."
      );

      return;
    }

    if (
      formData.sizes.length === 0
    ) {
      setErrorMessage(
        "Enable at least one product size."
      );

      return;
    }

    setIsSubmitting(true);

    const productData = {
      id: formData.id.trim(),
      name:
        formData.name.trim(),
      series:
        formData.series.trim(),
      color:
        formData.color.trim(),
      description:
        formData.description.trim(),
      details:
        formToProductDetails(formData),
      price:
        Number(formData.price),
      image:
        formData.image,
      sizes:
        formData.sizes,
      sizeStock:
        Object.fromEntries(
          OBSIDIAN_SIZE_ORDER.map(
            (size) => [
              size,
              Number(
                formData
                  .sizeStock[size] ||
                  0
              ),
            ]
          )
        ),
    };

    try {
      const response =
        await fetch(
          "/api/products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                productData
              ),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setErrorMessage(
          data.message ||
            "Product could not be added."
        );

        setIsSubmitting(false);
        return;
      }

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Products / New
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Add Product
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
          <div
            role="alert"
            className="mb-6 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <input
            name="id"
            placeholder="Product ID, e.g. artifact-002"
            value={formData.id}
            onChange={handleChange}
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

          <ProductInventoryFields
            inventoryMode="size"
            enabledSizes={
              formData.sizes
            }
            sizeStock={
              formData.sizeStock
            }
            onToggleSize={
              handleToggleSize
            }
            onSizeStockChange={
              handleSizeStockChange
            }
          />

          <ImageUploader
            value={formData.image}
            onChange={
              handleImageChange
            }
          />

          <textarea
            name="description"
            placeholder="Description"
            value={
              formData.description
            }
            onChange={handleChange}
            rows={5}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <ProductDetailsFields
            formData={formData}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#f1ece4] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Adding Product..."
              : "Add Product"}
          </button>
        </form>
      </div>
    </main>
  );
}
