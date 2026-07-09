"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

function normalizeCartItem(item) {
  const stock = Number(item.stock || 0);
  const quantity = Number(item.quantity) || 1;

  return {
    ...item,
    price: Number(item.price) || 0,
    stock,
    quantity: stock > 0 ? Math.min(quantity, stock) : quantity,
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
    const stock = Number(safeProduct.stock || 0);

    if (stock <= 0) {
      return {
        success: false,
        reason: "out_of_stock",
        message: "This piece is currently out of stock.",
      };
    }

    let result = {
      success: true,
      reason: "added",
      message: "Added to cart.",
    };

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === safeProduct.id && item.size === safeProduct.size
      );

      if (existingItem) {
        const currentQuantity = Number(existingItem.quantity) || 1;
        const requestedQuantity = Number(safeProduct.quantity) || 1;
        const nextQuantity = currentQuantity + requestedQuantity;

        if (nextQuantity > stock) {
          result = {
            success: false,
            reason: "stock_limit",
            message: `Only ${stock} item${stock === 1 ? "" : "s"} available in this size.`,
          };

          return currentItems.map((item) =>
            item.id === safeProduct.id && item.size === safeProduct.size
              ? { ...item, quantity: stock, stock }
              : item
          );
        }

        return currentItems.map((item) =>
          item.id === safeProduct.id && item.size === safeProduct.size
            ? { ...item, quantity: nextQuantity, stock }
            : item
        );
      }

      if (Number(safeProduct.quantity) > stock) {
        result = {
          success: false,
          reason: "stock_limit",
          message: `Only ${stock} item${stock === 1 ? "" : "s"} available in this size.`,
        };

        return [...currentItems, { ...safeProduct, quantity: stock, stock }];
      }

      return [...currentItems, safeProduct];
    });

    return result;
  }

  function removeFromCart(productId, size) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.id === productId && item.size === size)
      )
    );
  }

  function updateQuantity(productId, size, quantity) {
    const requestedQuantity = Number(quantity) || 1;
    let result = {
      success: true,
      reason: "updated",
      message: "Quantity updated.",
    };

    if (requestedQuantity <= 0) {
      removeFromCart(productId, size);
      return {
        success: true,
        reason: "removed",
        message: "Item removed from cart.",
      };
    }

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== productId || item.size !== size) return item;

        const stock = Number(item.stock || 0);

        if (stock > 0 && requestedQuantity > stock) {
          result = {
            success: false,
            reason: "stock_limit",
            message: `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
          };

          return { ...item, quantity: stock };
        }

        return { ...item, quantity: requestedQuantity };
      })
    );

    return result;
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