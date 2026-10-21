"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LogInIcon, MessageCircleIcon } from "@hugeicons/core-free-icons";
import { MotionConfig, motion, type Variants } from "motion/react";
import { Mascot } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { CtaButton } from "./CtaButton";

const ease = [...easing.standard] as [number, number, number, number];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const part: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease } },
};

export function Hero() {
  return (
    // "user" drops the y movement under prefers-reduced-motion and keeps the plain fade.
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center"
      >
        <motion.div variants={part} className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-125 rounded-full bg-accent/10 blur-3xl"
          />
          <Mascot state="idle" size={220} label="Mascota de Waylo" />
        </motion.div>

        <motion.h1 variants={part} className="text-headline font-bold text-text sm:text-display">
          Navegador del paciente
        </motion.h1>

        <motion.p variants={part} className="text-body-lg text-text-muted">
          Cuéntanos cómo te sientes y te decimos a qué nivel de atención acudir: Urgencias,
          Consulta Prioritaria o Medicina General.
        </motion.p>

        <motion.p
          variants={part}
          className="rounded-md border border-border bg-surface-raised px-4 py-3 text-body text-text"
        >
          Esto no es un diagnóstico ni una receta. Solo te orienta sobre dónde ir.
        </motion.p>

        <motion.div
          variants={part}
          className="flex w-full flex-col items-stretch gap-4 pt-2 sm:w-auto sm:flex-row"
        >
          <CtaButton href="/chat" variant="primary" icon={<HugeiconsIcon icon={MessageCircleIcon} aria-hidden="true" className="size-6" strokeWidth={2} />}>
            Orientarme ahora
          </CtaButton>
          <CtaButton href="/login" variant="secondary" icon={<HugeiconsIcon icon={LogInIcon} aria-hidden="true" className="size-6" strokeWidth={2} />}>
            Iniciar sesión
          </CtaButton>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
}
