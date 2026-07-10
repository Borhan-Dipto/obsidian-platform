"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import WishlistButton from "./WishlistButton";

const sizes = ["S", "M", "L", "XL", "XXL"];

export default function ProductActions({ product }) {
  const { addToCart, openMiniCart } = useCart();
  const { showToast } = useToast();

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const stock = Number(product.stock) || 0;
  const price = Number(product.price) || 0;
  const isOutOfStock = stock <= 0;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  function selectSize(size) {
    setSelectedSize(size);
  }

  function handleAddToCart() {
    if (isOutOfStock) {
      showToast({
        type: "error",
        title: "Out Of Stock",
        message: "This piece is currently unavailable.",
      });
      return;
    }

    if (!selectedSize) {
      showToast({
        type: "error",
        title: "Select Size",
        message: "Please select a size before adding this piece to cart.",
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
          result?.reason === "out_of_stock" ? "Out Of Stock" : "Stock Limit",
        message: result?.message || "Requested quantity is not available.",
        actionLabel: "View Cart",
        actionHref: "/cart",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Added To Cart",
      message: `${product.name} / Size ${selectedSize} × ${quantity}`,
    });

    openMiniCart();
  }

  return (
    <>
      <div className="mt-10 space-y-8">
        <div>
          <div className="mb-4 flex items-center justify-between gap-5">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Size
            </p>

            <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-400">
              {selectedSize ? `Selected: ${selectedSize}` : "Select one"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => selectSize(size)}
                  disabled={isOutOfStock}
                  aria-pressed={isSelected}
                  className={`min-w-[56px] border px-5 py-3 text-xs uppercase tracking-[0.25em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? "border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4]"
                      : "border-black/20 text-[#0b0b0b] hover:border-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {stock > 0 && stock <= 5 && (
            <div className="mt-5 flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#b1844a]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9b713e]">
                Only {stock} left — selling fast
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
            Quantity
          </p>

          <div className="flex w-fit items-center border border-black/20 text-[#0b0b0b]">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
            >
              −
            </button>

            <span className="min-w-14 text-center text-sm font-medium">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={isOutOfStock || quantity >= stock}
              aria-label="Increase quantity"
              className="flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
            >
              +
            </button>
          </div>

          {!isOutOfStock && quantity >= stock && (
            <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              Maximum available quantity selected
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_0.72fr]">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="group relative w-full overflow-hidden bg-[#0b0b0b] px-6 py-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="relative z-10">
              {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
            </span>

            {!isOutOfStock && (
              <span className="absolute inset-0 translate-y-full bg-[#272727] transition-transform duration-300 group-hover:translate-y-0" />
            )}
          </button>

          <WishlistButton product={product} />
        </div>

        <div className="grid gap-3 border-t border-black/10 pt-6 text-xs text-neutral-500 sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <span className="text-[#0b0b0b]">✓</span>
            Cash on delivery
          </p>

          <p className="flex items-center gap-2">
            <span className="text-[#0b0b0b]">✓</span>
            Easy exchange support
          </p>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f1ece4]/95 px-4 pt-3 shadow-[0_-16px_40px_rgba(11,11,11,0.12)] backdrop-blur-xl md:hidden"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.26em] text-neutral-500">
              {product.name}
            </p>

            <div className="mt-1 flex items-center gap-3">
              <p className="font-heading text-2xl font-medium leading-none">
                ৳ {price}
              </p>

              <span className="h-4 w-px bg-black/15" />

              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
                  selectedSize ? "text-[#0b0b0b]" : "text-[#9b713e]"
                }`}
              >
                {selectedSize ? `Size ${selectedSize}` : "Select size"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="min-w-[148px] shrink-0 bg-[#0b0b0b] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f1ece4] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isOutOfStock ? "Sold Out" : "Add To Cart"}
          </button>
        </div>
      </div>
    </>
  );
}