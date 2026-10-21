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
      <div className="flex min-h-dvh flex-col bg-surface text-text lg:flex-row">
        <aside className="hidden flex-col justify-between bg-surface-raised p-12 shadow-raised lg:flex lg:w-[44%] xl:w-1/2">
          <Link href="/inicio" className={`self-start rounded-sm font-script text-4xl text-title-gradient ${focusRing}`}>
            Waylo
          </Link>
          <div className="flex flex-col items-center gap-8 text-center">
            <Mascot state={mascotState} size={288} />
            <p className="max-w-md font-heading text-headline font-medium text-text">
              Te ayudamos a saber a dónde ir cuando algo te duele.
            </p>
          </div>
          <p className="text-caption text-text-muted">Waylo orienta. No diagnostica ni receta.</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <Link href="/inicio" className={`rounded-sm font-script text-3xl text-title-gradient lg:invisible ${focusRing}`}>
              Waylo
            </Link>
            <ThemeToggle />
          </header>

          <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-2 sm:px-10 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, ease: easing.standard }}
              className="w-full max-w-xl rounded-xl bg-surface-raised p-6 shadow-raised sm:p-10"
            >
              <div className="mb-8 flex items-center gap-4 lg:block">
                <Mascot state={mascotState} size={72} className="shrink-0 lg:hidden" />
                <div className="flex min-w-0 flex-col gap-2">
                  <h1 className="font-script text-4xl leading-tight text-title-gradient sm:text-5xl">{title}</h1>
                  <p className="text-body text-text-muted">{intro}</p>
                </div>
              </div>
              {children}
            </motion.div>
          </main>

          {footer ? <footer className="px-4 pb-8 text-center text-body text-text-muted">{footer}</footer> : null}
        </div>
      </div>
    </MotionConfig>
  );
}
