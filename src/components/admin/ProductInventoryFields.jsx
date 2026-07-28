"use client";

import {
  OBSIDIAN_SIZE_ORDER,
} from "../../lib/productInventory";

function getSafeStock(value) {
  const stock =
    Number(value);

  return (
    Number.isFinite(stock) &&
    stock >= 0
      ? Math.floor(stock)
      : 0
  );
}

export default function ProductInventoryFields({
  inventoryMode = "size",
  legacyStock = "",
  enabledSizes = [],
  sizeStock = {},
  onLegacyStockChange,
  onEnableSizeInventory,
  onToggleSize,
  onSizeStockChange,
  allowLegacy = false,
  migrationNote = "",
}) {
  const enabledSizeSet =
    new Set(enabledSizes);

  const totalSizeStock =
    OBSIDIAN_SIZE_ORDER.reduce(
      (total, size) =>
        total +
        (
          enabledSizeSet.has(size)
            ? getSafeStock(
                sizeStock[size]
              )
            : 0
        ),
      0
    );

  if (
    inventoryMode === "legacy"
  ) {
    return (
      <section className="border border-white/10 bg-white/[0.025] p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
              Inventory
            </p>

            <h2 className="mt-3 font-heading text-3xl font-light">
              Legacy Total Stock
            </h2>

            <p className="mt-3 max-w-xl text-xs leading-6 text-neutral-500">
              This existing product still uses one shared stock quantity for every size.
            </p>
          </div>

          {allowLegacy ? (
            <button
              type="button"
              onClick={
                onEnableSizeInventory
              }
              className="w-fit border border-[#f1ece4] px-5 py-3 text-[10px] uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Enable Size Inventory
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          <label
            htmlFor="legacy-product-stock"
            className="mb-3 block text-[10px] uppercase tracking-[0.26em] text-neutral-500"
          >
            Total Stock
          </label>

          <input
            id="legacy-product-stock"
            type="number"
            min="0"
            step="1"
            required
            value={legacyStock}
            onChange={(event) =>
              onLegacyStockChange?.(
                event.target.value
              )
            }
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="border border-white/10 bg-white/[0.025] p-6">
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
            Size Inventory
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light">
            Stock By Size
          </h2>

          <p className="mt-3 max-w-2xl text-xs leading-6 text-neutral-500">
            Enable the sizes sold for this product and enter the exact available quantity for each size.
          </p>
        </div>

        <div className="border border-white/10 bg-black px-5 py-4 text-right">
          <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500">
            Total Stock
          </p>

          <p className="mt-2 font-heading text-3xl font-light">
            {totalSizeStock}
          </p>
        </div>
      </div>

      {migrationNote ? (
        <div className="mt-6 border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs leading-6 text-yellow-200">
          {migrationNote}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {OBSIDIAN_SIZE_ORDER.map(
          (size) => {
            const isEnabled =
              enabledSizeSet.has(
                size
              );

            return (
              <div
                key={size}
                className={`grid gap-4 border p-4 sm:grid-cols-[100px_minmax(0,1fr)] sm:items-center ${
                  isEnabled
                    ? "border-white/20 bg-white/[0.04]"
                    : "border-white/10 bg-black/20 opacity-60"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(event) =>
                      onToggleSize?.(
                        size,
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-white"
                  />

                  <span className="font-heading text-2xl font-light">
                    {size}
                  </span>
                </label>

                <div>
                  <label
                    htmlFor={`product-size-stock-${size}`}
                    className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-neutral-500"
                  >
                    Available Quantity
                  </label>

                  <input
                    id={`product-size-stock-${size}`}
                    type="number"
                    min="0"
                    step="1"
                    disabled={!isEnabled}
                    value={
                      isEnabled
                        ? sizeStock[size] ?? 0
                        : 0
                    }
                    onChange={(event) =>
                      onSizeStockChange?.(
                        size,
                        event.target.value
                      )
                    }
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <p className="mt-5 text-xs leading-6 text-neutral-500">
        Disabled sizes will not be selectable on the storefront. Total product stock is calculated automatically.
      </p>
    </section>
  );
}
