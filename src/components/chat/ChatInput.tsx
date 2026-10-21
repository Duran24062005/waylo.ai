"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const MAX_HEIGHT = 176;

export function ChatInput({ value, pending, onChange, onSubmit, onFocus, onBlur }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !pending;

  // Grows with the text up to a limit, then scrolls.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="group relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-xl bg-linear-to-r from-accent via-success to-accent opacity-0 blur-xl transition-opacity duration-[var(--duration-slow)] ease-standard group-focus-within:opacity-30"
      />
      <div className="relative flex items-end gap-3 rounded-xl bg-surface-raised p-3 shadow-raised transition-transform duration-[var(--duration-base)] ease-standard group-focus-within:-translate-y-0.5">
        <label className="sr-only" htmlFor="mensaje">
          Escribe cómo te sientes
        </label>
        <textarea
          ref={ref}
          id="mensaje"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Cuéntame qué sientes…"
          autoComplete="off"
          enterKeyHint="send"
          className="max-h-44 min-h-12 min-w-0 flex-1 resize-none rounded-lg bg-surface px-4 py-3 text-body text-text shadow-inset placeholder:text-text-muted field-focus"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar mensaje"
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft",
            "lift lift-sm transition-opacity",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <HugeiconsIcon icon={ArrowUp02Icon} size={22} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </form>
  );
}
