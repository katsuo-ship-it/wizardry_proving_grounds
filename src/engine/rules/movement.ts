import { getEdge } from "@/engine/data/maze/lookup";
import type { CellEdge, MazeLevel } from "@/engine/data/maze/types";
import type { Direction, MazePosition } from "@/engine/state/types";

export function turnLeft(dir: Direction): Direction {
  switch (dir) {
    case "n":
      return "w";
    case "w":
      return "s";
    case "s":
      return "e";
    case "e":
      return "n";
  }
}

export function turnRight(dir: Direction): Direction {
  switch (dir) {
    case "n":
      return "e";
    case "e":
      return "s";
    case "s":
      return "w";
    case "w":
      return "n";
  }
}

export function reverse(dir: Direction): Direction {
  switch (dir) {
    case "n":
      return "s";
    case "s":
      return "n";
    case "e":
      return "w";
    case "w":
      return "e";
  }
}

export function canPassEdge(edge: CellEdge): boolean {
  return edge !== "wall";
}

export function canMoveForward(level: MazeLevel, pos: MazePosition): boolean {
  const edge = getEdge(level, pos.x, pos.y, pos.dir);
  return canPassEdge(edge);
}

/** 1 マス前進した位置を返す (壁判定はしない、呼び出し側で canMoveForward を確認) */
export function advance(pos: MazePosition): MazePosition {
  switch (pos.dir) {
    case "n":
      return { ...pos, y: pos.y - 1 };
    case "e":
      return { ...pos, x: pos.x + 1 };
    case "s":
      return { ...pos, y: pos.y + 1 };
    case "w":
      return { ...pos, x: pos.x - 1 };
  }
}
