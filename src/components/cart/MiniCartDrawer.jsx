"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
} from "react";

import {
  useCart,
} from "../../context/CartContext";

import {
  useToast,
} from "../../context/ToastContext";

const FALLBACK_IMAGE =
  "/images/collection-artifact.jpeg";

function getSafeImage(image) {
  return (
    typeof image ===
      "string" &&
    image.trim()
      ? image.trim()
      : FALLBACK_IMAGE
  );
}

export default function MiniCartDrawer() {
  const {
    cartItems,
    cartTotal,
    cartCount,
    isMiniCartOpen,
    closeMiniCart,
    removeFromCart,
    refreshCart,
    isStorageReady,
    isCartRefreshing,
  } = useCart();

  const {
    showToast,
  } = useToast();

  useEffect(() => {
    if (!isMiniCartOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        closeMiniCart();
      }
    }

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isMiniCartOpen,
    closeMiniCart,
  ]);

  useEffect(() => {
    if (
      !isMiniCartOpen ||
      !isStorageReady ||
      cartItems.length === 0
    ) {
      return;
    }

    let active =
      true;

    async function refreshOpenCart() {
      const result =
        await refreshCart();

      if (
        !active ||
        !result
      ) {
        return;
      }

      if (
        result.success &&
        result.reason ===
          "corrected"
      ) {
        showToast({
          type:
            "info",

          title:
            "Cart Updated",

          message:
            result.message,
        });

        return;
      }

      if (
        !result.success &&
        result.reason !==
          "superseded"
      ) {
        showToast({
          type:
            "error",

          title:
            "Stock Check Failed",

          message:
            result.message ||
            "Current cart stock could not be checked.",
        });
      }
    }

    refreshOpenCart();

    return () => {
      active =
        false;
    };
  }, [
    isMiniCartOpen,
    isStorageReady,
    cartItems.length,
    refreshCart,
    showToast,
  ]);

  if (!isMiniCartOpen) {
    return null;
  }

  function handleRemove(item) {
    removeFromCart(
      item.id,
      item.size
    );

    showToast({
      title:
        "Removed",

      message:
        `${item.name} removed from cart.`,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      <button
        type="button"
        aria-label="Close cart drawer"
        onClick={
          closeMiniCart
        }
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] animate-[miniCartSlideIn_420ms_cubic-bezier(0.16,1,0.3,1)_both] flex-col bg-[#f1ece4] text-[#0b0b0b] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Shopping Bag
            </p>

            <h2 className="mt-2 font-heading text-4xl font-light">
              Cart (
              {
                cartCount
              }
              )
            </h2>
          </div>

          <button
            type="button"
            onClick={
              closeMiniCart
            }
            aria-label="Close shopping bag"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-2xl leading-none text-neutral-500 transition duration-300 hover:rotate-90 hover:bg-black hover:text-[#f1ece4]"
          >
            ×
          </button>
        </div>

        {isCartRefreshing &&
        cartItems.length > 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="border-b border-black/10 bg-[#eee7dd] px-6 py-3 text-[9px] uppercase tracking-[0.24em] text-neutral-500"
          >
            Checking current stock and prices…
          </div>
        ) : null}

        {cartItems.length ===
        0 ? (
          <div className="flex flex-1 flex-col justify-center px-6">
            <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Empty Bag
            </p>

            <h3 className="mt-4 font-heading text-4xl font-light">
              Your cart is empty.
            </h3>

            <p className="mt-4 text-sm leading-7 text-neutral-600">
              Explore OBSIDIAN pieces built under pressure and finished with precision.
            </p>

            <Link
              href="/shop"
              onClick={
                closeMiniCart
              }
              className="mt-8 flex justify-center bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                {cartItems.map(
                  (item) => {
                    const quantity =
                      Number(
                        item.quantity ||
                          1
                      );

                    const stock =
                      Number(
                        item.stock ||
                          0
                      );

                    const subtotal =
                      Number(
                        item.price ||
                          0
                      ) *
                      quantity;

                    return (
                      <article
                        key={`${item.id}-${item.size}`}
                        className="grid grid-cols-[92px_1fr] gap-4 border-b border-black/10 pb-5"
                      >
                        <Link
                          href={`/product/${item.id}`}
                          onClick={
                            closeMiniCart
                          }
                          className="relative block aspect-[4/5] overflow-hidden bg-[#0b0b0b]"
                          aria-label={`View ${item.name}`}
                        >
                          <Image
                            src={getSafeImage(
                              item.image
                            )}
                            alt={
                              item.name ||
                              "Obsidian product"
                            }
                            fill
                            sizes="92px"
                            className="object-cover object-center transition-transform duration-700 hover:scale-105"
                          />
                        </Link>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                            {item.series ||
                              "Obsidian"}
                          </p>

                          <Link
                            href={`/product/${item.id}`}
                            onClick={
                              closeMiniCart
                            }
                            className="mt-2 block font-heading text-2xl font-light leading-none transition hover:opacity-60"
                          >
                            {
                              item.name
                            }
                          </Link>

                          <div className="mt-4 space-y-1 text-sm text-neutral-600">
                            <p>
                              Color:{" "}
                              {item.color ||
                                "Obsidian Black"}
                            </p>

                            <p>
                              Size:{" "}
                              {
                                item.size
                              }
                            </p>

                            <p>
                              Qty:{" "}
                              {
                                quantity
                              }
                            </p>

                            <p>
                              Stock:{" "}
                              {stock > 0
                                ? `${stock} available`
                                : "Out of stock"}
                            </p>

                            <p className="pt-1 font-medium text-[#0b0b0b]">
                              ৳{" "}
                              {
                                subtotal
                              }
                            </p>
                          </div>

                          {stock > 0 &&
                          stock <= 5 ? (
                            <p className="mt-3 w-fit bg-black px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-[#f1ece4]">
                              Only{" "}
                              {
                                stock
                              }{" "}
                              left
                            </p>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(
                                item
                              )
                            }
                            className="mt-4 text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </div>

            <div className="border-t border-black/10 bg-[#eee7dd] px-6 py-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Subtotal
                </span>

                <span className="font-heading text-3xl font-light">
                  ৳{" "}
                  {
                    cartTotal
                  }
                </span>
              </div>

              <p className="mb-5 text-xs leading-6 text-neutral-500">
                Delivery charge will be calculated during checkout.
              </p>

              <Link
                href="/checkout"
                onClick={
                  isCartRefreshing
                    ? undefined
                    : closeMiniCart
                }
                aria-disabled={
                  isCartRefreshing
                }
                className={`flex w-full justify-center bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#f1ece4] transition duration-300 ${
                  isCartRefreshing
                    ? "pointer-events-none opacity-45"
                    : "hover:-translate-y-0.5 hover:shadow-xl"
                }`}
              >
                {isCartRefreshing
                  ? "Checking Stock..."
                  : "Checkout"}
              </Link>

              <Link
                href="/cart"
                onClick={
                  closeMiniCart
                }
                className="mt-3 flex w-full justify-center border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
              >
                View Cart
              </Link>

              <button
                type="button"
                onClick={
                  closeMiniCart
                }
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
