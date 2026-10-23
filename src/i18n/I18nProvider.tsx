"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, matchLocale, type LanguageChoice, type Locale } from "@/i18n/locales";
import { messages, type Messages } from "@/i18n/messages";

interface I18nValue {
  /** The language on screen. */
  locale: Locale;
  /** What the person chose: a language, or "auto" to follow the browser. */
  choice: LanguageChoice;
  t: Messages;
  /** Switches the app's language at once, and saves the choice (on the account too, when signed in). */
  setLocale: (next: LanguageChoice) => Promise<void>;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Carries the language chosen on the server down to every client component. */
export function I18nProvider({
  locale: initial,
  choice: initialChoice,
  children,
}: {
  locale: Locale;
  choice: LanguageChoice;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initial);
  const [choice, setChoice] = useState(initialChoice);

  // A new language from the server (a refresh, signing in on another device's saved choice) wins over the local one.
  useEffect(() => setLocaleState(initial), [initial]);
  useEffect(() => setChoice(initialChoice), [initialChoice]);

  const setLocale = useCallback(
    async (next: LanguageChoice) => {
      setChoice(next);
      if (next === "auto") {
        // No cookie: the app follows the browser, and the page already shows what that is.
        document.cookie = `${LANG_COOKIE}=; path=/; max-age=0; samesite=lax`;
        setLocaleState(matchLocale((navigator.languages?.length ? navigator.languages : [navigator.language]).join(",")));
      } else {
        setLocaleState(next);
        // The cookie is written here too, so the next request already carries it even if the save below is slow.
        document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
      }
      await fetch("/api/preferencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idioma: next }),
      }).catch(() => undefined);
      // Server components (titles, legal pages, the greeting) read the cookie, so they render again.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nValue>(() => ({ locale, choice, t: messages[locale], setLocale }), [locale, choice, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>.");
  return context;
}

/** The texts of the current language. */
export function useT(): Messages {
  return useI18n().t;
}
