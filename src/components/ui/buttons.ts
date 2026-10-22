import { cn } from "@/lib/utils";

// Motion comes from the `lift` utility in globals.css: rise on hover, sink on press, touch-safe.
const base = cn(
  "lift inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6",
  "font-heading text-body font-semibold",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

/** Raised button on the accent color. */
export const buttonPrimary = cn(base, "bg-accent text-accent-foreground shadow-solid");

/** Raised button on a surface color. */
export const buttonSoft = cn(base, "bg-surface-raised text-text shadow-soft");
