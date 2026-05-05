import type { GameEvent, GameState } from "./types";

export function reduceTavern(
  state: Extract<GameState, { phase: "tavern" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "openAddMember":
        return { ...state, sub: { kind: "addMember", rosterIds: [] } };
      case "removeFromParty": {
        const next = [...party.members];
        next[event.slot] = null;
        return { ...state, party: { ...party, members: next } };
      }
      case "inspectMember":
        return { ...state, sub: { kind: "inspecting", slot: event.slot } };
      case "leaveTavern":
      case "goBack":
        return { phase: "castle", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "addMember") {
    if (event.type === "addToParty") {
      const next = [...party.members];
      next[event.slot] = event.characterId;
      return {
        ...state,
        sub: { kind: "menu" },
        party: { ...party, members: next },
      };
    }
    if (event.type === "closeAddMember") {
      return { ...state, sub: { kind: "menu" } };
    }
    return state;
  }

  if (sub.kind === "inspecting") {
    if (event.type === "closeInspect") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
