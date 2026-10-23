"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import type { SectionId } from "./sections";

// The window, its panels and the lists of cities and countries are only fetched when someone opens the settings.
const SettingsDialog = dynamic(() => import("./SettingsDialog").then((module) => module.SettingsDialog), { ssr: false });

interface SettingsApi {
  /** Opens the settings window, on a section. */
  open: (section?: SectionId) => void;
  /** Closes it, and refreshes the page so what changed (the name, the language) shows everywhere. */
  close: () => void;
  isOpen: boolean;
}

const SettingsContext = createContext<SettingsApi | null>(null);

/** Holds the floating settings window, so any button on the page can open it without leaving the chat. */
export function SettingsProvider({ children, initialSection }: { children: ReactNode; initialSection?: SectionId }) {
  const router = useRouter();
  const [section, setSection] = useState<SectionId | null>(initialSection ?? null);

  // Opened from a link (/chat?settings=usage): the address goes back to plain /chat, so a reload does not reopen it.
  // The router does it, not history.replaceState: the router would put the old address back on the next refresh.
  useEffect(() => {
    if (initialSection) router.replace("/chat", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, []);

  const open = useCallback((next: SectionId = "general") => setSection(next), []);
  const close = useCallback(() => {
    setSection(null);
    router.refresh();
  }, [router]);

  const api = useMemo<SettingsApi>(() => ({ open, close, isOpen: section !== null }), [open, close, section]);

  return (
    <SettingsContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {section ? <SettingsDialog key="settings" section={section} onSection={setSection} onClose={close} /> : null}
      </AnimatePresence>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsApi {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside <SettingsProvider>.");
  return context;
}
