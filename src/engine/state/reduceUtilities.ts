import type { GameEvent, GameState } from "./types";

export function reduceUtilities(
  state: Extract<GameState, { phase: "utilities" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openRestartList") {
      return { ...state, sub: { kind: "restartList" } };
    }
    if (event.type === "goBack") {
      return { phase: "edgeOfTown", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "restartList") {
    if (event.type === "restartParty") {
      return { phase: "title", sub: { kind: "loading", slotId: event.slotId } };
    }
    if (event.type === "goBack") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
