import { cn } from "@/lib/utils";

export const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Fields sit "inside" the surface (inverse depth). An error adds a danger ring, since color alone is not enough. */
export function controlClasses(hasError: boolean, className?: string) {
  return cn(
    "field-focus min-h-11 w-full rounded-md bg-surface px-4 text-base text-text shadow-inset placeholder:text-text-muted",
    hasError && "ring-2 ring-danger",
    className,
  );
}
