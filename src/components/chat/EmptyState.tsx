"use client";

import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";

interface EmptyStateProps {
  nombre?: string | null;
}

/** Greeting shown right above the composer while the chat is empty. `nombre` is already what the person likes to be called. */
export function EmptyState({ nombre }: EmptyStateProps) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: easing.standard }}
      className="flex flex-col items-center gap-3 text-center"
    >
      <h1 className="font-script text-5xl leading-tight text-title-gradient sm:text-6xl">
        {t.chat.greeting(nombre || null)}
      </h1>
      <p className="font-heading text-body-lg font-medium text-text sm:text-title">{t.chat.howAreYou}</p>
    </motion.div>
  );
}
