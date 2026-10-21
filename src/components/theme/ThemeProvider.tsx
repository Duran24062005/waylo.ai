"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { durationMs, prefersReducedMotion } from "@/design/motion";
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme-script";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const FADE_CLASS = "theme-fade";

// Used when localStorage is unavailable (private mode, blocked storage).
let memoryPreference: ThemePreference = "system";
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : memoryPreference;
  } catch {
    return memoryPreference;
  }
}

function writePreference(next: ThemePreference) {
  memoryPreference = next;
  try {
    if (next === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  } catch {
    // Storage unavailable: the in-memory value still drives this session.
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribePreference(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeSystemDark(listener: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function applyThemeAttribute(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }
}

type ViewTransitionDocument = {
  startViewTransition?: (update: () => void) => unknown;
};

function runThemeChange(update: () => void) {
  if (prefersReducedMotion()) {
    update();
    return;
  }

  const start = (document as ViewTransitionDocument).startViewTransition;
  if (typeof start === "function") {
    start.call(document, update);
    return;
  }

  const root = document.documentElement;
  root.classList.remove(FADE_CLASS);
  void root.offsetWidth;
  root.classList.add(FADE_CLASS);
  update();
  window.setTimeout(() => root.classList.remove(FADE_CLASS), durationMs.base);
}

export interface ThemeContextValue {
  /** What the person chose. "system" follows the device setting. */
  preference: ThemePreference;
  /** The theme actually on screen. */
  resolvedTheme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => "system",
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );

  useEffect(() => {
    applyThemeAttribute(preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    runThemeChange(() => {
      writePreference(next);
      applyThemeAttribute(next);
      flushSync(emit);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme: preference === "system" ? (systemDark ? "dark" : "light") : preference,
      setPreference,
    }),
    [preference, systemDark, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return context;
}
