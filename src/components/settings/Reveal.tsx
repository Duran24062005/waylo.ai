"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { durationMs } from "@/design/motion";
import { cn } from "@/lib/utils";

/**
 * Content that opens out and folds away smoothly instead of popping in.
 * It uses a grid row that goes from 0fr to 1fr, which animates to the content's own height without measuring it.
 * The content is clipped while it moves, and not once it is open, so the halo of a focused field shows in full.
 */
export function Reveal({ show, children, id }: { show: boolean; children: React.ReactNode; id?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(show);
  const [expanded, setExpanded] = useState(show);
  const [settled, setSettled] = useState(show);

  useLayoutEffect(() => {
    if (show) setMounted(true);
  }, [show]);

  // The closed state is built first, and its styles are computed (reading the height does it) before the open state is set,
  // so the browser has something to animate from. This does not depend on a frame being painted in between.
  useLayoutEffect(() => {
    if (!show || !mounted) return;
    void box.current?.offsetHeight;
    setExpanded(true);
  }, [show, mounted]);

  // The end of the transition says it is over. The timers only cover the cases where no transition runs
  // (animations off), and wait longer than the transition itself so they never cut it short.
  useEffect(() => {
    if (show) {
      const done = window.setTimeout(() => setSettled(true), durationMs.slow + 500);
      return () => window.clearTimeout(done);
    }
    setSettled(false);
    setExpanded(false);
    const gone = window.setTimeout(() => setMounted(false), durationMs.slow + 500);
    return () => window.clearTimeout(gone);
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      ref={box}
      id={id}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || event.propertyName !== "grid-template-rows") return;
        if (show) setSettled(true);
        else setMounted(false);
      }}
      className={cn(
        "grid transition-[grid-template-rows,opacity,transform] duration-[var(--duration-slow)] ease-standard",
        expanded ? "translate-y-0 grid-rows-[1fr] opacity-100" : "-translate-y-2 grid-rows-[0fr] opacity-0",
      )}
    >
      <div className={cn("min-h-0", !settled && "overflow-hidden")}>{children}</div>
    </div>
  );
}
