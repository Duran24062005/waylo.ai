import { cn } from "@/lib/utils";

const base = cn(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6",
  "font-heading text-body font-semibold",
  "transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-standard",
  "hover:-translate-y-0.5 active:translate-y-0",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
);

/** Raised button on the accent color. Pressing it sinks it (inverse depth). */
export const buttonPrimary = cn(
  base,
  "bg-accent text-accent-foreground shadow-soft hover:shadow-raised active:shadow-pressed",
);

/** Raised button on a surface color. */
export const buttonSoft = cn(
  base,
  "bg-surface-raised text-text shadow-soft hover:shadow-raised active:shadow-pressed",
);
