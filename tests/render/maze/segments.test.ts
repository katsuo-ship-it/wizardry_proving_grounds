import { MAZE_L1 } from "@/engine/data/maze/level1";
import type { MazePosition } from "@/engine/state/types";
import { selectSegments } from "@/render/maze/segments";
import { describe, expect, it } from "vitest";

describe("selectSegments", () => {
  it("returns segments when stairs are at current cell", () => {
    // 開始位置 (0, 19) は stairsUp
    const pos: MazePosition = { level: 1, x: 0, y: 19, dir: "n" };
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns segments for front wall when forward edge is wall", () => {
    // (0, 19) facing east → east edge は wall (壁)
    const pos: MazePosition = { level: 1, x: 0, y: 19, dir: "e" };
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns empty array for out-of-bounds cell", () => {
    // (0, 19) facing west, depth=3 westward → world (-3, 19) で x<0 で範囲外
    const posWest: MazePosition = { level: 1, x: 0, y: 19, dir: "w" };
    const segs = selectSegments(MAZE_L1, posWest, 3, 0);
    expect(segs).toEqual([]);
  });

  it("returns more segments when door is on front edge (wall + door frame)", () => {
    // (2, 1) facing north → north edge は door (Sorcery 経由データで door)
    const pos: MazePosition = { level: 1, x: 2, y: 1, dir: "n" };
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    // wall 4 線 + door 3 線 = 7 線分以上
    expect(segs.length).toBeGreaterThanOrEqual(7);
  });
});
