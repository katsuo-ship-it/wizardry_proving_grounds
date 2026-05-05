import type { Effect, GameEvent, GameState } from "../state/types";

/**
 * 状態遷移から副作用を決定する。
 * M1 では loading 遷移のみ。M5 で saving も追加。
 */
export function bindEffect(prev: GameState, next: GameState): Effect | null {
  const prevIsLoading = prev.phase === "title" && prev.sub.kind === "loading";
  const nextIsLoading = next.phase === "title" && next.sub.kind === "loading";
  if (nextIsLoading && !prevIsLoading) {
    return {
      type: "load",
      slotId: (next as { phase: "title"; sub: { kind: "loading"; slotId: number } }).sub.slotId,
    };
  }
  return null;
}

/**
 * 副作用を実行し、完了時に内部イベントを dispatch する。
 * M1 では load ハンドラはスタブ (常に loadFailed)。M5 で実装。
 */
export async function runEffect(effect: Effect, dispatch: (e: GameEvent) => void): Promise<void> {
  if (effect.type === "load") {
    dispatch({ type: "loadFailed", reason: "load not implemented yet (M5)" });
  }
}
