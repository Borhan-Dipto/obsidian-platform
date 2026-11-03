"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import {
  buildAddToCartParams,
  trackMetaEvent,
} from "../../lib/metaPixel";
import {
  buildGa4ItemEventParams,
  trackGa4Event,
} from "../../lib/googleAnalytics";

import {
  OBSIDIAN_SIZE_ORDER,
  getEnabledProductSizes,
  getProductSizeStock,
  getProductTotalStock,
} from "../../lib/productInventory";

import WishlistButton from "./WishlistButton";
import { LOW_STOCK_THRESHOLD } from "../../lib/productImages";

function subscribeNoop() {
  return () => {};
}

export default function ProductActions({
  product,
  productName,
  productImage,
  whatsappNumber = "",
  modelInfo = "",
}) {
  const primaryButtonRef = useRef(null);
  const sizeSectionRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [highlightSizes, setHighlightSizes] = useState(false);
  /* true only in the browser (portal target exists), false on the server */
  const canPortal = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const {
    addToCart,
    openMiniCart,
  } = useCart();

  const { showToast } =
    useToast();

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const price =
    Number(product?.price) || 0;

  const enabledSizes =
    getEnabledProductSizes(
      product
    );

  const enabledSizeSet =
    new Set(enabledSizes);

  const totalStock =
    getProductTotalStock(
      product
    );

  const selectedStock =
    selectedSize
      ? getProductSizeStock(
          product,
          selectedSize
        )
      : 0;

  const isOutOfStock =
    totalStock <= 0;

  /* Offered sizes that are currently sold out (for "notify me"). */
  const soldOutSizes =
    OBSIDIAN_SIZE_ORDER.filter(
      (size) =>
        enabledSizeSet.has(size) &&
        getProductSizeStock(product, size) <= 0
    );

  const whatsappDigits = String(
    whatsappNumber || ""
  )
    .replace(/\D/g, "")
    .slice(0, 15);

  /*
   * Phones: when the main Add to Cart button is off screen, a slim
   * bar stays at the bottom so buying never needs scrolling back.
   */
  useEffect(() => {
    const target = primaryButtonRef.current;

    if (!target || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (showStickyBar) {
      root.dataset.stickyCta = "true";
    } else {
      delete root.dataset.stickyCta;
    }

    return () => {
      delete root.dataset.stickyCta;
    };
  }, [showStickyBar]);

  function promptForSize() {
    sizeSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightSizes(true);
    window.setTimeout(() => setHighlightSizes(false), 1600);
  }

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  }

  function increaseQuantity() {
    if (
      !selectedSize ||
      selectedStock <= 0
    ) {
      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          selectedStock,
          current + 1
        )
    );
  }

  function selectSize(size) {
    const sizeStock =
      getProductSizeStock(
        product,
        size
      );

    if (
      !enabledSizeSet.has(
        size
      ) ||
      sizeStock <= 0
    ) {
      return;
    }

    setSelectedSize(size);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (isOutOfStock) {
      showToast({
        type: "error",
        title: "Out Of Stock",
        message:
          "This piece is currently unavailable.",
      });

      return;
    }

    if (!selectedSize) {
      promptForSize();

      showToast({
        type: "error",
        title: "Select Size",
        message:
          "Please select an available size before adding this piece to cart.",
      });

      return;
    }

    if (selectedStock <= 0) {
      showToast({
        type: "error",
        title: "Size Unavailable",
        message:
          `Size ${selectedSize} is currently out of stock.`,
      });

      return;
    }

    const result = addToCart({
      id: product.id,
      name: product.name,
      series: product.series,
      color: product.color,
      price,
      image: product.image,
      stock: selectedStock,
      size: selectedSize,
      quantity,
    });

    if (!result?.success) {
      showToast({
        type: "error",

        title:
          result?.reason ===
          "out_of_stock"
            ? "Out Of Stock"
            : "Stock Limit",

        message:
          result?.message ||
          "Requested quantity is not available.",

        actionLabel:
          "View Cart",

        actionHref:
          "/cart",
      });

      return;
    }

    trackMetaEvent(
      "AddToCart",
      buildAddToCartParams({
        id: product.id,
        name: product.name,
        price,
        quantity,
      })
    );

    trackGa4Event(
      "add_to_cart",
      buildGa4ItemEventParams([
        {
          id: product.id,
          name: product.name,
          series: product.series,
          size: selectedSize,
          price,
          quantity,
        },
      ])
    );

    showToast({
      type: "success",
      title: "Added To Cart",

      message:
        `${product.name} / Size ${selectedSize} × ${quantity}`,
    });

    openMiniCart();
  }

  return (
    <div className="obsidian-product-actions mt-10 space-y-7">
      <section
        ref={sizeSectionRef}
        aria-labelledby="product-size-selector-title"
        className={`obsidian-product-size-selector border-y py-6 transition-colors duration-500 ${
          highlightSizes
            ? "border-[#b1844a] bg-[#b1844a]/[0.07]"
            : "border-black/10"
        }`}
      >
        <div className="mb-4 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Size
            </p>

            <h2
              id="product-size-selector-title"
              className="mt-2 font-heading text-2xl font-light"
            >
              Select Your Size
            </h2>
          </div>

          <p
            aria-live="polite"
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500"
          >
            {selectedSize
              ? `Selected: ${selectedSize}`
              : "Select one"}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Choose product size"
          className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6"
        >
          {OBSIDIAN_SIZE_ORDER.map(
            (size) => {
              const sizeStock =
                getProductSizeStock(
                  product,
                  size
                );

              const isEnabled =
                enabledSizeSet.has(
                  size
                );

              const isAvailable =
                isEnabled &&
                sizeStock > 0;

              const isSelected =
                selectedSize ===
                size;

              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={
                    isSelected
                  }
                  aria-label={
                    !isAvailable
                      ? `${size}, unavailable`
                      : sizeStock <= LOW_STOCK_THRESHOLD
                        ? `${size}, only ${sizeStock} left`
                        : size
                  }
                  disabled={
                    !isAvailable
                  }
                  onClick={() =>
                    selectSize(size)
                  }
                  className={`obsidian-product-size-button flex min-h-12 items-center justify-center border px-2 text-xs font-semibold uppercase tracking-[0.16em] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-3 focus-visible:ring-offset-[#f1ece4] disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/[0.025] disabled:text-neutral-400 disabled:opacity-55 ${
                    isSelected
                      ? "obsidian-product-size-button--selected border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4]"
                      : "border-black/20 text-[#0b0b0b] hover:border-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                  }`}
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span
                      className={
                        isEnabled && !isAvailable
                          ? "line-through"
                          : ""
                      }
                    >
                      {size}
                    </span>

                    {isAvailable &&
                    sizeStock <= LOW_STOCK_THRESHOLD ? (
                      <span className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-[#9b713e] [.obsidian-product-size-button--selected_&]:text-[#e8c99c]">
                        {sizeStock} left
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <p className="mt-4 text-[11px] leading-5 text-neutral-500">
          Sold-out sizes can’t be selected. Not sure? See the size guide below.
        </p>

        {modelInfo ? (
          <p className="mt-3 text-xs text-neutral-700">
            <span className="text-neutral-500">Fit reference: </span>
            {modelInfo}
          </p>
        ) : null}

        {soldOutSizes.length > 0 && whatsappDigits ? (
          <a
            href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
              `Hello, please let me know when ${productName || product?.name} is back in size ${soldOutSizes.join(" / ")}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 border-b border-black/30 text-xs text-[#0b0b0b] transition hover:border-black"
          >
            Size {soldOutSizes.join(", ")} sold out — notify me on WhatsApp →
          </a>
        ) : null}
      </section>

      {selectedSize &&
      selectedStock > 0 &&
      selectedStock <= LOW_STOCK_THRESHOLD ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-[#b1844a] motion-reduce:animate-none"
          />

          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b713e]">
            Only {selectedStock} left in size{" "}
            {selectedSize}
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Quantity
        </p>

        <div className="obsidian-product-quantity-control flex w-fit items-center border border-black/20 text-[#0b0b0b]">
          <button
            type="button"
            onClick={
              decreaseQuantity
            }
            disabled={
              quantity <= 1
            }
            aria-label="Decrease quantity"
            className="obsidian-product-quantity-button flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
          >
            −
          </button>

          <span
            className="min-w-14 text-center text-sm font-medium"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={
              increaseQuantity
            }
            disabled={
              !selectedSize ||
              selectedStock <= 0 ||
              quantity >=
                selectedStock
            }
            aria-label="Increase quantity"
            className="obsidian-product-quantity-button flex h-12 w-12 items-center justify-center text-xl transition hover:bg-[#0b0b0b] hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#0b0b0b]"
          >
            +
          </button>
        </div>

        {selectedSize &&
        selectedStock > 0 &&
        quantity >=
          selectedStock ? (
          <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Maximum available quantity selected
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.42fr)]">
        <button
          ref={primaryButtonRef}
          type="button"
          onClick={
            handleAddToCart
          }
          disabled={
            isOutOfStock
          }
          className="obsidian-product-primary-action group relative min-h-14 w-full overflow-hidden bg-[#0b0b0b] px-6 py-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#f1ece4] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span
            aria-hidden="true"
            className="obsidian-product-primary-action-fill absolute inset-0 translate-y-full bg-[#272727] transition-transform duration-300 group-hover:translate-y-0 motion-reduce:transition-none"
          />

          <span className="relative">
            {isOutOfStock
              ? "Out Of Stock"
              : "Add To Cart"}
          </span>
        </button>

        <WishlistButton
          product={product}
        />
      </div>

      {/*
        Rendered into <body>: the product column animates with
        transforms, which would otherwise pin this "fixed" bar to the
        column instead of the screen.
      */}
      {canPortal
        ? createPortal(
      <div
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-[80] border-t border-black/10 bg-[#f1ece4]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(11,11,11,0.08)] backdrop-blur-xl transition-transform duration-300 lg:hidden ${
          showStickyBar
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {productImage ? (
            <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-[#eee7dd]">
              <Image
                src={productImage}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              {productName || product?.name}
            </p>

            <p className="text-xs text-neutral-600">
              ৳ {price.toLocaleString("en-BD")}
              {selectedSize ? ` · Size ${selectedSize}` : ""}
            </p>
          </div>

          <button
            type="button"
            tabIndex={showStickyBar ? 0 : -1}
            onClick={selectedSize || isOutOfStock ? handleAddToCart : promptForSize}
            disabled={isOutOfStock}
            className="min-h-12 shrink-0 bg-[#0b0b0b] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f1ece4] transition active:opacity-80 disabled:opacity-40"
          >
            {isOutOfStock
              ? "Out of stock"
              : selectedSize
                ? "Add to cart"
                : "Select size"}
          </button>
        </div>
      </div>,
            document.body
          )
        : null}
    </div>
  );
}
