import type { MazePosition } from "@/engine/state/types";
import { computeViewport, worldFromView } from "@/render/maze/viewport";
import { describe, expect, it } from "vitest";

describe("worldFromView", () => {
  it("facing north: depth advances toward -y, rel=+1 toward +x", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    expect(worldFromView(pos, 0, 0)).toEqual({ x: 5, y: 5 });
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 5, y: 4 });
    expect(worldFromView(pos, 2, 0)).toEqual({ x: 5, y: 3 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 6, y: 5 });
    expect(worldFromView(pos, 0, -1)).toEqual({ x: 4, y: 5 });
    expect(worldFromView(pos, 1, 1)).toEqual({ x: 6, y: 4 });
  });

  it("facing east: depth advances toward +x, rel=+1 toward +y", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "e" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 6, y: 5 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 5, y: 6 });
  });

  it("facing south: depth toward +y, rel=+1 toward -x", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "s" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 5, y: 6 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 4, y: 5 });
  });

  it("facing west: depth toward -x, rel=+1 toward -y", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "w" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 4, y: 5 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 5, y: 4 });
  });
});

describe("computeViewport", () => {
  it("returns 12 cells (4 depths × 3 rel positions)", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    const cells = computeViewport(pos);
    expect(cells).toHaveLength(12);
  });

  it("each entry has world coords + depth + rel", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    const cells = computeViewport(pos);
    for (const c of cells) {
      expect(c).toHaveProperty("x");
      expect(c).toHaveProperty("y");
      expect(c).toHaveProperty("depth");
      expect(c).toHaveProperty("rel");
      expect([0, 1, 2, 3]).toContain(c.depth);
      expect([-1, 0, 1]).toContain(c.rel);
    }
  });
});
