"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
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

interface StartersProps {
  suggestions: string[];
  disabled?: boolean;
  onSelect: (text: string) => void;
}

/** Symptom shortcuts shown right below the composer while the chat is empty. */
export function Starters({ suggestions, disabled, onSelect }: StartersProps) {
  return (
    <div role="group" aria-label="Empezar con un síntoma" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {suggestions.map((text, index) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, ease: easing.standard, delay: 0.12 + index * 0.08 }}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(text)}
            className="lift w-full group flex min-h-14 items-center justify-between gap-3 rounded-lg bg-surface-raised px-4 py-3 text-left font-heading text-base font-semibold text-text shadow-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {text}
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              size={18}
              strokeWidth={2.25}
              aria-hidden
              className="shrink-0 -translate-x-1 opacity-0 transition-[transform,opacity] duration-[var(--duration-base)] ease-standard group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
