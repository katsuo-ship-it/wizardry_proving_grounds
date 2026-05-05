import type { LineSegment } from "@/render/maze/types";

export function clear(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color = "#000",
): void {
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
