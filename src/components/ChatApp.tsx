"use client";

import { FormEvent, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  ChatHeader,
  ChatInput,
  ChatSidebar,
  EmptyState,
  MessageList,
  QuickReplies,
} from "@/components/chat";
import type { MascotState } from "@/components/mascot";
import type { ChatMessage, TriageResponse } from "@/lib/types";

const STARTERS = ["Dolor de cabeza", "Fiebre", "Dolor abdominal", "Golpe o caída"];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola. Te ayudo a saber a qué nivel de atención acudir. No doy diagnósticos ni recetas. Si te falta el aire, duele el pecho o te sientes muy mal, ve ya a Urgencias.",
};

const FAILURE_TEXT = "No pude completar la orientación. Si te sientes mal, busca atención médica.";
const SPEAKING_MS = 2400;

export function ChatApp({ nombre }: { nombre?: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [eps, setEps] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [alertIds, setAlertIds] = useState<string[]>([]);
  const [errorIds, setErrorIds] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), SPEAKING_MS);
    return () => window.clearTimeout(timer);
  }, [speaking]);

  async function request(history: ChatMessage[]) {
    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eps,
          messages: history
            .filter((message) => message.id !== "welcome" && !errorIds.includes(message.id))
            .map(({ role, content: textContent }) => ({ role, content: textContent })),
        }),
      });
      if (!response.ok) throw new Error("triage failed");
      const data = (await response.json()) as TriageResponse;
      const replyId = crypto.randomUUID();
      setResult(data);
      setMessages((current) => [...current, { id: replyId, role: "assistant", content: data.message }]);
      if (data.kind === "red_flag") setAlertIds((current) => [...current, replyId]);
      setSpeaking(true);
    } catch {
      const failureId = crypto.randomUUID();
      setMessages((current) => [...current, { id: failureId, role: "assistant", content: FAILURE_TEXT }]);
      setErrorIds((current) => [...current, failureId]);
    } finally {
      setPending(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    void request(nextMessages);
  }

  function retry() {
    const lastErrorId = errorIds[errorIds.length - 1];
    if (!lastErrorId || pending) return;
    const history = messages.filter((message) => message.id !== lastErrorId);
    setMessages(history);
    setErrorIds((current) => current.filter((id) => id !== lastErrorId));
    void request(history);
  }

  function reset() {
    setMessages([WELCOME]);
    setDraft("");
    setResult(null);
    setAlertIds([]);
    setErrorIds([]);
    setSpeaking(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  const lastMessage = messages[messages.length - 1];
  const failed = errorIds.includes(lastMessage.id);
  const started = messages.length > 1;
  const replies = result?.quickReplies ?? [];

  // The alert state is not used here: it only sits next to the fixed red-flag text, in MessageList.
  let mascotState: MascotState = "idle";
  if (pending) mascotState = "thinking";
  else if (failed) mascotState = "error";
  else if (speaking) mascotState = "speaking";
  else if (focused) mascotState = "listening";
  else if (result?.kind === "orientation" && result.card && result.card.nivel !== "urgencias") mascotState = "success";

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh bg-surface text-text">
        <ChatSidebar mascotState={mascotState} eps={eps} onEpsChange={setEps} onReset={reset} nombre={nombre} />

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader mascotState={mascotState} eps={eps} onEpsChange={setEps} />

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 sm:px-8">
              {started ? (
                <MessageList
                  messages={messages.filter((message) => message.id !== "welcome")}
                  pending={pending}
                  card={result?.card}
                  alertMessageIds={alertIds}
                  errorMessageIds={errorIds}
                  onRetry={retry}
                />
              ) : (
                <EmptyState nombre={nombre} suggestions={STARTERS} disabled={pending} onSelect={send} />
              )}
            </div>
          </div>

          <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
              <QuickReplies replies={replies} disabled={pending} onSelect={send} />
              <ChatInput
                value={draft}
                pending={pending}
                onChange={setDraft}
                onSubmit={onSubmit}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <p className="text-center text-caption text-text-muted">
                Waylo orienta, no diagnostica ni receta. Si te sientes muy mal, ve a Urgencias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
