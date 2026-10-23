"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  Cancel01Icon,
  Hospital01Icon,
  LanguageSquareIcon,
  Mic01Icon,
  PaintBrush01Icon,
  Shield01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { buttonSoft } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import type { LiveLanguage, Voice } from "@/lib/preferences";
import type { Profile } from "@/lib/profile";
import type { SessionInfo } from "@/lib/profile-db";
import type { EpsState } from "@/lib/eps";
import type { AccountUsage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AccountPanel } from "./AccountPanel";
import { AppearancePanel } from "./AppearancePanel";
import { GeneralPanel } from "./GeneralPanel";
import { EpsPanel } from "./EpsPanel";
import { LivePanel } from "./LivePanel";
import { SecurityPanel } from "./SecurityPanel";
import { UsagePanel } from "./UsagePanel";
import { GROUPS, SECTIONS, type SectionId } from "./sections";

const ICONS: Record<SectionId, IconSvgElement> = {
  general: LanguageSquareIcon,
  appearance: PaintBrush01Icon,
  live: Mic01Icon,
  account: UserCircleIcon,
  eps: Hospital01Icon,
  security: Shield01Icon,
  usage: Analytics01Icon,
};

/** What the server knows for the sections that need it. General and Appearance need nothing and show at once. */
interface SettingsData {
  signedIn: boolean;
  voice: Voice;
  liveLanguage: LiveLanguage;
  profile: Profile | null;
  sessions: SessionInfo[];
  usage: AccountUsage | null;
  eps: EpsState | null;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SettingsDialogProps {
  section: SectionId;
  onSection: (section: SectionId) => void;
  onClose: () => void;
}

/** The settings, in a window that floats over the chat. */
export function SettingsDialog({ section, onSection, onClose }: SettingsDialogProps) {
  const t = useT().settings;
  const [data, setData] = useState<SettingsData | null>(null);
  const [failed, setFailed] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetch("/api/configuracion", { cache: "no-store" });
      if (!response.ok) throw new Error("settings failed");
      setData((await response.json()) as SettingsData);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The window takes the focus when it opens, and gives it back to what opened it when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      // A menu row that opened the window is gone by now, so the focus goes to what holds the menu.
      const target = opener?.isConnected ? opener : document.querySelector<HTMLElement>("[data-settings-opener]");
      target?.focus?.();
    };
  }, []);

  // Escape closes the window, unless it is closing a menu opened inside it (a list of cities, say).
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The chosen section scrolls into view in the row of tabs of a phone.
  useEffect(() => {
    tabs.current[section]?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [section]);

  /** Tab stays inside the window. Menus opened from it live elsewhere in the page and handle their own keys. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panel.current?.contains(event.target as Node)) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const backward = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !backward) return;
    event.preventDefault();
    const at = SECTIONS.indexOf(section);
    const next = SECTIONS[(at + (forward ? 1 : -1) + SECTIONS.length) % SECTIONS.length];
    onSection(next);
    tabs.current[next]?.focus();
  }

  const needsData = section !== "general" && section !== "appearance";

  // A plain function, not a component: a component declared here would be rebuilt on every render and lose its focus.
  function renderTab(id: SectionId) {
    const active = id === section;
    return (
      <button
        key={id}
        ref={(el) => {
          tabs.current[id] = el;
        }}
        type="button"
        role="tab"
        id={`settings-tab-${id}`}
        aria-selected={active}
        aria-controls={`settings-panel-${id}`}
        tabIndex={active ? 0 : -1}
        onClick={() => onSection(id)}
        className={cn(
          "relative flex min-h-10 shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 font-heading text-sm font-medium",
          "transition-colors duration-[var(--duration-base)] ease-standard",
          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          active ? "text-text" : "text-text-muted hover:text-text",
        )}
      >
        {active ? (
          <motion.span
            layoutId="settings-tab"
            transition={{ duration: duration.base, ease: easing.standard }}
            className="absolute inset-0 rounded-lg bg-surface shadow-inset"
          />
        ) : null}
        <HugeiconsIcon icon={ICONS[id]} size={18} strokeWidth={2.25} aria-hidden className="relative shrink-0" />
        <span className="relative whitespace-nowrap">{t.nav[id]}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration.base, ease: easing.standard }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: duration.base, ease: easing.standard }}
        className="relative flex h-[min(44rem,calc(100dvh-1.5rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface-raised text-text shadow-raised outline-none sm:h-[min(44rem,calc(100dvh-3rem))]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <h1 id="settings-title" className="font-heading text-lg font-semibold">
            {t.title}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            title={t.close}
            className="lift lift-sm grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-text-muted hover:text-text focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2.25} aria-hidden />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[14.5rem_minmax(0,1fr)] md:grid-rows-1">
          <div
            role="tablist"
            aria-label={t.title}
            aria-orientation="vertical"
            onKeyDown={onTabsKeyDown}
            data-lenis-prevent
            className="scroll-soft flex shrink-0 gap-1 overflow-x-auto px-4 pb-3 md:flex-col md:gap-0 md:overflow-y-auto md:overflow-x-visible md:px-4 md:pb-4"
          >
            {GROUPS.map((group) => (
              <div key={group.id} className="flex gap-1 md:mt-4 md:flex-col md:first:mt-0">
                <p className="hidden px-3 pb-1 font-heading text-xs font-medium text-text-muted md:block">
                  {t.groups[group.id]}
                </p>
                {group.sections.map((id) => renderTab(id))}
              </div>
            ))}
          </div>

          {/* data-lenis-prevent: the page's smooth scroll would take the mouse wheel and this list would never move. */}
          <div data-lenis-prevent className="scroll-soft min-h-0 overflow-y-auto border-t border-text/10 px-5 py-6 sm:px-8 md:border-l md:border-t-0">
            {/* Every section stays mounted once the data is here, so what was typed in one is still there when coming back. */}
            <div role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general" hidden={section !== "general"} className="flex flex-col gap-8">
              <GeneralPanel />
            </div>
            <div role="tabpanel" id="settings-panel-appearance" aria-labelledby="settings-tab-appearance" hidden={section !== "appearance"} className="flex flex-col gap-8">
              <AppearancePanel />
            </div>

            {needsData && !data ? (
              failed ? (
                <div role="alert" className="flex flex-col items-start gap-4">
                  <p className="text-base text-text-muted">{t.loadFailed}</p>
                  <button type="button" onClick={() => void load()} className={cn(buttonSoft, "min-h-11 px-5 text-sm")}>
                    {t.retry}
                  </button>
                </div>
              ) : (
                <p role="status" className="text-sm text-text-muted">
                  {t.loading}
                </p>
              )
            ) : null}

            {data ? (
              <>
                <div role="tabpanel" id="settings-panel-live" aria-labelledby="settings-tab-live" hidden={section !== "live"} className="flex flex-col gap-8">
                  <LivePanel voice={data.voice} language={data.liveLanguage} />
                </div>
                <div role="tabpanel" id="settings-panel-account" aria-labelledby="settings-tab-account" hidden={section !== "account"} className="flex flex-col gap-8">
                  <AccountPanel profile={data.profile} />
                </div>
                <div role="tabpanel" id="settings-panel-eps" aria-labelledby="settings-tab-eps" hidden={section !== "eps"} className="flex flex-col gap-8">
                  <EpsPanel eps={data.eps} />
                </div>
                <div role="tabpanel" id="settings-panel-security" aria-labelledby="settings-tab-security" hidden={section !== "security"} className="flex flex-col gap-8">
                  <SecurityPanel profile={data.profile} sessions={data.sessions} />
                </div>
                <div role="tabpanel" id="settings-panel-usage" aria-labelledby="settings-tab-usage" hidden={section !== "usage"} className="flex flex-col gap-8">
                  <UsagePanel usage={data.usage} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
