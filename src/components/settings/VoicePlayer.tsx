"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { duration, easing, prefersReducedMotion } from "@/design/motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { Voice } from "@/lib/preferences";
import { cn } from "@/lib/utils";

type PlayerState = "idle" | "loading" | "playing" | "paused";

/** Bars on each side of the button. */
const BARS_PER_SIDE = 15;

/** The bars' resting heights, in px: tall beside the button, thinner toward the edges, never two alike in a row. */
const BASE_HEIGHTS = Array.from({ length: BARS_PER_SIDE }, (_, d) => {
  const fall = 1 - d / (BARS_PER_SIDE * 1.15);
  return Math.round(10 + 40 * Math.abs(Math.sin(d * 1.7 + 0.6)) * fall);
});

const swap = {
  initial: { opacity: 0, rotate: -80, scale: 0.5 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 80, scale: 0.5 },
  transition: { duration: duration.fast, ease: easing.standard },
};

interface AudioGraph {
  ctx: AudioContext;
  analyser: AnalyserNode;
}

/**
 * Plays a short sentence in the chosen voice, in a frame that spans the width: a round button in the middle and,
 * on both sides, bars that move with the sound of the voice while it plays.
 */
export function VoicePlayer({ voice }: { voice: Voice }) {
  const { t, locale } = useI18n();
  const copy = t.settings.live;
  const [state, setState] = useState<PlayerState>("idle");
  const [failed, setFailed] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const graph = useRef<AudioGraph | null>(null);
  // Each voice and language is fetched once; playing it again, or after a pause, reuses it.
  const cache = useRef(new Map<string, string>());
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const key = `${voice}|${locale}`;

  const stop = useCallback(() => {
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
    setState("idle");
  }, []);

  // Another voice or language makes the sample on screen out of date.
  useEffect(() => {
    stop();
  }, [key, stop]);

  // Leaving the page cuts the sample short and frees what it held.
  useEffect(() => {
    const urls = cache.current;
    return () => {
      audio.current?.pause();
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      void graph.current?.ctx.close().catch(() => undefined);
      graph.current = null;
    };
  }, []);

  // While it plays, every bar follows a slice of the sound's spectrum. Bars are moved directly, not through React, every frame.
  useEffect(() => {
    const els = bars.current;
    if (state !== "playing" || prefersReducedMotion() || !graph.current) {
      els.forEach((el) => {
        if (el && state !== "paused") el.style.transform = "";
      });
      return;
    }
    const { analyser } = graph.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const smoothed = new Array<number>(BARS_PER_SIDE).fill(1);
    let frame = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      for (let d = 0; d < BARS_PER_SIDE; d += 1) {
        // The bars next to the button take the low tones, where a voice has its body; the edges, the highs.
        const level = data[Math.min(data.length - 1, 1 + d * 2)] / 255;
        const target = 0.3 + level * 1.15;
        smoothed[d] += (target - smoothed[d]) * 0.4;
        const transform = `scaleY(${smoothed[d].toFixed(3)})`;
        const left = els[BARS_PER_SIDE - 1 - d];
        const right = els[BARS_PER_SIDE + d];
        if (left) left.style.transform = transform;
        if (right) right.style.transform = transform;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  async function load(): Promise<string> {
    const cached = cache.current.get(key);
    if (cached) return cached;
    const response = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: copy.previewText, voice, lang: locale }),
    });
    if (!response.ok) throw new Error("preview failed");
    const url = URL.createObjectURL(await response.blob());
    cache.current.set(key, url);
    return url;
  }

  function listen(element: HTMLAudioElement): AudioGraph | null {
    if (graph.current) return graph.current;
    if (typeof AudioContext === "undefined") return null;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.6;
    ctx.createMediaElementSource(element).connect(analyser);
    analyser.connect(ctx.destination);
    graph.current = { ctx, analyser };
    return graph.current;
  }

  async function toggle() {
    if (state === "loading") return;
    if (state === "playing") {
      audio.current?.pause();
      setState("paused");
      return;
    }
    if (state === "paused" && audio.current) {
      await audio.current.play().catch(() => undefined);
      setState("playing");
      return;
    }

    setFailed(false);
    setState("loading");
    try {
      const url = await load();
      if (!audio.current) {
        audio.current = new Audio();
        audio.current.onended = () => setState("idle");
      }
      const element = audio.current;
      const wiring = listen(element);
      if (element.src !== url) element.src = url;
      element.currentTime = 0;
      await wiring?.ctx.resume();
      await element.play();
      setState("playing");
    } catch {
      setFailed(true);
      setState("idle");
    }
  }

  const label = state === "playing" ? copy.pause : copy.preview;
  const playing = state === "playing";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-24 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-surface px-3 shadow-inset sm:gap-4 sm:px-5">
        <div aria-hidden className="flex flex-1 items-center justify-end gap-[3px] sm:gap-1">
          {Array.from({ length: BARS_PER_SIDE }, (_, i) => (
            <Bar key={i} index={i} distance={BARS_PER_SIDE - 1 - i} bars={bars} playing={playing} />
          ))}
        </div>

        <div className="relative shrink-0">
          {/* A ring spreads from the button while the voice plays. */}
          {playing ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-text/15"
              animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity }}
            />
          ) : null}
          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={label}
            title={label}
            aria-busy={state === "loading"}
            className="lift lift-sm relative grid size-16 cursor-pointer place-items-center rounded-full bg-surface-raised text-text shadow-raised focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={state === "loading" ? "loading" : playing ? "pause" : "play"} {...swap} className="grid place-items-center">
                {state === "loading" ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, ease: "linear", repeat: Infinity }} className="grid">
                    <HugeiconsIcon icon={Loading03Icon} size={26} strokeWidth={2.5} aria-hidden />
                  </motion.span>
                ) : (
                  <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={26} strokeWidth={2.5} aria-hidden />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <div aria-hidden className="flex flex-1 items-center justify-start gap-[3px] sm:gap-1">
          {Array.from({ length: BARS_PER_SIDE }, (_, i) => (
            <Bar key={i} index={BARS_PER_SIDE + i} distance={i} bars={bars} playing={playing} />
          ))}
        </div>
      </div>

      {failed ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {copy.previewFailed}
        </p>
      ) : null}
    </div>
  );
}

interface BarProps {
  /** Position across the whole row, from the left edge. */
  index: number;
  /** How far it is from the button: 0 is next to it. */
  distance: number;
  bars: React.RefObject<(HTMLSpanElement | null)[]>;
  playing: boolean;
}

function Bar({ index, distance, bars, playing }: BarProps) {
  return (
    <span
      ref={(el) => {
        bars.current[index] = el;
      }}
      className={cn(
        "w-[3px] shrink-0 rounded-full bg-text sm:w-1",
        // While it plays the frame loop sets the size every frame; at rest it settles back with a short ease.
        !playing && "transition-transform duration-[var(--duration-base)] ease-standard",
        // Now and then a fainter bar, so the row is not one flat tone.
        distance % 4 === 3 ? "opacity-35" : "opacity-80",
        // The bars on a phone are fewer: the outer ones are hidden to leave the button room.
        distance > 9 && "hidden sm:block",
      )}
      style={{ height: BASE_HEIGHTS[distance] }}
    />
  );
}
