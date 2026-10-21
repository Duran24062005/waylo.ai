"use client";

import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { Mascot, type MascotState } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme";
import { duration, easing } from "@/design/motion";
import { focusRing } from "./styles";

export interface AuthShellProps {
  title: string;
  intro: string;
  mascotState: MascotState;
  children: React.ReactNode;
  /** Short line under the card, e.g. a link to the other auth page. */
  footer?: React.ReactNode;
}

export function AuthShell({ title, intro, mascotState, children, footer }: AuthShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link
            href="/"
            className={`min-h-11 content-center rounded-sm text-body font-bold text-text ${focusRing}`}
          >
            Navegador del paciente
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.slow, ease: easing.standard }}
            className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-raised sm:p-8"
          >
            <div className="mb-6 flex flex-col items-center gap-4 text-center">
              <Mascot state={mascotState} size={96} />
              <div className="flex flex-col gap-2">
                <h1 className="text-headline font-bold text-text">{title}</h1>
                <p className="text-body text-text-muted">{intro}</p>
              </div>
            </div>
            {children}
          </motion.div>
        </main>

        {footer ? <footer className="px-4 pb-8 text-center text-body text-text-muted">{footer}</footer> : null}
      </div>
    </MotionConfig>
  );
}
