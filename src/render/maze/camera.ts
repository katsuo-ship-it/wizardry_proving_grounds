import type { MazePosition } from "@/engine/state/types";
import type { CameraTarget } from "./types";

export function targetFromPosition(pos: MazePosition): CameraTarget {
  const yawByDir = { n: 0, e: Math.PI / 2, s: Math.PI, w: -Math.PI / 2 } as const;
  return {
    pos: { x: pos.x + 0.5, y: pos.y + 0.5 },
    yaw: yawByDir[pos.dir],
  };
}

export function shortestAngleDelta(from: number, to: number): number {
  const TAU = Math.PI * 2;
  let d = (((to - from) % TAU) + TAU) % TAU;
  if (d > Math.PI) d -= TAU;
  return d;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}

export function interpolateTarget(from: CameraTarget, to: CameraTarget, t: number): CameraTarget {
  const e = easeInOutQuad(t);
  const dy = shortestAngleDelta(from.yaw, to.yaw);
  return {
    pos: {
      x: from.pos.x + (to.pos.x - from.pos.x) * e,
      y: from.pos.y + (to.pos.y - from.pos.y) * e,
    },
    yaw: from.yaw + dy * e,
  };
}
