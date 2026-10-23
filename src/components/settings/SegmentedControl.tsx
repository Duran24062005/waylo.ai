"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconSvgElement;
  /** A smaller line under the label, such as a language code. */
  caption?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  /** Columns on a wide screen. On a phone the options wrap to two. */
  columns?: 2 | 3 | 4;
  disabled?: boolean;
}

const COLUMNS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" } as const;

/** One choice out of a few. The raised pill slides to the chosen option, and the arrow keys move it. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 3,
  disabled,
}: SegmentedControlProps<T>) {
  const pillId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = options.findIndex((option) => option.value === value);
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("grid grid-cols-2 gap-1 rounded-xl bg-surface p-1.5 shadow-inset", COLUMNS[columns])}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            // With nothing chosen yet, the first option takes the tab stop so the group can still be reached.
            tabIndex={active || (!options.some((o) => o.value === value) && index === 0) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-center font-heading text-sm font-semibold",
              "transition-colors duration-[var(--duration-base)] ease-standard",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
              active ? "text-text" : "text-text-muted hover:text-text",
            )}
          >
            {active ? (
              <motion.span
                layoutId={pillId}
                transition={{ duration: duration.base, ease: easing.standard }}
                className="absolute inset-0 rounded-lg bg-surface-raised shadow-soft"
              />
            ) : null}
            {option.icon ? <HugeiconsIcon icon={option.icon} size={18} strokeWidth={2.25} aria-hidden className="relative shrink-0" /> : null}
            <span className="relative flex flex-col leading-tight">
              <span>{option.label}</span>
              {option.caption ? <span className="text-xs font-medium text-text-muted">{option.caption}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
