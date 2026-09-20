"use client";

import Lenis from "lenis";
import { useEffect } from "react";

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

    // Desktop felt laggy with the previous sine ease + 0.85s duration
    // (slow start). easeOutCubic + 0.6s is snappier: wheel responds
    // immediately, then eases out. Multipliers stay at 1x so a
    // wheel tick moves exactly one tick worth.
    const lenis = new Lenis({
      duration: 0.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      autoRaf: true,
      anchors: true,
    });

    // Expose for drawer/menu scroll-locks (stop/start without
    // fighting Lenis via body overflow alone).
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      if ((window as unknown as { __lenis?: Lenis }).__lenis === lenis) {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
      lenis.destroy();
    };
  }, []);

  return null;
}
