"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

// A letter counts as uppercase in any language, so a password in Portuguese or French is judged the same way.
const CHECKS = [
  { id: "length", test: (v: string) => v.length >= 8 },
  { id: "upper", test: (v: string) => /\p{Lu}/u.test(v) },
  { id: "number", test: (v: string) => /\d/.test(v) },
  { id: "symbol", test: (v: string) => /[^\p{L}\p{N}\s]/u.test(v) },
] as const;

/** Guidance only. The server asks for 8 characters; the rest helps pick a stronger password. */
export function StrengthMeter({ password }: { password: string }) {
  const t = useT().auth.strength;
  const results = CHECKS.map((check) => ({ ...check, ok: check.test(password) }));
  const score = password ? results.filter((r) => r.ok).length : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-3 shadow-inset" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-2" aria-hidden>
          {[0, 1, 2, 3].map((bar) => (
            <span key={bar} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised shadow-soft">
              <motion.span
                className="block h-full origin-left rounded-full bg-accent"
                initial={false}
                animate={{ scaleX: bar < score ? 1 : 0 }}
                transition={{ duration: duration.base, ease: easing.standard }}
              />
            </span>
          ))}
        </div>
        <span className="min-w-20 text-right font-heading text-xs font-medium text-text-muted">
          {password ? t.levels[score] : t.empty}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {results.map((r) => (
          <li key={r.id} className={cn("flex items-center gap-2 text-sm", r.ok ? "text-text" : "text-text-muted")}>
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
              {t.checks[r.id]}
              <span className="sr-only">{r.ok ? t.met : t.missing}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
