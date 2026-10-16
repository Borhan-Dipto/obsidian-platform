"use client";

import { useCart } from "../../context/CartContext";

export default function WishlistButton({ product, compact = false }) {
  const { toggleWishlist, isInWishlist } = useCart();
  const saved = isInWishlist(product.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(product);
      }}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      className={
        compact
          ? `obsidian-wishlist-toggle absolute right-2 top-2 z-20 flex h-10 w-10 sm:right-4 sm:top-4 sm:h-11 sm:w-11 items-center justify-center rounded-full border backdrop-blur-md ${
              saved
                ? "obsidian-wishlist-toggle--saved border-[#f1ece4] bg-[#0b0b0b] text-[#f1ece4]"
                : "border-black/10 bg-[#f1ece4]/85 text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            }`
          : `obsidian-wishlist-toggle w-full border px-8 py-4 text-xs uppercase tracking-[0.28em] ${
              saved
                ? "obsidian-wishlist-toggle--saved border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4]"
                : "border-black/20 text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            }`
      }
    >
      {compact ? (saved ? "♥" : "♡") : saved ? "Saved" : "Wishlist"}
    </button>
  );
}
