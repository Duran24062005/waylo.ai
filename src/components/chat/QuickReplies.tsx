"use client";

import { motion } from "motion/react";
import { duration, easing } from "@/design/motion";

interface QuickRepliesProps {
  replies: string[];
  disabled?: boolean;
  onSelect: (reply: string) => void;
}

export function QuickReplies({ replies, disabled, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div role="group" aria-label="Respuestas rápidas" className="flex flex-wrap gap-2">
      {replies.map((reply, index) => (
        <motion.button
          key={reply}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.standard, delay: index * 0.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex min-h-11 items-center rounded-full border-2 border-border-strong bg-surface-raised px-4 text-body font-bold text-text shadow-soft transition-colors duration-[var(--duration-fast)] ease-standard hover:border-accent hover:bg-surface hover:text-accent active:border-accent active:bg-accent active:text-accent-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reply}
        </motion.button>
      ))}
    </div>
  );
}
