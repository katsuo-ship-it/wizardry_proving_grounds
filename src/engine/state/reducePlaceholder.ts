import type { GameEvent, GameState } from "./types";

// training/tavern/boltac/inn/maze/temple は M3-M5 で実画面化 (専用 reducer)
type PlaceholderPhase = "utilities";

/**
 * 各 placeholder phase で 'goBack' を受け取ったときの戻り先。
 */
const BACK_TARGET: Record<PlaceholderPhase, "edgeOfTown" | "castle"> = {
  utilities: "edgeOfTown",
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
