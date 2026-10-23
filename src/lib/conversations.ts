import type { Conversation } from "@/lib/types";

export const MAX_CONVERSATIONS = 15;
export const CONVERSATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Longest title a conversation can have, whether the AI wrote it or the person renamed it. */
export const TITLE_MAX_CHARS = 48;

/** One list per account, so switching accounts in the same browser never shows someone else's chats. */
export function storageKey(userId?: string | null): string {
  return `waylo:conversations:${userId || "guest"}`;
}

const newestFirst = (a: Conversation, b: Conversation) => b.createdAt - a.createdAt;

/** Pinned conversations first, then the newest. */
const listOrder = (a: Conversation, b: Conversation) =>
  Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || newestFirst(a, b);

/** Removes the conversation that started first, whether or not it is pinned. */
function dropOldest(list: Conversation[]): void {
  let oldest = 0;
  list.forEach((item, index) => {
    if (item.createdAt < list[oldest].createdAt) oldest = index;
  });
  list.splice(oldest, 1);
}

/** Drops conversations older than a week. `keepId` is the one open on screen, which stays while it is in use. */
export function pruneExpired(list: Conversation[], now: number, keepId?: string): Conversation[] {
  return list.filter((conversation) => conversation.id === keepId || now - conversation.createdAt < CONVERSATION_TTL_MS);
}

/**
 * Saves a conversation, newest first. A new one that would pass the limit pushes out the oldest,
 * counted by when each conversation started.
 */
export function saveConversation(list: Conversation[], conversation: Conversation, now: number): Conversation[] {
  const others = pruneExpired(
    list.filter((item) => item.id !== conversation.id),
    now,
  );

  while (others.length >= MAX_CONVERSATIONS) dropOldest(others);
  return [...others, conversation].sort(listOrder);
}

export function removeConversation(list: Conversation[], id: string): Conversation[] {
  return list.filter((conversation) => conversation.id !== id);
}

/** A title as typed by the person: one line, tidy spaces, no longer than the limit. Empty when nothing is left. */
export function sanitizeTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX_CHARS).trim();
}

/** Gives a conversation a new title. An empty title is ignored, so a conversation is never left nameless. */
export function renameConversation(list: Conversation[], id: string, title: string): Conversation[] {
  const next = sanitizeTitle(title);
  if (!next) return list;
  return list.map((conversation) => (conversation.id === id ? { ...conversation, title: next } : conversation));
}

/** Pins a conversation to the top of the list, or unpins it. */
export function togglePin(list: Conversation[], id: string): Conversation[] {
  return list
    .map((conversation) => (conversation.id === id ? { ...conversation, pinned: !conversation.pinned } : conversation))
    .sort(listOrder);
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Conversation>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number" &&
    Array.isArray(item.messages) &&
    Array.isArray(item.alertIds) &&
    Array.isArray(item.errorIds)
  );
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

/** The saved conversations, without the expired ones. Anything unreadable counts as empty. */
export function readConversations(storage: ReadableStorage, key: string, now: number): Conversation[] {
  try {
    const raw = storage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Anything beyond the limit is cut by age first, then the list is put in display order.
    return pruneExpired(parsed.filter(isConversation), now)
      .sort(newestFirst)
      .slice(0, MAX_CONVERSATIONS)
      .sort(listOrder);
  } catch {
    return [];
  }
}

/** Saves the list. If the browser is out of space, the oldest conversations go first until it fits. */
export function writeConversations(storage: WritableStorage, key: string, list: Conversation[]): void {
  const remaining = [...list].sort(newestFirst);
  while (true) {
    try {
      storage.setItem(key, JSON.stringify(remaining));
      return;
    } catch {
      if (remaining.length <= 1) return;
      remaining.pop();
    }
  }
}

/** A title taken straight from the first message, used until the AI's title arrives or if it never does. */
export function fallbackTitle(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 6).join(" ");
  if (!words) return "Nueva conversación";
  return words.length > TITLE_MAX_CHARS ? `${words.slice(0, TITLE_MAX_CHARS - 1).trimEnd()}…` : words;
}

/** Tidies a title written by the AI: one line, no quotes or closing period, a sensible length. */
export function cleanTitle(raw: string): string {
  const line = raw.split(/\r?\n/).find((part) => part.trim()) ?? "";
  // Quotes, markdown marks and the closing period can come in any order, so they are cleared together.
  const cleaned = line
    .replace(/^[\s"'“”«»*#_-]+|[\s"'“”«»*#_.。]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > TITLE_MAX_CHARS ? `${cleaned.slice(0, TITLE_MAX_CHARS - 1).trimEnd()}…` : cleaned;
}
