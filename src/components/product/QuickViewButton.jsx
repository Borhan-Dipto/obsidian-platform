"use client";

import { useQuickView } from "../../context/QuickViewContext";

export default function QuickViewButton({ product }) {
  const { openQuickView } = useQuickView();

  function handleQuickView(event) {
    event.preventDefault();
    event.stopPropagation();
    openQuickView(product);
  }

  return (
    <button
      type="button"
      onClick={handleQuickView}
      aria-label={`Quick view ${product.name}`}
      className="obsidian-quick-view absolute inset-x-4 bottom-4 z-20 hidden translate-y-0 md:block border border-white/20 bg-[#0b0b0b]/85 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f1ece4] opacity-100 backdrop-blur-xl transition duration-500 focus:translate-y-0 focus:opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100"
    >
      Quick View
    </button>
  );
}
