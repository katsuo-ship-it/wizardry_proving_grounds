// Apple II HGR 280×192 viewport に対する 3D 視点の固定座標テーブル。
//
// 中央消失点 (140, 96)。深さごとに「内側矩形」が小さくなる遠近図。
// rel = ±1 で左右にシフトした側面セルも描画。
//
// ※ 暫定座標。Pascal 抽出 or 実機スクショで要調整 (open question)。

import type { LineSegment, SegmentSet, WireframeTable } from "./types";
import type { Depth, RelPos } from "./viewport";

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

const RECTS: readonly Rect[] = [
  { l: 0, t: 0, r: 280, b: 192 }, // depth 0 (自セル)
  { l: 50, t: 30, r: 230, b: 162 }, // depth 1
  { l: 90, t: 55, r: 190, b: 137 }, // depth 2
  { l: 115, t: 75, r: 165, b: 117 }, // depth 3 (最遠)
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

function leftWall(d: Depth, rel: RelPos): LineSegment[] {
  if (d === 3) return [];
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as Depth, rel);
  return [
    { x1: near.l, y1: near.t, x2: far.l, y2: far.t },
    { x1: near.l, y1: near.b, x2: far.l, y2: far.b },
  ];
}

function rightWall(d: Depth, rel: RelPos): LineSegment[] {
  if (d === 3) return [];
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as Depth, rel);
  return [
    { x1: near.r, y1: near.t, x2: far.r, y2: far.t },
    { x1: near.r, y1: near.b, x2: far.r, y2: far.b },
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

function stairsMarker(d: Depth, rel: RelPos): LineSegment[] {
  if (d > 1) return [];
  const r = shiftedRect(d, rel);
  const cx = (r.l + r.r) / 2;
  const cy = (r.t + r.b * 3) / 4; // 床寄り
  const s = (r.r - r.l) / 8;
  return [
    { x1: cx, y1: cy - s, x2: cx + s, y2: cy + s },
    { x1: cx, y1: cy - s, x2: cx - s, y2: cy + s },
    { x1: cx, y1: cy, x2: cx, y2: cy + s },
  ];
}

function buildSegmentSet(d: Depth, rel: RelPos): SegmentSet {
  return {
    frontWall: frontWall(d, rel),
    leftWall: leftWall(d, rel),
    rightWall: rightWall(d, rel),
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
