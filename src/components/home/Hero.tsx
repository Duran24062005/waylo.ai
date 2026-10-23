"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, FlashIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { MotionConfig, motion, type Variants } from "motion/react";
import { duration, easing } from "@/design/motion";
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

const FEATURES = [
  { icon: FlashIcon, title: "Respuesta rápida", text: "en minutos" },
  { icon: Shield01Icon, title: "Orientación clara", text: "según tus síntomas" },
  { icon: FavouriteIcon, title: "Tu salud primero", text: "siempre" },
] as const;

export function Hero({ chatHref }: { chatHref: string }) {
  return (
    // "user" drops the y movement under prefers-reduced-motion and keeps the plain fade.
    <MotionConfig reducedMotion="user">
      <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
        <motion.div variants={container} initial="hidden" animate="show" className="flex min-w-0 flex-col items-start gap-6">
          <motion.h1 variants={part} className="font-script text-[clamp(2.5rem,min(10vh,13vw),6.5rem)] leading-[1.05] text-title-gradient">
            Navegador del paciente
          </motion.h1>

          <motion.p variants={part} className="max-w-xl text-base leading-relaxed text-text-muted">
            Cuéntanos cómo te sientes y te decimos a qué nivel de atención acudir: Urgencias, Consulta Prioritaria o
            Medicina General.
          </motion.p>

          {/* Pills with a round icon, like the buttons and the mascot's cards: roomy, and each one reads at a glance. */}
          <motion.ul variants={part} className="flex flex-wrap gap-2.5 pt-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-center gap-2.5 rounded-full bg-surface-raised py-1.5 pl-1.5 pr-4 shadow-soft">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-text text-surface">
                  <HugeiconsIcon icon={feature.icon} size={18} strokeWidth={2.25} />
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
