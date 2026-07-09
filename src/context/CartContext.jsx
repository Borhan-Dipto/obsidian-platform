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

function normalizeWishlistItem(item) {
  return {
    id: item.id,
    name: item.name,
    series: item.series || "",
    color: item.color || "",
    price: Number(item.price) || 0,
    image: item.image || "",
    stock: Number(item.stock) || 0,
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("obsidian-cart");
      const savedWishlist = localStorage.getItem("obsidian-wishlist");

      if (savedCart) {
        setCartItems(JSON.parse(savedCart).map(normalizeCartItem));
      }

      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist).map(normalizeWishlistItem));
      }
    } catch {
      localStorage.removeItem("obsidian-cart");
      localStorage.removeItem("obsidian-wishlist");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("obsidian-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("obsidian-wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

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

  function isInWishlist(productId) {
    return wishlistItems.some((item) => item.id === productId);
  }

  function toggleWishlist(product) {
    const safeProduct = normalizeWishlistItem(product);
    const exists = wishlistItems.some((item) => item.id === safeProduct.id);

    if (exists) {
      setWishlistItems((currentItems) =>
        currentItems.filter((item) => item.id !== safeProduct.id)
      );
      return false;
    }

    setWishlistItems((currentItems) => [safeProduct, ...currentItems]);
    return true;
  }

  function removeFromWishlist(productId) {
    setWishlistItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  }

  function clearWishlist() {
    setWishlistItems([]);
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
        wishlistItems,
        wishlistCount: wishlistItems.length,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
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