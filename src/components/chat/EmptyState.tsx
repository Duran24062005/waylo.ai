"use client";

import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";

interface EmptyStateProps {
  nombre?: string | null;
  suggestions: string[];
  disabled?: boolean;
  onSelect: (text: string) => void;
}

export function EmptyState({ nombre, suggestions, disabled, onSelect }: EmptyStateProps) {
  const first = nombre?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col justify-center gap-10 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.slow, ease: easing.standard }}
        className="flex flex-col gap-3"
      >
        <h1 className="font-script text-5xl leading-tight text-title-gradient sm:text-6xl">
          {first ? `Hola, ${first}` : "Hola"}
        </h1>
        <p className="font-heading text-title font-medium text-text sm:text-headline">¿Cómo te sientes hoy?</p>
        <p className="max-w-2xl text-body-lg text-text-muted">
          Cuéntame qué sientes y te digo a qué nivel de atención acudir. No doy diagnósticos ni recetas. Si te falta el
          aire, duele el pecho o te sientes muy mal, ve ya a Urgencias.
        </p>
      </motion.div>

      <div role="group" aria-label="Empezar con un síntoma" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {suggestions.map((text, index) => (
          <motion.button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(text)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.slow, ease: easing.standard, delay: 0.12 + index * 0.08 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="min-h-24 rounded-lg bg-surface-raised p-5 text-left font-heading text-body-lg font-semibold text-text shadow-soft transition-shadow duration-[var(--duration-base)] ease-standard hover:shadow-raised active:shadow-pressed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
