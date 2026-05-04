import type { GameEvent, GameState } from './types';
import { reduceTitle } from './reduceTitle';

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'title':
      return reduceTitle(state, event);
    default:
      return state;
  }
}
