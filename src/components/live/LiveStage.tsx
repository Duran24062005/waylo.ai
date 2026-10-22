"use client";

import type { MutableRefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mascot, type MascotState } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";
import { VoiceHalo } from "./VoiceHalo";
import type { LivePhase } from "./useLiveVoice";

/** Which pose the mascot takes in each phase. Muted turns away with its eyes shut: it is not listening. */
export const MASCOT_STATE: Record<LivePhase, MascotState> = {
  off: "idle",
  waiting: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  muted: "private",
  error: "error",
};

export const PHASE_LABEL: Record<LivePhase, string> = {
  off: "",
  waiting: "Esperando…",
  listening: "Escuchando…",
  thinking: "Pensando…",
  speaking: "Respondiendo…",
  muted: "Micrófono silenciado",
  error: "No pude escucharte",
};

const PHASE_HINT: Record<LivePhase, string> = {
  off: "",
  waiting: "Háblame o escribe abajo.",
  listening: "Te escucho con atención.",
  thinking: "Estoy preparando mi respuesta.",
  speaking: "Puedes escribir mientras tanto.",
  muted: "Activa el micrófono para hablar, o escribe abajo.",
  error: "Revisa el micrófono o escribe abajo.",
};

interface LiveStageProps {
  phase: LivePhase;
  levelRef: MutableRefObject<number>;
  /** A soft problem, such as a sentence that could not be understood. It replaces the hint for a moment. */
  notice?: string | null;
  /** Small version that stays at the top while the conversation scrolls. */
  compact?: boolean;
}

/** The mascot and its state while the voice mode is on. */
export function LiveStage({ phase, levelRef, notice, compact }: LiveStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: duration.slow, ease: easing.standard }}
      className={cn("flex items-center", compact ? "flex-row gap-4 py-2" : "flex-col gap-4 text-center")}
      role="status"
      aria-live="polite"
      aria-label="Estado de la voz"
    >
      <VoiceHalo phase={phase} levelRef={levelRef} size={compact ? 64 : 176}>
        <Mascot state={MASCOT_STATE[phase]} size={compact ? 64 : 176} />
      </VoiceHalo>

      <div className={cn("flex min-w-0 flex-col", compact ? "items-start" : "items-center gap-1")}>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={phase}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: duration.base, ease: easing.standard }}
              className={cn("font-heading font-medium text-text", compact ? "text-base" : "text-title")}
            >
              {PHASE_LABEL[phase]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className={cn("text-sm text-text-muted", compact && "hidden sm:block")}>{notice ?? PHASE_HINT[phase]}</p>
      </div>
    </motion.div>
  );
}
