"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/design/motion";

/** The feel of the scroll, shared by the page and by the scrollable areas, so they all move the same way. */
export const SMOOTH_SCROLL = {
  duration: 1.25,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
} as const;

/** Marks a scrollable area that runs its own smooth scroll. The page's scroll leaves it alone. */
export const SMOOTH_AREA_ATTRIBUTE = "data-smooth-area";

/** Inertial page scroll. Anchor links glide to their section. Off under reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      ...SMOOTH_SCROLL,
      anchors: { offset: -96 },
      // Areas with their own smooth scroll (the chat) handle their own wheel.
      prevent: (node) => node.hasAttribute(SMOOTH_AREA_ATTRIBUTE),
    });

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
