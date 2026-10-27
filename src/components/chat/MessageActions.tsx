"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  type CheckIconHandle,
  type CopyIconHandle,
  type RefreshCcwIconHandle,
  type ThumbsDownIconHandle,
  type ThumbsUpIconHandle,
} from "@animateicons/react/lucide";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

const COPIED_MS = 1500;
const ICON_SIZE = 16;

export type MessageFeedback = "like" | "dislike";

const actionButton = cn(
  "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm text-text-muted transition-colors",
  "hover:text-text focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
);

interface AnimatedHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/** The icons only react to the pointer over themselves, so the whole button drives them through their handle. */
function hoverProps(handle: { current: AnimatedHandle | null }) {
  return {
    onMouseEnter: () => handle.current?.startAnimation(),
    onMouseLeave: () => handle.current?.stopAnimation(),
    onFocus: () => handle.current?.startAnimation(),
    onBlur: () => handle.current?.stopAnimation(),
  };
}

interface MessageActionsProps {
  text: string;
  onRegenerate?: () => void;
  /** Value already given to this reply. Passing `onFeedback` is what shows the like and dislike buttons. */
  feedback?: MessageFeedback | null;
  /** Called with the new value, or `null` when the person takes their choice back. */
  onFeedback?: (value: MessageFeedback | null) => void;
  /** Keeps the space but hides the buttons, for example while the reply is still being typed. */
  hidden?: boolean;
  className?: string;
}

/** Shown on hover or focus inside the message, always on touch screens. */
export function MessageActions({ text, onRegenerate, feedback = null, onFeedback, hidden, className }: MessageActionsProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const copyIcon = useRef<CopyIconHandle>(null);
  const checkIcon = useRef<CheckIconHandle>(null);
  const retryIcon = useRef<RefreshCcwIconHandle>(null);
  const likeIcon = useRef<ThumbsUpIconHandle>(null);
  const dislikeIcon = useRef<ThumbsDownIconHandle>(null);

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

  function rate(value: MessageFeedback) {
    onFeedback?.(feedback === value ? null : value);
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
      <button type="button" onClick={copy} className={actionButton} {...hoverProps(copied ? checkIcon : copyIcon)}>
        {copied ? (
          <CheckIcon ref={checkIcon} size={ICON_SIZE} aria-hidden />
        ) : (
          <CopyIcon ref={copyIcon} size={ICON_SIZE} aria-hidden />
        )}
        <span aria-live="polite">{copied ? t.chat.copied : t.chat.copy}</span>
      </button>
      {onRegenerate && (
        <button type="button" onClick={onRegenerate} className={actionButton} {...hoverProps(retryIcon)}>
          <RefreshCcwIcon ref={retryIcon} size={ICON_SIZE} aria-hidden />
          {t.chat.retry}
        </button>
      )}
      {onFeedback && (
        <>
          <button
            type="button"
            onClick={() => rate("like")}
            aria-label={t.chat.like}
            aria-pressed={feedback === "like"}
            title={t.chat.like}
            className={cn(actionButton, feedback === "like" && "bg-surface-raised text-text shadow-soft")}
            {...hoverProps(likeIcon)}
          >
            <ThumbsUpIcon ref={likeIcon} size={ICON_SIZE} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => rate("dislike")}
            aria-label={t.chat.dislike}
            aria-pressed={feedback === "dislike"}
            title={t.chat.dislike}
            className={cn(actionButton, feedback === "dislike" && "bg-surface-raised text-text shadow-soft")}
            {...hoverProps(dislikeIcon)}
          >
            <ThumbsDownIcon ref={dislikeIcon} size={ICON_SIZE} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
