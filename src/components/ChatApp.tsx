"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import {
  ChatHeader,
  ChatInput,
  ChatSidebar,
  EmptyState,
  MessageList,
  QuickReplies,
} from "@/components/chat";
import { LiveControls, LiveStage, MASCOT_STATE, useLiveVoice } from "@/components/live";
import type { MascotState } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { orientationNote } from "@/lib/orientation-note";
import type { ChatMessage, TriageResponse } from "@/lib/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola. Te ayudo a saber a qué nivel de atención acudir. No doy diagnósticos ni recetas. Si te falta el aire, duele el pecho o te sientes muy mal, ve ya a Urgencias.",
};

const FAILURE_TEXT = "No pude completar la orientación. Si te sientes mal, busca atención médica.";
const SPEAKING_MS = 2400;
const MIN_THINKING_MS = 2500;

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

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
  // Bumped on reset so a request still waiting for its minimum time can't write into the new chat.
  const requestIdRef = useRef(0);

  // What the patient says is sent exactly like typed text, so both get the same kind of answer.
  const live = useLiveVoice({ onUtterance: send, busy: pending });
  const { active: liveActive, speak: speakReply, silence: silenceVoice } = live;
  const spokenId = useRef("welcome");

  // Turning the voice on must not read the earlier conversation aloud.
  useEffect(() => {
    if (liveActive) spokenId.current = messages[messages.length - 1].id;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the mode is switched
  }, [liveActive]);

  // New replies are read aloud while the voice mode is on. Failure notices are not.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!liveActive || last.role !== "assistant" || last.id === spokenId.current) return;
    spokenId.current = last.id;
    if (!errorIds.includes(last.id)) speakReply(last.content);
  }, [liveActive, messages, errorIds, speakReply]);

  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), SPEAKING_MS);
    return () => window.clearTimeout(timer);
  }, [speaking]);

  async function request(history: ChatMessage[]) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPending(true);
    setResult(null);
    const startedAt = Date.now();

    const call = fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eps,
        messages: history
          .filter((message) => message.id !== "welcome" && !errorIds.includes(message.id))
          // The model never sees the card, so it gets a note about the orientation it already gave.
          .map(({ role, content: textContent, card }) => ({
            role,
            content: card ? `${textContent}\n${orientationNote(card)}` : textContent,
          })),
      }),
    }).then((response) => {
      if (!response.ok) throw new Error("triage failed");
      return response.json() as Promise<TriageResponse>;
    });

    // The reply, or the failure text, only shows once the minimum thinking time has passed.
    const [outcome] = await Promise.allSettled([
      call,
      wait(Math.max(0, MIN_THINKING_MS - (Date.now() - startedAt))),
    ]);
    if (requestId !== requestIdRef.current) return;

    if (outcome.status === "fulfilled") {
      const data = outcome.value;
      const replyId = crypto.randomUUID();
      setResult(data);
      setMessages((current) => [...current, { id: replyId, role: "assistant", content: data.message, card: data.card }]);
      if (data.kind === "red_flag") setAlertIds((current) => [...current, replyId]);
      setSpeaking(true);
    } else {
      const failureId = crypto.randomUUID();
      setMessages((current) => [...current, { id: failureId, role: "assistant", content: FAILURE_TEXT }]);
      setErrorIds((current) => [...current, failureId]);
    }
    setPending(false);
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

  function regenerate(assistantId: string) {
    if (pending) return;
    const index = messages.findIndex((message) => message.id === assistantId);
    if (index === -1 || assistantId === "welcome") return;
    // Everything before the reply, so the user message it answered is sent again.
    const history = messages.slice(0, index);
    setMessages(history);
    setAlertIds((current) => current.filter((id) => id !== assistantId));
    setErrorIds((current) => current.filter((id) => id !== assistantId));
    setResult(null);
    void request(history);
  }

  function reset() {
    requestIdRef.current += 1;
    setMessages([WELCOME]);
    setDraft("");
    setPending(false);
    setResult(null);
    setAlertIds([]);
    setErrorIds([]);
    setSpeaking(false);
    silenceVoice();
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
  if (liveActive) mascotState = MASCOT_STATE[live.phase];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh bg-surface text-text">
        <ChatSidebar
          mascotState={mascotState}
          eps={eps}
          onEpsChange={setEps}
          onReset={reset}
          nombre={nombre}
          hideMascot={liveActive}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader mascotState={mascotState} eps={eps} onEpsChange={setEps} />

          {/* Empty: the greeting sits right above the composer. Started: the conversation scrolls here. */}
          <div className="flex min-h-0 flex-1 flex-col">
            {started ? (
              <div data-lenis-prevent className="flex-1 overflow-y-auto">
                <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 sm:px-8">
                  {liveActive && (
                    <div className="sticky top-0 z-10 -mx-4 bg-surface/85 px-4 backdrop-blur-md sm:-mx-8 sm:px-8">
                      <LiveStage phase={live.phase} levelRef={live.levelRef} notice={live.notice} compact />
                    </div>
                  )}
                  <MessageList
                    messages={messages.filter((message) => message.id !== "welcome")}
                    pending={pending}
                    alertMessageIds={alertIds}
                    errorMessageIds={errorIds}
                    onRetry={retry}
                    onRegenerate={regenerate}
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-end px-4 pb-6 sm:px-8">
                {liveActive ? (
                  <LiveStage phase={live.phase} levelRef={live.levelRef} notice={live.notice} />
                ) : (
                  <EmptyState nombre={nombre} />
                )}
              </div>
            )}
          </div>

          {/* Glides from the middle of the screen to the bottom on the first message. */}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-2 sm:px-8">
            <QuickReplies replies={replies} disabled={pending} onSelect={send} />
            {live.error && !liveActive && (
              <p role="alert" className="text-center text-sm text-text-muted">
                {live.error}
              </p>
            )}
            <motion.div
              layout="position"
              layoutDependency={started}
              transition={{ duration: duration.slow, ease: easing.standard }}
              className="flex items-end"
            >
              <div className="min-w-0 flex-1">
                <ChatInput
                  value={draft}
                  pending={pending}
                  onChange={setDraft}
                  onSubmit={onSubmit}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </div>
              <div className="ml-3 shrink-0">
                <LiveControls
                  supported={live.supported}
                  active={liveActive}
                  muted={live.muted}
                  onStart={live.start}
                  onStop={live.stop}
                  onToggleMute={live.toggleMute}
                />
              </div>
            </motion.div>
          </div>

          {/* Empty spacer that mirrors the upper area, so the composer stays centered while the chat is empty. */}
          {!started && <div aria-hidden className="min-h-0 flex-1" />}

          <p className="mx-auto mt-4 w-full max-w-5xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-text-muted sm:px-8">
            Waylo orienta, no diagnostica ni receta. Si te sientes muy mal, ve a Urgencias.
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}
