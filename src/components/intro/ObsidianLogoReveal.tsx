"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const OBSIDIAN_LOGO_REVEAL_EVENT =
  "obsidian:logo-reveal";

const SESSION_STORAGE_KEY =
  "obsidian-logo-reveal-seen-v2";

const REVEAL_DURATION_MS = 2300;
const EXIT_DURATION_MS = 650;

type RevealPhase =
  | "checking"
  | "active"
  | "leaving"
  | "hidden";

function hasSeenReveal() {
  try {
    return (
      window.sessionStorage.getItem(
        SESSION_STORAGE_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
}

function markRevealAsSeen() {
  try {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      "true"
    );
  } catch {
    /*
     * Continue normally when browser storage
     * is blocked or unavailable.
     */
  }
}

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

export default function ObsidianLogoReveal() {
  const [phase, setPhase] =
    useState<RevealPhase>("checking");

  const [animationRun, setAnimationRun] =
    useState(0);

  const phaseRef =
    useRef<RevealPhase>("checking");

  const revealTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const exitTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const updatePhase = useCallback(
    (nextPhase: RevealPhase) => {
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
    },
    []
  );

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const hideImmediately =
    useCallback(() => {
      clearTimers();
      markRevealAsSeen();
      updatePhase("hidden");
    }, [
      clearTimers,
      updatePhase,
    ]);

  const beginExit = useCallback(() => {
    const currentPhase =
      phaseRef.current;

    if (
      currentPhase === "checking" ||
      currentPhase === "leaving" ||
      currentPhase === "hidden"
    ) {
      return;
    }

    clearTimers();
    markRevealAsSeen();
    updatePhase("leaving");

    exitTimerRef.current =
      setTimeout(() => {
        updatePhase("hidden");
        exitTimerRef.current = null;
      }, EXIT_DURATION_MS);
  }, [
    clearTimers,
    updatePhase,
  ]);

  const startReveal = useCallback(
    (forceReplay = false) => {
      clearTimers();

      if (prefersReducedMotion()) {
        hideImmediately();
        return;
      }

      if (
        !forceReplay &&
        hasSeenReveal()
      ) {
        updatePhase("hidden");
        return;
      }

      setAnimationRun(
        (currentRun) => currentRun + 1
      );

      updatePhase("active");

      revealTimerRef.current =
        setTimeout(
          beginExit,
          REVEAL_DURATION_MS
        );
    },
    [
      beginExit,
      clearTimers,
      hideImmediately,
      updatePhase,
    ]
  );

  useEffect(() => {
    const motionQuery =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const initialTimer =
      window.setTimeout(() => {
        startReveal();
      }, 0);

    function handleMotionChange() {
      if (motionQuery.matches) {
        hideImmediately();
      }
    }

    motionQuery.addEventListener(
      "change",
      handleMotionChange
    );

    return () => {
      window.clearTimeout(initialTimer);

      motionQuery.removeEventListener(
        "change",
        handleMotionChange
      );
    };
  }, [
    hideImmediately,
    startReveal,
  ]);

  useEffect(() => {
    function handleReplayEvent() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      startReveal(true);
    }

    window.addEventListener(
      OBSIDIAN_LOGO_REVEAL_EVENT,
      handleReplayEvent
    );

    return () => {
      window.removeEventListener(
        OBSIDIAN_LOGO_REVEAL_EVENT,
        handleReplayEvent
      );
    };
  }, [startReveal]);

  useEffect(() => {
    function handleHomepageLogoClick(
      event: MouseEvent
    ) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const brandLink = target.closest(
        "a.obsidian-brand"
      );

      if (
        !(brandLink instanceof HTMLAnchorElement)
      ) {
        return;
      }

      if (
        brandLink.getAttribute("href") !== "/"
      ) {
        return;
      }

      event.preventDefault();

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      startReveal(true);
    }

    document.addEventListener(
      "click",
      handleHomepageLogoClick,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleHomepageLogoClick,
        true
      );
    };
  }, [startReveal]);

  useEffect(() => {
    if (
      phase === "checking" ||
      phase === "hidden"
    ) {
      return;
    }

    const html =
      document.documentElement;

    const body =
      document.body;

    const previousHtmlOverflow =
      html.style.overflow;

    const previousBodyOverflow =
      body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow =
        previousHtmlOverflow;

      body.style.overflow =
        previousBodyOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (
      phase === "checking" ||
      phase === "hidden"
    ) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        beginExit();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    beginExit,
    phase,
  ]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  if (phase === "hidden") {
    return null;
  }

  const revealIsVisible =
    phase === "active" ||
    phase === "leaving";

  return (
    <section
      key={animationRun}
      role="dialog"
      aria-modal="true"
      aria-label="OBSIDIAN brand introduction"
      className={[
        "obsidian-cinematic-reveal",
        phase === "checking"
          ? "obsidian-cinematic-reveal--checking"
          : "",
        revealIsVisible
          ? "obsidian-cinematic-reveal--active"
          : "",
        phase === "leaving"
          ? "obsidian-cinematic-reveal--leaving"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="obsidian-cinematic-reveal__atmosphere"
        aria-hidden="true"
      >
        <span className="obsidian-cinematic-reveal__fog obsidian-cinematic-reveal__fog--one" />

        <span className="obsidian-cinematic-reveal__fog obsidian-cinematic-reveal__fog--two" />

        <span className="obsidian-cinematic-reveal__beam" />

        <span className="obsidian-cinematic-reveal__grain" />

        <span className="obsidian-cinematic-reveal__shard obsidian-cinematic-reveal__shard--one" />

        <span className="obsidian-cinematic-reveal__shard obsidian-cinematic-reveal__shard--two" />

        <span className="obsidian-cinematic-reveal__shard obsidian-cinematic-reveal__shard--three" />

        <span className="obsidian-cinematic-reveal__shard obsidian-cinematic-reveal__shard--four" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--one" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--two" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--three" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--four" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--five" />

        <span className="obsidian-cinematic-reveal__particle obsidian-cinematic-reveal__particle--six" />
      </div>

      <div
        className="obsidian-cinematic-reveal__content"
        aria-hidden="true"
      >
        <p className="obsidian-cinematic-reveal__eyebrow">
          Premium Fashion Brand
        </p>

        <div className="obsidian-cinematic-reveal__symbol-stage">
          <span className="obsidian-cinematic-reveal__symbol-halo" />

          <div className="obsidian-cinematic-reveal__symbol">
            <Image
              src="/brand/reveal/obsidian-symbol.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 767px) 56vw, 250px"
              className="obsidian-cinematic-reveal__image"
            />

            <span className="obsidian-cinematic-reveal__symbol-light" />
          </div>

          <span className="obsidian-cinematic-reveal__reflection" />
        </div>

        <div className="obsidian-cinematic-reveal__wordmark">
          <Image
            src="/brand/reveal/obsidian-wordmark.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 82vw, 540px"
            className="obsidian-cinematic-reveal__image"
          />
        </div>

        <div className="obsidian-cinematic-reveal__divider">
          <span />
          <i />
          <span />
        </div>

      </div>

      <span className="sr-only">
        Press Escape to skip the introduction.
      </span>

      <style jsx>{`
        .obsidian-cinematic-reveal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          min-height: 100svh;
          place-items: center;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(
              ellipse at 50% 44%,
              rgba(36, 37, 38, 0.92) 0%,
              rgba(13, 14, 15, 0.98) 35%,
              #050506 68%,
              #010101 100%
            );
          color: #ebe4d8;
          cursor: default;
          touch-action: none;
        }

        .obsidian-cinematic-reveal::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(
              ellipse at 50% 110%,
              rgba(119, 126, 130, 0.13),
              transparent 52%
            ),
            linear-gradient(
              115deg,
              rgba(255, 255, 255, 0.012),
              transparent 33%,
              rgba(255, 255, 255, 0.02) 51%,
              transparent 70%
            );
        }

        .obsidian-cinematic-reveal::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 20;
          pointer-events: none;
          box-shadow:
            inset 0 0 140px
              rgba(0, 0, 0, 0.88),
            inset 0 0 38px
              rgba(0, 0, 0, 0.72);
        }

        .obsidian-cinematic-reveal__atmosphere {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .obsidian-cinematic-reveal__grain {
          position: absolute;
          inset: -50%;
          opacity: 0.09;
          background-image:
            repeating-radial-gradient(
              circle at 0 0,
              transparent 0,
              rgba(255, 255, 255, 0.22)
                1px,
              transparent 2px,
              transparent 5px
            );
          background-size: 7px 7px;
          transform: rotate(9deg);
          animation:
            obsidianGrainShift
            650ms
            steps(2)
            infinite;
        }

        .obsidian-cinematic-reveal__fog {
          position: absolute;
          border-radius: 999px;
          opacity: 0;
          filter: blur(65px);
          will-change: transform, opacity;
        }

        .obsidian-cinematic-reveal__fog--one {
          top: 10%;
          left: -16%;
          width: 58vw;
          height: 34vw;
          background:
            rgba(116, 124, 127, 0.13);
        }

        .obsidian-cinematic-reveal__fog--two {
          right: -18%;
          bottom: -8%;
          width: 62vw;
          height: 38vw;
          background:
            rgba(94, 105, 109, 0.11);
        }

        .obsidian-cinematic-reveal__beam {
          position: absolute;
          top: -42%;
          left: -26%;
          width: 46%;
          height: 190%;
          opacity: 0;
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(221, 231, 233, 0.015)
                18%,
              rgba(237, 244, 244, 0.17)
                49%,
              rgba(167, 192, 197, 0.04)
                66%,
              transparent 100%
            );
          filter: blur(24px);
          transform:
            rotate(16deg)
            translate3d(-35%, 0, 0);
          mix-blend-mode: screen;
          will-change: transform, opacity;
        }

        .obsidian-cinematic-reveal__shard {
          position: absolute;
          width: 20px;
          height: 34px;
          opacity: 0;
          background:
            linear-gradient(
              145deg,
              rgba(100, 107, 110, 0.82),
              rgba(11, 12, 13, 0.96) 48%,
              #020202 100%
            );
          clip-path:
            polygon(
              50% 0,
              100% 31%,
              72% 100%,
              8% 75%,
              0 22%
            );
          box-shadow:
            inset 1px 0
              rgba(255, 255, 255, 0.12);
          filter: blur(0.3px);
        }

        .obsidian-cinematic-reveal__shard--one {
          top: 20%;
          left: 17%;
          transform:
            rotate(34deg)
            scale(0.65);
        }

        .obsidian-cinematic-reveal__shard--two {
          top: 31%;
          right: 16%;
          transform:
            rotate(-27deg)
            scale(0.42);
        }

        .obsidian-cinematic-reveal__shard--three {
          bottom: 19%;
          left: 24%;
          transform:
            rotate(71deg)
            scale(0.38);
        }

        .obsidian-cinematic-reveal__shard--four {
          right: 23%;
          bottom: 22%;
          transform:
            rotate(-54deg)
            scale(0.56);
        }

        .obsidian-cinematic-reveal__particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 999px;
          opacity: 0;
          background: rgba(
            228,
            234,
            233,
            0.72
          );
          box-shadow:
            0 0 8px
              rgba(209, 224, 224, 0.35);
        }

        .obsidian-cinematic-reveal__particle--one {
          top: 24%;
          left: 28%;
        }

        .obsidian-cinematic-reveal__particle--two {
          top: 37%;
          right: 25%;
        }

        .obsidian-cinematic-reveal__particle--three {
          right: 34%;
          bottom: 24%;
        }

        .obsidian-cinematic-reveal__particle--four {
          bottom: 31%;
          left: 31%;
        }

        .obsidian-cinematic-reveal__particle--five {
          top: 17%;
          right: 41%;
        }

        .obsidian-cinematic-reveal__particle--six {
          bottom: 17%;
          left: 43%;
        }

        .obsidian-cinematic-reveal__content {
          position: relative;
          z-index: 5;
          display: flex;
          width: min(88vw, 680px);
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform:
            translate3d(0, -1.5svh, 0);
          perspective: 1000px;
        }

        .obsidian-cinematic-reveal__eyebrow {
          margin: 0 0
            clamp(18px, 2.7vh, 28px);
          opacity: 0;
          transform:
            translate3d(0, 10px, 0);
          color: rgba(
            225,
            213,
            191,
            0.84
          );
          font-size:
            clamp(8px, 1vw, 10px);
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.42em;
          text-align: center;
          text-transform: uppercase;
          text-shadow:
            0 0 24px
              rgba(207, 190, 157, 0.18);
        }

        .obsidian-cinematic-reveal__symbol-stage {
          position: relative;
          display: grid;
          width:
            clamp(168px, 22vw, 252px);
          aspect-ratio: 1;
          place-items: center;
        }

        .obsidian-cinematic-reveal__symbol-halo {
          position: absolute;
          inset: -20%;
          border-radius: 999px;
          opacity: 0;
          background:
            radial-gradient(
              circle,
              rgba(191, 207, 208, 0.17)
                0%,
              rgba(99, 113, 116, 0.06)
                42%,
              transparent 70%
            );
          filter: blur(16px);
          transform: scale(0.7);
        }

        .obsidian-cinematic-reveal__symbol {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          opacity: 0;
          filter:
            blur(15px)
            brightness(0.35)
            contrast(1.25);
          transform:
            translate3d(0, 18px, -70px)
            rotateX(7deg)
            scale(0.76);
          clip-path:
            inset(
              42% 42% 42% 42%
              round 999px
            );
          will-change:
            transform,
            opacity,
            filter,
            clip-path;
        }

        .obsidian-cinematic-reveal__image {
          object-fit: contain;
          object-position: center;
          user-select: none;
          pointer-events: none;
          -webkit-user-drag: none;
          filter:
            drop-shadow(
              0 24px 40px
                rgba(0, 0, 0, 0.78)
            );
        }

        .obsidian-cinematic-reveal__symbol-light {
          position: absolute;
          top: -30%;
          left: -75%;
          width: 38%;
          height: 165%;
          opacity: 0;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.72),
              rgba(168, 209, 218, 0.24),
              transparent
            );
          filter: blur(5px);
          transform: rotate(16deg);
          mix-blend-mode: screen;
        }

        .obsidian-cinematic-reveal__reflection {
          position: absolute;
          left: 50%;
          bottom: -12%;
          width: 88%;
          height: 20%;
          border-radius: 999px;
          opacity: 0;
          background:
            radial-gradient(
              ellipse,
              rgba(203, 217, 218, 0.17),
              rgba(82, 92, 94, 0.04) 47%,
              transparent 72%
            );
          filter: blur(13px);
          transform:
            translateX(-50%)
            scaleX(0.55);
        }

        .obsidian-cinematic-reveal__wordmark {
          position: relative;
          width:
            clamp(290px, 49vw, 540px);
          aspect-ratio: 1600 / 429;
          margin-top:
            clamp(28px, 4vh, 42px);
          opacity: 0;
          filter: blur(8px);
          transform:
            translate3d(0, 18px, 0)
            scale(0.96);
          clip-path:
            inset(0 100% 0 0);
          will-change:
            transform,
            opacity,
            filter,
            clip-path;
        }

        .obsidian-cinematic-reveal__divider {
          display: grid;
          width:
            clamp(180px, 31vw, 330px);
          grid-template-columns:
            1fr auto 1fr;
          align-items: center;
          gap: 11px;
          margin-top:
            clamp(13px, 2vh, 19px);
          opacity: 0;
          transform: scaleX(0.72);
        }

        .obsidian-cinematic-reveal__divider
          span {
          display: block;
          height: 1px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(207, 194, 169, 0.48)
            );
        }

        .obsidian-cinematic-reveal__divider
          span:last-child {
          transform: scaleX(-1);
        }

        .obsidian-cinematic-reveal__divider
          i {
          display: block;
          width: 4px;
          height: 4px;
          border: 1px solid
            rgba(223, 210, 184, 0.7);
          transform: rotate(45deg);
        }


        .obsidian-cinematic-reveal--checking
          .obsidian-cinematic-reveal__content,
        .obsidian-cinematic-reveal--checking
          .obsidian-cinematic-reveal__atmosphere {
          visibility: hidden;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__fog--one {
          animation:
            obsidianFogOne
            2500ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__fog--two {
          animation:
            obsidianFogTwo
            2500ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__beam {
          animation:
            obsidianBeamSweep
            1550ms
            270ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__eyebrow {
          animation:
            obsidianEyebrowReveal
            600ms
            190ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__symbol-halo {
          animation:
            obsidianHaloReveal
            1150ms
            260ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__symbol {
          animation:
            obsidianSymbolFormation
            1050ms
            260ms
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__symbol-light {
          animation:
            obsidianMaterialSweep
            720ms
            890ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__reflection {
          animation:
            obsidianReflectionReveal
            900ms
            690ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__wordmark {
          animation:
            obsidianWordmarkReveal
            780ms
            1110ms
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__divider {
          animation:
            obsidianDividerReveal
            620ms
            1510ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }


        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__shard {
          animation:
            obsidianShardFloat
            2100ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--active
          .obsidian-cinematic-reveal__particle {
          animation:
            obsidianParticleFloat
            1900ms
            260ms
            ease-out
            both;
        }

        .obsidian-cinematic-reveal--leaving {
          pointer-events: none;
          animation:
            obsidianSceneExit
            ${EXIT_DURATION_MS}ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        .obsidian-cinematic-reveal--leaving
          .obsidian-cinematic-reveal__content {
          animation:
            obsidianContentExit
            ${EXIT_DURATION_MS}ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        @keyframes obsidianSymbolFormation {
          0% {
            opacity: 0;
            filter:
              blur(15px)
              brightness(0.35)
              contrast(1.25);
            transform:
              translate3d(
                0,
                18px,
                -70px
              )
              rotateX(7deg)
              scale(0.76);
            clip-path:
              inset(
                42% 42% 42% 42%
                round 999px
              );
          }

          48% {
            opacity: 0.92;
            filter:
              blur(2px)
              brightness(0.74)
              contrast(1.18);
          }

          100% {
            opacity: 1;
            filter:
              blur(0)
              brightness(1)
              contrast(1.08);
            transform:
              translate3d(0, 0, 0)
              rotateX(0)
              scale(1);
            clip-path:
              inset(
                0 0 0 0
                round 0
              );
          }
        }

        @keyframes obsidianMaterialSweep {
          0% {
            left: -75%;
            opacity: 0;
          }

          18% {
            opacity: 0.8;
          }

          62% {
            opacity: 0.52;
          }

          100% {
            left: 145%;
            opacity: 0;
          }
        }

        @keyframes obsidianWordmarkReveal {
          0% {
            opacity: 0;
            filter: blur(8px);
            transform:
              translate3d(0, 18px, 0)
              scale(0.96);
            clip-path:
              inset(0 100% 0 0);
          }

          100% {
            opacity: 1;
            filter: blur(0);
            transform:
              translate3d(0, 0, 0)
              scale(1);
            clip-path:
              inset(0 0 0 0);
          }
        }

        @keyframes obsidianEyebrowReveal {
          from {
            opacity: 0;
            transform:
              translate3d(0, 10px, 0);
            letter-spacing: 0.62em;
          }

          to {
            opacity: 1;
            transform:
              translate3d(0, 0, 0);
            letter-spacing: 0.42em;
          }
        }

        @keyframes obsidianDividerReveal {
          from {
            opacity: 0;
            transform: scaleX(0.72);
          }

          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }


        @keyframes obsidianHaloReveal {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }

          55% {
            opacity: 0.85;
          }

          100% {
            opacity: 0.36;
            transform: scale(1);
          }
        }

        @keyframes obsidianReflectionReveal {
          from {
            opacity: 0;
            transform:
              translateX(-50%)
              scaleX(0.55);
          }

          to {
            opacity: 1;
            transform:
              translateX(-50%)
              scaleX(1);
          }
        }

        @keyframes obsidianBeamSweep {
          0% {
            opacity: 0;
            transform:
              rotate(16deg)
              translate3d(-40%, 0, 0);
          }

          22% {
            opacity: 0.48;
          }

          72% {
            opacity: 0.16;
          }

          100% {
            opacity: 0;
            transform:
              rotate(16deg)
              translate3d(310%, 0, 0);
          }
        }

        @keyframes obsidianFogOne {
          from {
            opacity: 0;
            transform:
              translate3d(-5%, 9%, 0)
              scale(0.88);
          }

          to {
            opacity: 1;
            transform:
              translate3d(11%, -2%, 0)
              scale(1.08);
          }
        }

        @keyframes obsidianFogTwo {
          from {
            opacity: 0;
            transform:
              translate3d(7%, 10%, 0)
              scale(0.9);
          }

          to {
            opacity: 1;
            transform:
              translate3d(-9%, -3%, 0)
              scale(1.08);
          }
        }

        @keyframes obsidianShardFloat {
          0% {
            opacity: 0;
            translate: 0 20px;
          }

          34% {
            opacity: 0.42;
          }

          100% {
            opacity: 0.12;
            translate: 0 -13px;
          }
        }

        @keyframes obsidianParticleFloat {
          0% {
            opacity: 0;
            transform:
              translate3d(0, 15px, 0)
              scale(0.4);
          }

          38% {
            opacity: 0.8;
          }

          100% {
            opacity: 0.1;
            transform:
              translate3d(0, -26px, 0)
              scale(1);
          }
        }

        @keyframes obsidianSceneExit {
          from {
            opacity: 1;
            visibility: visible;
          }

          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes obsidianContentExit {
          from {
            opacity: 1;
            filter: blur(0);
            transform:
              translate3d(
                0,
                -1.5svh,
                0
              )
              scale(1);
          }

          to {
            opacity: 0;
            filter: blur(8px);
            transform:
              translate3d(
                0,
                -3svh,
                0
              )
              scale(1.035);
          }
        }

        @keyframes obsidianGrainShift {
          0% {
            transform:
              translate3d(-1%, -1%, 0)
              rotate(9deg);
          }

          50% {
            transform:
              translate3d(1%, 0, 0)
              rotate(9deg);
          }

          100% {
            transform:
              translate3d(0, 1%, 0)
              rotate(9deg);
          }
        }

        @media (max-width: 767px) {
          .obsidian-cinematic-reveal__content {
            width: 92vw;
            transform:
              translate3d(0, -1svh, 0);
          }

          .obsidian-cinematic-reveal__eyebrow {
            margin-bottom: 20px;
            font-size: 7px;
            letter-spacing: 0.36em;
          }

          .obsidian-cinematic-reveal__symbol-stage {
            width:
              clamp(160px, 55vw, 222px);
          }

          .obsidian-cinematic-reveal__wordmark {
            width:
              min(82vw, 430px);
            margin-top: 30px;
          }


          .obsidian-cinematic-reveal__fog {
            filter: blur(45px);
          }

          .obsidian-cinematic-reveal__shard--one {
            left: 8%;
          }

          .obsidian-cinematic-reveal__shard--two {
            right: 8%;
          }
        }

        @media (max-height: 650px) {
          .obsidian-cinematic-reveal__content {
            transform:
              translate3d(0, 0, 0)
              scale(0.82);
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .obsidian-cinematic-reveal {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}