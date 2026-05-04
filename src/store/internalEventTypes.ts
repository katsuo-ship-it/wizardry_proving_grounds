import type { GameEvent } from '@/engine/state/types';

/**
 * 内部発火イベント (副作用ランナーが dispatch するもの)。
 * 入力キューを経由せず即時処理される。
 */
export const INTERNAL_EVENT_TYPES: ReadonlyArray<GameEvent['type']> = [
  'loadStarted',
  'loadFailed',
];
