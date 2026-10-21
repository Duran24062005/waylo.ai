"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export interface ThemeToggleProps {
  className?: string;
  /** Show the current theme as text next to the icon. Default true. */
  showLabel?: boolean;
}

// Both icons stay mounted and swap with rotate, scale and opacity: only compositor properties animate.
const ICON_BASE =
  "absolute inset-0 size-5 transition-[transform,opacity] duration-[var(--duration-slow)] ease-emphasis motion-reduce:transition-none";

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, setPreference } = useTheme();
  // The server renders "light"; the real theme arrives after hydration. Skip animating that first correction.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  const isDark = resolvedTheme === "dark";
  const current = isDark ? "oscuro" : "claro";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      // The visible word ("Claro"/"Oscuro") is part of the accessible name, as WCAG 2.5.3 asks.
      aria-label={`Cambiar tema claro u oscuro. Ahora: ${current}`}
      title="Cambiar tema claro u oscuro"
      className={cn(
        "group inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3",
        "bg-surface-raised font-heading text-base font-semibold text-text shadow-soft",
        "transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-standard",
        "hover:-translate-y-0.5 hover:shadow-raised active:translate-y-0 active:shadow-pressed",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        showLabel && "px-4",
        !ready && "**:transition-none!",
        className,
      )}
    >
      <span aria-hidden="true" className="relative inline-block size-5 shrink-0">
        <HugeiconsIcon
          icon={SunIcon}
          strokeWidth={2.25}
          className={cn(
            ICON_BASE,
            "group-hover:rotate-45",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <HugeiconsIcon
          icon={MoonIcon}
          strokeWidth={2.25}
          className={cn(
            ICON_BASE,
            "group-hover:-rotate-12",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
      {showLabel ? (
        <span className="relative inline-grid">
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[transform,opacity] duration-[var(--duration-base)] ease-standard",
              isDark ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100",
            )}
          >
            Claro
          </span>
          <span
            aria-hidden
            className={cn(
              "col-start-1 row-start-1 transition-[transform,opacity] duration-[var(--duration-base)] ease-standard",
              isDark ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            Oscuro
          </span>
        </span>
      ) : null}
    </button>
  );
}
