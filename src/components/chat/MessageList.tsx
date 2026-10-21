"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mascot } from "@/components/mascot";
import { OrientationCard } from "@/components/OrientationCard";
import { duration, easing, prefersReducedMotion } from "@/design/motion";
import { cn } from "@/lib/utils";
import type { ChatMessage, OrientationCard as Card } from "@/lib/types";
import { TypingIndicator } from "./TypingIndicator";

const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard },
};

interface MessageListProps {
  messages: ChatMessage[];
  pending: boolean;
  card?: Card;
  /** Ids of red-flag replies. The alert mascot sits next to their fixed text and nowhere else. */
  alertMessageIds?: readonly string[];
}

export function MessageList({ messages, pending, card, alertMessageIds = [] }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length <= 1) return;
    endRef.current?.scrollIntoView({ block: "end", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages.length, pending]);

  return (
    <section aria-live="polite" aria-label="Conversación" className="flex flex-1 flex-col gap-3">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          const isAlert = alertMessageIds.includes(message.id);
          return (
            <motion.div
              key={message.id}
              {...enter}
              className={cn("flex items-start gap-3", isUser ? "justify-end pl-8" : "pr-8")}
            >
              {isAlert && <Mascot state="alert" size={44} className="shrink-0" />}
              <p
                className={cn(
                  "min-w-0 break-words px-4 py-3 text-body",
                  isUser
                    ? "rounded-lg rounded-br-sm bg-accent text-accent-foreground"
                    : "rounded-lg rounded-bl-sm border bg-surface-raised text-text shadow-soft",
                  !isUser && (isAlert ? "border-2 border-danger" : "border-border"),
                )}
              >
                {message.content}
              </p>
            </motion.div>
          );
        })}
        {pending && (
          <motion.div key="typing" {...enter} className="flex">
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} aria-hidden className="scroll-mb-52" />
      {card && (
        <motion.div {...enter} exit={undefined}>
          <OrientationCard card={card} />
        </motion.div>
      )}
    </section>
  );
}
