"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

const CHECKS = [
  { id: "len", label: "8 o más caracteres", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (v: string) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { id: "num", label: "Un número", test: (v: string) => /\d/.test(v) },
  { id: "sym", label: "Un símbolo", test: (v: string) => /[^A-Za-z0-9\sÁÉÍÓÚÑáéíóúñ]/.test(v) },
] as const;

const LEVEL = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"] as const;

/** Guidance only. The server asks for 8 characters; the rest helps pick a stronger password. */
export function StrengthMeter({ password }: { password: string }) {
  const results = CHECKS.map((check) => ({ ...check, ok: check.test(password) }));
  const score = password ? results.filter((r) => r.ok).length : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-3 shadow-inset" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-2" aria-hidden>
          {[0, 1, 2, 3].map((bar) => (
            <span key={bar} className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised shadow-soft">
              <motion.span
                className="block h-full origin-left rounded-full bg-accent"
                initial={false}
                animate={{ scaleX: bar < score ? 1 : 0 }}
                transition={{ duration: duration.base, ease: easing.standard }}
              />
            </span>
          ))}
        </div>
        <span className="min-w-20 text-right font-heading text-caption font-medium text-text-muted">
          {password ? LEVEL[score] : "Sin escribir"}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {results.map((r) => (
          <li key={r.id} className={cn("flex items-center gap-2 text-caption", r.ok ? "text-text" : "text-text-muted")}>
            <span
              aria-hidden
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full transition-[transform,opacity] duration-[var(--duration-base)] ease-emphasis",
                r.ok ? "bg-accent text-accent-foreground" : "bg-surface-raised text-text-muted shadow-soft",
              )}
            >
              <HugeiconsIcon icon={r.ok ? Tick02Icon : Cancel01Icon} size={12} strokeWidth={3} />
            </span>
            <span>
              {r.label}
              <span className="sr-only">{r.ok ? ": cumplido" : ": falta"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
