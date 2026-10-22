"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Refresh01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const COPIED_MS = 1500;

const actionButton = cn(
  "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm text-text-muted transition-colors",
  "hover:text-text focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
);

interface MessageActionsProps {
  text: string;
  onRegenerate?: () => void;
  /** Keeps the space but hides the buttons, for example while the reply is still being typed. */
  hidden?: boolean;
  className?: string;
}

/** Shown on hover or focus inside the message, always on touch screens. */
export function MessageActions({ text, onRegenerate, hidden, className }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 transition-opacity duration-[var(--duration-fast)]",
        "group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100",
        hidden && "invisible",
        className,
      )}
    >
      <button type="button" onClick={copy} className={actionButton}>
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={2} aria-hidden />
        <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
      </button>
      {onRegenerate && (
        <button type="button" onClick={onRegenerate} className={actionButton}>
          <HugeiconsIcon icon={Refresh01Icon} size={16} strokeWidth={2} aria-hidden />
          Reintentar
        </button>
      )}
    </div>
  );
}
