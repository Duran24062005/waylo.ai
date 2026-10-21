"use client";

import { MotionConfig, motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

const ease = [...easing.standard] as [number, number, number, number];

const LEVELS = [
  {
    title: "Urgencias",
    text: "Cuando algo pone tu vida en riesgo o empeora muy rápido. Ve de inmediato.",
    dot: "bg-danger",
  },
  {
    title: "Consulta prioritaria",
    text: "Cuando necesitas que te vea un médico hoy, pero no es una urgencia vital.",
    dot: "bg-warning",
  },
  {
    title: "Medicina general",
    text: "Para molestias leves o seguimiento, con una cita programada.",
    dot: "bg-success",
  },
] as const;

const STEPS = [
  { n: "1", title: "Cuéntanos", text: "Escribe qué sientes con tus palabras." },
  { n: "2", title: "Te preguntamos", text: "Hacemos de 3 a 5 preguntas cortas." },
  { n: "3", title: "Te orientamos", text: "Te decimos a dónde ir y qué llevar." },
] as const;

const card = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function Levels() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
        <section id="niveles" aria-labelledby="niveles-titulo" className="flex flex-col gap-8">
          <h2 id="niveles-titulo" className="font-heading text-headline font-semibold text-text">
            Tres niveles de atención
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {LEVELS.map((level, index) => (
              <motion.article
                key={level.title}
                {...card}
                transition={{ duration: duration.slow, ease, delay: index * 0.1 }}
              >
                <div className="lift lift-lg h-full rounded-xl bg-surface-raised p-8 shadow-soft">
                <span aria-hidden className={cn("mb-5 block size-4 rounded-full shadow-soft", level.dot)} />
                <h3 className="font-heading text-title font-semibold text-text">{level.title}</h3>
                <p className="mt-3 text-body-lg text-text-muted">{level.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="como" aria-labelledby="como-titulo" className="flex flex-col gap-8">
          <h2 id="como-titulo" className="font-heading text-headline font-semibold text-text">
            Cómo funciona
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.n}
                {...card}
                transition={{ duration: duration.slow, ease, delay: index * 0.1 }}
                className="flex items-start gap-5 rounded-xl bg-surface p-6 shadow-inset"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-raised font-heading text-title font-semibold text-accent shadow-soft">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-heading text-body-lg font-semibold text-text">{step.title}</h3>
                  <p className="mt-1 text-body text-text-muted">{step.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      </div>
    </MotionConfig>
  );
}
