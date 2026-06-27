"use client";

import { CartProvider } from "@/context/CartContext";

export default function AppProviders({ children }) {
  return <CartProvider>{children}</CartProvider>;
}