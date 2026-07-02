"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

function normalizeCartItem(item) {
  return {
    ...item,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    size: item.size || "M",
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("obsidian-cart");

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart.map(normalizeCartItem));
      } catch {
        localStorage.removeItem("obsidian-cart");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("obsidian-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product) {
    const safeProduct = normalizeCartItem(product);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === safeProduct.id && item.size === safeProduct.size
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === safeProduct.id && item.size === safeProduct.size
            ? {
                ...item,
                quantity:
                  (Number(item.quantity) || 1) +
                  (Number(safeProduct.quantity) || 1),
              }
            : item
        );
      }

      return [...currentItems, safeProduct];
    });
  }

  function removeFromCart(productId, size) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.id === productId && item.size === size)
      )
    );
  }

  function updateQuantity(productId, size, quantity) {
    const safeQuantity = Number(quantity) || 1;

    if (safeQuantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId && item.size === size
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}