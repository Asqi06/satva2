"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Activates Lenis smooth scroll site-wide.
 * Respects prefers-reduced-motion: if the user prefers no motion,
 * Lenis is not initialised and native scroll behaviour is used.
 *
 * Renders nothing — purely a side-effect component.
 */
export function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf: number;
    function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
