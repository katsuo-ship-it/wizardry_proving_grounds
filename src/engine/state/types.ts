// 言語
export type Lang = "en" | "ja";

// SaveSlot 識別子
export type SaveSlotId = number;
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  updatedAt: number;
}

// パーティ・キャラ (M3 でキャラ追加が始まるが、M2 で型を先に定義)
export type CharacterId = number;
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type Direction = "n" | "e" | "s" | "w";

export interface MazePosition {
  level: number;
  x: number;
  y: number;
  dir: Direction;
}

export interface PartyState {
  members: (CharacterId | null)[]; // 長さ 6
  gold: number;
  status: "inTown" | "inMaze" | "out";
  outAtPosition?: MazePosition;
}

export const EMPTY_PARTY: PartyState = {
  members: [null, null, null, null, null, null],
  gold: 0,
  status: "inTown",
};

// Title 画面の sub-state
export type TitleSubState =
  | { kind: "main" }
  | { kind: "continueMenu"; slots: SaveSlotInfo[] }
  | { kind: "loading"; slotId: SaveSlotId }
  | { kind: "loadError"; reason: string }
  | { kind: "settings" };

// Edge of Town: メニューと退出確認
export type EdgeOfTownSubState = { kind: "menu" } | { kind: "confirmLeave" };

// Castle, Training, Utilities, Tavern, Boltac, Temple, Inn, Maze は M2 では menu のみ。
export type SimpleSubState = { kind: "menu" };

// GameState union
export type GameState =
  | { phase: "title"; sub: TitleSubState }
  | { phase: "edgeOfTown"; sub: EdgeOfTownSubState; party: PartyState }
  | { phase: "castle"; sub: SimpleSubState; party: PartyState }
  | { phase: "training"; sub: SimpleSubState; party: PartyState }
  | { phase: "utilities"; sub: SimpleSubState; party: PartyState }
  | { phase: "tavern"; sub: SimpleSubState; party: PartyState }
  | { phase: "boltac"; sub: SimpleSubState; party: PartyState }
  | { phase: "temple"; sub: SimpleSubState; party: PartyState }
  | { phase: "inn"; sub: SimpleSubState; party: PartyState }
  | { phase: "maze"; sub: SimpleSubState; party: PartyState };

// イベント (Chapter 1 / M2 範囲)
export type GameEvent =
  // Title
  | { type: "startGame" }
  | { type: "openContinue" }
  | { type: "openSettings" }
  | { type: "closeSettings" }
  | { type: "changeLanguage"; lang: Lang }
  // Edge of Town
  | { type: "goToTraining" }
  | { type: "goToMaze" }
  | { type: "goToCastle" }
  | { type: "goToUtilities" }
  | { type: "leaveGame" }
  | { type: "confirmLeaveGame" }
  | { type: "cancelLeaveGame" }
  // Castle
  | { type: "enterTavern" }
  | { type: "enterBoltac" }
  | { type: "enterTemple" }
  | { type: "enterInn" }
  | { type: "leaveCastle" }
  // Placeholder phases 共通の戻る
  | { type: "goBack" }
  // 非同期ライフサイクル (M5 で本格実装)
  | { type: "loadStarted"; slotId: SaveSlotId }
  | { type: "loadFailed"; reason: string };

// 副作用
export type Effect = { type: "load"; slotId: SaveSlotId };
