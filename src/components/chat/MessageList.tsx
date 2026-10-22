"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mascot, MascotMark } from "@/components/mascot";
import { OrientationCard } from "@/components/OrientationCard";
import { buttonSoft } from "@/components/ui/buttons";
import { duration, easing, prefersReducedMotion } from "@/design/motion";
import { cn } from "@/lib/utils";
import type { ChatMessage, OrientationCard as Card } from "@/lib/types";
import { TypingIndicator } from "./TypingIndicator";

const enter = {
  initial: { opacity: 0, y: 14 },
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
  /** Ids of replies that are a failure notice, and the retry action for the last one. */
  errorMessageIds?: readonly string[];
  onRetry?: () => void;
}

export function MessageList({
  messages,
  pending,
  card,
  alertMessageIds = [],
  errorMessageIds = [],
  onRetry,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages.length, pending, card]);

  const lastErrorId = errorMessageIds[errorMessageIds.length - 1];

  return (
    <section aria-live="polite" aria-label="Conversación" className="flex flex-col gap-8 py-8">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          const isAlert = alertMessageIds.includes(message.id);
          const isError = errorMessageIds.includes(message.id);

          if (isUser) {
            return (
              <motion.div key={message.id} {...enter} className="flex justify-end pl-10 sm:pl-24">
                <p className="max-w-full min-w-0 break-words rounded-xl rounded-br-sm bg-accent px-5 py-3 text-body text-accent-foreground shadow-solid">
                  {message.content}
                </p>
              </motion.div>
            );
          }

          return (
            <motion.div key={message.id} {...enter} className="flex items-start gap-4 pr-4 sm:pr-24">
              {isAlert ? (
                <Mascot state="alert" size={44} className="shrink-0" />
              ) : isError ? (
                <Mascot state="error" size={44} className="shrink-0" />
              ) : (
                <MascotMark size={36} className="mt-1 shrink-0" />
              )}
              <div className="flex min-w-0 flex-col items-start gap-4">
                <p
                  className={cn(
                    "min-w-0 break-words text-body-lg text-text",
                    isAlert && "rounded-lg bg-danger px-5 py-4 font-semibold text-danger-foreground shadow-raised",
                    isError && "rounded-lg bg-surface-raised px-5 py-4 shadow-soft",
                  )}
                >
                  {message.content}
                </p>
                {isError && message.id === lastErrorId && onRetry && !pending ? (
                  <button type="button" onClick={onRetry} className={cn(buttonSoft, "min-h-11 px-5 text-base")}>
                    Intentar de nuevo
                  </button>
                ) : null}
              </div>
            </motion.div>
          );
        })}
        {pending && (
          <motion.div key="typing" {...enter}>
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>
      {card && (
        <motion.div {...enter} exit={undefined} className="sm:pl-14">
          <OrientationCard card={card} />
        </motion.div>
      )}
      <div ref={endRef} aria-hidden className="scroll-mb-8" />
    </section>
  );
}
