import { reduceTitle } from "./reduceTitle";
import type { GameEvent, GameState } from "./types";

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case "title":
      return reduceTitle(state, event);
    default:
      return state;
  }
}
