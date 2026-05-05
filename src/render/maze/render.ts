import type { MazeLevel } from "@/engine/data/maze/types";
import type { MazePosition } from "@/engine/state/types";
import { clear, drawLines } from "@/render/canvas/draw";
import { selectSegments } from "./segments";
import type { Depth, RelPos } from "./viewport";

const DEPTHS_FAR_TO_NEAR: Depth[] = [3, 2, 1, 0];
const RELS: RelPos[] = [-1, 0, 1];

/**
 * 280×192 の Canvas に視点からの 3D ワイヤーフレーム迷宮を描画する。
 * 奥のセルから手前へ順に描き、隠面消去を成立させる。
 */
export function renderMazeView(
  ctx: CanvasRenderingContext2D,
  level: MazeLevel,
  pos: MazePosition,
): void {
  clear(ctx, 280, 192, "#000");
  for (const d of DEPTHS_FAR_TO_NEAR) {
    for (const r of RELS) {
      const segs = selectSegments(level, pos, d, r);
      if (segs.length > 0) drawLines(ctx, segs, "#fff");
    }
  }
}
