"use client";

import Link from "next/link";
import { buttonPrimary } from "@/components/ui/buttons";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./SettingsCard";

/** What the sections that need an account show to a visitor. */
export function SignedOut({ title }: { title: string }) {
  const t = useI18n().t.settings.account;
  return (
    <SettingsCard title={title}>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-lg font-semibold text-text">{t.signedOutTitle}</p>
        <p className="text-base text-text-muted">{t.signedOutText}</p>
      </div>
      <Link href="/login" className={cn(buttonPrimary, "w-fit")}>
        {t.signIn}
      </Link>
    </SettingsCard>
  );
}
