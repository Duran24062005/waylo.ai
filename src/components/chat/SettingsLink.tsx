"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/** The gear that opens the settings window, for screens where the profile card is not shown. */
export function SettingsLink({ className }: { className?: string }) {
  const t = useT();
  const settings = useSettings();
  return (
    <button
      type="button"
      onClick={() => settings.open()}
      data-settings-opener
      aria-label={t.chat.openSettings}
      title={t.chat.openSettings}
      className={cn(
        "lift lift-sm group inline-grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl bg-surface-raised text-text shadow-soft",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        className,
      )}
    >
      {/* The gear turns a little on hover, like the sun does on the theme toggle. */}
      <HugeiconsIcon
        icon={Settings01Icon}
        size={24}
        strokeWidth={2.25}
        aria-hidden
        className="transition-transform duration-[var(--duration-slow)] ease-emphasis group-hover:rotate-45 motion-reduce:transition-none"
      />
    </button>
  );
}
