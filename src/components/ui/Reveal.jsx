"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const VALID_VARIANTS = new Set([
  "fade-up",
  "fade-in",
  "slide-left",
  "slide-right",
  "scale",
  "clip-up",
]);

function normalizeNumber(
  value,
  fallback
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  duration = 960,
  y = 28,
  once = true,
  variant = "fade-up",
  threshold = 0.16,
  rootMargin = "0px 0px -8% 0px",
  as: Component = "div",
  style = {},
  ...restProps
}) {
  const ref = useRef(null);

  const [
    motionReady,
    setMotionReady,
  ] = useState(false);

  const [visible, setVisible] =
    useState(true);

  const safeVariant =
    VALID_VARIANTS.has(variant)
      ? variant
      : "fade-up";

  const safeDelay = Math.max(
    0,
    normalizeNumber(delay, 0)
  );

  const safeDuration = Math.max(
    180,
    normalizeNumber(duration, 960)
  );

  const safeDistance = Math.max(
    0,
    normalizeNumber(y, 28)
  );

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const reducedMotionQuery =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    if (
      reducedMotionQuery.matches ||
      !("IntersectionObserver" in window)
    ) {
      return undefined;
    }

    let active = true;
    let observer = null;
    let setupFrameId = null;
    let fallbackFrameId = null;

    function isNearViewport() {
      const rect =
        element.getBoundingClientRect();

      const viewportHeight =
        window.innerHeight ||
        document.documentElement
          .clientHeight ||
        0;

      return (
        rect.bottom > 0 &&
        rect.top <
          viewportHeight * 0.94
      );
    }

    try {
      observer =
        new IntersectionObserver(
          ([entry]) => {
            if (!active) {
              return;
            }

            if (
              entry.isIntersecting
            ) {
              setVisible(true);

              if (once) {
                observer?.unobserve(
                  element
                );
              }

              return;
            }

            if (!once) {
              setVisible(false);
            }
          },
          {
            threshold: Math.min(
              1,
              Math.max(
                0,
                normalizeNumber(
                  threshold,
                  0.16
                )
              )
            ),

            rootMargin,
          }
        );

      observer.observe(element);
    } catch {
      const failOpenFrameId =
        window.requestAnimationFrame(
          () => {
            if (!active) {
              return;
            }

            setMotionReady(false);
            setVisible(true);
          }
        );

      return () => {
        active = false;

        window.cancelAnimationFrame(
          failOpenFrameId
        );
      };
    }

    function checkViewportFallback() {
      if (
        fallbackFrameId !== null
      ) {
        return;
      }

      fallbackFrameId =
        window.requestAnimationFrame(
          () => {
            fallbackFrameId = null;

            if (!active) {
              return;
            }

            if (
              isNearViewport()
            ) {
              setVisible(true);

              if (once) {
                observer?.unobserve(
                  element
                );
              }

              return;
            }

            if (!once) {
              setVisible(false);
            }
          }
        );
    }

    setupFrameId =
      window.requestAnimationFrame(
        () => {
          if (!active) {
            return;
          }

          setVisible(
            isNearViewport()
          );

          setMotionReady(true);

          checkViewportFallback();
        }
      );

    window.addEventListener(
      "scroll",
      checkViewportFallback,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      checkViewportFallback
    );

    return () => {
      active = false;

      observer?.disconnect();

      window.removeEventListener(
        "scroll",
        checkViewportFallback
      );

      window.removeEventListener(
        "resize",
        checkViewportFallback
      );

      if (
        setupFrameId !== null
      ) {
        window.cancelAnimationFrame(
          setupFrameId
        );
      }

      if (
        fallbackFrameId !== null
      ) {
        window.cancelAnimationFrame(
          fallbackFrameId
        );
      }
    };
  }, [
    once,
    rootMargin,
    threshold,
  ]);

  return (
    <Component
      {...restProps}
      ref={ref}
      data-motion-ready={
        motionReady
          ? "true"
          : "false"
      }
      data-visible={
        visible
          ? "true"
          : "false"
      }
      data-motion-variant={
        safeVariant
      }
      className={`obsidian-reveal obsidian-reveal--${safeVariant} ${className}`.trim()}
      style={{
        ...style,

        "--motion-delay":
          `${safeDelay}ms`,

        "--motion-duration":
          `${safeDuration}ms`,

        "--motion-distance":
          `${safeDistance}px`,
      }}
    >
      {children}
    </Component>
  );
}
