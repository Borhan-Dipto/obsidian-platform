"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";

const sizes = ["S", "M", "L", "XL", "XXL"];

export default function ProductActions({ product }) {
  const { addToCart } = useCart();

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
      alert("This product is out of stock.");
      return;
    }

    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      series: product.series,
      color: product.color,
      price: Number(product.price),
      image: product.image,
      size: selectedSize,
      quantity,
    });

    alert("Product added to cart.");
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
                  ? "border-[#f1ece4] bg-[#f1ece4] text-[#0b0b0b]"
                  : "border-white/20 text-[#f1ece4] hover:bg-white/10"
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

        <div className="flex w-fit items-center border border-white/20">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="px-5 py-3 text-xl"
          >
            -
          </button>

          <span className="min-w-12 text-center">{quantity}</span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={isOutOfStock || quantity >= stock}
            className="px-5 py-3 text-xl disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="w-full bg-[#f1ece4] py-5 text-[#0b0b0b] uppercase tracking-[0.3em] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
      </button>
    </div>
  );
}