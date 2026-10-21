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
    <div role="group" aria-label="Respuestas rápidas" className="flex flex-wrap gap-3">
      {replies.map((reply, index) => (
        <motion.div
          key={reply}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.standard, delay: index * 0.07 }}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(reply)}
            className="lift lift-sm inline-flex min-h-11 items-center rounded-full bg-surface-raised px-5 font-heading text-base font-medium text-text shadow-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reply}
          </button>
        </motion.div>
      ))}
    </div>
  );
}
