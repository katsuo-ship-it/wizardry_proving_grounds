import type { Direction } from "@/engine/state/types";

export type CellEdge = "open" | "wall" | "door" | "secretDoor";
export type SpecialTile =
  | "none"
  | "stairsUp"
  | "stairsDown"
  | "darkness"
  | "spinner"
  | "teleport"
  | "message";

export interface Cell {
  /** 北・西の Edge のみ真理。南・東は隣接セルから導出 (設計書 Section 7) */
  edges: { n: CellEdge; w: CellEdge };
  special: SpecialTile;
  /** メッセージマス時に i18n キー (例: "maze.l1.msg1") */
  messageId?: string;
}

/** 迷宮レベルデータ (20×20 + 境界) */
export interface MazeLevel {
  /** 20×20 = 400 セル。grid[y][x]。y=0 が北端、x=0 が西端 */
  grid: Cell[][];
  /** y=19 行の南エッジ 20 個 */
  southBoundary: CellEdge[];
  /** x=19 列の東エッジ 20 個 */
  eastBoundary: CellEdge[];
  /** 開始位置 */
  startPosition: { x: number; y: number; dir: Direction };
}

export const MAZE_SIZE = 20;
