import Image from "next/image";
import Link from "next/link";

import clientPromise from "../../../../lib/mongodb";

import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../../lib/adminAuth";

import {
  getEnabledProductSizes,
  getProductSizeStock,
  getProductTotalStock,
  hasProductSizeInventory,
} from "../../../../lib/productInventory";

export const dynamic =
  "force-dynamic";

async function getProduct(id) {
  const client =
    await clientPromise;

  const database =
    client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

  const product =
    await database
      .collection(
        "products"
      )
      .findOne({
        id,
      });

  if (!product) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(product)
  );
}

function normalizeStock(value) {
  const stock =
    Number(value);

  return Number.isFinite(stock)
    ? Math.max(
        0,
        Math.floor(stock)
      )
    : 0;
}

function getInventoryStatus(
  stock,
  {
    lowStockThreshold = 5,
  } = {}
) {
  const normalizedStock =
    normalizeStock(stock);

  if (
    normalizedStock <= 0
  ) {
    return {
      label:
        "Sold Out",

      className:
        "border-red-500/30 bg-red-500/10 text-red-300",
    };
  }

  if (
    normalizedStock <
    lowStockThreshold
  ) {
    return {
      label:
        "Low Stock",

      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label:
      "Available",

    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
}

function ProductInformationRow({
  label,
  children,
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:gap-6">
      <span className="w-28 shrink-0 text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>

      <div className="min-w-0 text-sm text-neutral-300">
        {children}
      </div>
    </div>
  );
}

function SizeInventoryPanel({
  product,
}) {
  const usesSizeInventory =
    hasProductSizeInventory(
      product
    );

  const totalStock =
    getProductTotalStock(
      product
    );

  const totalStatus =
    getInventoryStatus(
      totalStock,
      {
        lowStockThreshold:
          10,
      }
    );

  if (!usesSizeInventory) {
    return (
      <section className="mt-10 border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Inventory
            </p>

            <h2 className="mt-3 font-heading text-3xl font-light">
              Shared Stock
            </h2>
          </div>

          <span
            className={`w-fit border px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] ${totalStatus.className}`}
          >
            {
              totalStatus.label
            }
          </span>
        </div>

        <div className="mt-7 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs leading-6 text-neutral-500">
              This legacy product uses one shared inventory quantity across all selectable sizes.
            </p>

            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-neutral-600">
              Convert from the Edit Product page to manage independent size quantities.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-5xl font-light">
              {totalStock}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
              Total Units
            </p>
          </div>
        </div>
      </section>
    );
  }

  const enabledSizes =
    getEnabledProductSizes(
      product
    );

  const lowStockSizes =
    enabledSizes.filter(
      (size) => {
        const stock =
          getProductSizeStock(
            product,
            size
          );

        return (
          stock > 0 &&
          stock < 5
        );
      }
    );

  const soldOutSizes =
    enabledSizes.filter(
      (size) =>
        getProductSizeStock(
          product,
          size
        ) <= 0
    );

  return (
    <section className="mt-10 border border-white/10 bg-white/[0.025] p-6 md:p-8">
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            Size Inventory
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light">
            Stock Breakdown
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
            Each enabled size has an independent stock quantity used by the storefront and secure order reservation system.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`border px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] ${totalStatus.className}`}
          >
            {totalStock} Total
          </span>

          {lowStockSizes.length >
          0 ? (
            <span className="border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-amber-300">
              {
                lowStockSizes.length
              }{" "}
              Low Stock
            </span>
          ) : null}

          {soldOutSizes.length >
          0 ? (
            <span className="border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-red-300">
              {
                soldOutSizes.length
              }{" "}
              Sold Out
            </span>
          ) : null}
        </div>
      </div>

      {enabledSizes.length >
      0 ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enabledSizes.map(
            (size) => {
              const stock =
                getProductSizeStock(
                  product,
                  size
                );

              const status =
                getInventoryStatus(
                  stock
                );

              return (
                <article
                  key={size}
                  className="border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.22em] text-neutral-600">
                        Size
                      </p>

                      <p className="mt-2 font-heading text-3xl font-light">
                        {size}
                      </p>
                    </div>

                    <span
                      className={`border px-2.5 py-1 text-[8px] uppercase tracking-[0.15em] ${status.className}`}
                    >
                      {
                        status.label
                      }
                    </span>
                  </div>

                  <div className="mt-7 flex items-end justify-between border-t border-white/10 pt-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                      Available
                    </p>

                    <p className="font-heading text-4xl font-light">
                      {stock}
                    </p>
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <div className="mt-7 border border-red-500/20 bg-red-500/[0.06] px-6 py-8">
          <p className="text-sm text-red-200">
            No product sizes are currently enabled.
          </p>

          <p className="mt-3 text-xs leading-6 text-red-200/60">
            Enable at least one size from the Edit Product page before making this product available.
          </p>
        </div>
      )}
    </section>
  );
}

export default async function ProductDetailsPage({
  params,
}) {
  await requireAdminPermission({
    products: [
      "read_private",
    ],
  });

  const {
    id,
  } = await params;

  const [
    product,
    canUpdateProduct,
  ] = await Promise.all([
    getProduct(id),

    hasAdminPermission({
      products: [
        "update",
      ],
    }),
  ]);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-[#f1ece4]">
        <div className="text-center">
          <p className="mb-6 text-neutral-400">
            Product not found.
          </p>

          <Link
            href="/admin/products"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const totalStock =
    getProductTotalStock(
      product
    );

  const totalStatus =
    getInventoryStatus(
      totalStock,
      {
        lowStockThreshold:
          10,
      }
    );

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/products"
            className="text-xs uppercase tracking-[0.35em] text-neutral-500 transition hover:text-white"
          >
            ← Back to Products
          </Link>

          {canUpdateProduct ? (
            <Link
              href={`/admin/products/${encodeURIComponent(
                product.id
              )}/edit`}
              className="w-fit bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
            >
              Edit Product
            </Link>
          ) : (
            <span className="w-fit border border-white/10 bg-white/[0.025] px-5 py-3 text-xs uppercase tracking-[0.25em] text-neutral-600">
              Read Only
            </span>
          )}
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden border border-white/10 bg-white/[0.025]">
            {product.image ? (
              <Image
                src={
                  product.image
                }
                alt={
                  product.name ||
                  "Product"
                }
                width={1200}
                height={1500}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-auto w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[500px] items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-600">
                No Product Image
              </div>
            )}
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-neutral-500">
              {
                product.series ||
                "OBSIDIAN"
              }
            </p>

            <h1 className="font-heading text-5xl font-light sm:text-6xl">
              {
                product.name
              }
            </h1>

            <p className="mt-6 text-4xl">
              ৳
              {
                product.price
              }
            </p>

            <div className="mt-10 space-y-5">
              <ProductInformationRow label="Product ID">
                {
                  product.id
                }
              </ProductInformationRow>

              <ProductInformationRow label="Series">
                {
                  product.series ||
                  "Not specified"
                }
              </ProductInformationRow>

              <ProductInformationRow label="Color">
                {
                  product.color ||
                  "Not specified"
                }
              </ProductInformationRow>

              <ProductInformationRow label="Status">
                <span
                  className={
                    product.isActive ===
                    false
                      ? "text-red-300"
                      : "text-emerald-300"
                  }
                >
                  {product.isActive ===
                  false
                    ? "Inactive"
                    : "Active"}
                </span>
              </ProductInformationRow>

              <ProductInformationRow label="Total Stock">
                <span
                  className={`inline-flex border px-3 py-1 text-[9px] uppercase tracking-[0.18em] ${totalStatus.className}`}
                >
                  {totalStock}{" "}
                  {
                    totalStatus.label
                  }
                </span>
              </ProductInformationRow>

              <ProductInformationRow label="Stock Mode">
                {hasProductSizeInventory(
                  product
                )
                  ? "Independent size inventory"
                  : "Legacy shared inventory"}
              </ProductInformationRow>
            </div>

            <section className="mt-10">
              <h2 className="mb-4 font-heading text-3xl">
                Description
              </h2>

              <p className="whitespace-pre-line leading-8 text-neutral-400">
                {
                  product.description ||
                  "No product description is available."
                }
              </p>
            </section>
          </div>
        </div>

        <SizeInventoryPanel
          product={product}
        />
      </div>
    </main>
  );
}
