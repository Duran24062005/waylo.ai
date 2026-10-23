"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "./useSaveStatus";

/** "Saving…", "Saved" or the failure, in a fixed-height line so nothing around it jumps. */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useT().settings;
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex h-6 items-center gap-1.5 text-sm transition-opacity duration-[var(--duration-base)]",
        status === "idle" ? "opacity-0" : "opacity-100",
        status === "error" ? "font-semibold text-danger" : "text-text-muted",
      )}
    >
      {status === "saved" ? <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.75} aria-hidden /> : null}
      {status === "error" ? <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={2.25} aria-hidden /> : null}
      {status === "saving" ? t.saving : status === "saved" ? t.saved : status === "error" ? t.saveFailed : ""}
    </p>
  );
}

interface SettingsCardProps {
  title: string;
  /** The save indicator of the section, when its changes save on their own. */
  status?: SaveStatus;
  children: React.ReactNode;
}

/** One section of the settings: a title and its settings. Sections that follow one another are told apart by a faint line. */
export function SettingsCard({ title, status, children }: SettingsCardProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-6 not-first:border-t not-first:border-text/10 not-first:pt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
        {status ? <SaveIndicator status={status} /> : null}
      </div>
      {children}
    </section>
  );
}

/** A setting: its name, what it does, and the control. */
export function Setting({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-heading text-sm font-medium text-text">{label}</span>
      {children}
      {hint ? <p className="text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}
