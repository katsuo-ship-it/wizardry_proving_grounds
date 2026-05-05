import type { GameEvent, GameState } from "./types";

export function reduceCastle(
  state: Extract<GameState, { phase: "castle" }>,
  event: GameEvent,
): GameState {
  const { party } = state;
  switch (event.type) {
    case "enterTavern":
      return { phase: "tavern", sub: { kind: "menu" }, party };
    case "enterBoltac":
      return { phase: "boltac", sub: { kind: "menu" }, party };
    case "enterTemple":
      return { phase: "temple", sub: { kind: "menu" }, party };
    case "enterInn":
      return { phase: "inn", sub: { kind: "menu" }, party };
    case "leaveCastle":
      return { phase: "edgeOfTown", sub: { kind: "menu" }, party };
    default:
      return state;
  }
}
