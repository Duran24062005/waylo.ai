import type { MascotState } from "./contract";

/** Resting values per state. This is the whole pose when reduced motion is on. */
export interface Pose {
  bodyScale: number;
  bodyRotation: number;
  eyeScaleX: number;
  eyeScaleY: number;
  /** Horizontal glance in viewBox units. */
  lookX: number;
}

export const POSES: Record<MascotState, Pose> = {
  idle: { bodyScale: 1, bodyRotation: 0, eyeScaleX: 1, eyeScaleY: 1, lookX: 0 },
  listening: { bodyScale: 1, bodyRotation: 4, eyeScaleX: 1.06, eyeScaleY: 1.14, lookX: 0 },
  thinking: { bodyScale: 1, bodyRotation: -2, eyeScaleX: 1, eyeScaleY: 1, lookX: 4 },
  speaking: { bodyScale: 1, bodyRotation: 0, eyeScaleX: 1, eyeScaleY: 1.06, lookX: 0 },
  // Narrower eyes read as calm and steady, never startled.
  alert: { bodyScale: 1, bodyRotation: 0, eyeScaleX: 1, eyeScaleY: 0.86, lookX: 0 },
  success: { bodyScale: 1, bodyRotation: 0, eyeScaleX: 1, eyeScaleY: 0.82, lookX: 0 },
  // Lower, narrower eyes and a slight droop read as sad, never alarming.
  error: { bodyScale: 0.98, bodyRotation: -5, eyeScaleX: 1, eyeScaleY: 0.64, lookX: -2 },
};

/** States where the eyes follow the pointer. Thinking glances on its own, alert stays steady. */
export const FOLLOWS_POINTER: Record<MascotState, boolean> = {
  idle: true,
  listening: true,
  thinking: false,
  speaking: true,
  alert: false,
  success: true,
  error: false,
};

/** States where the mascot blinks now and then. */
export const BLINKS: Record<MascotState, boolean> = {
  idle: true,
  listening: true,
  thinking: false,
  speaking: true,
  alert: false,
  success: false,
  error: false,
};

/** Eye travel from the pointer, in viewBox units, and the distance (px) that reaches it. */
export const GAZE = { maxX: 4, maxY: 3, reach: 260 } as const;
