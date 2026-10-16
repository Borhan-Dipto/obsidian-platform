"use client";

import FramedImage from "../ui/FramedImage";
import { getStockLabel } from "../../lib/productImages";
import Link from "next/link";
import { useEffect } from "react";
import { useQuickView } from "../../context/QuickViewContext";

export default function QuickViewModal() {
  const {
    selectedProduct,
    isQuickViewOpen,
    closeQuickView,
  } = useQuickView();

  useEffect(() => {
    if (!isQuickViewOpen) return;

    document.body.style.overflow = "hidden";

    function handleEscape(e) {
      if (e.key === "Escape") {
        closeQuickView();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isQuickViewOpen, closeQuickView]);

  if (!isQuickViewOpen || !selectedProduct) return null;

  const stock = Number(selectedProduct.stock || 0);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={`${selectedProduct.name} quick view`}>
      <div
        onClick={closeQuickView}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="absolute left-1/2 top-1/2 max-h-[92vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain border border-black/10 bg-[#f1ece4] shadow-2xl">
        <button
          type="button"
          onClick={closeQuickView}
          className="absolute right-3 top-3 z-20 min-h-11 bg-[#f1ece4]/90 px-4 text-xs uppercase tracking-[0.3em] text-neutral-700 transition hover:text-black"
        >
          Close
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
            <FramedImage
              src={selectedProduct.image}
              alt={selectedProduct.name}
              sizes="(min-width: 768px) 50vw, 94vw"
            />
          </div>

          <div className="flex flex-col justify-center p-8 lg:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              {selectedProduct.series}
            </p>

            <h2 className="mt-4 font-heading text-5xl font-light leading-none">
              {selectedProduct.name}
            </h2>

            <p className="mt-6 text-3xl font-light">
              ৳ {selectedProduct.price}
            </p>

            <p className="mt-8 leading-8 text-neutral-600">
              {selectedProduct.description}
            </p>

            <div className="mt-8 flex items-center justify-between border-y border-black/10 py-5 text-sm">
              <span>{selectedProduct.color}</span>

              <span>
                {getStockLabel(stock).text}
              </span>
            </div>

            <Link
              href={`/product/${selectedProduct.id}`}
              onClick={closeQuickView}
              className="mt-10 flex justify-center bg-[#0b0b0b] py-5 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85"
            >
              View Full Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}