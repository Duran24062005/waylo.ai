"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/design/motion";

const MAX_MS_PER_CHAR = 25;
const MAX_TOTAL_MS = 1800;

interface TypewriterTextProps {
  text: string;
  onDone?: () => void;
}

/** Reveals text letter by letter. The untyped rest stays in the layout, so the box never grows while typing. */
export function TypewriterText({ text, onDone }: TypewriterTextProps) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (prefersReducedMotion() || text.length === 0) {
      setCount(text.length);
      onDoneRef.current?.();
      return;
    }

    const total = Math.min(text.length * MAX_MS_PER_CHAR, MAX_TOTAL_MS);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const next = Math.min(text.length, Math.floor(((now - start) / total) * text.length));
      setCount(next);
      if (next < text.length) {
        frame = requestAnimationFrame(tick);
      } else {
        onDoneRef.current?.();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <>
      {text.slice(0, count)}
      <span aria-hidden className="invisible">
        {text.slice(count)}
      </span>
    </>
  );
}
