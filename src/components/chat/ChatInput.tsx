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
    <form onSubmit={onSubmit} method="post">
      <div
        className={cn(
          // No borders: depth tells the state. Resting is raised, hover lifts it, focus sinks it like a field.
          "group relative flex items-end gap-2 rounded-3xl bg-surface-raised py-2 pl-5 pr-2",
          "transition-transform duration-[var(--duration-base)] ease-standard",
          "hover:-translate-y-0.5 focus-within:translate-y-0 focus-within:hover:translate-y-0",
        )}
      >
        {/*
          Shadows can't be interpolated between an outer and an inset one, so each state is its own layer
          and the layers cross-fade. That is what makes hover to focus a smooth transition.
        */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl shadow-soft",
            "transition-opacity duration-[var(--duration-base)] ease-standard",
            "group-hover:opacity-0 group-focus-within:opacity-0",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl opacity-0 shadow-raised",
            "transition-opacity duration-[var(--duration-base)] ease-standard",
            "group-hover:opacity-100 group-focus-within:opacity-0 group-focus-within:group-hover:opacity-0",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl opacity-0 shadow-inset",
            "transition-opacity duration-[var(--duration-slow)] ease-standard",
            "group-focus-within:opacity-100",
          )}
        />
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
          className="relative max-h-44 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base text-text outline-none placeholder:text-text-muted"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar mensaje"
          className={cn(
            "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground",
            "lift lift-sm transition-opacity",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-30",
          )}
        >
          <HugeiconsIcon icon={ArrowUp02Icon} size={20} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </form>
  );
}
