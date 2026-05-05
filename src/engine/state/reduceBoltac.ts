import type { GameEvent, GameState } from "./types";

export function reduceBoltac(
  state: Extract<GameState, { phase: "boltac" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "openBuy":
        return { ...state, sub: { kind: "pickBuyer", mode: "buy" } };
      case "openSell":
        return { ...state, sub: { kind: "pickBuyer", mode: "sell" } };
      case "leaveBoltac":
      case "goBack":
        return { phase: "castle", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "pickBuyer") {
    if (event.type === "pickBuyer") {
      return {
        ...state,
        sub:
          sub.mode === "buy"
            ? { kind: "buyList", buyer: event.characterId }
            : { kind: "sellList", seller: event.characterId },
      };
    }
    if (event.type === "leaveBoltac") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "buyList" || sub.kind === "sellList") {
    if (event.type === "buyItem" || event.type === "sellItem") {
      return { ...state, sub: { kind: "menu" } };
    }
    if (event.type === "leaveBoltac") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
