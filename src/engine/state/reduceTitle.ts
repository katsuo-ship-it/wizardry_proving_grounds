import type { GameEvent, GameState } from './types';

export function reduceTitle(state: GameState & { phase: 'title' }, event: GameEvent): GameState {
  const { sub } = state;

  switch (event.type) {
    case 'openContinue':
      return { phase: 'title', sub: { kind: 'continueMenu', slots: [] } };

    case 'openSettings':
      return { phase: 'title', sub: { kind: 'settings' } };

    case 'closeSettings':
      if (sub.kind === 'settings') {
        return { phase: 'title', sub: { kind: 'main' } };
      }
      return state;

    case 'loadFailed':
      if (sub.kind === 'loading') {
        return { phase: 'title', sub: { kind: 'loadError', reason: event.reason } };
      }
      return state;

    // M2 以降で実装
    default:
      return state;
  }
}
