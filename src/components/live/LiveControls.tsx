"use client";

import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Mic01Icon, MicOff01Icon } from "@hugeicons/core-free-icons";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

// Same square, same depth as the rest of the composer: raised at rest, lifted on hover.
const square = cn(
  "relative inline-flex size-14 shrink-0 items-center justify-center rounded-2xl",
  "lift lift-sm transition-[box-shadow,background-color,color] duration-[var(--duration-base)] ease-standard",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

/** Five bars, like a sound wave. */
function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
      <path d="M4 10v4M8 6v12M12 3v18M16 8v8M20 10v4" />
    </svg>
  );
}

const swap = {
  initial: { opacity: 0, rotate: -90, scale: 0.5 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 90, scale: 0.5 },
  transition: { duration: duration.fast, ease: easing.standard },
};

interface LiveControlsProps {
  supported: boolean;
  active: boolean;
  muted: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
}

export function LiveControls({ supported, active, muted, onStart, onStop, onToggleMute }: LiveControlsProps) {
  const voiceLabel = active ? "Salir del modo voz" : "Iniciar voz";

  return (
    <div className="flex shrink-0 items-end">
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            key="mute"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 68, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            className="overflow-hidden"
          >
            <div className="pr-3">
              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={muted}
                aria-label={muted ? "Activar el micrófono" : "Silenciar el micrófono"}
                title={muted ? "Activar el micrófono" : "Silenciar el micrófono"}
                className={cn(square, muted ? "bg-text text-surface shadow-solid" : "bg-surface-raised text-text shadow-soft hover:shadow-raised")}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={muted ? "off" : "on"} {...swap} className="grid place-items-center">
                    <HugeiconsIcon icon={muted ? MicOff01Icon : Mic01Icon} size={24} strokeWidth={2.25} aria-hidden />
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={active ? onStop : onStart}
        disabled={!supported}
        aria-pressed={active}
        aria-label={voiceLabel}
        title={supported ? voiceLabel : "Tu navegador no permite usar la voz"}
        className={cn(square, active ? "bg-accent text-accent-foreground shadow-solid" : "bg-surface-raised text-text shadow-soft hover:shadow-raised")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={active ? "close" : "wave"} {...swap} className="grid place-items-center">
            {active ? <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={2.5} aria-hidden /> : <WaveIcon />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
