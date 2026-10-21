import { cn } from "@/lib/utils";

export const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function controlClasses(hasError: boolean, className?: string) {
  return cn(
    "min-h-12 w-full rounded-md border bg-surface-raised px-4 text-body text-text",
    "transition-colors duration-[var(--duration-fast)] ease-standard",
    hasError ? "border-danger" : "border-border-strong",
    focusRing,
    className,
  );
}
