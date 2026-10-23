"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { MascotState } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";
import { STATUS_COPY } from "./status";

const DOT: Record<MascotState, string> = {
  idle: "bg-success",
  listening: "bg-accent",
  thinking: "bg-warning animate-pulse",
  speaking: "bg-accent animate-pulse",
  alert: "bg-danger",
  success: "bg-success",
  error: "bg-danger",
  private: "bg-text-muted",
  muted: "bg-text-muted",
  resting: "bg-text-muted",
};

// Dot (10px), the gap after it (10px), and the pill's side padding (16px each).
const CHROME_PX = 52;

// The pill's width follows the label's measured width, animated with a CSS transition.
// Layout animations would scale the text while the frame resizes, so they are not used.
//
// The label rolls vertically inside an overflow-hidden box: the old text leaves
// upward, the new text enters from below. Nothing animates on first render.
export function StatusBadge({ state, className }: { state: MascotState; className?: string }) {
  const reduced = useReducedMotion();
  const label = STATUS_COPY[state];
  // One stable, invisible copy of the current label. Measuring it avoids the animated copies,
  // which overlap while a roll is in progress. It also catches web fonts that load late.
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>();

  useLayoutEffect(() => {
    const el = sizerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth + CHROME_PX);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      style={{ width }}
      className={cn(
        "inline-flex min-h-9 items-center gap-2.5 overflow-hidden rounded-full bg-surface px-4 font-heading text-base font-medium text-text shadow-inset",
        "transition-[width] duration-[var(--duration-base)] ease-standard motion-reduce:transition-none",
        className,
      )}
    >
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", DOT[state])} />
      <span className="relative grid overflow-hidden">
        <span ref={sizerRef} aria-hidden className="invisible col-start-1 row-start-1 w-max">
          {label}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: "0%" }}
            exit={reduced ? { opacity: 0 } : { y: "-100%" }}
            transition={{ duration: reduced ? duration.fast : duration.base, ease: easing.standard }}
            className="col-start-1 row-start-1 w-max"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
