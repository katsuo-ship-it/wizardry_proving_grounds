import { reduceBoltac } from "./reduceBoltac";
import { reduceCamp } from "./reduceCamp";
import { reduceCastle } from "./reduceCastle";
import { reduceEdgeOfTown } from "./reduceEdgeOfTown";
import { reduceInn } from "./reduceInn";
import { reduceMaze } from "./reduceMaze";
import { reduceTavern } from "./reduceTavern";
import { reduceTemple } from "./reduceTemple";
import { reduceTitle } from "./reduceTitle";
import { reduceTraining } from "./reduceTraining";
import { reduceUtilities } from "./reduceUtilities";
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
    case "temple":
      return reduceTemple(state, event);
    case "utilities":
      return reduceUtilities(state, event);
    default:
      return state;
  }
}
