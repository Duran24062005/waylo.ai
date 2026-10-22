"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mascot, MascotMark } from "@/components/mascot";
import { OrientationCard } from "@/components/OrientationCard";
import { buttonSoft } from "@/components/ui/buttons";
import { duration, easing, prefersReducedMotion } from "@/design/motion";
import { cn } from "@/lib/utils";
import type { ChatMessage, OrientationCard as Card } from "@/lib/types";
import { MessageActions } from "./MessageActions";
import { ThinkingLoader } from "./ThinkingLoader";
import { TypewriterText } from "./TypewriterText";

const enter = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.standard },
};

// Replies take the place of the thinking indicator, so they only fade in and never move.
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.fast, ease: easing.standard },
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
  /** Asks for a new answer to the turn that this assistant reply closed. */
  onRegenerate?: (assistantId: string) => void;
}

interface AssistantTextProps {
  message: ChatMessage;
  animate: boolean;
  isAlert: boolean;
  isError: boolean;
  isLastError: boolean;
  pending: boolean;
  onRetry?: () => void;
  onRegenerate?: (assistantId: string) => void;
}

function AssistantText({ message, animate, isAlert, isError, isLastError, pending, onRetry, onRegenerate }: AssistantTextProps) {
  const [done, setDone] = useState(!animate);

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <p
        className={cn(
          "min-w-0 break-words text-base text-text",
          // Centers the first line (24px) on the 36px mascot.
          !isAlert && !isError && "mt-1.5",
          isAlert && "rounded-lg bg-danger px-5 py-4 font-semibold text-danger-foreground shadow-raised",
          isError && "rounded-lg bg-surface-raised px-5 py-4 shadow-soft",
        )}
      >
        {animate ? <TypewriterText text={message.content} onDone={() => setDone(true)} /> : message.content}
      </p>
      {isError ? (
        isLastError && onRetry && !pending ? (
          <button type="button" onClick={onRetry} className={cn(buttonSoft, "mt-2 min-h-11 px-5 text-base")}>
            Intentar de nuevo
          </button>
        ) : null
      ) : (
        <MessageActions
          text={message.content}
          hidden={!done}
          onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
        />
      )}
    </div>
  );
}

export function MessageList({
  messages,
  pending,
  card,
  alertMessageIds = [],
  errorMessageIds = [],
  onRetry,
  onRegenerate,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  // Replies present on mount show at once; only later ones are typed.
  const initialIds = useRef(new Set(messages.map((message) => message.id)));

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
              <motion.div key={message.id} {...enter} className="group flex flex-col items-end gap-1 pl-10 sm:pl-24">
                <p className="max-w-full min-w-0 break-words rounded-xl rounded-br-sm bg-accent px-5 py-3 text-base text-accent-foreground shadow-solid">
                  {message.content}
                </p>
                <MessageActions text={message.content} />
              </motion.div>
            );
          }

          return (
            <motion.div key={message.id} {...fade} className="group flex items-start gap-4 pr-4 sm:pr-24">
              {isAlert ? (
                <Mascot state="alert" size={44} className="shrink-0" />
              ) : isError ? (
                <Mascot state="error" size={44} className="shrink-0" />
              ) : (
                <MascotMark size={36} className="shrink-0" />
              )}
              <AssistantText
                message={message}
                animate={!initialIds.current.has(message.id) && !isAlert && !isError}
                isAlert={isAlert}
                isError={isError}
                isLastError={message.id === lastErrorId}
                pending={pending}
                onRetry={onRetry}
                onRegenerate={onRegenerate}
              />
            </motion.div>
          );
        })}
        {pending && (
          <motion.div key="typing" {...enter} exit={undefined}>
            <ThinkingLoader />
          </motion.div>
        )}
      </AnimatePresence>
      {card && (
        <motion.div {...enter} exit={undefined} className="pl-13 pr-4 sm:pr-24">
          <OrientationCard card={card} />
        </motion.div>
      )}
      <div ref={endRef} aria-hidden className="scroll-mb-8" />
    </section>
  );
}
