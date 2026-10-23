"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** How many digits the code has. The field takes no more than that. */
  length: number;
  /** Names the field for screen readers. */
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}

/**
 * A code of digits, one per underlined slot. Behind the slots there is one real input, invisible and as large as the
 * whole field: that is what takes the typing, the paste and the code a phone offers from an SMS (one-time-code),
 * and what the number keypad of a phone is for. The slots only show what it holds.
 */
export function OtpInput({ value, onChange, length, label, disabled, invalid, id }: OtpInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  // The slot that takes the next digit. When the code is full, the last one.
  const current = Math.min(value.length, length - 1);

  function toEnd() {
    const el = input.current;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  }

  return (
    <div className={cn("relative w-fit", disabled && "opacity-50")}>
      <div aria-hidden className="flex gap-2.5 sm:gap-3">
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const active = focused && !disabled && i === current;
          return (
            <div key={i} className="relative flex h-14 w-9 items-end sm:w-11">
              <AnimatePresence initial={false}>
                {digit ? (
                  <motion.span
                    key={`${i}-${digit}`}
                    initial={{ y: 8, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.fast, ease: easing.emphasis }}
                    className="absolute inset-x-0 bottom-3 text-center font-heading text-2xl font-semibold leading-none text-text"
                  >
                    {digit}
                  </motion.span>
                ) : null}
              </AnimatePresence>

              {/* The caret blinks in the slot that is waiting for a digit. */}
              {active && !digit ? (
                <span className="absolute bottom-3 left-1/2 h-7 w-0.5 -translate-x-1/2 rounded-full bg-text motion-safe:animate-[caret-blink_1.1s_steps(1)_infinite]" />
              ) : null}

              <span
                className={cn(
                  "block h-0.5 w-full rounded-full transition-[background-color,transform] duration-[var(--duration-base)] ease-standard",
                  invalid ? "bg-danger" : active ? "scale-y-[2] bg-text" : digit ? "bg-text/70" : "bg-text/25",
                )}
              />
            </div>
          );
        })}
      </div>

      <input
        ref={input}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={() => {
          setFocused(true);
          toEnd();
        }}
        onBlur={() => setFocused(false)}
        onClick={toEnd}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        disabled={disabled}
        aria-label={label}
        aria-invalid={invalid ? true : undefined}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
