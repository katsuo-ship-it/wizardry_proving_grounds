import { MAZE_L1 } from "@/engine/data/maze/level1";
import type { MazePosition } from "@/engine/state/types";
import { selectSegments } from "@/render/maze/segments";
import { describe, expect, it } from "vitest";

describe("selectSegments", () => {
  it("returns segments when stairs are at current cell", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 3, dir: "n" };
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns segments for front wall when forward edge is wall", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "n" }; // 北は壁
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns empty array for out-of-bounds cell", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "n" };
    // (1+1, 1-3) = (2, -2) は範囲外
    const segs = selectSegments(MAZE_L1, pos, 3, 1);
    expect(segs).toEqual([]);
  });

  it("returns more segments when door is on front edge (wall + door frame)", () => {
    // (2,1) facing south は door なので front wall + frontDoor 両方描かれる
    const pos: MazePosition = { level: 1, x: 2, y: 1, dir: "s" };
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    // wall 4 線 + door 3 線 = 7 線分以上
    expect(segs.length).toBeGreaterThanOrEqual(7);
  });
});
