import type { Depth, RelPos } from "./viewport";

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SegmentSet {
  /** 前面の壁 (このセルの正面方向のエッジが壁の場合に描画) */
  frontWall: LineSegment[];
  /** 左面の壁 (左エッジが壁の場合) */
  leftWall: LineSegment[];
  /** 右面の壁 (右エッジが壁の場合) */
  rightWall: LineSegment[];
  /** 扉 (壁と一緒に枠付きで描く) */
  frontDoor: LineSegment[];
  leftDoor: LineSegment[];
  rightDoor: LineSegment[];
  /** 階段マーカー (床中央に矢印形) */
  stairsUp: LineSegment[];
  stairsDown: LineSegment[];
}

export type WireframeTable = Record<Depth, Record<RelPos, SegmentSet>>;

// === Three.js 移行用の新型 (Phase 8 で旧型を全削除) ===

export type Yaw = number; // ラジアン、0 = 北、+π/2 = 東

export interface CameraTarget {
  pos: { x: number; y: number }; // ワールド座標 (= grid + 0.5)
  yaw: Yaw;
}
