"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRemaining } from "@/components/chat/useRemaining";
import { buttonPrimary } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { useI18n } from "@/i18n/I18nProvider";
import { FORMAT_LOCALE } from "@/i18n/locales";
import type { AccountUsage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWait } from "@/lib/wait";
import { SettingsCard } from "./SettingsCard";

interface MeterProps {
  label: string;
  detail: string;
  hint: string;
  percent: number;
  percentLabel: string;
  /** The allowance is used up: the bar turns to the danger color, as a cue besides the numbers. */
  full: boolean;
}

/** A horizontal line that fills as the allowance is used, with the numbers beside it. */
function Meter({ label, detail, hint, percent, percentLabel, full }: MeterProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-heading text-sm font-medium text-text">{label}</span>
        <span className="font-heading text-sm font-semibold text-text">{percentLabel}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={detail}
        className="h-3 overflow-hidden rounded-full bg-surface shadow-inset"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: duration.slow, ease: easing.standard }}
          className={cn("h-full rounded-full", full ? "bg-[#c62828]" : "bg-text")}
        />
      </div>
      <p className="text-sm text-text">{detail}</p>
      <p className="text-sm text-text-muted">{hint}</p>
    </div>
  );
}

const percentOf = (used: number, limit: number) => Math.min(100, Math.round((used / limit) * 100));

export function UsagePanel({ usage }: { usage: AccountUsage | null }) {
  const { t, locale } = useI18n();
  const copy = t.settings.usage;
  const blocked = usage?.blocked ?? null;
  const left = useRemaining(blocked?.resetAt);

  if (!usage) {
    return (
      <SettingsCard title={copy.title}>
        <p className="text-base text-text-muted">{copy.signedOutText}</p>
        <Link href="/login" className={cn(buttonPrimary, "w-fit")}>
          {t.settings.account.signIn}
        </Link>
      </SettingsCard>
    );
  }

  const monthDate = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], { day: "numeric", month: "long" });
  const dayPercent = percentOf(usage.dayUsed, usage.dayLimit);
  const monthPercent = percentOf(usage.monthUsed, usage.monthLimit);

  return (
    <SettingsCard title={copy.title}>
      {blocked ? (
        <p role="status" className="rounded-xl bg-surface p-4 text-sm font-semibold text-text shadow-inset">
          {blocked.scope === "day"
            ? copy.blockedDay(formatWait(left ?? Math.max(0, blocked.resetAt - Date.now()), t.common))
            : copy.blockedMonth(monthDate.format(blocked.resetAt))}
        </p>
      ) : null}
      <Meter
        label={copy.dailyLabel}
        detail={copy.dailyDetail(usage.dayUsed, usage.dayLimit)}
        hint={copy.dailyHint}
        percent={dayPercent}
        percentLabel={copy.percent(dayPercent)}
        full={usage.dayUsed >= usage.dayLimit}
      />
      <Meter
        label={copy.monthlyLabel}
        detail={copy.monthlyDetail(usage.monthUsed, usage.monthLimit)}
        hint={copy.monthlyHint}
        percent={monthPercent}
        percentLabel={copy.percent(monthPercent)}
        full={usage.monthUsed >= usage.monthLimit}
      />
    </SettingsCard>
  );
}
