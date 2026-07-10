"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "obsidian-recently-viewed";
const MAX_RECENT_ITEMS = 6;

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name || "Obsidian Product",
    series: product.series || "Obsidian",
    color: product.color || "",
    price: Number(product.price) || 0,
    image: product.image || "",
    stock: Number(product.stock) || 0,
  };
}

function readRecentlyViewed() {
  try {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (!savedItems) {
      return [];
    }

    const parsedItems = JSON.parse(savedItems);

    if (!Array.isArray(parsedItems)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsedItems
      .filter((item) => item?.id)
      .map(normalizeProduct)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export default function RecentlyViewedProducts({ product }) {
  const [recentItems, setRecentItems] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!product?.id) {
      setIsReady(true);
      return;
    }

    const currentProduct = normalizeProduct(product);
    const savedItems = readRecentlyViewed();

    const previousProducts = savedItems.filter(
      (item) => item.id !== currentProduct.id
    );

    const updatedItems = [currentProduct, ...previousProducts].slice(
      0,
      MAX_RECENT_ITEMS
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    } catch {
      // Recently viewed will still work for the current session.
    }

    setRecentItems(previousProducts.slice(0, MAX_RECENT_ITEMS));
    setIsReady(true);
  }, [product]);

  if (!isReady || recentItems.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f1ece4] px-6 pb-28 text-[#0b0b0b] lg:px-10 lg:pb-36">
      <div className="mx-auto max-w-[1440px] border-t border-black/10 pt-16 lg:pt-20">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Recently Viewed
            </p>

            <h2 className="font-heading text-5xl font-light leading-none md:text-7xl">
              Return To Pieces
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600">
              Revisit the OBSIDIAN pieces you explored recently.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-fit border border-black/20 px-6 py-4 text-xs uppercase tracking-[0.3em] text-neutral-700 transition duration-300 hover:border-black hover:bg-black hover:text-[#f1ece4]"
          >
            View All Products
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.id}`}
              className="group block overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-[#f1ece4]/50">
                    Image Unavailable
                  </div>
                )}

                {item.stock <= 0 && (
                  <div className="absolute left-3 top-3 bg-[#0b0b0b]/85 px-3 py-2 text-[9px] uppercase tracking-[0.24em] text-[#f1ece4] backdrop-blur-sm">
                    Sold Out
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              </div>

              <div className="p-4">
                <p className="truncate text-[9px] uppercase tracking-[0.24em] text-neutral-500">
                  {item.series}
                </p>

                <h3 className="mt-2 line-clamp-2 font-heading text-2xl font-light leading-[0.95]">
                  {item.name}
                </h3>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
                  <p className="text-sm text-neutral-700">৳ {item.price}</p>

                  <span className="text-sm transition duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}