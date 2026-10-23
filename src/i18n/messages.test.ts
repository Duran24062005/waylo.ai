import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, LOCALES, matchLocale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";
import { es } from "@/i18n/messages/es";

type Node = unknown;

/** Every path to a text in the dictionary, such as "chat.send" or "home.features.0.title". */
function leaves(node: Node, path = ""): string[] {
  if (typeof node === "function") return [path];
  if (Array.isArray(node)) return node.flatMap((item, index) => leaves(item, `${path}.${index}`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
  }
  return [path];
}

function at(node: Node, path: string): Node {
  return path.split(".").reduce<Node>((current, key) => (current as Record<string, Node>)?.[key], node);
}

describe("dictionaries", () => {
  it("have the same texts in every language, none missing and none extra", () => {
    const expected = leaves(es).sort();
    for (const locale of LOCALES) {
      expect(leaves(messages[locale]).sort(), locale).toEqual(expected);
    }
  });

  it("have a real text, never an empty one, for every plain text", () => {
    for (const locale of LOCALES) {
      for (const path of leaves(messages[locale])) {
        const value = at(messages[locale], path);
        if (typeof value === "string") expect(value.trim(), `${locale}.${path}`).not.toBe("");
      }
    }
  });

  it("give a text from every function, with the numbers and names put in", () => {
    for (const locale of LOCALES) {
      const t = messages[locale];
      expect(t.chat.conversationsCount(3)).toContain("3");
      expect(t.chat.optionsFor("Rodilla")).toContain("Rodilla");
      expect(t.chat.greeting("Ana")).toContain("Ana");
      expect(t.chat.greeting(null).length).toBeGreaterThan(0);
      expect(t.profile.freeReplies(0)).not.toBe(t.profile.freeReplies(3));
      expect(t.profile.freeReplies(3)).toContain("3");
      expect(t.profile.comeBackIn("2 h")).toContain("2 h");
      expect(t.limits.dayText("5 min")).toContain("5 min");
      expect(t.settings.usage.dailyDetail(12, 100)).toMatch(/12.*100/);
      expect(t.settings.usage.monthlyDetail(30, 2000)).toMatch(/30.*2000/);
      expect(t.settings.account.sessions.closed(1)).not.toBe(t.settings.account.sessions.closed(4));
    }
  });

  it("keep the password strength levels and the home features in the numbers the screens expect", () => {
    for (const locale of LOCALES) {
      expect(messages[locale].auth.strength.levels, locale).toHaveLength(5);
      expect(messages[locale].home.features, locale).toHaveLength(3);
      expect(messages[locale].server.checklist.length, locale).toBeGreaterThan(0);
    }
  });

  it("translate every requirement written in the sites' data", () => {
    for (const locale of LOCALES) {
      expect(Object.keys(messages[locale].server.requirements).sort(), locale).toEqual(
        Object.keys(es.server.requirements).sort(),
      );
    }
  });

  it("name Spanish, English and Portuguese the way each reads in itself, for the AI's instructions", () => {
    expect(messages.es.server.answerLanguage).toBe("español");
    expect(messages.en.server.answerLanguage).toBe("English");
    expect(messages.pt.server.answerLanguage).toBe("português");
  });
});

describe("locales", () => {
  it("knows Spanish, English and Portuguese, with Spanish as the default", () => {
    expect([...LOCALES]).toEqual(["es", "en", "pt"]);
    expect(DEFAULT_LOCALE).toBe("es");
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("picks the best language for the browser's list, by preference", () => {
    expect(matchLocale("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(matchLocale("pt-BR,pt;q=0.9")).toBe("pt");
    expect(matchLocale("fr-FR,fr;q=0.9,pt;q=0.5")).toBe("pt");
    expect(matchLocale("es-CO")).toBe("es");
    expect(matchLocale("es;q=0.4, en;q=0.9")).toBe("en");
  });

  it("falls back to Spanish when nothing it speaks is asked for", () => {
    expect(matchLocale(undefined)).toBe("es");
    expect(matchLocale("")).toBe("es");
    expect(matchLocale("fr-FR,de;q=0.8")).toBe("es");
    expect(matchLocale("*")).toBe("es");
    expect(matchLocale("en;q=0")).toBe("es");
  });
});
