import type { Alignment } from "@/engine/data/alignments";
import type { ClassId } from "@/engine/data/classes";
import type { ItemId } from "@/engine/data/items";
import type { RaceId } from "@/engine/data/races";

// 言語
export type Lang = "en" | "ja";

// SaveSlot 識別子
export type SaveSlotId = number;
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  createdAt: number;
  updatedAt: number;
}

// パーティ・キャラ
export type CharacterId = number;
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type Direction = "n" | "e" | "s" | "w";

export interface MazePosition {
  level: number;
  x: number;
  y: number;
  dir: Direction;
}

// キャラクター
export type AttributeKey = "str" | "iq" | "pie" | "vit" | "agi" | "luk";

export interface Attributes {
  str: number;
  iq: number;
  pie: number;
  vit: number;
  agi: number;
  luk: number;
}

export interface CharacterStatus {
  hp: number;
  hpMax: number;
  mp: { mage: number; priest: number };
  mpMax: { mage: number; priest: number };
  level: number;
  exp: number;
  gold: number;
  ac: number;
  age: number;
  /** Inn での休息回数 (Chapter 2 で年齢加算判定に使用) */
  restCount: number;
}

export interface InventoryItem {
  itemId: ItemId;
  identified: boolean; // Chapter 1 では常に true (識別/未識別は Chapter 4)
  cursed: boolean; // Chapter 1 では常に false
  equipped: boolean;
}

export type StatusFlag =
  | "ok"
  | "afraid"
  | "asleep"
  | "paralyzed"
  | "petrified"
  | "dead"
  | "ashes"
  | "lost";

export interface Character {
  id: number; // IndexedDB autoIncrement
  slotId: number;
  name: string;
  race: RaceId;
  class: ClassId;
  alignment: Alignment;
  attributes: Attributes;
  status: CharacterStatus;
  inventory: InventoryItem[];
  statusFlag: StatusFlag;
  createdAt: number;
}

/** キャラ作成時の作業中データ */
export interface CharacterDraft {
  name: string;
  race: RaceId;
  alignment: Alignment;
  baseAttributes: Attributes;
  attributes: Attributes;
  bonusPointsRemaining: number;
  selectedClass: ClassId | null;
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

// Castle, Utilities, Maze は M2 から menu のみ
export type SimpleSubState = { kind: "menu" };

// Training: 7 ステップキャラ作成フロー
export type CreatingStep =
  | "name"
  | "race"
  | "alignment"
  | "rollAttributes"
  | "allocateBonus"
  | "pickClass"
  | "confirm";

export type TrainingSubState =
  | { kind: "menu" }
  | { kind: "creating"; step: CreatingStep; draft: CharacterDraft }
  | { kind: "inspecting"; characterId: CharacterId }
  | { kind: "deleteConfirm"; characterId: CharacterId };

// Tavern
export type TavernSubState =
  | { kind: "menu" }
  | { kind: "addMember"; rosterIds: CharacterId[] }
  | { kind: "inspecting"; slot: SlotIndex };

// Boltac
export type BoltacSubState =
  | { kind: "menu" }
  | { kind: "pickBuyer"; mode: "buy" | "sell" }
  | { kind: "buyList"; buyer: CharacterId }
  | { kind: "sellList"; seller: CharacterId };

// Inn
export type InnSubState =
  | { kind: "menu" }
  | { kind: "pickGuest" }
  | { kind: "rest"; guest: CharacterId };

// Camp (M4)
export type CampSubState = { kind: "menu" };

// Temple (M5)
export type TempleSubState =
  | { kind: "menu" }
  | { kind: "savePicker" }
  | { kind: "saveNameInput"; slotId: SaveSlotId | undefined }
  | { kind: "saving"; slotId: SaveSlotId | undefined; name: string }
  | { kind: "saveDone"; slotId: SaveSlotId }
  | { kind: "saveError"; reason: string };

// Utilities (M5)
export type UtilitiesSubState = { kind: "menu" } | { kind: "restartList" };

// GameState union
export type GameState =
  | { phase: "title"; sub: TitleSubState }
  | { phase: "edgeOfTown"; sub: EdgeOfTownSubState; party: PartyState }
  | { phase: "castle"; sub: SimpleSubState; party: PartyState }
  | { phase: "training"; sub: TrainingSubState; party: PartyState }
  | { phase: "utilities"; sub: UtilitiesSubState; party: PartyState }
  | { phase: "tavern"; sub: TavernSubState; party: PartyState }
  | { phase: "boltac"; sub: BoltacSubState; party: PartyState }
  | { phase: "temple"; sub: TempleSubState; party: PartyState }
  | { phase: "inn"; sub: InnSubState; party: PartyState }
  | { phase: "maze"; pos: MazePosition; party: PartyState }
  | { phase: "camp"; sub: CampSubState; pos: MazePosition; party: PartyState };

// イベント
export type GameEvent =
  // Title
  | { type: "startGame" }
  | { type: "openContinue" }
  | { type: "openSettings" }
  | { type: "closeSettings" }
  | { type: "closeContinueMenu" }
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
  // Training
  | { type: "startCreate" }
  | { type: "inputName"; name: string }
  | { type: "pickRace"; race: RaceId }
  | { type: "pickAlignment"; alignment: Alignment }
  | { type: "attributesRolled"; attributes: Attributes; bonus: number }
  | { type: "allocateBonus"; attribute: AttributeKey; delta: -1 | 1 }
  | { type: "proceedToClass" }
  | { type: "pickClass"; klass: ClassId }
  | { type: "confirmCharacter" }
  | { type: "cancelCreate" }
  | { type: "inspectCharacter"; characterId: CharacterId }
  | { type: "deleteCharacter"; characterId: CharacterId }
  | { type: "confirmDelete" }
  | { type: "cancelDelete" }
  | { type: "closeInspect" }
  // Tavern
  | { type: "openAddMember" }
  | { type: "addToParty"; characterId: CharacterId; slot: SlotIndex }
  | { type: "removeFromParty"; slot: SlotIndex }
  | { type: "inspectMember"; slot: SlotIndex }
  | { type: "closeAddMember" }
  | { type: "leaveTavern" }
  // Boltac
  | { type: "openBuy" }
  | { type: "openSell" }
  | { type: "pickBuyer"; characterId: CharacterId }
  | { type: "buyItem"; itemId: ItemId }
  | { type: "sellItem"; itemIndex: number }
  | { type: "leaveBoltac" }
  // Inn
  | { type: "openInnGuest" }
  | { type: "pickGuest"; characterId: CharacterId }
  | { type: "restStables" }
  | { type: "leaveInn" }
  // Maze 内移動 (M4)
  | { type: "moveForward" }
  | { type: "moveBackward" }
  | { type: "turnLeft" }
  | { type: "turnRight" }
  | { type: "openCamp" }
  | { type: "ascendStairs" }
  | { type: "descendStairs" }
  // Camp (M4)
  | { type: "leaveCamp" }
  | { type: "quitToTown" }
  // Save/Load (M5)
  | { type: "openSavePicker" }
  | { type: "pickSlot"; slotId: SaveSlotId | "new" }
  | { type: "inputSaveName"; name: string }
  | { type: "confirmSave" }
  | { type: "cancelSave" }
  | { type: "saveStarted" }
  | { type: "saveSucceeded"; slotId: SaveSlotId }
  | { type: "saveFailed"; reason: string }
  | { type: "dismissSaveResult" }
  | { type: "loadSucceeded"; state: GameState }
  | { type: "dismissLoadResult" }
  | { type: "continueGame"; slotId: SaveSlotId }
  | { type: "openRestartList" }
  | { type: "restartParty"; slotId: SaveSlotId }
  // 非同期ライフサイクル (既存 + 新規)
  | { type: "loadStarted"; slotId: SaveSlotId }
  | { type: "loadFailed"; reason: string };

// 副作用
export type Effect =
  | { type: "load"; slotId: SaveSlotId }
  | { type: "save"; slotId: SaveSlotId | undefined; name: string };
