import { reduceBoltac } from "./reduceBoltac";
import { reduceCamp } from "./reduceCamp";
import { reduceCastle } from "./reduceCastle";
import { reduceEdgeOfTown } from "./reduceEdgeOfTown";
import { reduceInn } from "./reduceInn";
import { reduceMaze } from "./reduceMaze";
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
    case "maze":
      return reduceMaze(state, event);
    case "camp":
      return reduceCamp(state, event);
    case "utilities":
    case "temple":
      return reducePlaceholder(state, event);
    default:
      return state;
  }
}
