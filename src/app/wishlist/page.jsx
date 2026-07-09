"use client";

import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function WishlistPage() {
  const cartContext = useCart();

  const wishlistItems = cartContext?.wishlistItems || [];
  const removeFromWishlist =
    cartContext?.removeFromWishlist || function () {};
  const clearWishlist = cartContext?.clearWishlist || function () {};

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Saved Pieces
          </p>

          <div className="mb-12 flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              Wishlist
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {wishlistItems.length} Saved
            </p>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              <h2 className="font-heading text-4xl font-light">
                Your wishlist is empty.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                Save your favourite OBSIDIAN pieces and return to them anytime.
              </p>

              <Link
                href="/shop"
                className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Explore Shop
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 flex justify-end">
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-xs uppercase tracking-[0.28em] text-neutral-500 transition hover:text-black"
                >
                  Clear Wishlist
                </button>
              </div>

              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {wishlistItems.map((product) => (
                  <div
                    key={product.id}
                    className="border border-black/10 bg-[#eee7dd]"
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className="aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition duration-700 hover:scale-105"
                        />
                      </div>
                    </Link>

                    <div className="p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                        {product.series}
                      </p>

                      <h2 className="mt-3 font-heading text-3xl font-light">
                        {product.name}
                      </h2>

                      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                        <p className="text-sm text-neutral-700">
                          ৳ {product.price}
                        </p>

                        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {Number(product.stock) > 0
                            ? `${product.stock} In Stock`
                            : "Out of Stock"}
                        </p>
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="flex justify-center bg-[#0b0b0b] px-6 py-4 text-xs uppercase tracking-[0.25em] text-[#f1ece4] transition hover:opacity-85"
                        >
                          Choose Size
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                          className="border border-black/20 px-6 py-4 text-xs uppercase tracking-[0.25em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}