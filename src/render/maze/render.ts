import type { MazeLevel } from "@/engine/data/maze/types";
import type { MazePosition } from "@/engine/state/types";
import { clear, drawLines, fillPolygon } from "@/render/canvas/draw";
import { selectFills, selectSegments } from "./segments";
import type { Depth, RelPos } from "./viewport";

const DEPTHS_FAR_TO_NEAR: Depth[] = [3, 2, 1, 0];
const RELS: RelPos[] = [-1, 0, 1];

/**
 * 280×192 の Canvas に視点からの 3D ワイヤーフレーム迷宮を描画する。
 * 奥のセルから手前へ順に、各セルで [壁の塗りつぶし → 線分] の順に描き、
 * 手前の壁が奥のセルを上書きする (隠面消去)。
 * 床線・天井線は各セルの left/right wall 関数が「上下遠近線」として担当。
 * 連続壁のセルでは各 depth の遠近線が結合して 1 本の廊下に見える。
 */
export function renderMazeView(
  ctx: CanvasRenderingContext2D,
  level: MazeLevel,
  pos: MazePosition,
): void {
  clear(ctx, 280, 192, "#000");
  for (const d of DEPTHS_FAR_TO_NEAR) {
    for (const r of RELS) {
      const fills = selectFills(level, pos, d, r);
      for (const poly of fills) fillPolygon(ctx, poly, "#000");
      const segs = selectSegments(level, pos, d, r);
      if (segs.length > 0) drawLines(ctx, segs, "#fff");
    }
  }
}
