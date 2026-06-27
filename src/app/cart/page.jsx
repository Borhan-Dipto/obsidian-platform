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
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-6 border border-black/10 bg-[#eee7dd] p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h2 className="font-heading text-3xl">
                        {item.name}
                      </h2>

                      <p className="mt-2 text-neutral-600">
                        ৳ {item.price}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        className="border border-black px-4 py-2"
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        className="border border-black px-4 py-2"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm uppercase tracking-[0.25em] text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-12 border-t border-black/10 pt-8">
                <h2 className="font-heading text-4xl">
                  Total: ৳ {cartTotal}
                </h2>

                <Link
                  href="/checkout"
                  className="mt-8 block w-full bg-black px-8 py-5 text-center text-xs uppercase tracking-[0.35em] text-white transition hover:opacity-80"
                >
                  Proceed To Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}