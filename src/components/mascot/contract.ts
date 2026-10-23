/**
 * Shared mascot contract. The mascot is decoration plus a calm status cue: it never
 * replaces text, never diagnoses, and never carries a message on its own.
 *
 * - idle:      Nothing is happening. Resting pose, waiting for the person to write.
 * - listening: The person is typing or the input has focus. Attentive, no motion loops.
 * - thinking:  A request is in flight (triage is running). Gentle, slow loop.
 * - speaking:  The assistant's answer is being shown or streamed.
 * - alert:     A red flag was detected. This is a calm, steady visual cue that only
 *              appears next to the fixed red-flag text ("Esto requiere atención
 *              inmediata..."). It is never an alarm by itself: no flashing, no shaking,
 *              no sound, no red takeover. The text is the message; the mascot only
 *              supports it.
 * - error:     Something failed (network, server). A soft, sad pose: eyes lower and narrower,
 *              one gentle tilt. No flashing, no loud shaking. The text explains the problem.
 * - private:   The person is typing a password. The mascot turns away to the left and closes
 *              its eyes, and does not follow the pointer. It returns to normal when the field loses focus.
 * - muted:     The voice mode's microphone is off. The eyes stay open and it keeps facing the person;
 *              a mute icon (a solid speaker with a cross) pops in where the mouth would be.
 * - resting:   Nothing is happening and nobody is writing. The eyes shut, facing front, and three Z
 *              float up from it. It wakes (opens its eyes) as soon as the input gets focus.
 * - success:   A step completed well (e.g. an orientation was delivered). The only
 *              state allowed to use --ease-emphasis. Must not appear alongside "alert".
 *
 * All states must respect prefers-reduced-motion (see src/design/motion.ts).
 */
export type MascotState = "idle" | "listening" | "thinking" | "speaking" | "alert" | "success" | "error" | "private" | "muted" | "resting";

export interface MascotProps {
  state: MascotState;
  /** Rendered width and height in CSS pixels. */
  size?: number;
  className?: string;
  /**
   * Spanish accessible name. When omitted, the mascot is decorative (aria-hidden),
   * because the surrounding text already says what is happening.
   */
  label?: string;
}
