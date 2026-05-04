import type { GameState } from '../state/types';

export type AnimationKind = 'fade' | 'mazeStep' | 'mazeTurn' | 'doorOpen' | 'messageOpen' | 'messageClose';

export const ANIM_DURATION: Record<AnimationKind, number> = {
  fade: 300,
  mazeStep: 150,
  mazeTurn: 200,
  doorOpen: 250,
  messageOpen: 100,
  messageClose: 100,
};

/**
 * 状態遷移からアニメーション種別を決定する。
 * M1 では title phase のみのため null を返す。
 */
export function bindAnimation(_prev: GameState, _next: GameState): AnimationKind | null {
  return null;
}

export function runAnimation(kind: AnimationKind, onDone: () => void): void {
  const duration = ANIM_DURATION[kind];
  const start = performance.now();
  function tick(now: number): void {
    if (now - start >= duration) {
      onDone();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
