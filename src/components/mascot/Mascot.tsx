"use client";

import gsap from "gsap";
import { useId, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { REDUCED_MOTION_QUERY, duration, prefersReducedMotion } from "@/design/motion";
import type { MascotProps } from "./contract";
import { gazeOffset } from "./pointer";
import { FOLLOWS_POINTER, GAZE } from "./states";
import { applyPose, initOrigins, playState, type MascotTargets } from "./timelines";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
}

// Character colors are fixed on purpose: the sphere must read on light and dark surfaces.
const EYE_COLOR = "#0d0e12";

export function Mascot({ state, size = 120, className, label }: MascotProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();

  const svgRef = useRef<SVGSVGElement>(null);
  const gazeRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const lidsRef = useRef<SVGGElement>(null);
  const lookRef = useRef<SVGGElement>(null);
  const eyeLeftRef = useRef<SVGGElement>(null);
  const eyeRightRef = useRef<SVGGElement>(null);

  const followRef = useRef(false);
  const moveGazeRef = useRef<(x: number, y: number) => void>(() => {});
  const mountedRef = useRef(false);

  // Pointer follow: the pointer lives in refs and quickTo, so no React state changes per frame.
  useLayoutEffect(() => {
    const gaze = gazeRef.current;
    const svg = svgRef.current;
    if (!gaze || !svg || reduced) return;

    const ctx = gsap.context(() => {
      const quickX = gsap.quickTo(gaze, "x", { duration: duration.slow, ease: "power3.out" });
      const quickY = gsap.quickTo(gaze, "y", { duration: duration.slow, ease: "power3.out" });
      moveGazeRef.current = (x, y) => {
        quickX(x);
        quickY(y);
      };
    }, svg);

    const onMove = (event: PointerEvent) => {
      if (!followRef.current) return;
      const rect = svg.getBoundingClientRect();
      const { x, y } = gazeOffset(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
        GAZE.maxX,
        GAZE.maxY,
        GAZE.reach,
      );
      moveGazeRef.current(x, y);
    };
    const onLeave = () => moveGazeRef.current(0, 0);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      ctx.revert();
      moveGazeRef.current = () => {};
    };
  }, [reduced]);

  // One timeline per state. Rebuilt on every change; the previous one is killed first.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const shadow = shadowRef.current;
    const lids = lidsRef.current;
    const look = lookRef.current;
    const eyeLeft = eyeLeftRef.current;
    const eyeRight = eyeRightRef.current;
    const gaze = gazeRef.current;
    if (!body || !shadow || !lids || !look || !eyeLeft || !eyeRight || !gaze) return;

    const targets: MascotTargets = { body, shadow, lids, look, eyes: [eyeLeft, eyeRight] };

    if (!mountedRef.current) initOrigins(targets);

    if (reduced) {
      followRef.current = false;
      gsap.set(gaze, { x: 0, y: 0 });
      applyPose(targets, state);
      return;
    }

    followRef.current = FOLLOWS_POINTER[state];
    if (!followRef.current) moveGazeRef.current(0, 0);

    const instant = !mountedRef.current;
    mountedRef.current = true;
    if (instant) applyPose(targets, state);

    let stop = () => {};
    const ctx = gsap.context(() => {
      stop = playState(targets, state, instant);
    }, svgRef);

    return () => {
      stop();
      // kill, not revert: the next state continues from the current pose.
      ctx.kill();
    };
  }, [state, reduced]);

  const ids = {
    body: `${uid}-body`,
    gloss: `${uid}-gloss`,
    bounce: `${uid}-bounce`,
    shadow: `${uid}-shadow`,
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ overflow: "visible" }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient id={ids.body} cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.38" stopColor="#f4f5f8" />
          <stop offset="0.78" stopColor="#d3d7de" />
          <stop offset="1" stopColor="#a9afbb" />
        </radialGradient>
        <radialGradient id={ids.gloss} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.bounce} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0b1020" stopOpacity="0.34" />
          <stop offset="1" stopColor="#0b1020" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        ref={shadowRef}
        cx="60"
        cy="108"
        rx="32"
        ry="6"
        fill={`url(#${ids.shadow})`}
      />

      <g ref={bodyRef}>
        <circle cx="60" cy="58" r="46" fill={`url(#${ids.body})`} />
        <ellipse cx="60" cy="90" rx="26" ry="12" fill={`url(#${ids.bounce})`} />
        <ellipse cx="44" cy="31" rx="19" ry="11" transform="rotate(-28 44 31)" fill={`url(#${ids.gloss})`} />

        <g ref={gazeRef}>
          <g ref={lookRef}>
            <g ref={lidsRef}>
              <g transform="translate(47 52) rotate(-16)">
                <g ref={eyeLeftRef}>
                  <rect x="-4.5" y="-11" width="9" height="22" rx="4.5" fill={EYE_COLOR} />
                  <ellipse cx="-1.2" cy="-5.5" rx="1.1" ry="2.4" fill="#ffffff" opacity="0.22" />
                </g>
              </g>
              <g transform="translate(73 52) rotate(-16)">
                <g ref={eyeRightRef}>
                  <rect x="-4.5" y="-11" width="9" height="22" rx="4.5" fill={EYE_COLOR} />
                  <ellipse cx="-1.2" cy="-5.5" rx="1.1" ry="2.4" fill="#ffffff" opacity="0.22" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
