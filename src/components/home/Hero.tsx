"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MessageCircleIcon } from "@hugeicons/core-free-icons";
import { MotionConfig, motion, type Variants } from "motion/react";
import { Mascot } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { CtaButton } from "./CtaButton";

const ease = [...easing.standard] as [number, number, number, number];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const part: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease } },
};

export function Hero({ loggedIn }: { loggedIn?: boolean }) {
  return (
    // "user" drops the y movement under prefers-reduced-motion and keeps the plain fade.
    <MotionConfig reducedMotion="user">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-start gap-7">
          <motion.h1 variants={part} className="font-script text-[clamp(3rem,10vh,6.5rem)] leading-[1.05] text-title-gradient">
            Navegador del paciente
          </motion.h1>

          <motion.p variants={part} className="max-w-2xl text-body text-text-muted sm:text-body-lg">
            Cuéntanos cómo te sientes y te decimos a qué nivel de atención acudir: Urgencias, Consulta Prioritaria o
            Medicina General.
          </motion.p>

          <motion.div variants={part} className="flex w-full flex-col gap-4 pt-2 sm:w-auto sm:flex-row">
            <CtaButton
              href="/chat"
              variant="primary"
              icon={<HugeiconsIcon icon={MessageCircleIcon} aria-hidden="true" className="size-6" strokeWidth={2} />}
            >
              Orientarme ahora
            </CtaButton>
            {loggedIn ? null : (
              <CtaButton href="/registro" variant="secondary">
                Crear cuenta
              </CtaButton>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.slow, ease, delay: 0.2 }}
          className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none"
        >
          <div aria-hidden="true" className="absolute inset-6 rounded-full bg-accent/15 blur-3xl" />
          <Mascot state="idle" size={380} label="Mascota de Waylo" className="relative h-auto w-[min(26rem,52vh)] max-w-full" />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
