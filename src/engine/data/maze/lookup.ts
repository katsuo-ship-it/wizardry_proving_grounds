import type { Direction } from "@/engine/state/types";
import type { Cell, CellEdge, MazeLevel } from "./types";

export function getCell(level: MazeLevel, x: number, y: number): Cell | undefined {
  return level.grid[y]?.[x];
}

/**
 * 指定セルの指定方向の Edge を返す。境界を越える場合は south/eastBoundary を参照。
 * 北・西は自セル、南は隣接セル (y+1) の北、東は隣接セル (x+1) の西。
 */
export function getEdge(level: MazeLevel, x: number, y: number, dir: Direction): CellEdge {
  const cell = getCell(level, x, y);
  if (!cell) return "wall";

  switch (dir) {
    case "n":
      return cell.edges.n;
    case "w":
      return cell.edges.w;
    case "s": {
      const south = getCell(level, x, y + 1);
      if (south) return south.edges.n;
      return level.southBoundary[x] ?? "wall";
    }
    case "e": {
      const east = getCell(level, x + 1, y);
      if (east) return east.edges.w;
      return level.eastBoundary[y] ?? "wall";
    }
  }
}
