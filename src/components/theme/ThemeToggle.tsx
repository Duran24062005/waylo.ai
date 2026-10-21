"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export interface ThemeToggleProps {
  className?: string;
  /** Show the current theme as text next to the icon. Default true. */
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, setPreference } = useTheme();
  const isDark = resolvedTheme === "dark";
  const current = isDark ? "oscuro" : "claro";
  const icon = isDark ? MoonIcon : SunIcon;

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      // The visible word ("Claro"/"Oscuro") is part of the accessible name, as WCAG 2.5.3 asks.
      aria-label={`Cambiar tema claro u oscuro. Ahora: ${current}`}
      title="Cambiar tema claro u oscuro"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full",
        "border border-border-strong bg-surface-raised px-3 text-body font-bold text-text shadow-soft",
        "transition-colors duration-[var(--duration-fast)] ease-standard",
        "hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        showLabel && "px-4",
        className,
      )}
    >
      <HugeiconsIcon icon={icon} aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.25} />
      {showLabel ? <span>{isDark ? "Oscuro" : "Claro"}</span> : null}
    </button>
  );
}
