"use client";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { QuickViewProvider } from "@/context/QuickViewContext";
import MiniCartDrawer from "@/components/cart/MiniCartDrawer";
import QuickViewModal from "@/components/product/QuickViewModal";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CartProvider>
        <QuickViewProvider>
          {children}
          <QuickViewModal />
          <MiniCartDrawer />
        </QuickViewProvider>
      </CartProvider>
    </ToastProvider>
  );
}