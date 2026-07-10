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
      className="absolute inset-x-4 bottom-4 z-20 translate-y-4 border border-white/20 bg-[#0b0b0b]/85 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f1ece4] opacity-0 backdrop-blur-xl transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
    >
      Quick View
    </button>
  );
}