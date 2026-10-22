export interface VadOptions {
  /** Never trigger below this level, however quiet the room is. */
  minThreshold?: number;
  /** Speech must rise this many times above the measured noise floor. */
  floorFactor?: number;
  /** Loud this long before it counts as speech. */
  startMs?: number;
  /** Quiet this long after speech ends the utterance. */
  endMs?: number;
  /** Shorter bursts (a cough, a click) are dropped. */
  minSpeechMs?: number;
}

export type VadEvent = "start" | "end" | "cancel" | null;

/**
 * Turns a stream of loudness readings into utterance boundaries.
 * The threshold follows the room's noise floor, so a fan or street noise does not keep it open.
 */
export function createVad(options: VadOptions = {}) {
  const { minThreshold = 0.045, floorFactor = 3, startMs = 140, endMs = 900, minSpeechMs = 450 } = options;

  let speaking = false;
  let loudSince: number | null = null;
  let speechStart = 0;
  let lastLoud = 0;
  let floor = 0.01;

  return {
    push(level: number, now: number): VadEvent {
      const threshold = Math.max(minThreshold, floor * floorFactor);
      const loud = level >= threshold;

      if (!speaking) {
        if (!loud) {
          // Only quiet moments teach it what the room sounds like.
          floor = floor * 0.97 + level * 0.03;
          loudSince = null;
          return null;
        }
        loudSince ??= now;
        if (now - loudSince >= startMs) {
          speaking = true;
          speechStart = loudSince;
          lastLoud = now;
          return "start";
        }
        return null;
      }

      if (loud) {
        lastLoud = now;
        return null;
      }
      if (now - lastLoud >= endMs) {
        speaking = false;
        loudSince = null;
        return lastLoud - speechStart >= minSpeechMs ? "end" : "cancel";
      }
      return null;
    },
    reset() {
      speaking = false;
      loudSince = null;
    },
  };
}

/** Splits a reply into sentence-sized pieces, so the first one can play while the rest are prepared. */
export function splitForSpeech(text: string, maxChars = 220): string[] {
  const clean = text.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  const pieces: string[] = [];

  for (const sentence of sentences) {
    let rest = sentence;
    while (rest.length > maxChars) {
      const cut = Math.max(rest.lastIndexOf(", ", maxChars), rest.lastIndexOf(" ", maxChars));
      const at = cut > maxChars / 2 ? cut + 1 : maxChars;
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }

  // Very short pieces sound choppy when spoken alone, so they join the one before.
  const merged: string[] = [];
  for (const piece of pieces) {
    const previous = merged[merged.length - 1];
    if (previous && (previous.length < 40 || piece.length < 25) && previous.length + piece.length + 1 <= maxChars) {
      merged[merged.length - 1] = `${previous} ${piece}`;
    } else {
      merged.push(piece);
    }
  }
  return merged;
}
