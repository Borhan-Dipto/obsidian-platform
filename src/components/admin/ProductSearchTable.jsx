"use client";

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
import DeleteProductButton from "./DeleteProductButton";

function getStockStyle(stock) {
  if (stock <= 0) {
    return "border-red-500/40 bg-red-500/10 text-red-400";
  }

  if (stock < 10) {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  return "border-green-500/40 bg-green-500/10 text-green-400";
}

function getStockText(stock) {
  if (stock <= 0) {
    return "Out of Stock";
  }

  if (stock < 10) {
    return `${stock} Low Stock`;
  }

  return `${stock} In Stock`;
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
  return roles.some((role) =>
    roleHasPermission(
      role,
      permissions
    )
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

  const roles = useMemo(
    () =>
      normalizeAdminRoles(
        session?.user?.role
      ),
    [session?.user?.role]
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
    products.filter(
      (product) => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        return (
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
      }
    );

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
          No matching products
          found.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <div className="min-w-[1150px]">
            <div className="grid grid-cols-[90px_1.2fr_1fr_0.8fr_0.9fr_0.9fr_1fr] border-b border-white/10 bg-white/5 px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span>Image</span>
              <span>Name</span>
              <span>Series</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Color</span>
              <span>Actions</span>
            </div>

            {filteredProducts.map(
              (product) => (
                <div
                  key={
                    product._id
                  }
                  className="grid grid-cols-[90px_1.2fr_1fr_0.8fr_0.9fr_0.9fr_1fr] items-center border-b border-white/10 px-6 py-5 text-sm text-neutral-300 last:border-b-0"
                >
                  <div className="h-16 w-16 overflow-hidden border border-white/10 bg-white/5">
                    {product.image ? (
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name ||
                          "Product"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        No Image
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[#f1ece4]">
                      {
                        product.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {
                        product.id
                      }
                    </p>
                  </div>

                  <span>
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

                  <span
                    className={`w-fit border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getStockStyle(
                      Number(
                        product.stock
                      )
                    )}`}
                  >
                    {getStockText(
                      Number(
                        product.stock
                      )
                    )}
                  </span>

                  <span>
                    {
                      product.color
                    }
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {canUpdateProducts ? (
                      <Link
                        href={`/admin/products/${product.id}/edit`}
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
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}