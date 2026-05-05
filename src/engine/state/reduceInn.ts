import type { GameEvent, GameState } from "./types";

export function reduceInn(
  state: Extract<GameState, { phase: "inn" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openInnGuest") return { ...state, sub: { kind: "pickGuest" } };
    if (event.type === "leaveInn" || event.type === "goBack") {
      return { phase: "castle", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "pickGuest") {
    if (event.type === "pickGuest") {
      return { ...state, sub: { kind: "rest", guest: event.characterId } };
    }
    if (event.type === "leaveInn") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "rest") {
    if (event.type === "restStables") return { ...state, sub: { kind: "menu" } };
    if (event.type === "leaveInn") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
