"use client";

import Image from "next/image";
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
    <div className="fixed inset-0 z-[100]">
      <div
        onClick={closeQuickView}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-black/10 bg-[#f1ece4] shadow-2xl">
        <button
          onClick={closeQuickView}
          className="absolute right-6 top-6 z-20 text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:text-black"
        >
          Close
        </button>

        <div className="grid md:grid-cols-2">
          <div className="bg-[#0b0b0b]">
            <Image
              src={selectedProduct.image}
              alt={selectedProduct.name}
              width={1200}
              height={1500}
              sizes="(min-width: 768px) 50vw, 94vw"
              className="aspect-[4/5] h-full w-full object-cover"
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
                {stock > 0 ? `${stock} Available` : "Out Of Stock"}
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