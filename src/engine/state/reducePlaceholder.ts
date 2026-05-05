import type { GameEvent, GameState } from "./types";

type PlaceholderPhase = "training" | "utilities" | "maze" | "tavern" | "boltac" | "temple" | "inn";

/**
 * 各 placeholder phase で 'goBack' を受け取ったときの戻り先。
 *
 * - training/utilities/maze は Edge of Town 配下 → edgeOfTown へ
 * - tavern/boltac/temple/inn は Castle 配下 → castle へ
 */
const BACK_TARGET: Record<PlaceholderPhase, "edgeOfTown" | "castle"> = {
  training: "edgeOfTown",
  utilities: "edgeOfTown",
  maze: "edgeOfTown",
  tavern: "castle",
  boltac: "castle",
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
