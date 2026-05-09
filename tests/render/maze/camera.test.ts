import {
  easeInOutQuad,
  interpolateTarget,
  shortestAngleDelta,
  targetFromPosition,
} from "@/render/maze/camera";
import type { CameraTarget } from "@/render/maze/types";
import { describe, expect, it } from "vitest";

describe("targetFromPosition", () => {
  it("maps grid (0, 19) north to world (0.5, 19.5) yaw 0", () => {
    const t = targetFromPosition({ level: 1, x: 0, y: 19, dir: "n" });
    expect(t.pos).toEqual({ x: 0.5, y: 19.5 });
    expect(t.yaw).toBe(0);
  });

  it("maps east to yaw +π/2", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "e" }).yaw).toBeCloseTo(Math.PI / 2);
  });

  it("maps south to yaw π", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "s" }).yaw).toBeCloseTo(Math.PI);
  });

  it("maps west to yaw -π/2", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "w" }).yaw).toBeCloseTo(-Math.PI / 2);
  });
});

describe("shortestAngleDelta", () => {
  it("returns 0 for same angles", () => {
    expect(shortestAngleDelta(0, 0)).toBeCloseTo(0);
  });
  it("returns +π/2 for 0 → π/2", () => {
    expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });
  it("returns -π/2 for 0 → 3π/2 (shortest = clockwise)", () => {
    expect(shortestAngleDelta(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
  });
  it("returns +π for 0 → π (either direction is equivalent)", () => {
    expect(Math.abs(shortestAngleDelta(0, Math.PI))).toBeCloseTo(Math.PI);
  });
  it("handles wraparound: from -π/2 to π is shortest = -π/2 (clockwise)", () => {
    expect(Math.abs(shortestAngleDelta(-Math.PI / 2, Math.PI))).toBeCloseTo(Math.PI / 2);
  });
});

describe("easeInOutQuad", () => {
  it("starts at 0", () => {
    expect(easeInOutQuad(0)).toBe(0);
  });
  it("ends at 1", () => {
    expect(easeInOutQuad(1)).toBe(1);
  });
  it("midpoint is 0.5", () => {
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5);
  });
  it("monotonically increasing", () => {
    for (let i = 0; i < 10; i++) {
      expect(easeInOutQuad((i + 1) / 10)).toBeGreaterThan(easeInOutQuad(i / 10));
    }
  });
});

describe("interpolateTarget", () => {
  const from: CameraTarget = { pos: { x: 0, y: 0 }, yaw: 0 };
  const to: CameraTarget = { pos: { x: 1, y: 1 }, yaw: Math.PI / 2 };

  it("returns from at t=0", () => {
    const r = interpolateTarget(from, to, 0);
    expect(r.pos).toEqual({ x: 0, y: 0 });
    expect(r.yaw).toBeCloseTo(0);
  });

  it("returns to at t=1", () => {
    const r = interpolateTarget(from, to, 1);
    expect(r.pos.x).toBeCloseTo(1);
    expect(r.pos.y).toBeCloseTo(1);
    expect(r.yaw).toBeCloseTo(Math.PI / 2);
  });

  it("at t=0.5 pos is roughly midway, yaw uses ease", () => {
    const r = interpolateTarget(from, to, 0.5);
    expect(r.pos.x).toBeCloseTo(0.5);
    expect(r.pos.y).toBeCloseTo(0.5);
    expect(r.yaw).toBeCloseTo(Math.PI / 4); // ease(0.5)=0.5
  });

  it("uses shortest angle: 0 → 3π/2 goes clockwise", () => {
    const r = interpolateTarget(
      { pos: { x: 0, y: 0 }, yaw: 0 },
      { pos: { x: 0, y: 0 }, yaw: (3 * Math.PI) / 2 },
      0.5,
    );
    // shortest delta = -π/2; midway = 0 + (-π/2) * 0.5 = -π/4
    expect(r.yaw).toBeCloseTo(-Math.PI / 4);
  });
});
