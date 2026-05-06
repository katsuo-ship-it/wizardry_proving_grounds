import type { GameState } from "@/engine/state/types";

/**
 * GameState を JSON 文字列に変換する。
 * 注: GameState は既に characterId 参照のみを保持しているので、特別な変換は不要。
 * (キャラ実体は character objectStore に別途保存される。)
 */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

const VALID_PHASES = [
  "title",
  "edgeOfTown",
  "castle",
  "training",
  "utilities",
  "tavern",
  "boltac",
  "temple",
  "inn",
  "maze",
  "camp",
] as const;

export function deserializeState(json: string): GameState {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("deserializeState: not an object");
  }
  const obj = parsed as { phase?: unknown };
  if (typeof obj.phase !== "string" || !VALID_PHASES.includes(obj.phase as never)) {
    throw new Error(`deserializeState: invalid phase ${String(obj.phase)}`);
  }
  return parsed as GameState;
}
