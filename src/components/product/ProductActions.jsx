"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import {
  OBSIDIAN_SIZE_ORDER,
} from "../../lib/sizeGuide";
import WishlistButton from "./WishlistButton";

export default function ProductActions({
  product,
}) {
  const { addToCart, openMiniCart } =
    useCart();

  const { showToast } = useToast();

  const [selectedSize, setSelectedSize] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const stock =
    Number(product?.stock) || 0;

  const price =
    Number(product?.price) || 0;

  const isOutOfStock =
    stock <= 0;

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(stock, current + 1)
    );
  }

  function handleAddToCart() {
    if (isOutOfStock) {
      showToast({
        type: "error",
        title: "Out Of Stock",
        message:
          "This piece is currently unavailable.",
      });

      return;
    }

    if (!selectedSize) {
      showToast({
        type: "error",
        title: "Select Size",
        message:
          "Please select a size before adding this piece to cart.",
      });

      return;
    }

    const result = addToCart({
      id: product.id,
      name: product.name,
      series: product.series,
      color: product.color,
      price,
      image: product.image,
      stock,
      size: selectedSize,
      quantity,
    });

    if (!result?.success) {
      showToast({
        type: "error",
        title:
          result?.reason ===
          "out_of_stock"
            ? "Out Of Stock"
            : "Stock Limit",
        message:
          result?.message ||
          "Requested quantity is not available.",
        actionLabel: "View Cart",
        actionHref: "/cart",
      });

      return;
    }

    showToast({
      type: "success",
      title: "Added To Cart",
      message:
        `${product.name} / Size ${selectedSize} × ${quantity}`,
    });

    openMiniCart();
  }

  return (
    <div className="obsidian-product-actions mt-10 space-y-7">
      <section
        aria-labelledby="product-size-selector-title"
        className="obsidian-product-size-selector border-y border-black/10 py-6"
      >
        <div className="mb-4 flex items-end justify-between gap-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Size
            </p>

            <h2
              id="product-size-selector-title"
              className="mt-2 font-heading text-2xl font-light"
            >
              Select Your Size
            </h2>
          </div>

          <p
            aria-live="polite"
            className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-500"
          >
            {selectedSize
              ? `Selected: ${selectedSize}`
              : "Select one"}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Choose product size"
          className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        >
          {OBSIDIAN_SIZE_ORDER.map(
            (size) => {
              const isSelected =
                selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isOutOfStock}
                  onClick={() =>
                    setSelectedSize(size)
                  }
                  className={`obsidian-product-size-button flex min-h-12 items-center justify-center border px-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-3 focus-visible:ring-offset-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? "obsidian-product-size-button--selected border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4]"
                      : "border-black/20 text-[#0b0b0b] hover:border-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                  }`}
                >
                  {size}
                </button>
              );
            }
          )}
        </div>

        <p className="mt-4 text-[9px] leading-5 text-neutral-500">
          Full garment measurements are
          displayed below the product
          information.
        </p>
      </section>

      {stock > 0 && stock <= 5 ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-[#b1844a] motion-reduce:animate-none"
          />

          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9b713e]">
            Only {stock} left — selling fast
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Quantity
        </p>

        <div className="obsidian-product-quantity-control flex w-fit items-center border border-black/20 text-[#0b0b0b]">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="obsidian-product-quantity-button flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
          >
            −
          </button>

          <span
            className="min-w-14 text-center text-sm font-medium"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={
              isOutOfStock ||
              quantity >= stock
            }
            aria-label="Increase quantity"
            className="obsidian-product-quantity-button flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
          >
            +
          </button>
        </div>

        {!isOutOfStock &&
        quantity >= stock ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Maximum available quantity selected
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.42fr)]">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="obsidian-product-primary-action group relative min-h-14 w-full overflow-hidden bg-[#0b0b0b] px-6 py-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span
            aria-hidden="true"
            className="obsidian-product-primary-action-fill absolute inset-0 translate-y-full bg-[#272727] transition-transform duration-300 group-hover:translate-y-0 motion-reduce:transition-none"
          />

          <span className="relative">
            {isOutOfStock
              ? "Out Of Stock"
              : "Add To Cart"}
          </span>
        </button>

        <WishlistButton
          product={product}
        />
      </div>
    </div>
  );
}
