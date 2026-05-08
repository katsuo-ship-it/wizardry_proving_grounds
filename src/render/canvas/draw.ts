import type { LineSegment, Polygon } from "@/render/maze/types";

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number, color = "#000"): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function drawLines(
  ctx: CanvasRenderingContext2D,
  segments: ReadonlyArray<LineSegment>,
  color = "#fff",
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const s of segments) {
    // ピクセル整列のため 0.5 オフセット
    ctx.moveTo(s.x1 + 0.5, s.y1 + 0.5);
    ctx.lineTo(s.x2 + 0.5, s.y2 + 0.5);
  }
  ctx.stroke();
}

export function fillPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Polygon,
  color = "#000",
): void {
  if (polygon.length < 3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  const first = polygon[0];
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < polygon.length; i++) {
    const p = polygon[i];
    if (!p) continue;
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
}
