"use client";

import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { showToast } = useToast();

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  function handleQuantityChange(item, nextQuantity) {
    const result = updateQuantity(item.id, item.size, nextQuantity);

    if (!result?.success) {
      showToast({
        type: "error",
        title: "Stock Limit",
        message: result.message || "Quantity adjusted to available stock.",
      });
      return;
    }

    if (result?.reason === "removed") {
      showToast({
        title: "Removed",
        message: `${item.name} removed from cart.`,
      });
    }
  }

  function handleRemove(item) {
    removeFromCart(item.id, item.size);

    showToast({
      title: "Removed",
      message: `${item.name} removed from cart.`,
    });
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Shopping Bag
          </p>

          <div className="mb-14 flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              Your Cart
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              <h2 className="font-heading text-4xl font-light">
                Your cart is empty.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                Explore engineered essentials built with pressure, precision,
                and quiet confidence.
              </p>

              <Link
                href="/shop"
                className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_390px]">
              <div className="space-y-5">
                {cartItems.map((item) => {
                  const stock = Number(item.stock || 0);
                  const quantity = Number(item.quantity || 1);
                  const reachedLimit = stock > 0 && quantity >= stock;

                  return (
                    <article
                      key={`${item.id}-${item.size}`}
                      className="grid gap-6 border border-black/10 bg-[#eee7dd] p-5 md:grid-cols-[140px_1fr_auto] md:items-center md:p-6"
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0b0b0b] md:w-[140px]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                          {item.series}
                        </p>

                        <h2 className="mt-3 font-heading text-3xl font-light">
                          {item.name}
                        </h2>

                        <div className="mt-5 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                          <p>Color: {item.color}</p>
                          <p>Size: {item.size}</p>
                          <p>Unit Price: ৳ {item.price}</p>
                          <p>
                            Stock:{" "}
                            {stock > 0 ? `${stock} Available` : "Out of Stock"}
                          </p>
                        </div>

                        {stock > 0 && stock <= 5 && (
                          <p className="mt-4 w-fit bg-[#0b0b0b] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#f1ece4]">
                            Only {stock} left
                          </p>
                        )}
                      </div>

                      <div className="space-y-5 md:text-right">
                        <div className="flex w-fit items-center border border-black/20 md:ml-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(item, quantity - 1)
                            }
                            className="px-4 py-3 text-sm transition hover:bg-black hover:text-[#f1ece4]"
                          >
                            -
                          </button>

                          <span className="min-w-12 text-center text-sm">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(item, quantity + 1)
                            }
                            disabled={reachedLimit}
                            className="px-4 py-3 text-sm transition hover:bg-black hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
                          >
                            +
                          </button>
                        </div>

                        {reachedLimit && (
                          <p className="text-xs leading-6 text-neutral-500">
                            Maximum available quantity selected.
                          </p>
                        )}

                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                            Subtotal
                          </p>

                          <p className="mt-2 font-heading text-3xl font-light">
                            ৳ {Number(item.price) * quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          className="text-xs uppercase tracking-[0.25em] text-neutral-500 transition hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit border border-black/10 bg-[#eee7dd] p-8 lg:sticky lg:top-28">
                <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  Summary
                </p>

                <h2 className="font-heading text-4xl font-light">
                  Order Summary
                </h2>

                <div className="mt-8 space-y-5 border-y border-black/10 py-6 text-sm">
                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Items</span>
                    <span>{totalItems}</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>৳ {cartTotal}</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Delivery</span>
                    <span>Calculated later</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Payment</span>
                    <span>Cash on Delivery</span>
                  </div>
                </div>

                <div className="mt-7 flex justify-between gap-6">
                  <span className="font-heading text-3xl font-light">Total</span>
                  <span className="font-heading text-3xl font-light">
                    ৳ {cartTotal}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 flex w-full justify-center bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#f1ece4] transition hover:opacity-85"
                >
                  Checkout
                </Link>

                <Link
                  href="/shop"
                  className="mt-4 flex w-full justify-center border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                >
                  Continue Shopping
                </Link>

                <div className="mt-8 space-y-3 border-t border-black/10 pt-6 text-sm text-neutral-600">
                  <p>✓ Cash on Delivery</p>
                  <p>✓ 2-5 Days Delivery</p>
                  <p>✓ Easy Exchange Support</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}