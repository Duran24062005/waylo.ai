"use client";

import { motion, useReducedMotion } from "motion/react";
import { MascotMark } from "@/components/mascot";

// Same mechanics as Kokonut's AI text loading: a shimmering gradient sweeps across the label,
// clipped to the glyphs. The base color stays readable in both themes.
const SWEEP = ["100% 50%", "0% 50%"];

export function ThinkingLoader() {
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-4">
      <MascotMark size={36} className="shrink-0" />
      <motion.span
        role="status"
        className="bg-[linear-gradient(90deg,var(--text-muted)_0%,var(--text-muted)_35%,var(--text)_50%,var(--text-muted)_65%,var(--text-muted)_100%)] bg-[length:250%_100%] bg-clip-text text-base text-transparent"
        style={reduced ? { backgroundPosition: "50% 50%" } : undefined}
        animate={reduced ? undefined : { backgroundPosition: SWEEP }}
        transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
      >
        Pensando
      </motion.span>
    </div>
  );
}
