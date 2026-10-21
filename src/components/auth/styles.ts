import { cn } from "@/lib/utils";

export const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Fields sit "inside" the surface (inverse depth). An error adds a danger ring, since color alone is not enough. */
export function controlClasses(hasError: boolean, className?: string) {
  return cn(
    "min-h-12 w-full rounded-md bg-surface px-4 text-body text-text shadow-inset",
    "transition-shadow duration-[var(--duration-fast)] ease-standard placeholder:text-text-muted",
    hasError && "ring-2 ring-danger",
    focusRing,
    className,
  );
}
