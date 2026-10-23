"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, FlashIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { MotionConfig, motion, type Variants } from "motion/react";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import { HeroScene } from "./HeroScene";

const ease = [...easing.standard] as [number, number, number, number];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const part: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease } },
};

const FEATURE_ICONS = [FlashIcon, Shield01Icon, FavouriteIcon] as const;

export function Hero({ chatHref }: { chatHref: string }) {
  const t = useT();
  return (
    // "user" drops the y movement under prefers-reduced-motion and keeps the plain fade.
    <MotionConfig reducedMotion="user">
      <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
        <motion.div variants={container} initial="hidden" animate="show" className="flex min-w-0 flex-col items-start gap-6">
          <motion.h1 variants={part} className="font-script text-[clamp(2.5rem,min(10vh,13vw),6.5rem)] leading-[1.05] text-title-gradient">
            {t.home.headline}
          </motion.h1>

          <motion.p variants={part} className="max-w-xl text-base leading-relaxed text-text-muted">
            {t.home.intro}
          </motion.p>

          {/* Pills with a round icon, like the buttons and the mascot's cards: roomy, and each one reads at a glance. */}
          <motion.ul variants={part} className="flex flex-wrap gap-2.5 pt-3">
            {t.home.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2.5 rounded-full bg-surface-raised py-1.5 pl-1.5 pr-4 shadow-soft">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-text text-surface">
                  <HugeiconsIcon icon={FEATURE_ICONS[index]} size={18} strokeWidth={2.25} />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-heading text-sm font-semibold text-text">{feature.title}</span>
                  <span className="text-[0.78rem] text-text-muted">{feature.text}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroScene chatHref={chatHref} />
      </div>
    </MotionConfig>
  );
}
