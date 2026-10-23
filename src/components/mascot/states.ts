import type { MascotState } from "./contract";

/** Resting values per state. This is the whole pose when reduced motion is on. */
export interface Pose {
  bodyScale: number;
  bodyRotation: number;
  eyeScaleX: number;
  eyeScaleY: number;
  /** Horizontal glance in viewBox units. */
  lookX: number;
  /** Turn on the vertical axis, in degrees. Negative faces the viewer's left. */
  turn: number;
  /** 0 eyes open, 1 eyes shut. */
  closed: number;
  /** 1 shows the mute icon where the mouth would be. */
  mute: number;
  /** 1 shows the three Z of a sleeping mascot. */
  zzz: number;
}

const pose = (overrides: Partial<Pose>): Pose => ({
  bodyScale: 1,
  bodyRotation: 0,
  eyeScaleX: 1,
  eyeScaleY: 1,
  lookX: 0,
  turn: 0,
  closed: 0,
  mute: 0,
  zzz: 0,
  ...overrides,
});

export const POSES: Record<MascotState, Pose> = {
  idle: pose({}),
  listening: pose({ bodyRotation: 4, eyeScaleX: 1.06, eyeScaleY: 1.14 }),
  thinking: pose({ bodyRotation: -2, lookX: 4 }),
  speaking: pose({ eyeScaleY: 1.06 }),
  // Narrower eyes read as calm and steady, never startled.
  alert: pose({ eyeScaleY: 0.86 }),
  success: pose({ eyeScaleY: 0.82 }),
  // Lower, narrower eyes and a slight droop read as sad, never alarming.
  error: pose({ bodyScale: 0.98, bodyRotation: -5, eyeScaleY: 0.64, lookX: -2 }),
  // Turned away to the left on its vertical axis, then the eyes shut: it is not looking at what is typed.
  private: pose({ turn: -58, closed: 1 }),
  // Eyes open and facing front, with the mute icon where the mouth would be.
  muted: pose({ mute: 1 }),
  // Eyes shut and facing front: resting, with the Z of sleep floating up.
  resting: pose({ closed: 1, zzz: 1 }),
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
  private: false,
  muted: true,
  resting: false,
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
  private: false,
  muted: true,
  resting: false,
};

/** Eye travel from the pointer, in viewBox units, and the distance (px) that reaches it. */
export const GAZE = { maxX: 4, maxY: 3, reach: 260 } as const;
