import type { FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SendIcon } from "@hugeicons/core-free-icons";

interface ChatInputProps {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function ChatInput({ value, pending, onChange, onSubmit, onFocus, onBlur }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} method="post" className="group relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-xl bg-linear-to-r from-accent via-success to-accent opacity-0 blur-md transition-opacity duration-[var(--duration-base)] ease-standard group-focus-within:opacity-40"
      />
      <div className="relative flex items-center gap-2 rounded-xl border-2 border-border-strong bg-surface-raised p-2 shadow-soft transition-colors duration-[var(--duration-fast)] ease-standard group-focus-within:border-accent has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring">
        <label className="sr-only" htmlFor="mensaje">
          Escribe cómo te sientes
        </label>
        <input
          id="mensaje"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Cuéntame qué sientes"
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-body text-text outline-none placeholder:text-text-muted"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-body font-bold text-accent-foreground transition-[opacity,transform] duration-[var(--duration-fast)] ease-standard enabled:hover:opacity-90 enabled:active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HugeiconsIcon icon={SendIcon} size={20} strokeWidth={2} aria-hidden />
          Enviar
        </button>
      </div>
    </form>
  );
}
