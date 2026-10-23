import { describe, expect, it, vi } from "vitest";
import {
  cleanTitle,
  CONVERSATION_TTL_MS,
  fallbackTitle,
  MAX_CONVERSATIONS,
  pruneExpired,
  readConversations,
  removeConversation,
  renameConversation,
  sanitizeTitle,
  saveConversation,
  storageKey,
  TITLE_MAX_CHARS,
  togglePin,
  writeConversations,
} from "@/lib/conversations";
import type { Conversation } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

function conversation(id: string, createdAt: number, title = `Conversación ${id}`): Conversation {
  return { id, title, createdAt, updatedAt: createdAt, messages: [], alertIds: [], errorIds: [] };
}

/** `count` conversations, one started every minute, so "c0" is the oldest. */
function many(count: number, start = NOW - count * 60_000): Conversation[] {
  return Array.from({ length: count }, (_, i) => conversation(`c${i}`, start + i * 60_000));
}

describe("expiry", () => {
  it("keeps a conversation until it is exactly seven days old", () => {
    const justUnder = conversation("a", NOW - CONVERSATION_TTL_MS + 1);
    const exactly = conversation("b", NOW - CONVERSATION_TTL_MS);
    const older = conversation("c", NOW - 8 * DAY);

    expect(pruneExpired([justUnder, exactly, older], NOW).map((c) => c.id)).toEqual(["a"]);
  });

  it("keeps the conversation that is open on screen even when it is old", () => {
    const open = conversation("open", NOW - 9 * DAY);

    expect(pruneExpired([open], NOW, "open")).toHaveLength(1);
    expect(pruneExpired([open], NOW)).toHaveLength(0);
  });
});

describe("saveConversation", () => {
  it("lists the newest conversation first", () => {
    const list = saveConversation(many(2), conversation("new", NOW), NOW);

    expect(list.map((c) => c.id)).toEqual(["new", "c1", "c0"]);
  });

  it("updates an existing conversation instead of duplicating it", () => {
    const start = many(3);
    const edited = { ...start[1], title: "Cambiado" };

    const list = saveConversation(start, edited, NOW);

    expect(list).toHaveLength(3);
    expect(list.find((c) => c.id === "c1")?.title).toBe("Cambiado");
  });

  it("fits fifteen conversations without removing any", () => {
    const list = saveConversation(many(MAX_CONVERSATIONS - 1), conversation("new", NOW), NOW);

    expect(list).toHaveLength(MAX_CONVERSATIONS);
    expect(list.some((c) => c.id === "c0")).toBe(true);
  });

  it("removes the oldest one when a new conversation starts with fifteen already saved", () => {
    const list = saveConversation(many(MAX_CONVERSATIONS), conversation("new", NOW), NOW);

    expect(list).toHaveLength(MAX_CONVERSATIONS);
    expect(list.some((c) => c.id === "c0")).toBe(false);
    expect(list[0].id).toBe("new");
    expect(list.some((c) => c.id === "c1")).toBe(true);
  });

  it("removes the oldest by start time, not by list order", () => {
    const shuffled = many(MAX_CONVERSATIONS).reverse();

    const list = saveConversation(shuffled, conversation("new", NOW), NOW);

    expect(list.some((c) => c.id === "c0")).toBe(false);
  });

  it("does not remove anything when an existing conversation is updated at the limit", () => {
    const full = many(MAX_CONVERSATIONS);

    const list = saveConversation(full, { ...full[0], title: "Editada" }, NOW);

    expect(list).toHaveLength(MAX_CONVERSATIONS);
    expect(list.some((c) => c.id === "c0")).toBe(true);
  });

  it("also drops the expired ones while saving", () => {
    const old = conversation("old", NOW - 10 * DAY);

    const list = saveConversation([old], conversation("new", NOW), NOW);

    expect(list.map((c) => c.id)).toEqual(["new"]);
  });
});

describe("removeConversation", () => {
  it("removes only the one asked for", () => {
    expect(removeConversation(many(3), "c1").map((c) => c.id)).toEqual(["c0", "c2"]);
  });
});

describe("renaming", () => {
  it("sets the new title on the chosen conversation only", () => {
    const list = renameConversation(many(3), "c1", "Mi rodilla");

    expect(list.map((c) => c.title)).toEqual(["Conversación c0", "Mi rodilla", "Conversación c2"]);
  });

  it("allows exactly the maximum number of characters and cuts anything beyond it", () => {
    const exact = "a".repeat(TITLE_MAX_CHARS);

    expect(sanitizeTitle(exact)).toHaveLength(TITLE_MAX_CHARS);
    expect(sanitizeTitle(exact + "b")).toBe(exact);
    expect(renameConversation(many(1), "c0", "x".repeat(200))[0].title).toHaveLength(TITLE_MAX_CHARS);
  });

  it("tidies spaces and line breaks", () => {
    expect(sanitizeTitle("  Dolor   de\n cabeza  ")).toBe("Dolor de cabeza");
  });

  it("ignores an empty title, so a conversation is never left nameless", () => {
    const start = many(2);

    expect(renameConversation(start, "c0", "   ")).toBe(start);
    expect(renameConversation(start, "c0", "")).toBe(start);
  });

  it("keeps the other fields of the conversation, including a pin", () => {
    const start = [{ ...conversation("a", NOW), pinned: true }];

    expect(renameConversation(start, "a", "Nuevo")[0]).toMatchObject({ id: "a", pinned: true, createdAt: NOW });
  });
});

describe("pinning", () => {
  it("lists a pinned conversation first, even if it is the oldest", () => {
    const list = togglePin(many(3), "c0");

    expect(list.map((c) => c.id)).toEqual(["c0", "c2", "c1"]);
    expect(list[0].pinned).toBe(true);
  });

  it("puts it back in its place when unpinned", () => {
    const pinned = togglePin(many(3), "c0");

    expect(togglePin(pinned, "c0").map((c) => c.id)).toEqual(["c2", "c1", "c0"]);
  });

  it("orders several pinned conversations newest first, above the rest", () => {
    let list = many(4);
    list = togglePin(list, "c0");
    list = togglePin(list, "c2");

    expect(list.map((c) => c.id)).toEqual(["c2", "c0", "c3", "c1"]);
  });

  it("keeps pinned conversations on top when a new one is saved", () => {
    const pinned = togglePin(many(3), "c0");

    const list = saveConversation(pinned, conversation("new", NOW), NOW);

    expect(list.map((c) => c.id)).toEqual(["c0", "new", "c2", "c1"]);
  });

  it("does not change how long a pinned conversation is kept: it still expires after a week", () => {
    const old = { ...conversation("old", NOW - 8 * DAY), pinned: true };

    expect(saveConversation([old], conversation("new", NOW), NOW).map((c) => c.id)).toEqual(["new"]);
  });

  it("does not protect a pinned conversation from the limit: the one that started first goes", () => {
    const full = togglePin(many(MAX_CONVERSATIONS), "c0");

    const list = saveConversation(full, conversation("new", NOW), NOW);

    expect(list.some((c) => c.id === "c0")).toBe(false);
    expect(list).toHaveLength(MAX_CONVERSATIONS);
  });

  it("is read back from storage in the same order", () => {
    const saved = JSON.stringify(togglePin(many(3), "c1"));

    expect(readConversations({ getItem: () => saved }, "k", NOW).map((c) => c.id)).toEqual(["c1", "c2", "c0"]);
  });
});

describe("storage", () => {
  const memory = (initial?: string) => ({ getItem: () => initial ?? null });

  it("keeps one list per account", () => {
    expect(storageKey("u1")).not.toBe(storageKey("u2"));
    expect(storageKey(null)).toBe(storageKey(undefined));
    expect(storageKey(null)).not.toBe(storageKey("u1"));
  });

  it("reads back what was written, dropping expired conversations", () => {
    const saved = JSON.stringify([...many(2), conversation("old", NOW - 9 * DAY)]);

    expect(readConversations(memory(saved), "k", NOW).map((c) => c.id)).toEqual(["c1", "c0"]);
  });

  it("treats missing, broken or wrongly shaped data as empty", () => {
    expect(readConversations(memory(), "k", NOW)).toEqual([]);
    expect(readConversations(memory("{no es json"), "k", NOW)).toEqual([]);
    expect(readConversations(memory('{"a":1}'), "k", NOW)).toEqual([]);
    expect(readConversations(memory('[{"id":1},null,"x"]'), "k", NOW)).toEqual([]);
  });

  it("never returns more than fifteen, even if more were stored", () => {
    expect(readConversations(memory(JSON.stringify(many(20))), "k", NOW)).toHaveLength(MAX_CONVERSATIONS);
  });

  it("writes the list as JSON", () => {
    const setItem = vi.fn();

    writeConversations({ setItem }, "k", many(2));

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setItem.mock.calls[0][1])).toHaveLength(2);
  });

  it("drops the oldest conversations until the list fits when the browser is out of space", () => {
    const stored: string[] = [];
    const setItem = vi.fn((_key: string, value: string) => {
      if ((JSON.parse(value) as unknown[]).length > 3) throw new Error("QuotaExceededError");
      stored.push(value);
    });

    writeConversations({ setItem }, "k", many(6));

    const kept = (JSON.parse(stored[0]) as Conversation[]).map((c) => c.id);
    expect(kept).toEqual(["c5", "c4", "c3"]);
  });

  it("gives up quietly if even one conversation does not fit", () => {
    const setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => writeConversations({ setItem }, "k", many(3))).not.toThrow();
  });
});

describe("titles", () => {
  it("builds a fallback from the first words of the message", () => {
    expect(fallbackTitle("  Me duele   la rodilla desde ayer después de correr mucho ")).toBe(
      "Me duele la rodilla desde ayer",
    );
  });

  it("shortens a very long fallback and names an empty one", () => {
    expect(fallbackTitle("a".repeat(80)).length).toBeLessThanOrEqual(48);
    expect(fallbackTitle("a".repeat(80)).endsWith("…")).toBe(true);
    expect(fallbackTitle("   ")).toBe("Nueva conversación");
  });

  it("tidies a title written by the AI", () => {
    expect(cleanTitle('"Dolor de rodilla".')).toBe("Dolor de rodilla");
    expect(cleanTitle("**Tos leve**")).toBe("Tos leve");
    expect(cleanTitle("\n\nFiebre alta\nExplicación que sobra")).toBe("Fiebre alta");
    expect(cleanTitle("«Dolor de cabeza»")).toBe("Dolor de cabeza");
  });

  it("returns an empty title for empty output, so the caller can keep the fallback", () => {
    expect(cleanTitle("")).toBe("");
    expect(cleanTitle('  ""  ')).toBe("");
  });

  it("caps a runaway title", () => {
    expect(cleanTitle("palabra ".repeat(30)).length).toBeLessThanOrEqual(48);
  });
});
