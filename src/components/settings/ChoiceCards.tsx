"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** A line under the label. */
  hint?: string;
  /** What is drawn at the start of the card: an avatar, a flag. */
  visual: ReactNode;
}

interface ChoiceCardsProps<T extends string> {
  label: string;
  value: T;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
}

/**
 * Pill-shaped cards to pick one option. The chosen card is the dark one: a pill that slides from the old choice to
 * the new, with a check that pops in. The arrow keys move the choice, as in any group of radio buttons.
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
      // Two columns: with a check beside the label, a card needs the room. Cards with a hint stack on a phone.
      className={cn("grid gap-1.5 rounded-[2.25rem] bg-surface p-1.5 shadow-inset", tall ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}
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
              "lift lift-sm relative flex cursor-pointer items-center gap-3 rounded-full bg-surface-raised px-3 py-2 text-left shadow-soft",
              tall ? "min-h-[4.5rem]" : "min-h-14",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            )}
          >
            {active ? (
              <motion.span
                layoutId={pillId}
                transition={{ duration: duration.base, ease: easing.standard }}
                className="absolute inset-0 rounded-full bg-text shadow-solid"
              />
            ) : null}

            {/* The visual gives a small hop when it is chosen. */}
            <motion.span
              animate={active ? { scale: [1, 1.14, 1] } : { scale: 1 }}
              transition={{ duration: duration.base, ease: easing.emphasis }}
              className="relative shrink-0"
            >
              {option.visual}
            </motion.span>

            <span className="relative min-w-0 flex-1 leading-tight">
              <span
                className={cn(
                  "block font-heading text-sm font-semibold transition-colors duration-[var(--duration-base)] ease-standard",
                  active ? "text-surface" : "text-text",
                )}
              >
                {option.label}
              </span>
              {option.hint ? (
                <span
                  className={cn(
                    "mt-0.5 block text-sm transition-colors duration-[var(--duration-base)] ease-standard",
                    active ? "text-surface/70" : "text-text-muted",
                  )}
                >
                  {option.hint}
                </span>
              ) : null}
            </span>

            <AnimatePresence initial={false}>
              {active ? (
                <motion.span
                  key="check"
                  aria-hidden
                  initial={{ scale: 0, rotate: -40, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: duration.base, ease: easing.emphasis }}
                  className="relative mr-1 grid size-7 shrink-0 place-items-center rounded-full bg-surface text-text"
                >
                  <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={3} />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
