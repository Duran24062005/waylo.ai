"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/locales";
import {
  ChatHeader,
  ChatInput,
  ChatSidebar,
  EmptyState,
  GuestLimitNotice,
  MessageList,
} from "@/components/chat";
import { UsageLimitNotice } from "@/components/chat/UsageLimitNotice";
import { useAttachments } from "@/components/chat/useAttachments";
import { LiveControls, LiveStage, MASCOT_STATE, useLiveVoice } from "@/components/live";
import type { MascotState } from "@/components/mascot";
import { ScrollEdge } from "@/components/chat/ScrollEdge";
import { useRemaining } from "@/components/chat/useRemaining";
import type { SectionId } from "@/components/settings/sections";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { SmoothScrollArea } from "@/components/SmoothScrollArea";
import { duration, easing } from "@/design/motion";
import {
  fallbackTitle,
  readConversations,
  removeConversation,
  renameConversation,
  saveConversation,
  storageKey,
  togglePin,
  writeConversations,
} from "@/lib/conversations";
import type { WireAttachment } from "@/lib/attachments";
import { orientationNote } from "@/lib/orientation-note";
import type { AccountUsage, Attachment, ChatMessage, Conversation, GuestUsage, TriageResponse } from "@/lib/types";

// The empty chat starts with this marker message. It is never shown or sent: the greeting on screen is its own component.
const WELCOME: ChatMessage = { id: "welcome", role: "assistant", content: "" };

const SPEAKING_MS = 2400;
const MIN_THINKING_MS = 2500;

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

/** The server refused the request because the visitor used up the free replies. It says when they come back. */
class GuestLimitError extends Error {
  constructor(readonly guest?: GuestUsage) {
    super("guest_limit");
  }
}

/** The server refused the request because the account used up its daily or monthly replies. */
class UsageLimitError extends Error {
  constructor(readonly usage?: AccountUsage) {
    super("usage_limit");
  }
}

/** What is saved of a file: its name and kind. The content (a photo, a document's text) stays in memory only. */
function withoutContent(message: ChatMessage): ChatMessage {
  if (!message.attachments) return message;
  return { ...message, attachments: message.attachments.map(({ id, name, kind }) => ({ id, name, kind })) };
}

/** The files of a message as the triage route takes them. Only the newest message sends its photos. */
function wireAttachments(attachments: Attachment[] | undefined, withPhotos: boolean): WireAttachment[] | undefined {
  if (!attachments?.length) return undefined;
  return attachments.flatMap(({ name, kind, text, dataUrl, truncated }): WireAttachment[] => {
    if (kind === "document") return text ? [{ kind, name, text, truncated }] : [];
    return [{ kind, name, dataUrl: withPhotos ? dataUrl : undefined }];
  });
}

/** Browsers can block storage (private windows, blocked site data), so every access is guarded. */
function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface ChatAppProps {
  /** Opens the settings window when the page arrives, on this section (a link such as /chat?settings=usage). */
  initialSettings?: SectionId;
  nombre?: string | null;
  /** Keeps the saved conversations of each account apart. */
  userId?: string | null;
  /** Only for visitors without an account: how many free replies they have used. */
  guest?: GuestUsage;
  /** Only for signed-in accounts: the daily and monthly replies used, and the wait if they ran out. */
  usage?: AccountUsage;
}

function ChatAppInner({ nombre, userId, guest, usage: initialUsage }: ChatAppProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const attached = useAttachments();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [alertIds, setAlertIds] = useState<string[]>([]);
  const [errorIds, setErrorIds] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [guestUsed, setGuestUsed] = useState(guest?.used ?? 0);
  // When the free replies come back, once they are used up.
  const [guestResetAt, setGuestResetAt] = useState(guest?.resetAt);
  const [limitAttempted, setLimitAttempted] = useState(false);
  const [usage, setUsage] = useState(initialUsage);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState(() => crypto.randomUUID());
  // Bumped on reset so a request still waiting for its minimum time can't write into the new chat.
  const requestIdRef = useRef(0);
  const conversationsRef = useRef<Conversation[]>([]);
  const loadedRef = useRef(false);
  // The account the open conversation belongs to. It lags one render behind when the account changes.
  const previousUser = useRef(userId);
  const key = storageKey(userId);

  // Signing in or out re-renders the page with a new account. The server's count replaces the one on screen.
  const serverGuestUsed = guest?.used ?? 0;
  const serverResetAt = guest?.resetAt;
  useEffect(() => {
    setGuestUsed(serverGuestUsed);
    setGuestResetAt(serverResetAt);
  }, [serverGuestUsed, serverResetAt, userId]);

  // The wait counts down on screen. When it ends the five replies are back, without reloading the page.
  const waitLeft = useRemaining(guestResetAt);
  useEffect(() => {
    if (waitLeft !== 0) return;
    setGuestUsed(0);
    setGuestResetAt(undefined);
    setLimitAttempted(false);
  }, [waitLeft]);

  const limitReached = Boolean(guest) && guestUsed >= (guest?.limit ?? Infinity);

  // A signed-in account that used its daily or monthly replies waits too, and gets them back on screen when it ends.
  useEffect(() => setUsage(initialUsage), [initialUsage]);
  const blocked = usage?.blocked ?? null;
  const blockLeft = useRemaining(blocked?.resetAt);
  useEffect(() => {
    if (blockLeft !== 0) return;
    setUsage((current) =>
      current && current.blocked
        ? {
            ...current,
            blocked: null,
            dayUsed: current.blocked.scope === "day" ? 0 : current.dayUsed,
            monthUsed: current.blocked.scope === "month" ? 0 : current.monthUsed,
          }
        : current,
    );
    setLimitAttempted(false);
  }, [blockLeft]);
  const accountBlocked = Boolean(blocked) && blockLeft !== 0;

  // The patient can always type. The notice shows once they start writing or try to send.
  const writing = draft.trim().length > 0 || attached.items.length > 0;
  const showLimit = limitReached && (writing || limitAttempted);
  const showUsageLimit = accountBlocked && (writing || limitAttempted);

  // What the patient says is sent exactly like typed text, so both get the same kind of answer.
  const live = useLiveVoice({ onUtterance: (text, language) => send(text, language ?? undefined), busy: pending });
  const { active: liveActive, speak: speakReply, silence: silenceVoice, stop: stopLive } = live;
  const spokenId = useRef("welcome");
  // The language of the latest reply, so it is read aloud in it (a Live conversation in another language).
  const replyLanguage = useRef<Locale | undefined>(undefined);

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
    if (!errorIds.includes(last.id)) speakReply(last.content, replyLanguage.current);
  }, [liveActive, messages, errorIds, speakReply]);

  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), SPEAKING_MS);
    return () => window.clearTimeout(timer);
  }, [speaking]);

  const commit = useCallback(
    (next: Conversation[]) => {
      conversationsRef.current = next;
      setConversations(next);
      const storage = getStorage();
      if (storage) writeConversations(storage, key, next);
    },
    [key],
  );

  // Saved conversations are read once the page is in the browser.
  useEffect(() => {
    const storage = getStorage();
    const saved = storage ? readConversations(storage, key, Date.now()) : [];
    conversationsRef.current = saved;
    setConversations(saved);
    loadedRef.current = true;
  }, [key]);

  // The open conversation is saved as it changes. Starting a new one past the limit pushes out the oldest.
  useEffect(() => {
    if (!loadedRef.current || messages.length < 2) return;
    // Right after signing in or out, the open conversation still belongs to the other account. It must not be saved here.
    if (previousUser.current !== userId) return;
    const now = Date.now();
    const existing = conversationsRef.current.find((item) => item.id === activeId);
    const firstUser = messages.find((message) => message.role === "user");
    commit(
      saveConversation(
        conversationsRef.current,
        {
          // Keeps what the person set on the conversation, such as the pin.
          ...existing,
          id: activeId,
          title: existing?.title ?? fallbackTitle(firstUser?.content ?? ""),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          messages: messages.filter((message) => message.id !== "welcome").map(withoutContent),
          alertIds,
          errorIds,
        },
        now,
      ),
    );
  }, [messages, alertIds, errorIds, activeId, commit, userId]);

  /** Asks the AI for a title from the first message. The first words stay as the title if it cannot. */
  async function requestTitle(conversationId: string, firstMessage: string) {
    try {
      const response = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: firstMessage }),
      });
      if (!response.ok) return;
      const { title } = (await response.json()) as { title?: string };
      if (!title) return;
      // A title the person already chose is never replaced by the AI's.
      const placeholder = fallbackTitle(firstMessage);
      commit(
        conversationsRef.current.map((item) =>
          item.id === conversationId && item.title === placeholder ? { ...item, title } : item,
        ),
      );
    } catch {
      // The fallback title stays.
    }
  }

  /** A message that was not answered goes back to the input, with its files. Words the chat added for a file alone are dropped. */
  function returnToInput(message: ChatMessage) {
    const onlyFiles = Boolean(message.attachments?.length) && message.content === t.chat.attach.sentOnly;
    setDraft(onlyFiles ? "" : message.content);
    attached.restore(message.attachments);
  }

  async function request(history: ChatMessage[], avoid?: string, language?: Locale) {
    replyLanguage.current = language;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPending(true);
    setResult(null);
    const startedAt = Date.now();

    const call = fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Only set when redoing a reply: it tells the AI which answer to say differently.
        avoid,
        // Only set when the patient spoke in a language: the reply comes back in it.
        lang: language,
        messages: history
          .filter((message) => message.id !== "welcome" && !errorIds.includes(message.id))
          // The model never sees the card, so it gets a note about the orientation it already gave.
          .map(({ role, content: textContent, card, attachments }, index, kept) => ({
            role,
            content: card ? `${textContent}\n${orientationNote(card)}` : textContent,
            attachments: wireAttachments(attachments, index === kept.length - 1),
          })),
      }),
    }).then(async (response) => {
      if (response.status === 403) {
        const body = (await response.json().catch(() => null)) as { error?: string; guest?: GuestUsage; usage?: AccountUsage } | null;
        if (body?.error === "usage_limit") throw new UsageLimitError(body.usage);
        throw new GuestLimitError(body?.guest);
      }
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
      if (data.guest) {
        setGuestUsed(data.guest.used);
        setGuestResetAt(data.guest.resetAt);
      }
      if (data.usage) setUsage(data.usage);
      setResult(data);
      setMessages((current) => [...current, { id: replyId, role: "assistant", content: data.message, card: data.card }]);
      if (data.kind === "red_flag") setAlertIds((current) => [...current, replyId]);
      setSpeaking(true);
    } else if (outcome.reason instanceof UsageLimitError) {
      // The account ran out of replies. The message was not answered, so it goes back to the input.
      const unanswered = history[history.length - 1];
      if (outcome.reason.usage) setUsage(outcome.reason.usage);
      setMessages(history.slice(0, -1));
      if (unanswered?.role === "user") returnToInput(unanswered);
      setLimitAttempted(true);
    } else if (outcome.reason instanceof GuestLimitError) {
      // The server's count wins over the screen's. The message was not answered, so it goes back to the input.
      const unanswered = history[history.length - 1];
      setGuestUsed(outcome.reason.guest?.used ?? guest?.limit ?? 0);
      setGuestResetAt(outcome.reason.guest?.resetAt);
      setMessages(history.slice(0, -1));
      if (unanswered?.role === "user") returnToInput(unanswered);
      setLimitAttempted(true);
    } else {
      const failureId = crypto.randomUUID();
      setMessages((current) => [...current, { id: failureId, role: "assistant", content: t.chat.failure }]);
      setErrorIds((current) => [...current, failureId]);
    }
    setPending(false);
  }

  function send(text: string, language?: Locale, files: Attachment[] = []) {
    // A message can be only files: the chat words it, so the AI and the conversation both have a sentence to answer.
    const content = text.trim() || (files.length > 0 ? t.chat.attach.sentOnly : "");
    if (!content || pending) return;

    if (limitReached || accountBlocked) {
      // Nothing is sent. The voice mode ends so the notice with the sign-in button can be seen.
      setLimitAttempted(true);
      if (liveActive) stopLive();
      return;
    }

    const isFirstMessage = !messages.some((message) => message.role === "user");
    const nextMessages = [
      ...messages,
      { id: crypto.randomUUID(), role: "user" as const, content, ...(files.length > 0 && { attachments: files }) },
    ];
    setMessages(nextMessages);
    setDraft("");
    attached.clear();
    void request(nextMessages, undefined, language);
    if (isFirstMessage) void requestTitle(activeId, content);
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
    if (limitReached || accountBlocked) {
      setLimitAttempted(true);
      return;
    }
    const index = messages.findIndex((message) => message.id === assistantId);
    if (index === -1 || assistantId === "welcome") return;
    // Everything before the reply, so the user message it answered is sent again.
    const history = messages.slice(0, index);
    setMessages(history);
    setAlertIds((current) => current.filter((id) => id !== assistantId));
    setErrorIds((current) => current.filter((id) => id !== assistantId));
    setResult(null);
    // The reply being redone goes along, so the AI answers the same question in a different way.
    void request(history, messages[index].content);
  }

  /** Starts a new, empty conversation. The one that was open stays saved. */
  function reset() {
    requestIdRef.current += 1;
    setActiveId(crypto.randomUUID());
    setMessages([WELCOME]);
    setDraft("");
    attached.clear();
    setPending(false);
    setResult(null);
    setAlertIds([]);
    setErrorIds([]);
    setSpeaking(false);
    setLimitAttempted(false);
    silenceVoice();
  }

  // When the account changes (sign-out, sign-in), the open conversation belongs to the previous one and must go.
  useEffect(() => {
    if (previousUser.current === userId) return;
    previousUser.current = userId;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only clears state, and it runs once per change of account
  }, [userId]);

  function openConversation(id: string) {
    const target = conversationsRef.current.find((item) => item.id === id);
    if (!target || id === activeId) return;
    requestIdRef.current += 1;
    setActiveId(id);
    setMessages([WELCOME, ...target.messages]);
    setAlertIds(target.alertIds);
    setErrorIds(target.errorIds);
    setDraft("");
    attached.clear();
    setPending(false);
    setResult(null);
    setSpeaking(false);
    setLimitAttempted(false);
    silenceVoice();
  }

  function renameSaved(id: string, title: string) {
    commit(renameConversation(conversationsRef.current, id, title));
  }

  function togglePinSaved(id: string) {
    commit(togglePin(conversationsRef.current, id));
  }

  function deleteConversation(id: string) {
    commit(removeConversation(conversationsRef.current, id));
    if (id === activeId) reset();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (attached.busy) return;
    send(draft, undefined, attached.ready);
  }

  const lastMessage = messages[messages.length - 1];
  const failed = errorIds.includes(lastMessage.id);
  const started = messages.length > 1;
  // The composer sits in the middle while the chat is empty, and also during the voice mode, which shows only the mascot.
  const centered = !started || liveActive;

  // The alert state is not used here: it only sits next to the fixed red-flag text, in MessageList.
  // With nothing going on and no one writing, Waylo rests. Clicking the input wakes it ("listening").
  let mascotState: MascotState = "resting";
  if (pending) mascotState = "thinking";
  else if (failed) mascotState = "error";
  else if (speaking) mascotState = "speaking";
  else if (focused) mascotState = "listening";
  else if (result?.kind === "orientation" && result.card && result.card.nivel !== "urgencias") mascotState = "success";
  if (liveActive) mascotState = MASCOT_STATE[live.phase];

  const conversationProps = {
    conversations,
    activeId,
    onOpenConversation: openConversation,
    onRenameConversation: renameSaved,
    onTogglePinConversation: togglePinSaved,
    onDeleteConversation: deleteConversation,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh bg-surface text-text">
        <ChatSidebar
          mascotState={mascotState}
          onReset={reset}
          nombre={nombre}
          hideMascot={liveActive}
          guestLeft={guest ? Math.max(0, guest.limit - guestUsed) : undefined}
          guestWaitMs={waitLeft}
          {...conversationProps}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader mascotState={mascotState} onReset={reset} {...conversationProps} />

          {/* Voice mode: only the mascot, as at the start. Empty: the greeting. Started: the conversation scrolls here. */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            {liveActive ? (
              <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-end px-4 pb-6 sm:px-8">
                <LiveStage phase={live.phase} levelRef={live.levelRef} notice={failed ? t.chat.failure : live.notice} />
              </div>
            ) : started ? (
              <SmoothScrollArea
                className="scroll-soft scroll-fade flex-1 overflow-y-auto"
                contentClassName="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 sm:px-8"
                overlay={<ScrollEdge />}
              >
                <MessageList
                  key={activeId}
                  messages={messages.filter((message) => message.id !== "welcome")}
                  pending={pending}
                  alertMessageIds={alertIds}
                  errorMessageIds={errorIds}
                  onRetry={retry}
                  onRegenerate={regenerate}
                />
              </SmoothScrollArea>
            ) : (
              <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-end px-4 pb-6 sm:px-8">
                <EmptyState nombre={nombre} />
              </div>
            )}
          </div>

          {/* Glides between the middle of the screen and the bottom as the layout changes. */}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-2 sm:px-8">
            {showLimit && <GuestLimitNotice waitMs={waitLeft} />}
            {showUsageLimit && blocked && (
              <UsageLimitNotice scope={blocked.scope} resetAt={blocked.resetAt} waitMs={blockLeft} />
            )}
            {live.error && !liveActive && (
              <p role="alert" className="text-center text-sm text-text-muted">
                {live.error}
              </p>
            )}
            <motion.div
              layout="position"
              layoutDependency={centered}
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
                  attachments={attached.items}
                  attachNotice={attached.notice}
                  onAttach={attached.add}
                  onRemoveAttachment={attached.remove}
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
          {centered && <div aria-hidden className="min-h-0 flex-1" />}

          <p className="mx-auto mt-4 w-full max-w-5xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-text-muted sm:px-8">
            {t.chat.disclaimer}
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}

export function ChatApp({ initialSettings, ...props }: ChatAppProps) {
  return (
    <SettingsProvider initialSection={initialSettings}>
      <ChatAppInner {...props} />
    </SettingsProvider>
  );
}
