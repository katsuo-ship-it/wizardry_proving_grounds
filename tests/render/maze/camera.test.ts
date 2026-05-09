import {
  CameraAnimator,
  easeInOutQuad,
  interpolateTarget,
  shortestAngleDelta,
  targetFromPosition,
} from "@/render/maze/camera";
import type { CameraTarget } from "@/render/maze/types";
import { beforeEach, describe, expect, it } from "vitest";

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

describe("CameraAnimator", () => {
  // Test harness: drive RAF + clock manually
  let scheduled: ((now: number) => void)[] = [];
  let nowMs = 0;

  function fakeRaf(cb: (now: number) => void): number {
    scheduled.push(cb);
    return scheduled.length;
  }
  function fakeCancel(id: number): void {
    // no-op for tests; we don't actually run callbacks after cancel
    scheduled[id - 1] = () => {};
  }
  function fakeNow(): number {
    return nowMs;
  }
  function advance(ms: number): void {
    nowMs += ms;
    const toRun = scheduled;
    scheduled = [];
    for (const cb of toRun) cb(nowMs);
  }

  beforeEach(() => {
    scheduled = [];
    nowMs = 0;
  });

  it("calls onFrame with the start target at t=0", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 }, fakeRaf, fakeCancel, fakeNow);
    const frames: number[] = [];
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, (c) => frames.push(c.pos.x));
    expect(frames[0]).toBeCloseTo(0);
  });

  it("ends exactly at the target after duration", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 }, fakeRaf, fakeCancel, fakeNow);
    const last: { x: number }[] = [];
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, (c) => last.push({ ...c.pos }));
    advance(50);
    advance(50);
    advance(10); // past end
    const final = last.at(-1);
    expect(final?.x).toBeCloseTo(1);
  });

  it("interrupting animateTo restarts from current interpolated frame", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 }, fakeRaf, fakeCancel, fakeNow);
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, () => {});
    advance(50); // halfway: ease(0.5) = 0.5 → x = 0.5
    const frames: { x: number }[] = [];
    a.animateTo({ pos: { x: 0, y: 1 }, yaw: 0 }, 100, (c) => frames.push({ ...c.pos }));
    expect(frames.at(0)?.x).toBeCloseTo(0.5); // new from = current at interrupt
  });

  it("isAnimating: false initially, true while running, false after end", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 }, fakeRaf, fakeCancel, fakeNow);
    expect(a.isAnimating).toBe(false);
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, () => {});
    expect(a.isAnimating).toBe(true);
    advance(50);
    expect(a.isAnimating).toBe(true); // still in flight
    advance(60); // past end
    expect(a.isAnimating).toBe(false);
  });

  it("cancel() stops further frames and clears callback", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 }, fakeRaf, fakeCancel, fakeNow);
    let calls = 0;
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, () => calls++);
    expect(calls).toBe(1); // initial tick
    a.cancel();
    expect(a.isAnimating).toBe(false);
    advance(50); // would have triggered more frames
    expect(calls).toBe(1); // cancel() prevented further callbacks
  });
});
