"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";
import ImageUploader from "./ImageUploader";
import ProductGalleryFields from "./ProductGalleryFields";
import ProductInventoryFields from "./ProductInventoryFields";
import ProductDetailsFields, {
  EMPTY_PRODUCT_DETAILS_FORM,
  formToProductDetails,
  productDetailsToForm,
} from "./ProductDetailsFields";

import {
  OBSIDIAN_SIZE_ORDER,
  createEmptySizeStock,
  getEnabledProductSizes,
  hasProductSizeInventory,
  normalizeSizeStockForForm,
} from "../../lib/productInventory";

export default function EditProductClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    originalLegacyStock,
    setOriginalLegacyStock,
  ] = useState(0);

  const [
    formData,
    setFormData,
  ] = useState({
    id: "",
    name: "",
    series: "",
    color: "",
    price: "",
    stock: "",
    image: "",
    gallery: [],
    description: "",
    ...EMPTY_PRODUCT_DETAILS_FORM,
    inventoryMode: "legacy",
    sizes: [
      ...OBSIDIAN_SIZE_ORDER,
    ],
    sizeStock:
      createEmptySizeStock(),
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response =
          await fetch(
            `/api/products/${productId}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setNotFound(true);
          return;
        }

        const product =
          data.product;

        const usesSizeInventory =
          hasProductSizeInventory(
            product
          );

        const legacyStock =
          Number(
            product.stock || 0
          );

        setOriginalLegacyStock(
          usesSizeInventory
            ? 0
            : legacyStock
        );

        setFormData({
          id:
            product.id || "",
          name:
            product.name || "",
          series:
            product.series || "",
          color:
            product.color || "",
          price:
            String(
              product.price ?? ""
            ),
          stock:
            String(
              product.stock ?? ""
            ),
          image:
            product.image || "",
          gallery: Array.isArray(product.gallery)
            ? product.gallery
            : [],
          description:
            product.description || "",

          ...productDetailsToForm(
            product.details
          ),

          inventoryMode:
            usesSizeInventory
              ? "size"
              : "legacy",

          sizes:
            usesSizeInventory
              ? getEnabledProductSizes(
                  product
                )
              : [
                  ...OBSIDIAN_SIZE_ORDER,
                ],

          sizeStock:
            usesSizeInventory
              ? normalizeSizeStockForForm(
                  product
                )
              : createEmptySizeStock(),
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

  function enableSizeInventory() {
    setErrorMessage("");

    setFormData(
      (currentFormData) => ({
        ...currentFormData,
        inventoryMode: "size",
        sizes: [
          ...OBSIDIAN_SIZE_ORDER,
        ],
        sizeStock:
          createEmptySizeStock(),
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
        "Please upload or provide a product image."
      );

      return;
    }

    if (
      formData.inventoryMode ===
        "size" &&
      formData.sizes.length === 0
    ) {
      setErrorMessage(
        "Enable at least one product size."
      );

      return;
    }

    const totalSizeStock =
      formData.sizes.reduce(
        (total, size) =>
          total +
          (
            Number(
              formData.sizeStock[
                size
              ]
            ) || 0
          ),
        0
      );

    if (
      originalLegacyStock > 0 &&
      formData.inventoryMode ===
        "size" &&
      totalSizeStock <= 0
    ) {
      setErrorMessage(
        `Allocate the existing ${originalLegacyStock} units across the enabled sizes before saving.`
      );

      return;
    }

    setIsSubmitting(true);

    const commonProductData = {
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
      gallery: formData.gallery || [],
    };

    const productData =
      formData.inventoryMode ===
      "size"
        ? {
            ...commonProductData,

            sizes:
              formData.sizes,

            sizeStock:
              Object.fromEntries(
                OBSIDIAN_SIZE_ORDER.map(
                  (size) => [
                    size,
                    Number(
                      formData
                        .sizeStock[
                          size
                        ] || 0
                    ),
                  ]
                )
              ),
          }
        : {
            ...commonProductData,

            stock:
              Number(
                formData.stock
              ),
          };

    try {
      const response =
        await fetch(
          `/api/products/${productId}`,
          {
            method: "PATCH",

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
            "Product could not be updated."
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
        "Something went wrong while updating product."
      );

      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="mx-auto max-w-4xl">
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
        <div className="mx-auto max-w-4xl">
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
      <div className="mx-auto max-w-4xl">
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
            inventoryMode={
              formData.inventoryMode
            }
            legacyStock={
              formData.stock
            }
            enabledSizes={
              formData.sizes
            }
            sizeStock={
              formData.sizeStock
            }
            allowLegacy={
              formData.inventoryMode ===
              "legacy"
            }
            migrationNote={
              originalLegacyStock > 0 &&
              formData.inventoryMode ===
                "size"
                ? `This product previously had ${originalLegacyStock} units of shared stock. Allocate those units across the required sizes before saving.`
                : ""
            }
            onLegacyStockChange={(
              value
            ) =>
              setFormData(
                (current) => ({
                  ...current,
                  stock: value,
                })
              )
            }
            onEnableSizeInventory={
              enableSizeInventory
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

          <ProductGalleryFields
            gallery={formData.gallery}
            onChange={(gallery) =>
              setFormData((currentFormData) => ({
                ...currentFormData,
                gallery,
              }))
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
              ? "Updating Product..."
              : "Update Product"}
          </button>
        </form>
      </div>
    </main>
  );
}
