import { CanvasTexture } from "three";

function drawArrow(ctx: CanvasRenderingContext2D, up: boolean): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  if (up) {
    ctx.moveTo(32, 12);
    ctx.lineTo(52, 52);
    ctx.lineTo(12, 52);
  } else {
    ctx.moveTo(32, 52);
    ctx.lineTo(52, 12);
    ctx.lineTo(12, 12);
  }
  ctx.closePath();
  ctx.fill();
}

export function makeStairsTexture(direction: "up" | "down"): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");
  drawArrow(ctx, direction === "up");
  return new CanvasTexture(canvas);
}
