"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

function getSafeImage(image) {
  return typeof image === "string" && image.trim()
    ? image.trim()
    : FALLBACK_IMAGE;
}

export default function WishlistPage() {
  const { wishlistItems = [], removeFromWishlist, clearWishlist } = useCart();
  const { showToast } = useToast();

  function handleRemove(product) {
    removeFromWishlist(product.id);

    showToast({
      title: "Removed From Wishlist",
      message: `${product.name} was removed from your wishlist.`,
    });
  }

  function handleClearWishlist() {
    clearWishlist();

    showToast({
      title: "Wishlist Cleared",
      message: "All saved pieces have been removed.",
    });
  }

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
                  onClick={handleClearWishlist}
                  className="text-xs uppercase tracking-[0.28em] text-neutral-500 transition hover:text-red-700"
                >
                  Clear Wishlist
                </button>
              </div>

              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {wishlistItems.map((product, index) => {
                  const stock = Number(product.stock || 0);

                  return (
                    <article
                      key={product.id}
                      className="group overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
                    >
                      <Link
                        href={`/product/${product.id}`}
                        className="relative block aspect-[4/5] overflow-hidden bg-[#0b0b0b]"
                        aria-label={`View ${product.name}`}
                      >
                        <Image
                          src={getSafeImage(product.image)}
                          alt={product.name || "Obsidian product"}
                          fill
                          priority={index < 2}
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                        />

                        {stock <= 0 && (
                          <div className="absolute left-4 top-4 z-10 bg-[#0b0b0b] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f1ece4]">
                            Sold Out
                          </div>
                        )}

                        {stock > 0 && stock <= 5 && (
                          <div className="absolute left-4 top-4 z-10 border border-[#f1ece4]/20 bg-black/45 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f1ece4] backdrop-blur-md">
                            Only {stock} Left
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                      </Link>

                      <div className="p-6">
                        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                          {product.series || "Obsidian"}
                        </p>

                        <Link href={`/product/${product.id}`}>
                          <h2 className="mt-3 font-heading text-3xl font-light transition hover:opacity-60">
                            {product.name}
                          </h2>
                        </Link>

                        <p className="mt-3 text-sm text-neutral-500">
                          {product.color || "Obsidian Black"}
                        </p>

                        <div className="mt-6 flex items-center justify-between gap-5 border-t border-black/10 pt-5">
                          <p className="text-sm text-neutral-700">
                            ৳ {Number(product.price) || 0}
                          </p>

                          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                            {stock > 0 ? `${stock} In Stock` : "Out of Stock"}
                          </p>
                        </div>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                          <Link
                            href={`/product/${product.id}`}
                            className="flex justify-center bg-[#0b0b0b] px-6 py-4 text-xs uppercase tracking-[0.25em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                          >
                            Choose Size
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleRemove(product)}
                            className="border border-black/20 px-6 py-4 text-xs uppercase tracking-[0.25em] transition hover:border-black hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}