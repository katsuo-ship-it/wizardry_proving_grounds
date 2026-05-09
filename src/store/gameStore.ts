import { bindAnimation, runAnimation } from "@/engine/animation/orchestrator";
import { bindEffect, runEffect } from "@/engine/effects/orchestrator";
import { reduce } from "@/engine/state/reduce";
import type { GameEvent, GameState, Lang, MazePosition } from "@/engine/state/types";
import { EMPTY_PARTY } from "@/engine/state/types";
import { useStore } from "zustand";
import { type StoreApi, createStore } from "zustand/vanilla";
import { INTERNAL_EVENT_TYPES } from "./internalEventTypes";

const MAX_QUEUED_INPUTS = 1;
const QUEUE_TIMEOUT_MS = 5000;

export interface GameStoreShape {
  state: GameState;
  lang: Lang;
  scaleMode: "auto" | 1 | 2 | 3 | 4;
  isAnimating: boolean;
  isBusy: boolean;
  inputQueue: GameEvent[];
  /** IndexedDB が利用可能か (M5 で health check 結果を反映) */
  isStorageHealthy: boolean;
  dispatch: (event: GameEvent) => void;
}

const initialState: Omit<GameStoreShape, "dispatch"> = {
  state: { phase: "title", sub: { kind: "main" } },
  lang: "en",
  scaleMode: "auto",
  isAnimating: false,
  isBusy: false,
  inputQueue: [],
  isStorageHealthy: true, // 初期値 true (bootstrap で確認後に false にしうる)
};

function flushQueue(api: StoreApi<GameStoreShape>): void {
  const { isBusy, isAnimating, inputQueue, dispatch } = api.getState();
  if (isBusy || isAnimating) return;
  if (inputQueue.length === 0) return;
  const [head, ...rest] = inputQueue;
  api.setState({ inputQueue: rest });
  if (head) {
    queueMicrotask(() => dispatch(head));
  }
}

export function createGameStore(): StoreApi<GameStoreShape> {
  const store = createStore<GameStoreShape>((set, get) => ({
    ...initialState,

    dispatch: (event: GameEvent): void => {
      // 設定系イベントは Reducer をバイパスして直接 store 更新
      if (event.type === "changeLanguage") {
        set({ lang: event.lang });
        return;
      }

      const isInternal = INTERNAL_EVENT_TYPES.includes(event.type);

      if (!isInternal && (get().isAnimating || get().isBusy)) {
        const queue = get().inputQueue;
        if (queue.length < MAX_QUEUED_INPUTS) {
          set({ inputQueue: [...queue, event] });
        }
        return;
      }

      const prev = get().state;
      const next = reduce(prev, event);
      const anim = bindAnimation(prev, next);
      const effect = bindEffect(prev, next);

      set({ state: next });

      if (effect) {
        set({ isBusy: true });
        const safetyTimer = setTimeout(() => {
          set({ isBusy: false, inputQueue: [] });
        }, QUEUE_TIMEOUT_MS);
        runEffect(effect, get().dispatch, () => get().state).finally(() => {
          clearTimeout(safetyTimer);
          set({ isBusy: false });
          flushQueue(store);
        });
      }

      if (anim) {
        set({ isAnimating: true });
        runAnimation(anim, () => {
          set({ isAnimating: false });
          flushQueue(store);
        });
      }
    },
  }));
  return store;
}

// シングルトン
export const gameStore = createGameStore();

// React 用フック
export function useGameStore<T>(selector: (s: GameStoreShape) => T): T {
  return useStore(gameStore, selector);
}

/**
 * Test-only: forcibly replace state with maze phase + given pos.
 * party is EMPTY_PARTY (0 characters) — Camp/inventory aren't tested.
 * No-op in production builds (import.meta.env.DEV is false).
 */
export function devEnterMazeAt(pos: MazePosition): void {
  if (!import.meta.env.DEV) return;
  gameStore.setState((s) => ({
    ...s,
    state: { phase: "maze", pos, party: EMPTY_PARTY },
  }));
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  // @ts-expect-error global extension for tests only
  window.__wpgDev = { devEnterMazeAt };
}
