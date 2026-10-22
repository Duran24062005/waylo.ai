"use client";

import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";

interface EmptyStateProps {
  nombre?: string | null;
}

/** Greeting shown right above the composer while the chat is empty. */
export function EmptyState({ nombre }: EmptyStateProps) {
  const first = nombre?.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: easing.standard }}
      className="flex flex-col items-center gap-3 text-center"
    >
      <h1 className="font-script text-5xl leading-tight text-title-gradient sm:text-6xl">
        {first ? `Hola, ${first}` : "Hola"}
      </h1>
      <p className="font-heading text-body-lg font-medium text-text sm:text-title">¿Cómo te sientes hoy?</p>
    </motion.div>
  );
}
