import type { Cell, CellEdge, MazeLevel, SpecialTile } from "@/engine/data/maze/types";

/**
 * 4x4 fixture: 全外周が壁、(2,1) の west エッジが扉、(2,2) は階段 up。
 * - grid[y][x] で参照
 * - 内部エッジは全て open (= 壁が外周のみ)
 * - 内部 north/west = open, x=0 の west = wall, y=0 の north = wall
 * - southBoundary/eastBoundary 全 wall
 */
export function makeMiniLevel(): MazeLevel {
  const grid: Cell[][] = Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => {
      const n: CellEdge = y === 0 ? "wall" : "open";
      const w: CellEdge = x === 0 ? "wall" : "open";
      const special: SpecialTile = x === 2 && y === 2 ? "stairsUp" : "none";
      return { edges: { n, w }, special };
    }),
  );
  // (2, 1) の west エッジを door に上書き (= (1,1) と (2,1) の間に扉)
  // biome-ignore lint/style/noNonNullAssertion: 4x4 fixture always has row 1
  grid[1]![2] = { edges: { n: "open", w: "door" }, special: "none" };
  return {
    grid,
    southBoundary: ["wall", "wall", "wall", "wall"],
    eastBoundary: ["wall", "wall", "wall", "wall"],
    startPosition: { x: 0, y: 0, dir: "n" },
  };
}
