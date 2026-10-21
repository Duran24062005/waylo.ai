export interface GazeOffset {
  x: number;
  y: number;
}

/**
 * Maps the pointer's distance from the mascot's center to an eye offset inside an
 * elliptical bound (maxX, maxY). The offset grows linearly until the pointer is `reach`
 * pixels away, then stays on the edge of the ellipse.
 */
export function gazeOffset(
  dx: number,
  dy: number,
  maxX: number,
  maxY: number,
  reach: number,
): GazeOffset {
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || reach <= 0) return { x: 0, y: 0 };
  const strength = Math.min(distance / reach, 1);
  return {
    x: (dx / distance) * strength * maxX,
    y: (dy / distance) * strength * maxY,
  };
}
