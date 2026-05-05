import type { GameEvent, GameState } from "./types";

export function reduceEdgeOfTown(
  state: Extract<GameState, { phase: "edgeOfTown" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "goToTraining":
        return { phase: "training", sub: { kind: "menu" }, party };
      case "goToMaze":
        return { phase: "maze", sub: { kind: "menu" }, party };
      case "goToCastle":
        return { phase: "castle", sub: { kind: "menu" }, party };
      case "goToUtilities":
        return { phase: "utilities", sub: { kind: "menu" }, party };
      case "leaveGame":
        return { ...state, sub: { kind: "confirmLeave" } };
      default:
        return state;
    }
  }

  if (sub.kind === "confirmLeave") {
    switch (event.type) {
      case "confirmLeaveGame":
        return { phase: "title", sub: { kind: "main" } };
      case "cancelLeaveGame":
        return { ...state, sub: { kind: "menu" } };
      default:
        return state;
    }
  }

  return state;
}
