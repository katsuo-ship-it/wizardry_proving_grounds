import type { Direction, MazePosition } from "@/engine/state/types";

export type Depth = 0 | 1 | 2 | 3;
export type RelPos = -1 | 0 | 1;

export interface ViewportCell {
  /** ワールド X 座標 (範囲外の可能性あり、呼び出し側で getCell で確認) */
  x: number;
  /** ワールド Y 座標 */
  y: number;
  depth: Depth;
  rel: RelPos;
}

const FORWARD: Record<Direction, { dx: number; dy: number }> = {
  n: { dx: 0, dy: -1 },
  e: { dx: 1, dy: 0 },
  s: { dx: 0, dy: 1 },
  w: { dx: -1, dy: 0 },
};

const RIGHT: Record<Direction, { dx: number; dy: number }> = {
  n: { dx: 1, dy: 0 },
  e: { dx: 0, dy: 1 },
  s: { dx: -1, dy: 0 },
  w: { dx: 0, dy: -1 },
};

export function worldFromView(
  pos: MazePosition,
  depth: number,
  rel: number,
): { x: number; y: number } {
  const f = FORWARD[pos.dir];
  const r = RIGHT[pos.dir];
  return {
    x: pos.x + f.dx * depth + r.dx * rel,
    y: pos.y + f.dy * depth + r.dy * rel,
  };
}

const DEPTHS: Depth[] = [0, 1, 2, 3];
const RELS: RelPos[] = [-1, 0, 1];

export function computeViewport(pos: MazePosition): ViewportCell[] {
  const out: ViewportCell[] = [];
  for (const depth of DEPTHS) {
    for (const rel of RELS) {
      const w = worldFromView(pos, depth, rel);
      out.push({ x: w.x, y: w.y, depth, rel });
    }
  }
  return out;
}
