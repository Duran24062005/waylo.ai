/**
 * Turning the sphere on its vertical axis. The lighting stays put, so the body looks the same;
 * only the eyes move. Each eye slides along the surface (x = r·sin φ) and gets narrower as it
 * nears the edge (width ∝ cos φ), the way a feature on a turning globe does.
 */

/** Horizontal radius of the sphere at eye height (sphere r 46 centered at y 58, eyes at y 52). */
export const SPHERE_RADIUS = Math.sqrt(46 ** 2 - 6 ** 2);
export const SPHERE_CX = 60;
/** Eye centers in viewBox units, left then right. */
export const EYE_X = [47, 73] as const;
export const EYE_Y = 52;

export interface EyeOrbit {
  /** Offset from the eye's resting x. */
  x: number;
  /** Horizontal foreshortening, 1 when facing the viewer. */
  scaleX: number;
  /** Fades the eye out as it reaches the edge, so it never pops off. */
  opacity: number;
}

/** turnDeg < 0 turns the face to the viewer's left. */
export function orbitEye(baseX: number, turnDeg: number): EyeOrbit {
  const r = SPHERE_RADIUS;
  const dx = baseX - SPHERE_CX;
  const start = Math.asin(dx / r);
  const angle = start + (turnDeg * Math.PI) / 180;
  const facing = Math.cos(angle);
  return {
    x: r * Math.sin(angle) - dx,
    scaleX: Math.max(0, facing / Math.cos(start)),
    opacity: Math.min(1, Math.max(0, facing / 0.18)),
  };
}
