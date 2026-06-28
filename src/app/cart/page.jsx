"use client";

import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Cart
          </p>

          <h1 className="font-heading mb-16 text-6xl font-light md:text-8xl">
            Your Cart
          </h1>

          {cartItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10">
              <p className="text-lg text-neutral-600">
                Your cart is currently empty.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-block border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-white"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="grid gap-6 border border-black/10 bg-[#eee7dd] p-6 md:grid-cols-[120px_1fr_auto] md:items-center"
                  >
                    <div className="h-32 w-32 overflow-hidden border border-black/10 bg-[#f1ece4]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <h2 className="font-heading text-3xl">
                        {item.name}
                      </h2>

                      <p className="mt-2 text-sm text-neutral-600">
                        {item.series}
                      </p>

                      <p className="mt-2 text-sm text-neutral-600">
                        Color: {item.color}
                      </p>

                      <p className="mt-2 text-sm text-neutral-600">
                        Size: {item.size}
                      </p>

                      <p className="mt-4 text-lg">
                        ৳ {item.price}
                      </p>
                    </div>

                    <div className="space-y-5 md:text-right">
                      <div className="flex w-fit items-center border border-black/20 md:ml-auto">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="px-4 py-2"
                        >
                          -
                        </button>

                        <span className="min-w-10 text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="px-4 py-2"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm text-neutral-600">
                        Subtotal
                      </p>

                      <p className="font-heading text-3xl">
                        ৳ {item.price * item.quantity}
                      </p>

                      <button
                        onClick={() =>
                          removeFromCart(item.id, item.size)
                        }
                        className="text-xs uppercase tracking-[0.25em] text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="h-fit border border-black/10 bg-[#eee7dd] p-8">
                <h2 className="font-heading text-4xl">
                  Order Summary
                </h2>

                <div className="mt-8 space-y-4 border-b border-black/10 pb-6">
                  <div className="flex justify-between text-sm">
                    <span>Items</span>
                    <span>
                      {cartItems.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>৳ {cartTotal}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Calculated later</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <span className="font-heading text-3xl">Total</span>
                  <span className="font-heading text-3xl">
                    ৳ {cartTotal}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 block w-full bg-black px-8 py-5 text-center text-xs uppercase tracking-[0.35em] text-white transition hover:opacity-80"
                >
                  Proceed To Checkout
                </Link>

                <Link
                  href="/shop"
                  className="mt-4 block w-full border border-black px-8 py-4 text-center text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-white"
                >
                  Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}