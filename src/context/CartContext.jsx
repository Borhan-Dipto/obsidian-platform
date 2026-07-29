"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const CartContext =
  createContext(null);

const CART_STORAGE_KEY =
  "obsidian-cart";

const WISHLIST_STORAGE_KEY =
  "obsidian-wishlist";

const CART_REFRESH_INTERVAL_MS =
  60 * 1000;

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function normalizeStock(value) {
  const stock =
    Number(value);

  if (
    !Number.isFinite(stock)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(stock)
  );
}

function normalizeQuantity(value) {
  const quantity =
    Number(value);

  if (
    !Number.isFinite(
      quantity
    )
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

function normalizeCartSize(value) {
  return String(
    value || "M"
  )
    .normalize("NFKC")
    .trim() || "M";
}

function createCartLineKey(
  productId,
  size
) {
  return `${String(
    productId || ""
  )
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase(
      "en"
    )}\u0000${normalizeCartSize(
    size
  ).toLocaleLowerCase("en")}`;
}

function normalizeCartItem(item) {
  const source =
    isPlainObject(item)
      ? item
      : {};

  const stock =
    normalizeStock(
      source.stock
    );

  const quantity =
    normalizeQuantity(
      source.quantity
    );

  return {
    ...source,

    id:
      String(
        source.id || ""
      ).trim(),

    name:
      String(
        source.name || ""
      ).trim(),

    series:
      String(
        source.series || ""
      ).trim(),

    color:
      String(
        source.color || ""
      ).trim(),

    image:
      String(
        source.image || ""
      ).trim(),

    price:
      Number(source.price) ||
      0,

    stock,

    quantity:
      stock > 0
        ? Math.min(
            quantity,
            stock
          )
        : quantity,

    size:
      normalizeCartSize(
        source.size
      ),
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
      Number(source.price) ||
      0,

    image:
      source.image || "",

    stock:
      normalizeStock(
        source.stock
      ),
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

  if (
    !Array.isArray(
      parsedValue
    )
  ) {
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

function createCartPayload(
  items
) {
  return items.map(
    (item) => ({
      id:
        item.id,

      size:
        item.size || "",

      quantity:
        normalizeQuantity(
          item.quantity
        ),
    })
  );
}

function createRefreshMessage(
  summary
) {
  const removedLines =
    Number(
      summary?.removedLines
    ) || 0;

  const adjustedLines =
    Number(
      summary?.adjustedLines
    ) || 0;

  if (
    removedLines > 0 &&
    adjustedLines > 0
  ) {
    return `${removedLines} unavailable cart line${
      removedLines === 1
        ? ""
        : "s"
    } removed and ${adjustedLines} quantit${
      adjustedLines === 1
        ? "y"
        : "ies"
    } adjusted to current stock.`;
  }

  if (removedLines > 0) {
    return `${removedLines} unavailable cart line${
      removedLines === 1
        ? ""
        : "s"
    } removed.`;
  }

  if (adjustedLines > 0) {
    return `${adjustedLines} cart quantit${
      adjustedLines === 1
        ? "y was"
        : "ies were"
    } adjusted to current stock.`;
  }

  return "Cart stock and prices are up to date.";
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

  const [
    isCartRefreshing,
    setIsCartRefreshing,
  ] = useState(false);

  const [
    lastCartRefreshAt,
    setLastCartRefreshAt,
  ] = useState(null);

  const cartItemsRef =
    useRef([]);

  const cartRefreshRequestRef =
    useRef(0);

  const lastRefreshTimeRef =
    useRef(0);

  const initialRefreshCompletedRef =
    useRef(false);

  const isMountedRef =
    useRef(true);

  useEffect(() => {
    isMountedRef.current =
      true;

    return () => {
      isMountedRef.current =
        false;

      cartRefreshRequestRef.current +=
        1;
    };
  }, []);

  useEffect(() => {
    cartItemsRef.current =
      cartItems;
  }, [cartItems]);

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

  const refreshCart =
    useCallback(
      async ({
        force = false,
      } = {}) => {
        if (!isStorageReady) {
          return {
            success: false,

            reason:
              "storage_not_ready",

            message:
              "Cart storage is still loading.",
          };
        }

        const currentItems =
          cartItemsRef.current;

        if (
          currentItems.length ===
          0
        ) {
          return {
            success: true,

            reason:
              "empty",

            message:
              "Your cart is empty.",

            summary: {
              requestedLines:
                0,

              availableLines:
                0,

              removedLines:
                0,

              adjustedLines:
                0,

              hasCorrections:
                false,
            },
          };
        }

        const now =
          Date.now();

        if (
          !force &&
          now -
            lastRefreshTimeRef.current <
            CART_REFRESH_INTERVAL_MS
        ) {
          return {
            success: true,

            reason:
              "recently_refreshed",

            message:
              "Cart stock was refreshed recently.",
          };
        }

        const requestId =
          cartRefreshRequestRef.current +
          1;

        cartRefreshRequestRef.current =
          requestId;

        setIsCartRefreshing(
          true
        );

        try {
          const response =
            await fetch(
              "/api/cart/validate",
              {
                method:
                  "POST",

                cache:
                  "no-store",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    items:
                      createCartPayload(
                        currentItems
                      ),
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            requestId !==
            cartRefreshRequestRef.current
          ) {
            return {
              success:
                false,

              reason:
                "superseded",

              message:
                "A newer cart refresh replaced this request.",
            };
          }

          if (
            !response.ok ||
            !data?.success ||
            !data?.snapshot
          ) {
            return {
              success:
                false,

              reason:
                data?.code ||
                "refresh_failed",

              message:
                data?.message ||
                "Your cart could not be refreshed.",
            };
          }

          const snapshotItems =
            Array.isArray(
              data.snapshot
                .items
            )
              ? data.snapshot
                  .items
              : [];

          const snapshotByLine =
            new Map();

          for (
            const snapshotItem
            of snapshotItems
          ) {
            snapshotByLine.set(
              createCartLineKey(
                snapshotItem.id,
                snapshotItem.size
              ),

              snapshotItem
            );
          }

          setCartItems(
            (
              latestItems
            ) => {
              const refreshedItems =
                [];

              const refreshedLines =
                new Set();

              for (
                const currentItem
                of latestItems
              ) {
                const lineKey =
                  createCartLineKey(
                    currentItem.id,
                    currentItem.size
                  );

                const snapshotItem =
                  snapshotByLine.get(
                    lineKey
                  );

                /*
                 * A line added after this
                 * request started has no
                 * snapshot yet. Preserve it.
                 */
                if (
                  !snapshotItem
                ) {
                  refreshedItems.push(
                    currentItem
                  );

                  continue;
                }

                if (
                  snapshotItem
                    .isAvailable !==
                    true
                ) {
                  continue;
                }

                const availableStock =
                  normalizeStock(
                    snapshotItem
                      .availableStock
                  );

                if (
                  availableStock <=
                  0
                ) {
                  continue;
                }

                const quantity =
                  Math.min(
                    normalizeQuantity(
                      currentItem
                        .quantity
                    ),

                    availableStock
                  );

                const trustedPrice =
                  Number(
                    snapshotItem.price
                  );

                const refreshedItem =
                  normalizeCartItem({
                    ...currentItem,

                    id:
                      snapshotItem.id ||
                      currentItem.id,

                    name:
                      snapshotItem.name ||
                      currentItem.name,

                    series:
                      snapshotItem.series ||
                      currentItem.series,

                    color:
                      snapshotItem.color ||
                      currentItem.color,

                    image:
                      snapshotItem.image ||
                      currentItem.image,

                    size:
                      snapshotItem.size ||
                      currentItem.size,

                    price:
                      Number.isFinite(
                        trustedPrice
                      )
                        ? trustedPrice
                        : currentItem.price,

                    stock:
                      availableStock,

                    quantity,
                  });

                const refreshedKey =
                  createCartLineKey(
                    refreshedItem.id,
                    refreshedItem.size
                  );

                /*
                 * Prevent duplicate lines
                 * after canonical size
                 * normalization.
                 */
                if (
                  refreshedLines.has(
                    refreshedKey
                  )
                ) {
                  const existingIndex =
                    refreshedItems.findIndex(
                      (item) =>
                        createCartLineKey(
                          item.id,
                          item.size
                        ) ===
                        refreshedKey
                    );

                  if (
                    existingIndex >=
                    0
                  ) {
                    const existingItem =
                      refreshedItems[
                        existingIndex
                      ];

                    refreshedItems[
                      existingIndex
                    ] =
                      normalizeCartItem({
                        ...existingItem,

                        stock:
                          availableStock,

                        quantity:
                          Math.min(
                            normalizeQuantity(
                              existingItem.quantity
                            ) +
                              quantity,

                            availableStock
                          ),
                      });
                  }

                  continue;
                }

                refreshedLines.add(
                  refreshedKey
                );

                refreshedItems.push(
                  refreshedItem
                );
              }

              return refreshedItems;
            }
          );

          const refreshedAt =
            Date.now();

          lastRefreshTimeRef.current =
            refreshedAt;

          setLastCartRefreshAt(
            refreshedAt
          );

          return {
            success: true,

            reason:
              data.snapshot
                .summary
                ?.hasCorrections
                ? "corrected"
                : "refreshed",

            message:
              createRefreshMessage(
                data.snapshot
                  .summary
              ),

            summary:
              data.snapshot
                .summary,

            items:
              snapshotItems,
          };
        } catch (error) {
          console.error(
            "Unable to refresh OBSIDIAN cart:",
            error
          );

          return {
            success: false,

            reason:
              "network_error",

            message:
              "Your cart could not be refreshed. Please check your connection and try again.",
          };
        } finally {
          if (
            isMountedRef.current &&
            requestId ===
              cartRefreshRequestRef.current
          ) {
            setIsCartRefreshing(
              false
            );
          }
        }
      },
      [isStorageReady]
    );

  useEffect(() => {
    if (
      !isStorageReady ||
      initialRefreshCompletedRef.current
    ) {
      return;
    }

    initialRefreshCompletedRef.current =
      true;

    if (
      cartItemsRef.current
        .length > 0
    ) {
      refreshCart({
        force: true,
      });
    }
  }, [
    isStorageReady,
    refreshCart,
  ]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    function refreshVisibleCart() {
      if (
        document.visibilityState !==
          "visible" ||
        cartItemsRef.current
          .length === 0
      ) {
        return;
      }

      refreshCart();
    }

    window.addEventListener(
      "focus",
      refreshVisibleCart
    );

    document.addEventListener(
      "visibilitychange",
      refreshVisibleCart
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshVisibleCart
      );

      document.removeEventListener(
        "visibilitychange",
        refreshVisibleCart
      );
    };
  }, [
    isStorageReady,
    refreshCart,
  ]);

  function openMiniCart() {
    setIsMiniCartOpen(true);
  }

  function closeMiniCart() {
    setIsMiniCartOpen(false);
  }

  function addToCart(product) {
    const safeProduct =
      normalizeCartItem(
        product
      );

    const stock =
      normalizeStock(
        safeProduct.stock
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

      reason:
        "added",

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
            normalizeQuantity(
              existingItem.quantity
            );

          const requestedQuantity =
            normalizeQuantity(
              safeProduct.quantity
            );

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
          normalizeQuantity(
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

              quantity:
                stock,

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
              item.size ===
                size
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

        reason:
          "removed",

        message:
          "Item removed from cart.",
      };
    }

    let result = {
      success: true,

      reason:
        "updated",

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
              item.size !==
                size
            ) {
              return item;
            }

            const stock =
              normalizeStock(
                item.stock
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

                quantity:
                  stock,
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
    cartRefreshRequestRef.current +=
      1;

    setIsCartRefreshing(
      false
    );

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
        refreshCart,
        cartCount,
        cartTotal,
        isStorageReady,
        isCartRefreshing,
        lastCartRefreshAt,

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
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
