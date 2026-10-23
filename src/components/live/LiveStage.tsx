"use client";

import type { MutableRefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mascot, type MascotState } from "@/components/mascot";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import { VoiceHalo } from "./VoiceHalo";
import type { LivePhase } from "./useLiveVoice";

/** Which pose the mascot takes in each phase. Muted shuts its eyes but keeps facing the person. */
export const MASCOT_STATE: Record<LivePhase, MascotState> = {
  off: "idle",
  waiting: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  muted: "muted",
  error: "error",
};

interface LiveStageProps {
  phase: LivePhase;
  levelRef: MutableRefObject<number>;
  /** A soft problem, such as a sentence that could not be understood. It replaces the hint for a moment. */
  notice?: string | null;
}

/** The mascot and its state while the voice mode is on. The transcript stays hidden until the mode is closed. */
export function LiveStage({ phase, levelRef, notice }: LiveStageProps) {
  const t = useT().live;
  const label = phase === "off" ? "" : t.phases[phase];
  const hint = phase === "off" ? "" : t.hints[phase];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: duration.slow, ease: easing.standard }}
      className="flex flex-col items-center gap-4 text-center"
      role="status"
      aria-live="polite"
      aria-label={t.stageLabel}
    >
      <VoiceHalo phase={phase} levelRef={levelRef} size={176}>
        <Mascot state={MASCOT_STATE[phase]} size={176} />
      </VoiceHalo>

      <div className="flex min-w-0 flex-col items-center gap-1">
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={phase}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: duration.base, ease: easing.standard }}
              className="font-heading text-title font-medium text-text"
            >
              {label}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="text-sm text-text-muted">{notice ?? hint}</p>
      </div>
    </motion.div>
  );
}
