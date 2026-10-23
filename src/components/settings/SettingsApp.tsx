"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  ArrowLeft01Icon,
  LanguageSquareIcon,
  Mic01Icon,
  PaintBrush01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { buttonSoft } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import type { LiveLanguage, Voice } from "@/lib/preferences";
import type { Profile } from "@/lib/profile";
import type { SessionInfo } from "@/lib/profile-db";
import type { AccountUsage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AccountPanel } from "./AccountPanel";
import { AppearancePanel } from "./AppearancePanel";
import { GeneralPanel } from "./GeneralPanel";
import { LivePanel } from "./LivePanel";
import { UsagePanel } from "./UsagePanel";
import { SECTIONS, type SectionId } from "./sections";

const ICONS: Record<SectionId, IconSvgElement> = {
  general: LanguageSquareIcon,
  appearance: PaintBrush01Icon,
  account: UserCircleIcon,
  live: Mic01Icon,
  usage: Analytics01Icon,
};

interface SettingsAppProps {
  initialSection: SectionId;
  /** Null for a visitor without an account. */
  profile: Profile | null;
  sessions: SessionInfo[];
  usage: AccountUsage | null;
  voice: Voice;
  liveLanguage: LiveLanguage;
}

export function SettingsApp({ initialSection, profile, sessions, usage, voice, liveLanguage }: SettingsAppProps) {
  const t = useT().settings;
  const [section, setSection] = useState<SectionId>(initialSection);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // On a phone the tabs scroll sideways: the chosen one comes into view, so it is never half cut off.
  useEffect(() => {
    tabs.current[SECTIONS.indexOf(section)]?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [section]);

  function choose(next: SectionId) {
    setSection(next);
    // The address follows, so a section can be linked to and survives a reload.
    window.history.replaceState(null, "", `/configuracion?s=${next}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const backward = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !backward) return;
    event.preventDefault();
    const at = SECTIONS.indexOf(section);
    const next = (at + (forward ? 1 : -1) + SECTIONS.length) % SECTIONS.length;
    choose(SECTIONS[next]);
    tabs.current[next]?.focus();
  }

  return (
    <div className="min-h-dvh bg-surface text-text">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-8">
        <header>
          <Link href="/chat" className={cn(buttonSoft, "min-h-11 gap-2 px-4 text-sm")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2.25} aria-hidden />
            {t.backToChat}
          </Link>
        </header>

        <h1 className="mt-8 font-script text-5xl leading-tight text-title-gradient sm:text-6xl">{t.title}</h1>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <div
            role="tablist"
            aria-label={t.title}
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="scroll-soft -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {SECTIONS.map((id, index) => {
              const active = id === section;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => choose(id)}
                  className={cn(
                    "relative flex min-h-12 shrink-0 cursor-pointer items-center gap-3 rounded-xl px-4 py-2 font-heading text-sm font-semibold",
                    "transition-colors duration-[var(--duration-base)] ease-standard",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    active ? "text-text" : "text-text-muted hover:text-text",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="settings-tab"
                      transition={{ duration: duration.base, ease: easing.standard }}
                      className="absolute inset-0 rounded-xl bg-surface-raised shadow-soft"
                    />
                  ) : null}
                  <HugeiconsIcon icon={ICONS[id]} size={20} strokeWidth={2.25} aria-hidden className="relative shrink-0" />
                  <span className="relative whitespace-nowrap">{t.nav[id]}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section}
              role="tabpanel"
              id={`panel-${section}`}
              aria-labelledby={`tab-${section}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: duration.base, ease: easing.standard }}
              className="flex min-w-0 flex-col gap-6"
            >
              {section === "general" ? <GeneralPanel /> : null}
              {section === "appearance" ? <AppearancePanel /> : null}
              {section === "account" ? <AccountPanel profile={profile} sessions={sessions} /> : null}
              {section === "live" ? <LivePanel voice={voice} language={liveLanguage} /> : null}
              {section === "usage" ? <UsagePanel usage={usage} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
