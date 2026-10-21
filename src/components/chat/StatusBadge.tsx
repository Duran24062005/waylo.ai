"use client";

import { AnimatePresence, motion } from "motion/react";
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
};

export function StatusBadge({ state, className }: { state: MascotState; className?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-h-9 items-center gap-2.5 rounded-full bg-surface px-4 font-heading text-base font-medium text-text shadow-inset",
        className,
      )}
    >
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", DOT[state])} />
      <span className="relative grid overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            className="col-start-1 row-start-1"
          >
            {STATUS_COPY[state]}
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
