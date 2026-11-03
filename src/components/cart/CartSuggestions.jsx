"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loadCatalog } from "../layout/PredictiveSearch";
import { getProductTotalStock } from "../../lib/productInventory";

/*
 * "Pairs well with" in the cart drawer: up to two in-stock pieces that
 * are not already in the bag, preferring the same collection.
 */
export default function CartSuggestions({ cartItems = [], onNavigate }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    loadCatalog().then((list) => {
      if (!cancelled) {
        setProducts(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const inCart = new Set(cartItems.map((item) => String(item.id)));
  const series = new Set(cartItems.map((item) => item.series));

  const picks = products
    .filter((product) => !inCart.has(String(product.id)) && getProductTotalStock(product) > 0)
    .sort((a, b) => Number(series.has(b.series)) - Number(series.has(a.series)))
    .slice(0, 2);

  if (picks.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-black/10 pt-6" aria-labelledby="cart-suggestions-title">
      <h3
        id="cart-suggestions-title"
        className="mb-4 text-[11px] uppercase tracking-[0.3em] text-neutral-500"
      >
        Pairs well with
      </h3>

      <ul className="grid grid-cols-2 gap-3">
        {picks.map((product) => (
          <li key={product.id}>
            <Link
              href={`/product/${encodeURIComponent(product.id)}`}
              onClick={onNavigate}
              className="group block"
            >
              <span className="relative block aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill sizes="160px" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : null}
              </span>

              <span className="mt-2 block truncate text-sm">{product.name}</span>
              <span className="block text-xs text-neutral-600">
                ৳ {Number(product.price || 0).toLocaleString("en-BD")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
