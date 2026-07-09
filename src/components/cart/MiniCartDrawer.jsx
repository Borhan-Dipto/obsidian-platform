"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";

export default function MiniCartDrawer() {
  const {
    cartItems,
    cartTotal,
    cartCount,
    isMiniCartOpen,
    closeMiniCart,
    removeFromCart,
  } = useCart();

  useEffect(() => {
    if (!isMiniCartOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeMiniCart();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMiniCartOpen, closeMiniCart]);

  if (!isMiniCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998]">
      <button
        type="button"
        aria-label="Close cart drawer"
        onClick={closeMiniCart}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] animate-[miniCartSlideIn_420ms_cubic-bezier(0.16,1,0.3,1)_both] flex-col bg-[#f1ece4] text-[#0b0b0b] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Shopping Bag
            </p>

            <h2 className="mt-2 font-heading text-4xl font-light">
              Cart ({cartCount})
            </h2>
          </div>

          <button
            type="button"
            onClick={closeMiniCart}
            className="text-2xl leading-none text-neutral-500 transition hover:text-black"
          >
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center px-6">
            <h3 className="font-heading text-4xl font-light">
              Your cart is empty.
            </h3>

            <p className="mt-4 text-sm leading-7 text-neutral-600">
              Explore OBSIDIAN pieces built under pressure and finished with
              precision.
            </p>

            <Link
              href="/shop"
              onClick={closeMiniCart}
              className="mt-8 flex justify-center bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.3em] text-[#f1ece4]"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                {cartItems.map((item) => (
                  <article
                    key={`${item.id}-${item.size}`}
                    className="grid grid-cols-[92px_1fr] gap-4 border-b border-black/10 pb-5"
                  >
                    <Link
                      href={`/product/${item.id}`}
                      onClick={closeMiniCart}
                      className="block aspect-[4/5] overflow-hidden bg-[#0b0b0b]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </Link>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                        {item.series}
                      </p>

                      <Link
                        href={`/product/${item.id}`}
                        onClick={closeMiniCart}
                        className="mt-2 block font-heading text-2xl font-light leading-none"
                      >
                        {item.name}
                      </Link>

                      <div className="mt-4 space-y-1 text-sm text-neutral-600">
                        <p>Size: {item.size}</p>
                        <p>Qty: {item.quantity}</p>
                        <p>৳ {Number(item.price) * Number(item.quantity)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="mt-4 text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border-t border-black/10 px-6 py-6">
              <div className="mb-5 flex justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Subtotal
                </span>

                <span className="font-heading text-3xl font-light">
                  ৳ {cartTotal}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={closeMiniCart}
                className="flex w-full justify-center bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#f1ece4] transition hover:opacity-85"
              >
                Checkout
              </Link>

              <Link
                href="/cart"
                onClick={closeMiniCart}
                className="mt-3 flex w-full justify-center border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
              >
                View Cart
              </Link>

              <button
                type="button"
                onClick={closeMiniCart}
                className="mt-4 w-full text-xs uppercase tracking-[0.28em] text-neutral-500 transition hover:text-black"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}