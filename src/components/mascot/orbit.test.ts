import { describe, expect, it } from "vitest";
import { EYE_X, orbitEye, SPHERE_CX, SPHERE_RADIUS } from "./orbit";

describe("orbitEye", () => {
  it("leaves the eyes in place when facing forward", () => {
    for (const x of EYE_X) {
      const o = orbitEye(x, 0);
      expect(o.x).toBeCloseTo(0);
      expect(o.scaleX).toBeCloseTo(1);
      expect(o.opacity).toBe(1);
    }
  });

  it("moves both eyes left and narrows the outer one most when turning left", () => {
    const left = orbitEye(EYE_X[0], -58);
    const right = orbitEye(EYE_X[1], -58);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeLessThan(0);
    expect(left.scaleX).toBeLessThan(right.scaleX);
    expect(left.scaleX).toBeGreaterThan(0);
  });

  it("keeps the eyes on the sphere", () => {
    for (const x of EYE_X) {
      for (const turn of [-80, -58, -30, 30, 58]) {
        const position = x + orbitEye(x, turn).x;
        expect(Math.abs(position - SPHERE_CX)).toBeLessThanOrEqual(SPHERE_RADIUS + 1e-9);
      }
    }
  });

  it("is symmetric", () => {
    const a = orbitEye(EYE_X[0], -40);
    const b = orbitEye(EYE_X[1], 40);
    expect(a.x).toBeCloseTo(-b.x);
    expect(a.scaleX).toBeCloseTo(b.scaleX);
  });
});
