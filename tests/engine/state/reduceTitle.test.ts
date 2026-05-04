import { describe, it, expect } from 'vitest';
import { reduce } from '@/engine/state/reduce';
import type { GameState } from '@/engine/state/types';

const initial: GameState = { phase: 'title', sub: { kind: 'main' } };

describe('title phase reducer', () => {
  it('openContinue from main → continueMenu (with empty slots placeholder)', () => {
    const next = reduce(initial, { type: 'openContinue' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'continueMenu', slots: [] } });
  });

  it('openSettings from main → settings', () => {
    const next = reduce(initial, { type: 'openSettings' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'settings' } });
  });

  it('closeSettings from settings → main', () => {
    const fromSettings: GameState = { phase: 'title', sub: { kind: 'settings' } };
    const next = reduce(fromSettings, { type: 'closeSettings' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'main' } });
  });

  it('loadFailed from loading → loadError', () => {
    const fromLoading: GameState = { phase: 'title', sub: { kind: 'loading', slotId: 1 } };
    const next = reduce(fromLoading, { type: 'loadFailed', reason: 'corrupted' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'loadError', reason: 'corrupted' } });
  });

  it('startGame leaves state unchanged in M1 (M2 で実装)', () => {
    const next = reduce(initial, { type: 'startGame' });
    expect(next).toEqual(initial);
  });
});
