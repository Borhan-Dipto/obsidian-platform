"use client";

import { useState } from "react";

export default function ProductImageZoom({ src, alt }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative aspect-[4/5] overflow-hidden border border-black/10 bg-[#eee7dd]"
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.75]"
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      />

      <div className="pointer-events-none absolute bottom-5 left-5 bg-[#0b0b0b]/65 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f1ece4] opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100">
        Hover To Zoom
      </div>
    </div>
  );
}