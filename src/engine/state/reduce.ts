import { reduceBoltac } from "./reduceBoltac";
import { reduceCastle } from "./reduceCastle";
import { reduceEdgeOfTown } from "./reduceEdgeOfTown";
import { reduceInn } from "./reduceInn";
import { reducePlaceholder } from "./reducePlaceholder";
import { reduceTavern } from "./reduceTavern";
import { reduceTitle } from "./reduceTitle";
import { reduceTraining } from "./reduceTraining";
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
      return reduceTraining(state, event);
    case "tavern":
      return reduceTavern(state, event);
    case "boltac":
      return reduceBoltac(state, event);
    case "inn":
      return reduceInn(state, event);
    case "utilities":
    case "maze":
    case "temple":
      return reducePlaceholder(state, event);
    default:
      return state;
  }
}
