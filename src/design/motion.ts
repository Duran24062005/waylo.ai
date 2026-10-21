// Mirrors the motion tokens in src/app/globals.css. Change both together.

export const durationMs = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

/** Seconds, for GSAP and motion. */
export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

/** Cubic-bezier control points, for motion's `ease` option. */
export const easing = {
  standard: [0.22, 1, 0.36, 1],
  /** Overshoot: reserved for the success moment. */
  emphasis: [0.34, 1.4, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** CSS strings, identical to --ease-standard and --ease-emphasis. */
export const easingCss = {
  standard: "cubic-bezier(0.22, 1, 0.36, 1)",
  emphasis: "cubic-bezier(0.34, 1.4, 0.64, 1)",
} as const;

/** SVG path data for GSAP CustomEase.create(name, path). Same curves as above. */
export const gsapEasePath = {
  standard: "M0,0 C0.22,1 0.36,1 1,1",
  emphasis: "M0,0 C0.34,1.4 0.64,1 1,1",
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
