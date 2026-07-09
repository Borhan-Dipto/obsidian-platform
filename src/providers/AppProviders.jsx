"use client";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import MiniCartDrawer from "@/components/cart/MiniCartDrawer";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CartProvider>
        {children}
        <MiniCartDrawer />
      </CartProvider>
    </ToastProvider>
  );
}