"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, PlusSignIcon, StethoscopeIcon, UserIcon } from "@hugeicons/core-free-icons";
import { motion, useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

const ease = [...easing.standard] as [number, number, number, number];

// Same order and tones as the level badges: black, dark gray, mid gray.
const LEVELS = [
  { label: "Urgencias", icon: PlusSignIcon, tone: "bg-danger text-danger-foreground" },
  { label: "Consulta Prioritaria", icon: StethoscopeIcon, tone: "bg-warning text-warning-foreground" },
  { label: "Medicina General", icon: UserIcon, tone: "bg-success text-success-foreground" },
] as const;

function TypingBubble() {
  const reduced = useReducedMotion();
  return (
    <div className="relative rounded-2xl bg-surface-raised px-5 py-4 shadow-raised">
      <div aria-hidden className="flex items-center gap-2">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-2.5 rounded-full bg-text"
            animate={reduced ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: dot * 0.18 }}
          />
        ))}
      </div>
      {/* Tail: leaves the bottom-right corner and points down and right, at the mascot. */}
      <svg aria-hidden viewBox="0 0 22 18" className="absolute -bottom-[13px] right-3 h-[18px] w-[22px] fill-surface-raised">
        <path d="M0 0 H14 Q 15 9 22 18 Q 9 14 4 6 Z" />
      </svg>
    </div>
  );
}

/** Right side of the hero: soft blob, the mascot "typing", and the three levels of care. */
export function HeroScene({ chatHref }: { chatHref: string }) {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[40rem] lg:max-w-none xl:aspect-auto xl:h-[min(36rem,64vh)]">
      {/* Background blob */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.slow * 1.4, ease }}
        className="absolute left-[2%] top-[4%] h-[88%] w-[78%] rounded-[46%_54%_42%_58%/52%_44%_56%_48%] bg-text/[0.06]"
      />

      {/* Levels of care: behind the mascot, turned slightly to the left in 3D. */}
      <div className="absolute left-[44%] top-[14%] z-0 hidden w-[min(21rem,54%)] sm:block">
        <motion.nav
          aria-label="Niveles de atención"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.slow, ease, delay: 0.3 }}
          style={{ transformPerspective: 1100, rotateY: -18, rotateZ: -3, transformOrigin: "100% 50%" }}
          className="rounded-2xl bg-surface-raised/60 p-3 shadow-raised"
        >
        <ul className="flex flex-col gap-2.5">
          {LEVELS.map((level) => (
            <li key={level.label}>
              <Link
                href={chatHref}
                className="lift lift-sm group flex items-center gap-3 rounded-xl bg-surface-raised px-3 py-3 shadow-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full shadow-solid", level.tone)}>
                  <HugeiconsIcon icon={level.icon} size={18} strokeWidth={2.5} aria-hidden />
                </span>
                <span className="flex-1 font-heading text-sm font-medium text-text">{level.label}</span>
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  size={16}
                  strokeWidth={2}
                  aria-hidden
                  className="text-text-muted transition-transform duration-[var(--duration-base)] ease-standard group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
        </motion.nav>
      </div>

      {/* Mascot, in front of the card, with its "typing" bubble right at its top-left. */}
      <div className="pointer-events-none absolute left-[2%] top-1/2 z-10 w-[min(27rem,58%,56vh)] -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.slow, ease, delay: 0.15 }}
        >
          <Mascot state="idle" size={360} label="Mascota de Waylo" className="h-auto w-full" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: duration.slow, ease, delay: 0.45 }}
          className="absolute -left-[4%] top-[6%]"
        >
          <TypingBubble />
        </motion.div>
      </div>
    </div>
  );
}
