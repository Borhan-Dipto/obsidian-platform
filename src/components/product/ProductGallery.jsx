"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import FramedImage from "../ui/FramedImage";

function subscribeNoop() {
  return () => {};
}

const MAIN_SIZES = "(max-width: 1024px) 100vw, 55vw";

/*
 * Product photo gallery.
 * - Phones: swipe between photos (scroll-snap), dots show position.
 * - Desktop: arrows + thumbnails, hover zoom on the active photo.
 * - Tap / click opens a full-screen viewer so the whole print can
 *   be inspected. Photos are never cropped (see FramedImage).
 */
export default function ProductGallery({
  images = [],
  alt = "OBSIDIAN product",
}) {
  const photos = images.filter(Boolean);
  const trackRef = useRef(null);
  const viewerTrackRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [failed, setFailed] = useState(() => new Set());
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  const canPortal = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const count = photos.length;
  const hasMany = count > 1;

  const scrollTrackTo = useCallback((track, index, smooth = true) => {
    if (!track) {
      return;
    }

    track.scrollTo({
      left: index * track.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const goTo = useCallback(
    (index) => {
      const next = (index + count) % count;

      setActiveIndex(next);
      scrollTrackTo(trackRef.current, next);

      if (viewerOpen) {
        scrollTrackTo(viewerTrackRef.current, next);
      }
    },
    [count, scrollTrackTo, viewerOpen]
  );

  function handleTrackScroll(event) {
    const track = event.currentTarget;
    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));

    if (index !== activeIndex && index >= 0 && index < count) {
      setActiveIndex(index);
    }
  }

  function openViewer() {
    lastFocusRef.current = document.activeElement;
    setViewerOpen(true);
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    scrollTrackTo(trackRef.current, activeIndex, false);
    lastFocusRef.current?.focus?.();
  }, [activeIndex, scrollTrackTo]);

  useEffect(() => {
    if (!viewerOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      scrollTrackTo(viewerTrackRef.current, activeIndex, false);
      closeButtonRef.current?.focus();
    });

    function handleKey(event) {
      if (event.key === "Escape") {
        closeViewer();
      } else if (event.key === "ArrowRight" && hasMany) {
        goTo(activeIndex + 1);
      } else if (event.key === "ArrowLeft" && hasMany) {
        goTo(activeIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
    // activeIndex intentionally read fresh on each key press via goTo.
  }, [viewerOpen, activeIndex, closeViewer, goTo, hasMany, scrollTrackTo]);

  function handleMouseMove(event) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setZoom({
      active: true,
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }

  function markFailed(index) {
    setFailed((current) => new Set(current).add(index));
  }

  if (count === 0) {
    return (
      <div className="obsidian-product-media-shell relative flex aspect-[4/5] items-center justify-center border border-black/10 bg-[#eee7dd]">
        <p className="text-[11px] uppercase tracking-[0.32em] text-neutral-500">
          Image unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="obsidian-product-media-shell group relative aspect-[4/5] overflow-hidden border border-black/10 bg-[#eee7dd]">
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carousel"
          aria-label={`${alt} photos`}
        >
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={openViewer}
              onMouseMove={index === activeIndex ? handleMouseMove : undefined}
              onMouseLeave={() => setZoom({ active: false, x: 50, y: 50 })}
              aria-label={`Enlarge photo ${index + 1} of ${count}`}
              className="relative h-full w-full shrink-0 snap-center snap-always cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/50"
            >
              {failed.has(index) ? (
                <span className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.32em] text-neutral-500">
                  Image unavailable
                </span>
              ) : (
                <FramedImage
                  src={src}
                  alt={index === 0 ? alt : `${alt} — photo ${index + 1}`}
                  sizes={MAIN_SIZES}
                  preload={index === 0}
                  onError={() => markFailed(index)}
                  imageClassName="obsidian-product-media-image transition-transform duration-500 ease-out motion-reduce:transition-none"
                  style={
                    zoom.active && index === activeIndex
                      ? {
                          transform: "scale(1.8)",
                          transformOrigin: `${zoom.x}% ${zoom.y}%`,
                        }
                      : undefined
                  }
                />
              )}
            </button>
          ))}
        </div>

        {hasMany ? (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#f1ece4]/85 text-lg text-[#0b0b0b] shadow-md backdrop-blur transition hover:bg-[#f1ece4] lg:flex"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#f1ece4]/85 text-lg text-[#0b0b0b] shadow-md backdrop-blur transition hover:bg-[#f1ece4] lg:flex"
            >
              →
            </button>

            <div
              className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
              aria-hidden="true"
            >
              {photos.map((src, index) => (
                <span
                  key={src}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "w-5 bg-[#f1ece4]"
                      : "w-1.5 bg-[#f1ece4]/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}

        <span className="pointer-events-none absolute right-3 top-3 z-10 border border-[#f1ece4]/15 bg-[#0b0b0b]/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f1ece4] backdrop-blur-md">
          {hasMany ? `${activeIndex + 1} / ${count}` : null}
          <span className={hasMany ? "ml-2 hidden [@media(hover:hover)]:inline" : "hidden [@media(hover:hover)]:inline"}>
            Click to enlarge
          </span>
          <span className={hasMany ? "ml-2 [@media(hover:hover)]:hidden" : "[@media(hover:hover)]:hidden"}>
            Tap to enlarge
          </span>
        </span>
      </div>

      {hasMany ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`relative aspect-[4/5] overflow-hidden border bg-[#eee7dd] transition ${
                index === activeIndex
                  ? "border-[#0b0b0b]"
                  : "border-black/10 opacity-70 hover:opacity-100"
              }`}
            >
              <FramedImage src={src} alt="" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Portalled to <body> so the animated column can't trap it. */}
      {viewerOpen && canPortal
        ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — full view`}
          className="fixed inset-0 z-[200] flex flex-col bg-[#0b0b0b]/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-5 py-4 text-[#f1ece4]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#f1ece4]/70">
              {activeIndex + 1} / {count}
            </p>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeViewer}
              aria-label="Close full view"
              className="flex h-11 w-11 items-center justify-center text-2xl transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1ece4]/60"
            >
              ×
            </button>
          </div>

          <div
            ref={viewerTrackRef}
            onScroll={handleTrackScroll}
            className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((src, index) => (
              <div
                key={src}
                className="relative h-full w-full shrink-0 snap-center snap-always"
              >
                <Image
                  src={src}
                  alt={index === 0 ? alt : `${alt} — photo ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {hasMany ? (
            <div className="flex items-center justify-center gap-6 px-5 py-5 text-[#f1ece4]">
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous photo"
                className="flex h-11 w-11 items-center justify-center border border-[#f1ece4]/25 text-lg transition hover:bg-[#f1ece4]/10"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next photo"
                className="flex h-11 w-11 items-center justify-center border border-[#f1ece4]/25 text-lg transition hover:bg-[#f1ece4]/10"
              >
                →
              </button>
            </div>
          ) : null}
        </div>,
            document.body
          )
        : null}
    </div>
  );
}
