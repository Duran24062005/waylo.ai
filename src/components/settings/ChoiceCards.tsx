"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** A line under the label. */
  hint?: string;
  /** What is drawn at the start of the option: an avatar, a flag. */
  visual: ReactNode;
}

interface ChoiceCardsProps<T extends string> {
  label: string;
  value: T;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
}

/**
 * One choice out of a few, drawn like the other selectors of the settings: a sunken tray, and a raised pill that slides
 * to the chosen option. Each option carries a picture (an avatar, a flag). The arrow keys move the choice.
 */
export function ChoiceCards<T extends string>({ label, value, options, onChange }: ChoiceCardsProps<T>) {
  const pillId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tall = options.some((option) => option.hint);

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
      // Options with a hint stack on a phone; the others stay two by two.
      className={cn("grid gap-1 rounded-xl bg-surface p-1.5 shadow-inset", tall ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}
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
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left",
              tall ? "min-h-16" : "min-h-12",
              "transition-colors duration-[var(--duration-base)] ease-standard",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
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

            {/* The picture gives a small hop when it is chosen. */}
            <motion.span
              animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: duration.base, ease: easing.emphasis }}
              className="relative shrink-0"
            >
              {option.visual}
            </motion.span>

            <span className="relative min-w-0 flex-1 leading-tight">
              <span className="block font-heading text-sm font-semibold">{option.label}</span>
              {option.hint ? <span className="mt-0.5 block text-sm font-normal text-text-muted">{option.hint}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
