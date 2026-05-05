// 言語
export type Lang = "en" | "ja";

// SaveSlot 識別子
export type SaveSlotId = number;
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  updatedAt: number;
}

// Title 画面の sub-state
export type TitleSubState =
  | { kind: "main" }
  | { kind: "continueMenu"; slots: SaveSlotInfo[] }
  | { kind: "loading"; slotId: SaveSlotId }
  | { kind: "loadError"; reason: string }
  | { kind: "settings" };

// Chapter 1 / M1 では title phase のみ実装。他 phase は M2 以降で追加。
export type GameState = { phase: "title"; sub: TitleSubState };

// イベント (Chapter 1 / M1 範囲のみ)
export type GameEvent =
  | { type: "startGame" }
  | { type: "openContinue" }
  | { type: "openSettings" }
  | { type: "closeSettings" }
  | { type: "changeLanguage"; lang: Lang }
  // 非同期ライフサイクル (M5 で本格実装)
  | { type: "loadStarted"; slotId: SaveSlotId }
  | { type: "loadFailed"; reason: string };

// 副作用
export type Effect = { type: "load"; slotId: SaveSlotId };
