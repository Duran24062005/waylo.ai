"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { buttonSoft } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { useI18n } from "@/i18n/I18nProvider";
import { FORMAT_LOCALE } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import { formatWait } from "@/lib/wait";
import { TypewriterText } from "./TypewriterText";

interface UsageLimitNoticeProps {
  scope: "day" | "month";
  /** Epoch milliseconds when the replies come back. */
  resetAt: number;
  /** Milliseconds left, counting down. Null before the first tick in the browser. */
  waitMs: number | null;
}

/** Shown when a signed-in account used its daily or monthly replies and tries to write. */
export function UsageLimitNotice({ scope, resetAt, waitMs }: UsageLimitNoticeProps) {
  const { t, locale } = useI18n();
  const day = scope === "day";
  // A month's wait is told as a date; a day's, as the time that is left.
  const date = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], { day: "numeric", month: "long" }).format(resetAt);

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easing.standard }}
      className="flex flex-col gap-3 rounded-2xl bg-surface-raised p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-heading text-base font-semibold text-text">
          <TypewriterText text={day ? t.limits.dayTitle : t.limits.monthTitle} />
        </p>
        <p className="mt-0.5 text-sm text-text-muted">
          {day
            ? t.limits.dayText(formatWait(waitMs ?? Math.max(0, resetAt - Date.now()), t.common))
            : t.limits.monthText(date)}
        </p>
      </div>
      <Link href="/configuracion?s=usage" className={cn(buttonSoft, "min-h-11 shrink-0 px-5 text-base")}>
        {t.limits.seeUsage}
      </Link>
    </motion.div>
  );
}
