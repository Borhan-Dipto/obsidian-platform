"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import WishlistButton from "./WishlistButton";

const sizes = ["S", "M", "L", "XL", "XXL"];

export default function ProductActions({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
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

    addToCart({
      id: product.id,
      name: product.name,
      series: product.series,
      color: product.color,
      price: Number(product.price),
      image: product.image,
      stock: Number(product.stock || 0),
      size: selectedSize,
      quantity,
    });

    showToast({
      type: "success",
      title: "Added To Cart",
      message: `${product.name} / Size ${selectedSize} × ${quantity}`,
      actionLabel: "View Cart",
      actionHref: "/cart",
    });
  }

  return (
    <div className="mt-10 space-y-8">
      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Size
        </p>

        <div className="flex flex-wrap gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`border px-5 py-3 text-xs uppercase tracking-[0.25em] transition ${
                selectedSize === size
                  ? "border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4]"
                  : "border-black/20 text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Quantity
        </p>

        <div className="flex w-fit items-center border border-black/20 text-[#0b0b0b]">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="px-5 py-3 text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            -
          </button>

          <span className="min-w-12 text-center">{quantity}</span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={isOutOfStock || quantity >= stock}
            className="px-5 py-3 text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_0.72fr]">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full bg-[#0b0b0b] py-5 text-[#f1ece4] uppercase tracking-[0.3em] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
        </button>

        <WishlistButton product={product} />
      </div>
    </div>
  );
}