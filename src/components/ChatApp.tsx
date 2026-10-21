"use client";

import { FormEvent, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { ChatHeader, ChatInput, EpsField, MessageList, QuickReplies } from "@/components/chat";
import type { MascotState } from "@/components/mascot";
import type { ChatMessage, TriageResponse } from "@/lib/types";

const STARTERS = ["Dolor de cabeza", "Fiebre", "Dolor abdominal", "Golpe o caída"];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola. Te ayudo a saber a qué nivel de atención acudir. No doy diagnósticos ni recetas. Si te falta el aire, duele el pecho o te sientes muy mal, ve ya a Urgencias.",
};

const SPEAKING_MS = 2400;

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [eps, setEps] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [alertIds, setAlertIds] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), SPEAKING_MS);
    return () => window.clearTimeout(timer);
  }, [speaking]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eps,
          messages: nextMessages
            .filter((message) => message.id !== "welcome")
            .map(({ role, content: textContent }) => ({ role, content: textContent })),
        }),
      });
      const data = (await response.json()) as TriageResponse;
      const replyId = crypto.randomUUID();
      setResult(data);
      setMessages((current) => [...current, { id: replyId, role: "assistant", content: data.message }]);
      if (data.kind === "red_flag") setAlertIds((current) => [...current, replyId]);
      setSpeaking(true);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "No pude completar la orientación. Si te sientes mal, busca atención médica.",
        },
      ]);
      setSpeaking(true);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  const replies = result?.quickReplies ?? (messages.length === 1 ? STARTERS : []);

  // The alert state is never used in the header: it only sits next to the fixed red-flag text.
  let mascotState: MascotState = "idle";
  if (pending) mascotState = "thinking";
  else if (speaking) mascotState = "speaking";
  else if (focused) mascotState = "listening";
  else if (result?.kind === "orientation" && result.card && result.card.nivel !== "urgencias") mascotState = "success";

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-x-clip px-4 pt-4">
        <ChatHeader mascotState={mascotState} />
        <EpsField value={eps} onChange={setEps} />
        <MessageList
          messages={messages}
          pending={pending}
          card={result?.card}
          alertMessageIds={alertIds}
        />
        <div className="sticky bottom-0 z-10 -mx-4 mt-4 space-y-3 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <QuickReplies replies={replies} disabled={pending} onSelect={(reply) => void send(reply)} />
          <ChatInput
            value={draft}
            pending={pending}
            onChange={setDraft}
            onSubmit={onSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </main>
    </MotionConfig>
  );
}
