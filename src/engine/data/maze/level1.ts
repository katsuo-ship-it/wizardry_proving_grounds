// Reference: docs/reference/wiz1/data-tables/maze-l1.md
//
// M4 開発用の最小テストマップ。Phase H で tk421 を見て 20×20 完全データに差し替える。
// 構造 (4×4 領域、それ以外は全て壁):
//   y=0 [W][W][W][W]
//   y=1 [W][.][.][W]      ← (1,1) が開始位置 (北向き)
//   y=2 [W][.][D][W]      ← (2,2) は (2,1) と扉でつながる
//   y=3 [W][U][W][W]      ← (1,3) に上り階段 (stairsUp)
//
// 全周は壁、内側に通路 + 扉 + 階段。

import type { Cell, CellEdge, MazeLevel } from "./types";
import { MAZE_SIZE } from "./types";

const SOLID_CELL: Cell = {
  edges: { n: "wall", w: "wall" },
  special: "none",
};

function makeRow(): Cell[] {
  return Array.from({ length: MAZE_SIZE }, () => ({ ...SOLID_CELL, edges: { ...SOLID_CELL.edges } }));
}

const grid: Cell[][] = Array.from({ length: MAZE_SIZE }, () => makeRow());

// 4×4 内側領域の上書き (型 narrowing のため非 null assertion)
// (1,0) は北端の通路セル — 北は壁 (boundary)、西は壁 (0,0 との境)
grid[0]![1] = { edges: { n: "wall", w: "wall" }, special: "none" };
// (1,1) 開始位置: 北は壁 (1,0 との境)、西は壁 (0,1 との境)
grid[1]![1] = { edges: { n: "wall", w: "wall" }, special: "none" };
// (2,1): 北は壁、西は open (1,1 と通じる)
grid[1]![2] = { edges: { n: "wall", w: "open" }, special: "none" };
// (1,2): 北は open (1,1 と通じる)、西は壁
grid[2]![1] = { edges: { n: "open", w: "wall" }, special: "none" };
// (2,2): 北は door (2,1 と扉)、西は壁
grid[2]![2] = { edges: { n: "door", w: "wall" }, special: "none" };
// (1,3): 北は open (1,2 と通じる)、西は壁、上り階段
grid[3]![1] = { edges: { n: "open", w: "wall" }, special: "stairsUp" };

const allWalls: CellEdge[] = Array.from({ length: MAZE_SIZE }, () => "wall" as const);

export const MAZE_L1: MazeLevel = {
  grid,
  southBoundary: allWalls,
  eastBoundary: allWalls,
  startPosition: { x: 1, y: 1, dir: "n" },
};
