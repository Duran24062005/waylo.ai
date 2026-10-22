"use client";

import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { prefersReducedMotion } from "@/design/motion";
import { cn } from "@/lib/utils";
import type { LivePhase } from "./useLiveVoice";

interface VoiceHaloProps {
  phase: LivePhase;
  /** Loudness of the voice being heard, read every frame. */
  levelRef: MutableRefObject<number>;
  size: number;
  children: ReactNode;
}

const RINGS = [0, 1, 2];

/**
 * Soft rings behind the mascot that show what the conversation is doing:
 * they breathe while waiting, swell with the patient's voice while listening,
 * follow the assistant's voice while it answers, and a ring of light turns while it thinks.
 */
export function VoiceHalo({ phase, levelRef, size, children }: VoiceHaloProps) {
  const rings = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;

    const tick = (now: number) => {
      const level = levelRef.current;
      rings.current.forEach((ring, i) => {
        if (!ring) return;
        let scale = 1;
        let opacity = 0;

        if (phase === "waiting") {
          const breath = Math.sin(now / 900 - i * 0.7);
          scale = 1.1 + i * 0.08 + breath * 0.03;
          opacity = 0.1 + breath * 0.04;
        } else if (phase === "listening" || phase === "speaking") {
          // The voice sets the size; a small floor keeps the rings alive between words.
          const swell = Math.max(level, 0.08);
          scale = 1.1 + i * 0.08 + swell * (0.35 + i * 0.18);
          opacity = 0.14 + swell * 0.4;
        } else if (phase === "thinking") {
          scale = 1.08 + i * 0.06;
          opacity = 0.07;
        }

        ring.style.transform = `scale(${scale.toFixed(3)})`;
        ring.style.opacity = opacity.toFixed(3);
      });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, levelRef]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {RINGS.map((i) => (
        <span
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--text) 40%, transparent) 38%, transparent 70%)" }}
        />
      ))}

      {/* A ring of light that turns while the answer is being prepared. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-[7%] rounded-full opacity-0 transition-opacity duration-[var(--duration-base)] ease-standard",
          phase === "thinking" && "animate-spin opacity-70 [animation-duration:1.4s] motion-reduce:animate-none",
        )}
        style={{
          background: "conic-gradient(from 0deg, transparent 0 62%, var(--text) 100%)",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
