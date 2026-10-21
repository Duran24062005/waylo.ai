"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export interface ThemeToggleProps {
  className?: string;
}

// Both icons stay mounted and swap with rotate, scale and opacity: only compositor properties animate.
const ICON_BASE =
  "absolute inset-0 m-auto size-6 transition-[transform,opacity] duration-[var(--duration-slow)] ease-emphasis motion-reduce:transition-none";

/** Square (1:1) button. The current theme is in the accessible name, since there is no visible text. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setPreference } = useTheme();
  // The server renders "light"; the real theme arrives after hydration. Skip animating that first correction.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      aria-label={`Cambiar tema claro u oscuro. Ahora: ${isDark ? "oscuro" : "claro"}`}
      title="Cambiar tema claro u oscuro"
      className={cn(
        "lift lift-sm group relative inline-block size-12 shrink-0 rounded-xl bg-surface-raised text-text shadow-soft",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        !ready && "**:transition-none!",
        className,
      )}
    >
      <HugeiconsIcon
        icon={SunIcon}
        strokeWidth={2.25}
        aria-hidden="true"
        className={cn(
          ICON_BASE,
          "group-hover:rotate-45",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
      <HugeiconsIcon
        icon={MoonIcon}
        strokeWidth={2.25}
        aria-hidden="true"
        className={cn(
          ICON_BASE,
          "group-hover:-rotate-12",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}
