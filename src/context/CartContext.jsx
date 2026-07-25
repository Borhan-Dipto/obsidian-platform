"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext =
  createContext(null);

const CART_STORAGE_KEY =
  "obsidian-cart";

const WISHLIST_STORAGE_KEY =
  "obsidian-wishlist";

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function normalizeCartItem(item) {
  const source =
    isPlainObject(item)
      ? item
      : {};

  const stock =
    Number(source.stock || 0);

  const quantity =
    Number(source.quantity) || 1;

  return {
    ...source,

    price:
      Number(source.price) || 0,

    stock,

    quantity:
      stock > 0
        ? Math.min(
            quantity,
            stock
          )
        : quantity,

    size:
      source.size || "M",
  };
}

function normalizeWishlistItem(
  item
) {
  const source =
    isPlainObject(item)
      ? item
      : {};

  return {
    id: source.id,
    name: source.name,

    series:
      source.series || "",

    color:
      source.color || "",

    price:
      Number(source.price) || 0,

    image:
      source.image || "",

    stock:
      Number(source.stock) || 0,
  };
}

function readStoredItems(
  storageKey,
  normalizeItem
) {
  const storedValue =
    window.localStorage.getItem(
      storageKey
    );

  if (!storedValue) {
    return [];
  }

  const parsedValue =
    JSON.parse(storedValue);

  if (!Array.isArray(parsedValue)) {
    throw new Error(
      `Invalid stored value for ${storageKey}.`
    );
  }

  return parsedValue
    .map(normalizeItem)
    .filter(
      (item) =>
        Boolean(item?.id)
    );
}

function writeStoredItems(
  storageKey,
  items
) {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error(
      `Unable to save ${storageKey}:`,
      error
    );
  }
}

export function CartProvider({
  children,
}) {
  const [
    cartItems,
    setCartItems,
  ] = useState([]);

  const [
    wishlistItems,
    setWishlistItems,
  ] = useState([]);

  const [
    isStorageReady,
    setIsStorageReady,
  ] = useState(false);

  const [
    isMiniCartOpen,
    setIsMiniCartOpen,
  ] = useState(false);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        () => {
          try {
            const storedCart =
              readStoredItems(
                CART_STORAGE_KEY,
                normalizeCartItem
              );

            const storedWishlist =
              readStoredItems(
                WISHLIST_STORAGE_KEY,
                normalizeWishlistItem
              );

            setCartItems(
              storedCart
            );

            setWishlistItems(
              storedWishlist
            );
          } catch (error) {
            console.error(
              "Unable to restore OBSIDIAN cart storage:",
              error
            );

            window.localStorage.removeItem(
              CART_STORAGE_KEY
            );

            window.localStorage.removeItem(
              WISHLIST_STORAGE_KEY
            );

            setCartItems([]);
            setWishlistItems([]);
          } finally {
            setIsStorageReady(
              true
            );
          }
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    writeStoredItems(
      CART_STORAGE_KEY,
      cartItems
    );
  }, [
    cartItems,
    isStorageReady,
  ]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    writeStoredItems(
      WISHLIST_STORAGE_KEY,
      wishlistItems
    );
  }, [
    wishlistItems,
    isStorageReady,
  ]);

  function openMiniCart() {
    setIsMiniCartOpen(true);
  }

  function closeMiniCart() {
    setIsMiniCartOpen(false);
  }

  function addToCart(product) {
    const safeProduct =
      normalizeCartItem(product);

    const stock =
      Number(
        safeProduct.stock || 0
      );

    if (stock <= 0) {
      return {
        success: false,
        reason:
          "out_of_stock",

        message:
          "This piece is currently out of stock.",
      };
    }

    let result = {
      success: true,
      reason: "added",
      message:
        "Added to cart.",
    };

    setCartItems(
      (currentItems) => {
        const existingItem =
          currentItems.find(
            (item) =>
              item.id ===
                safeProduct.id &&
              item.size ===
                safeProduct.size
          );

        if (existingItem) {
          const currentQuantity =
            Number(
              existingItem.quantity
            ) || 1;

          const requestedQuantity =
            Number(
              safeProduct.quantity
            ) || 1;

          const nextQuantity =
            currentQuantity +
            requestedQuantity;

          if (
            nextQuantity >
            stock
          ) {
            result = {
              success: false,
              reason:
                "stock_limit",

              message:
                `Only ${stock} item${
                  stock === 1
                    ? ""
                    : "s"
                } available in this size.`,
            };

            return currentItems.map(
              (item) =>
                item.id ===
                    safeProduct.id &&
                item.size ===
                    safeProduct.size
                  ? {
                      ...item,
                      quantity:
                        stock,
                      stock,
                    }
                  : item
            );
          }

          return currentItems.map(
            (item) =>
              item.id ===
                  safeProduct.id &&
              item.size ===
                  safeProduct.size
                ? {
                    ...item,

                    quantity:
                      nextQuantity,

                    stock,
                  }
                : item
          );
        }

        if (
          Number(
            safeProduct.quantity
          ) > stock
        ) {
          result = {
            success: false,
            reason:
              "stock_limit",

            message:
              `Only ${stock} item${
                stock === 1
                  ? ""
                  : "s"
              } available in this size.`,
          };

          return [
            ...currentItems,

            {
              ...safeProduct,
              quantity: stock,
              stock,
            },
          ];
        }

        return [
          ...currentItems,
          safeProduct,
        ];
      }
    );

    return result;
  }

  function removeFromCart(
    productId,
    size
  ) {
    setCartItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.id ===
                productId &&
              item.size === size
            )
        )
    );
  }

  function updateQuantity(
    productId,
    size,
    quantity
  ) {
    const requestedQuantity =
      Number(quantity) || 1;

    if (
      requestedQuantity <= 0
    ) {
      removeFromCart(
        productId,
        size
      );

      return {
        success: true,
        reason: "removed",

        message:
          "Item removed from cart.",
      };
    }

    let result = {
      success: true,
      reason: "updated",

      message:
        "Quantity updated.",
    };

    setCartItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              item.id !==
                productId ||
              item.size !== size
            ) {
              return item;
            }

            const stock =
              Number(
                item.stock || 0
              );

            if (
              stock > 0 &&
              requestedQuantity >
                stock
            ) {
              result = {
                success: false,
                reason:
                  "stock_limit",

                message:
                  `Only ${stock} item${
                    stock === 1
                      ? ""
                      : "s"
                  } available.`,
              };

              return {
                ...item,
                quantity: stock,
              };
            }

            return {
              ...item,

              quantity:
                requestedQuantity,
            };
          }
        )
    );

    return result;
  }

  function clearCart() {
    setCartItems([]);
  }

  function isInWishlist(
    productId
  ) {
    return wishlistItems.some(
      (item) =>
        item.id === productId
    );
  }

  function toggleWishlist(
    product
  ) {
    const safeProduct =
      normalizeWishlistItem(
        product
      );

    const exists =
      wishlistItems.some(
        (item) =>
          item.id ===
          safeProduct.id
      );

    if (exists) {
      setWishlistItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !==
              safeProduct.id
          )
      );

      return false;
    }

    setWishlistItems(
      (currentItems) => [
        safeProduct,
        ...currentItems,
      ]
    );

    return true;
  }

  function removeFromWishlist(
    productId
  ) {
    setWishlistItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.id !==
            productId
        )
    );
  }

  function clearWishlist() {
    setWishlistItems([]);
  }

  const cartCount =
    cartItems.reduce(
      (total, item) =>
        total +
        (Number(
          item.quantity
        ) || 0),
      0
    );

  const cartTotal =
    cartItems.reduce(
      (total, item) =>
        total +
        (Number(
          item.price
        ) || 0) *
          (Number(
            item.quantity
          ) || 0),
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

        wishlistCount:
          wishlistItems.length,

        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,

        isMiniCartOpen,
        openMiniCart,
        closeMiniCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}