import { describe, expect, it } from "vitest";
import { gazeOffset } from "./pointer";

describe("gazeOffset", () => {
  it("stays centered when the pointer is on the mascot", () => {
    expect(gazeOffset(0, 0, 4, 3, 200)).toEqual({ x: 0, y: 0 });
  });

  it("scales linearly inside the reach", () => {
    const { x, y } = gazeOffset(100, 0, 4, 3, 200);
    expect(x).toBeCloseTo(2);
    expect(y).toBeCloseTo(0);
  });

  it("clamps to the ellipse when the pointer is far away", () => {
    const right = gazeOffset(5000, 0, 4, 3, 200);
    expect(right.x).toBeCloseTo(4);
    const down = gazeOffset(0, 5000, 4, 3, 200);
    expect(down.y).toBeCloseTo(3);
    const diagonal = gazeOffset(-5000, -5000, 4, 3, 200);
    expect(Math.abs(diagonal.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(diagonal.y)).toBeLessThanOrEqual(3);
    expect(diagonal.x).toBeLessThan(0);
    expect(diagonal.y).toBeLessThan(0);
  });

  it("returns no offset when reach is not positive", () => {
    expect(gazeOffset(50, 50, 4, 3, 0)).toEqual({ x: 0, y: 0 });
  });
});
