"use client";

import { createContext, useContext, useMemo, useState } from "react";

const QuickViewContext = createContext(null);

function normalizeQuickViewProduct(product) {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name || "Obsidian Product",
    series: product.series || "Obsidian",
    color: product.color || "Obsidian Black",
    description:
      product.description ||
      "A refined essential built with pressure, precision, and purpose.",
    price: Number(product.price) || 0,
    image: product.image || "",
    stock: Number(product.stock) || 0,
  };
}

export function QuickViewProvider({ children }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  function openQuickView(product) {
    const safeProduct = normalizeQuickViewProduct(product);

    if (!safeProduct?.id) {
      return;
    }

    setSelectedProduct(safeProduct);
    setIsQuickViewOpen(true);
  }

  function closeQuickView() {
    setIsQuickViewOpen(false);
  }

  function clearQuickView() {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  }

  const value = useMemo(
    () => ({
      selectedProduct,
      isQuickViewOpen,
      openQuickView,
      closeQuickView,
      clearQuickView,
    }),
    [selectedProduct, isQuickViewOpen]
  );

  return (
    <QuickViewContext.Provider value={value}>
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);

  if (!context) {
    throw new Error("useQuickView must be used inside QuickViewProvider");
  }

  return context;
}