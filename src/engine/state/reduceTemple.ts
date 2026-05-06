import type { GameEvent, GameState } from "./types";

export function reduceTemple(
  state: Extract<GameState, { phase: "temple" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openSavePicker") {
      return { ...state, sub: { kind: "savePicker" } };
    }
    if (event.type === "goBack") {
      return { phase: "castle", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "savePicker") {
    if (event.type === "pickSlot") {
      return {
        ...state,
        sub: {
          kind: "saveNameInput",
          slotId: event.slotId === "new" ? undefined : event.slotId,
        },
      };
    }
    if (event.type === "cancelSave") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "saveNameInput") {
    if (event.type === "inputSaveName") {
      return {
        ...state,
        sub: { kind: "saving", slotId: sub.slotId, name: event.name },
      };
    }
    if (event.type === "cancelSave") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "saving") {
    if (event.type === "saveSucceeded") {
      return { ...state, sub: { kind: "saveDone", slotId: event.slotId } };
    }
    if (event.type === "saveFailed") {
      return { ...state, sub: { kind: "saveError", reason: event.reason } };
    }
    return state;
  }

  if (sub.kind === "saveDone" || sub.kind === "saveError") {
    if (event.type === "dismissSaveResult") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
