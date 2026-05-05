import type { GameEvent, GameState } from "./types";

export function reduceCamp(
  state: Extract<GameState, { phase: "camp" }>,
  event: GameEvent,
): GameState {
  const { pos, party } = state;
  switch (event.type) {
    case "leaveCamp":
      return { phase: "maze", pos, party };
    case "quitToTown":
      return {
        phase: "edgeOfTown",
        sub: { kind: "menu" },
        party: { ...party, status: "out", outAtPosition: pos },
      };
    default:
      return state;
  }
}
