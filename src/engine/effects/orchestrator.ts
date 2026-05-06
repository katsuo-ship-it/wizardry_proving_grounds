import type { Effect, GameEvent, GameState } from "@/engine/state/types";
import { db } from "@/persist/db";

/**
 * 状態遷移から副作用を決定する。
 * - title: loading sub-state への新規遷移 → load effect
 * - temple: saving sub-state への新規遷移 → save effect
 */
export function bindEffect(prev: GameState, next: GameState): Effect | null {
  // load トリガ
  const prevLoading = prev.phase === "title" && prev.sub.kind === "loading";
  const nextLoading = next.phase === "title" && next.sub.kind === "loading";
  if (nextLoading && !prevLoading) {
    if (next.phase !== "title" || next.sub.kind !== "loading") return null;
    return { type: "load", slotId: next.sub.slotId };
  }

  // save トリガ
  const prevSaving = prev.phase === "temple" && prev.sub.kind === "saving";
  const nextSaving = next.phase === "temple" && next.sub.kind === "saving";
  if (nextSaving && !prevSaving) {
    if (next.phase !== "temple" || next.sub.kind !== "saving") return null;
    return { type: "save", slotId: next.sub.slotId, name: next.sub.name };
  }

  return null;
}

/**
 * 副作用を実行し、完了時に内部イベントを dispatch する。
 *
 * @param effect 実行する副作用
 * @param dispatch 完了/失敗時のイベント発火関数
 * @param getState save 時に現在の state を取得するための関数
 */
export async function runEffect(
  effect: Effect,
  dispatch: (e: GameEvent) => void,
  getState: () => GameState,
): Promise<void> {
  if (effect.type === "load") {
    try {
      const { state } = await db.loadStateAtomic(effect.slotId);
      dispatch({ type: "loadSucceeded", state });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "loadFailed", reason });
    }
    return;
  }

  if (effect.type === "save") {
    try {
      const slotId = await db.saveStateAtomic({
        slotId: effect.slotId,
        name: effect.name,
        state: getState(),
        // M5 範囲では Boltac/Inn が UI-direct で character 更新済み。
        // Chapter 2 で戦闘・状態変化が入ったら、現在パーティ内のキャラを差分として渡す。
        changedCharacters: [],
      });
      dispatch({ type: "saveSucceeded", slotId });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "saveFailed", reason });
    }
  }
}
