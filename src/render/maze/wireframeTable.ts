// Apple II HGR 280×192 viewport に対する 3D 視点の固定座標テーブル。
//
// 中央消失点 (140, 96)。深さごとに「内側矩形」が小さくなる遠近図。
// rel = ±1 で左右にシフトした側面セルも描画。
//
// ※ 暫定座標。Pascal 抽出 or 実機スクショで要調整 (open question)。

import type { LineSegment, Polygon, SegmentSet, WireframeTable } from "./types";
import type { Depth, RelPos } from "./viewport";

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

// Apple II 原典の wireframe 遠近に近づけた台形座標。
// 中央消失点 (140, 96) を維持し、depth が増えるごとに約 70% に縮小する。
// (Pascal 抽出 or 実機スクショとの照合は将来の独立タスク)
const RECTS: readonly Rect[] = [
  { l: 0, t: 0, r: 280, b: 192 }, // depth 0 (自セル) — 画面全体
  { l: 40, t: 28, r: 240, b: 164 }, // depth 1 — 1 マス先
  { l: 75, t: 54, r: 205, b: 138 }, // depth 2 — 2 マス先
  { l: 105, t: 78, r: 175, b: 114 }, // depth 3 — 最奥
];

function rectAtDepth(d: Depth): Rect {
  // biome-ignore lint/style/noNonNullAssertion: RECTS is fixed-length 4
  return RECTS[d]!;
}

function relOffsetX(d: Depth): number {
  // 深さに応じて視差が小さく
  const shifts = [200, 120, 70, 40];
  // biome-ignore lint/style/noNonNullAssertion: shifts is fixed-length 4
  return shifts[d]!;
}

function shiftedRect(d: Depth, rel: RelPos): Rect {
  const r = rectAtDepth(d);
  const shift = rel * relOffsetX(d);
  return { l: r.l + shift, t: r.t, r: r.r + shift, b: r.b };
}

function frontWall(d: Depth, rel: RelPos): LineSegment[] {
  const r = shiftedRect(d, rel);
  return [
    { x1: r.l, y1: r.t, x2: r.r, y2: r.t }, // top
    { x1: r.r, y1: r.t, x2: r.r, y2: r.b }, // right
    { x1: r.r, y1: r.b, x2: r.l, y2: r.b }, // bottom
    { x1: r.l, y1: r.b, x2: r.l, y2: r.t }, // left
  ];
}

function frontWallFill(d: Depth, rel: RelPos): Polygon {
  const r = shiftedRect(d, rel);
  return [
    { x: r.l, y: r.t },
    { x: r.r, y: r.t },
    { x: r.r, y: r.b },
    { x: r.l, y: r.b },
  ];
}

// 左壁: 上下の遠近線のみ (= その depth における天井線・床線の左半分)。
// near/far の縦線は描かない (連続壁では各 depth の遠近線が 1 本に繋がり、
// 廊下が奥へ伸びる表現になる。1981 Apple II 原典の wireframe と同方式)。
// depth 3 (最奥) は遠近の先がないので、左壁の縦線で「前壁の左辺」を示す。
function leftWall(d: Depth, rel: RelPos): LineSegment[] {
  const near = shiftedRect(d, rel);
  if (d === 3) return [{ x1: near.l, y1: near.t, x2: near.l, y2: near.b }];
  const far = shiftedRect((d + 1) as Depth, rel);
  return [
    { x1: near.l, y1: near.t, x2: far.l, y2: far.t }, // 上遠近 (天井側)
    { x1: near.l, y1: near.b, x2: far.l, y2: far.b }, // 下遠近 (床側)
  ];
}

function leftWallFill(d: Depth, rel: RelPos): Polygon {
  if (d === 3) return [];
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as Depth, rel);
  // 左側の遠近台形: 奥のセルを隠す
  return [
    { x: near.l, y: near.t },
    { x: far.l, y: far.t },
    { x: far.l, y: far.b },
    { x: near.l, y: near.b },
  ];
}

// 右壁: 左壁と対称、上下の遠近線のみ
function rightWall(d: Depth, rel: RelPos): LineSegment[] {
  const near = shiftedRect(d, rel);
  if (d === 3) return [{ x1: near.r, y1: near.t, x2: near.r, y2: near.b }];
  const far = shiftedRect((d + 1) as Depth, rel);
  return [
    { x1: near.r, y1: near.t, x2: far.r, y2: far.t }, // 上遠近
    { x1: near.r, y1: near.b, x2: far.r, y2: far.b }, // 下遠近
  ];
}

function rightWallFill(d: Depth, rel: RelPos): Polygon {
  if (d === 3) return [];
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as Depth, rel);
  return [
    { x: near.r, y: near.t },
    { x: far.r, y: far.t },
    { x: far.r, y: far.b },
    { x: near.r, y: near.b },
  ];
}

function frontDoor(d: Depth, rel: RelPos): LineSegment[] {
  const r = shiftedRect(d, rel);
  const cx = (r.l + r.r) / 2;
  const w = (r.r - r.l) * 0.3;
  const h = (r.b - r.t) * 0.6;
  const dl = cx - w / 2;
  const dr = cx + w / 2;
  const dt = r.b - h;
  const db = r.b;
  return [
    { x1: dl, y1: dt, x2: dr, y2: dt },
    { x1: dr, y1: dt, x2: dr, y2: db },
    { x1: dl, y1: dt, x2: dl, y2: db },
  ];
}

// 階段マーカーは 3D ビューには描画しない (1981 原典準拠)。
// 自セルが階段であることは画面下部の HUD テキスト ("L1 (x, y) U" 等の "U") で示す。
function stairsMarker(_d: Depth, _rel: RelPos): LineSegment[] {
  return [];
}

function buildSegmentSet(d: Depth, rel: RelPos): SegmentSet {
  return {
    frontWall: frontWall(d, rel),
    frontWallFill: frontWallFill(d, rel),
    leftWall: leftWall(d, rel),
    leftWallFill: leftWallFill(d, rel),
    rightWall: rightWall(d, rel),
    rightWallFill: rightWallFill(d, rel),
    frontDoor: frontDoor(d, rel),
    leftDoor: [],
    rightDoor: [],
    stairsUp: stairsMarker(d, rel),
    stairsDown: stairsMarker(d, rel),
  };
}

export const WIREFRAME_TABLE: WireframeTable = {
  0: { "-1": buildSegmentSet(0, -1), 0: buildSegmentSet(0, 0), 1: buildSegmentSet(0, 1) },
  1: { "-1": buildSegmentSet(1, -1), 0: buildSegmentSet(1, 0), 1: buildSegmentSet(1, 1) },
  2: { "-1": buildSegmentSet(2, -1), 0: buildSegmentSet(2, 0), 1: buildSegmentSet(2, 1) },
  3: { "-1": buildSegmentSet(3, -1), 0: buildSegmentSet(3, 0), 1: buildSegmentSet(3, 1) },
};
