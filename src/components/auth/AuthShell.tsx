"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";
import { Mascot, type MascotState } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme";
import { useT } from "@/i18n/I18nProvider";
import { focusRing } from "./styles";

export interface AuthShellProps {
  mascotState: MascotState;
  children: React.ReactNode;
}

/** Page frame: brand panel on the left (large screens), the access card on the right. */
export function AuthShell({ mascotState, children }: AuthShellProps) {
  const t = useT();
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col bg-surface text-text lg:flex-row">
        <aside className="hidden flex-col justify-between bg-surface-raised p-12 shadow-raised lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[38%] lg:self-start xl:w-[40%]">
          <Link href="/inicio" className={`self-start rounded-sm font-script text-4xl text-title-gradient ${focusRing}`}>
            Waylo
          </Link>
          <div className="flex flex-col items-center gap-8 text-center">
            <Mascot state={mascotState} size={288} />
            <p className="max-w-md font-heading text-headline font-medium text-text">
              {t.auth.tagline}
            </p>
          </div>
          <p className="text-caption text-text-muted">{t.auth.footnote}</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 px-4 py-4 short:py-2 sm:px-8">
            <Link href="/inicio" className={`rounded-sm font-script text-3xl text-title-gradient lg:invisible ${focusRing}`}>
              Waylo
            </Link>
            <ThemeToggle />
          </header>

          <main className="flex flex-1 items-start justify-center px-4 pb-8 pt-2 sm:px-10 lg:items-center short:pb-2">
            {children}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
