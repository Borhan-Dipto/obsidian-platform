"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  adminAuthClient,
} from "../../lib/adminAuthClient";

import {
  normalizeAdminRoles,
} from "../../lib/adminPermissions";

import {
  getEnabledProductSizes,
  getProductSizeStock,
  getProductTotalStock,
  hasProductSizeInventory,
} from "../../lib/productInventory";

import DeleteProductButton from "./DeleteProductButton";

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

function getStockStyle(stock) {
  const normalizedStock =
    normalizeStock(stock);

  if (
    normalizedStock <= 0
  ) {
    return "border-red-500/40 bg-red-500/10 text-red-400";
  }

  if (
    normalizedStock < 10
  ) {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  return "border-green-500/40 bg-green-500/10 text-green-400";
}

function getStockText(stock) {
  const normalizedStock =
    normalizeStock(stock);

  if (
    normalizedStock <= 0
  ) {
    return "Out of Stock";
  }

  if (
    normalizedStock < 10
  ) {
    return `${normalizedStock} Low Stock`;
  }

  return `${normalizedStock} In Stock`;
}

function getSizeStockStyle(stock) {
  const normalizedStock =
    normalizeStock(stock);

  if (
    normalizedStock <= 0
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (
    normalizedStock < 5
  ) {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function roleHasPermission(
  role,
  permissions
) {
  try {
    return (
      adminAuthClient.admin.checkRolePermission(
        {
          role,
          permissions,
        }
      ) === true
    );
  } catch {
    return false;
  }
}

function rolesHavePermission(
  roles,
  permissions
) {
  return roles.some(
    (role) =>
      roleHasPermission(
        role,
        permissions
      )
  );
}

function SizeInventoryBreakdown({
  product,
}) {
  const usesSizeInventory =
    hasProductSizeInventory(
      product
    );

  if (!usesSizeInventory) {
    return (
      <div className="mt-3">
        <span className="inline-flex border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-neutral-500">
          Shared Stock
        </span>
      </div>
    );
  }

  const enabledSizes =
    getEnabledProductSizes(
      product
    );

  if (
    enabledSizes.length === 0
  ) {
    return (
      <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-red-300">
        No Sizes Enabled
      </p>
    );
  }

  return (
    <div
      className="mt-3 flex max-w-[260px] flex-wrap gap-1.5"
      aria-label="Size-wise inventory"
    >
      {enabledSizes.map(
        (size) => {
          const stock =
            getProductSizeStock(
              product,
              size
            );

          return (
            <span
              key={size}
              title={`${size}: ${stock} available`}
              aria-label={`${size}, ${stock} available`}
              className={`inline-flex min-w-[52px] items-center justify-between gap-2 border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${getSizeStockStyle(
                stock
              )}`}
            >
              <span>
                {size}
              </span>

              <strong className="font-semibold">
                {stock}
              </strong>
            </span>
          );
        }
      )}
    </div>
  );
}

export default function ProductSearchTable({
  products,
}) {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const {
    data: session,
    isPending:
      isSessionPending,
  } =
    adminAuthClient.useSession();

  const roles =
    useMemo(
      () =>
        normalizeAdminRoles(
          session?.user?.role
        ),
      [
        session?.user?.role,
      ]
    );

  const canUpdateProducts =
    useMemo(
      () =>
        !isSessionPending &&
        rolesHavePermission(
          roles,
          {
            products: [
              "update",
            ],
          }
        ),
      [
        roles,
        isSessionPending,
      ]
    );

  const canDeleteProducts =
    useMemo(
      () =>
        !isSessionPending &&
        rolesHavePermission(
          roles,
          {
            products: [
              "delete",
            ],
          }
        ),
      [
        roles,
        isSessionPending,
      ]
    );

  const filteredProducts =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(search) ||
          product.id
            ?.toLowerCase()
            .includes(search) ||
          product.series
            ?.toLowerCase()
            .includes(search) ||
          product.color
            ?.toLowerCase()
            .includes(search)
      );
    }, [
      products,
      searchTerm,
    ]);

  return (
    <div className="space-y-6">
      <input
        type="search"
        placeholder="Search products by name, ID, series or color..."
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(
            event.target.value
          )
        }
        className="w-full border border-white/10 bg-white/5 px-5 py-4 text-sm outline-none placeholder:text-neutral-600"
      />

      <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">
        Showing{" "}
        {
          filteredProducts.length
        }{" "}
        of {products.length} products
      </div>

      {filteredProducts.length ===
      0 ? (
        <div className="border border-white/10 p-8 text-neutral-400">
          No matching products found.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <div className="min-w-[1320px]">
            <div className="grid grid-cols-[90px_1.1fr_0.85fr_0.65fr_1.5fr_0.75fr_1fr] border-b border-white/10 bg-white/5 px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span>
                Image
              </span>

              <span>
                Name
              </span>

              <span>
                Series
              </span>

              <span>
                Price
              </span>

              <span>
                Inventory
              </span>

              <span>
                Color
              </span>

              <span>
                Actions
              </span>
            </div>

            {filteredProducts.map(
              (product) => {
                const totalStock =
                  getProductTotalStock(
                    product
                  );

                return (
                  <div
                    key={
                      product._id ||
                      product.id
                    }
                    className="grid grid-cols-[90px_1.1fr_0.85fr_0.65fr_1.5fr_0.75fr_1fr] items-center border-b border-white/10 px-6 py-5 text-sm text-neutral-300 last:border-b-0"
                  >
                    <div className="h-16 w-16 overflow-hidden border border-white/10 bg-white/5">
                      {product.image ? (
                        <Image
                          src={
                            product.image
                          }
                          alt={
                            product.name ||
                            "Product"
                          }
                          width={256}
                          height={256}
                          sizes="64px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 pr-4">
                      <p className="truncate text-[#f1ece4]">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {
                          product.id
                        }
                      </p>
                    </div>

                    <span className="pr-4">
                      {
                        product.series
                      }
                    </span>

                    <span>
                      ৳{" "}
                      {
                        product.price
                      }
                    </span>

                    <div className="py-1">
                      <span
                        className={`inline-flex w-fit border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getStockStyle(
                          totalStock
                        )}`}
                      >
                        {getStockText(
                          totalStock
                        )}
                      </span>

                      <SizeInventoryBreakdown
                        product={
                          product
                        }
                      />
                    </div>

                    <span className="pr-4">
                      {
                        product.color
                      }
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/products/${encodeURIComponent(
                          product.id
                        )}`}
                        className="border border-white/15 px-3 py-1 text-xs text-neutral-300 transition hover:bg-white/10 hover:text-white"
                      >
                        View
                      </Link>

                      {canUpdateProducts ? (
                        <Link
                          href={`/admin/products/${encodeURIComponent(
                            product.id
                          )}/edit`}
                          className="border border-blue-500 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500 hover:text-white"
                        >
                          Edit
                        </Link>
                      ) : null}

                      {canDeleteProducts ? (
                        <DeleteProductButton
                          productId={
                            product.id
                          }
                        />
                      ) : null}

                      {!isSessionPending &&
                      !canUpdateProducts &&
                      !canDeleteProducts ? (
                        <span className="border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                          Read Only
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
