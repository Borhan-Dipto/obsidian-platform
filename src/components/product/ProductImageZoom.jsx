"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImageZoom({
  src,
  alt = "Obsidian product",
}) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [hasImageError, setHasImageError] = useState(false);

  const hasValidImage =
    typeof src === "string" && src.trim().length > 0 && !hasImageError;

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = Math.min(
      100,
      Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)
    );

    const y = Math.min(
      100,
      Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)
    );

    setPosition({ x, y });
  }

  function handleMouseLeave() {
    setPosition({ x: 50, y: 50 });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative aspect-[4/5] overflow-hidden border border-black/10 bg-[#eee7dd]"
    >
      {hasValidImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          onError={() => setHasImageError(true)}
          className="object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.75]"
          style={{
            transformOrigin: `${position.x}% ${position.y}%`,
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
            Image Unavailable
          </p>
        </div>
      )}

      {hasValidImage && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          <div className="pointer-events-none absolute bottom-5 left-5 translate-y-2 border border-[#f1ece4]/15 bg-[#0b0b0b]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4] opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Hover To Zoom
          </div>
        </>
      )}
    </div>
  );
}