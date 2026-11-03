"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/admin", "/success"];

/*
 * Always-visible "chat on WhatsApp" button. Many customers in
 * Bangladesh ask a question before ordering; on a product page the
 * message already names the product so support can answer quickly.
 */
export default function FloatingWhatsApp({
  whatsappNumber = "",
  storeName = "OBSIDIAN",
}) {
  const pathname = usePathname() || "/";
  const digits = String(whatsappNumber || "").replace(/\D/g, "").slice(0, 15);

  if (
    digits.length < 8 ||
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  function handleClick(event) {
    const isProduct = pathname.startsWith("/product/");
    const message = isProduct
      ? `Hello ${storeName}, I have a question about this product: ${window.location.href}`
      : `Hello ${storeName}, I would like to know more about your products.`;

    event.currentTarget.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  return (
    <a
      href={`https://wa.me/${digits}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${storeName} on WhatsApp`}
      className="obsidian-whatsapp-fab fixed bottom-4 right-3 z-[70] flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-[#f1ece4]/15 bg-[#0b0b0b] text-[#f1ece4] xl:w-auto xl:px-4 shadow-[0_14px_34px_rgba(11,11,11,0.28)] transition-[transform,bottom] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b1844a] focus-visible:ring-offset-2 sm:bottom-6 sm:right-5"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.4A8.4 8.4 0 1 1 20.5 11.6Z" />
        <path d="M8.8 9.2c.3 2.6 3.2 5.4 6 5.9" />
      </svg>

      <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] xl:inline">
        WhatsApp
      </span>
    </a>
  );
}
