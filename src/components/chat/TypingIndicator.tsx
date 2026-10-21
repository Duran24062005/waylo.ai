"use client";

import { motion, useReducedMotion } from "motion/react";

const DOTS = [0, 1, 2];

export function TypingIndicator() {
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-1.5 self-start rounded-lg rounded-bl-sm border border-border bg-surface-raised px-4 py-4 shadow-soft">
      <span className="sr-only">Preparando tu orientación</span>
      {DOTS.map((dot) => (
        <motion.span
          key={dot}
          aria-hidden
          className="size-2.5 rounded-full bg-text-muted"
          style={{ opacity: reduced ? 0.7 : undefined }}
          animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: dot * 0.16 }}
        />
      ))}
    </div>
  );
}
