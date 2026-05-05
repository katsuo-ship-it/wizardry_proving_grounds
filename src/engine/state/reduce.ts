import { reduceCastle } from "./reduceCastle";
import { reduceEdgeOfTown } from "./reduceEdgeOfTown";
import { reducePlaceholder } from "./reducePlaceholder";
import { reduceTitle } from "./reduceTitle";
import type { GameEvent, GameState } from "./types";

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case "title":
      return reduceTitle(state, event);
    case "edgeOfTown":
      return reduceEdgeOfTown(state, event);
    case "castle":
      return reduceCastle(state, event);
    case "training":
    case "utilities":
    case "maze":
    case "tavern":
    case "boltac":
    case "temple":
    case "inn":
      return reducePlaceholder(state, event);
    default:
      return state;
  }
}
