import type { GameEvent, GameState } from "./types";

// training/tavern/boltac は M3 で実画面化 (専用 reducer 経由)
type PlaceholderPhase = "utilities" | "maze" | "temple" | "inn";

/**
 * 各 placeholder phase で 'goBack' を受け取ったときの戻り先。
 */
const BACK_TARGET: Record<PlaceholderPhase, "edgeOfTown" | "castle"> = {
  utilities: "edgeOfTown",
  maze: "edgeOfTown",
  temple: "castle",
  inn: "castle",
};

export function reducePlaceholder(
  state: Extract<GameState, { phase: PlaceholderPhase }>,
  event: GameEvent,
): GameState {
  if (event.type === "goBack") {
    const target = BACK_TARGET[state.phase];
    return { phase: target, sub: { kind: "menu" }, party: state.party };
  }
  return state;
}
