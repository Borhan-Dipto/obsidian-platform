"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

let catalogPromise = null;

/* Loads the public catalogue once per visit (small store; filtering is local). */
export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch("/api/products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (Array.isArray(data?.products) ? data.products : []))
      .catch(() => {
        catalogPromise = null;
        return [];
      });
  }

  return catalogPromise;
}

function normalize(value) {
  return String(value ?? "").toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

/*
 * Live results under the search box: products whose name, series or
 * colour match every typed word. Enter still opens the full results.
 */
export default function PredictiveSearch({ query = "", active = false, onNavigate }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;

    loadCatalog().then((list) => {
      if (!cancelled) {
        setProducts(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  const words = normalize(query).split(" ").filter(Boolean);

  const matches =
    words.length === 0
      ? []
      : products
          .filter((product) => {
            const haystack = normalize(`${product.name} ${product.series} ${product.color}`);
            return words.every((word) => haystack.includes(word));
          })
          .slice(0, 6);

  if (words.length === 0) {
    return null;
  }

  return (
    <div className="mt-5" aria-live="polite">
      {matches.length === 0 ? (
        <p className="text-sm text-black/55">
          No pieces match “{query.trim()}”. Try a colour or collection name.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {matches.map((product) => (
            <li key={product.id}>
              <Link
                href={`/product/${encodeURIComponent(product.id)}`}
                onClick={onNavigate}
                className="group flex items-center gap-3 border border-black/10 bg-white/40 p-2 transition hover:border-black/30"
              >
                <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-[#eee7dd]">
                  {product.image ? (
                    <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm text-black">{product.name}</span>
                  <span className="block truncate text-[11px] uppercase tracking-[0.16em] text-black/50">
                    {product.color}
                  </span>
                  <span className="block text-xs text-black/70">
                    ৳ {Number(product.price || 0).toLocaleString("en-BD")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
