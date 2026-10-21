"use client";

import { motion, useReducedMotion } from "motion/react";
import { MascotMark } from "@/components/mascot";

const DOTS = [0, 1, 2];

export function TypingIndicator() {
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-3">
      <MascotMark size={32} className="shrink-0" />
      <div className="flex items-center gap-3 font-heading text-body text-text-muted">
        <span>Pensando</span>
        <span aria-hidden className="flex items-center gap-1.5">
          {DOTS.map((dot) => (
            <motion.span
              key={dot}
              className="size-2 rounded-full bg-accent"
              style={{ opacity: reduced ? 0.7 : undefined }}
              animate={reduced ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: dot * 0.18 }}
            />
          ))}
        </span>
        <span className="sr-only">Preparando tu orientación</span>
      </div>
    </div>
  );
}
