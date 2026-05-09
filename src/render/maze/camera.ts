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

type Raf = (cb: (now: number) => void) => number;
type CancelRaf = (id: number) => void;

export class CameraAnimator {
  private current: CameraTarget;
  private from: CameraTarget;
  private to: CameraTarget;
  private startMs = 0;
  private duration = 0;
  private rafId = 0;
  private onFrame: ((c: CameraTarget) => void) | null = null;
  private raf: Raf;
  private cancelRaf: CancelRaf;
  private now: () => number;

  constructor(
    initial: CameraTarget,
    // window 結合を保つため arrow でラップ。素のまま渡すと this.raf(...) で
    // "Illegal invocation" になる (requestAnimationFrame は window メソッド)
    raf: Raf = (cb) => requestAnimationFrame(cb),
    cancelRaf: CancelRaf = (id) => cancelAnimationFrame(id),
    now: () => number = () => performance.now(),
  ) {
    this.current = initial;
    this.from = initial;
    this.to = initial;
    this.raf = raf;
    this.cancelRaf = cancelRaf;
    this.now = now;
  }

  animateTo(target: CameraTarget, durationMs: number, onFrame: (c: CameraTarget) => void): void {
    if (this.rafId) {
      this.cancelRaf(this.rafId);
      this.rafId = 0;
    }
    this.from = this.current; // 中断時の補間結果から再スタート
    this.to = target;
    this.duration = durationMs;
    this.startMs = this.now();
    this.onFrame = onFrame;
    this.tick();
  }

  cancel(): void {
    if (this.rafId) {
      this.cancelRaf(this.rafId);
      this.rafId = 0;
    }
    this.onFrame = null;
  }

  /** Phase 9 (Playwright) で animation 完了待ちに使う */
  get isAnimating(): boolean {
    return this.rafId !== 0;
  }

  private tick = (): void => {
    const elapsed = this.now() - this.startMs;
    const t = this.duration === 0 ? 1 : Math.min(elapsed / this.duration, 1);
    this.current = interpolateTarget(this.from, this.to, t);
    this.onFrame?.(this.current);
    if (t < 1) {
      this.rafId = this.raf(this.tick);
    } else {
      this.rafId = 0;
      this.onFrame = null;
    }
  };
}
