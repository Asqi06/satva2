"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

/**
 * Activates Lenis smooth scroll site-wide.
 * Respects prefers-reduced-motion: if the user prefers no motion,
 * Lenis is not initialised and native scroll behaviour is used.
 *
 * Uses Lenis `autoRaf` (no manual requestAnimationFrame loop) and a
 * shorter duration so scrolling feels snappy instead of laggy/stuck.
 * Required Lenis CSS lives in globals.css (`html.lenis ...` rules);
 * without it Lenis miscalculates the scroll limit and the page can
 * stop scrolling part-way down.
 *
 * Inner scroll areas (cart drawer, mobile menu) must carry
 * `data-lenis-prevent` so Lenis lets them scroll natively.
 *
 * Renders nothing — purely a side-effect component.
 */
export function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Defer to idle so initial LCP/CLS is not blocked by smooth-scroll JS.
    // Dynamic import also removes Lenis from the initial JS bundle (~25 KiB).
    let lenis: Lenis | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      void import("lenis").then(({ default: LenisCtor }) => {
        if (cancelled) return;
        lenis = new LenisCtor({
          duration: 0.6,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.2,
          autoRaf: true,
          anchors: true,
        });
        (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      });
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 1200 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
        if (lenis) {
          if ((window as unknown as { __lenis?: Lenis }).__lenis === lenis) delete (window as unknown as { __lenis?: Lenis }).__lenis;
          lenis.destroy();
        }
      };
    }
    const t = window.setTimeout(start, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (lenis) {
        if ((window as unknown as { __lenis?: Lenis }).__lenis === lenis) delete (window as unknown as { __lenis?: Lenis }).__lenis;
        lenis.destroy();
      }
    };
  }, []);

  return null;
}
