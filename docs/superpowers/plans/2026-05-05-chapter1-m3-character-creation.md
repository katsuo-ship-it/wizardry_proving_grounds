# Wizardry Proving Grounds - Chapter 1 / M3 Character Creation & Town Services Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Training Grounds でのキャラクター作成 (5 種族 × 8 職業 × 3 属性) を完成させ、Tavern でのパーティ編成、Boltac での装備の売買 (gold・inventory の実増減)、Inn の Stables 休息 (時間経過のみ・HP 回復なし)、Utilities の placeholder を完成させる。Pascal 抽出済みデータを TypeScript 定数として落とし、IndexedDB の `character` objectStore でロスターを永続化する。

**Architecture:** M2 で確立した state machine パターンを踏襲。各町施設 (training/tavern/boltac/inn) は専用 reducer を持ち、サブステートで複数ステップフローを表現。乱数は依存性注入 (mulberry32 シード固定) で決定論的にテスト可能。キャラデータは `character` objectStore が真理、`saveSlot.gameState` は `characterId` の参照のみを保持 (設計書 Section 6 「真理の所在」)。

**Tech Stack:** 既存スタック (Vite + React 18 + TypeScript strict + Zustand + Vitest + Biome + idb)。新規依存追加なし。

**Reference:** [設計書](../specs/2026-05-04-wizardry-proving-grounds-design.md) Section 4 (state machine) / Section 6 (永続化) / Section 7 (ゲームデータ・キャラ作成アルゴリズム) / [docs/reference/wiz1/data-tables/](../../reference/wiz1/data-tables/) (Pascal 抽出データ)

---

## File Structure

### Phase A: ゲームデータ (静的定数) + RNG
- Create: `src/engine/rng/mulberry32.ts` — シード固定可能な 32bit PRNG
- Create: `src/engine/data/alignments.ts` — Good/Neutral/Evil 定数
- Create: `src/engine/data/races.ts` — 5 種族の base 能力値
- Create: `src/engine/data/classes.ts` — 8 職業の minStats + alignments
- Create: `src/engine/data/items.ts` — Chapter 1 装備 (武器/鎧/盾/兜)
- Test: `tests/engine/rng/mulberry32.test.ts`
- Test: `tests/engine/data/races.test.ts` (smoke)
- Test: `tests/engine/data/classes.test.ts` (smoke)

### Phase B: キャラクター型 + 永続化レイヤ拡張
- Modify: `src/engine/state/types.ts` — Character, CharacterStatus, Attributes, ItemId 等の追加
- Modify: `src/persist/schema.ts` — character objectStore の value 型を Character 型に統一
- Modify: `src/persist/db.ts` — character CRUD API (listCharacters, addCharacter, updateCharacter, deleteCharacter)
- Test: `tests/persist/character.test.ts`

### Phase C: キャラ作成ロジック (純関数) + Training Grounds reducer
- Create: `src/engine/rules/character.ts` — rollBonus, applyBonus, eligibleClasses, makeCharacterFromDraft
- Test: `tests/engine/rules/character.test.ts` (テーブルテスト網羅)
- Modify: `src/engine/state/types.ts` — TrainingSubState の詳細化 (creating ステップ列)
- Create: `src/engine/state/reduceTraining.ts`
- Test: `tests/engine/state/reduceTraining.test.ts`

### Phase D: Training Grounds 画面
- Modify: `src/screens/Training/index.tsx` — placeholder から実画面へ
- Create: `src/screens/Training/CharacterList.tsx` — ロスター表示・新規/詳細/削除メニュー
- Create: `src/screens/Training/CreateName.tsx`
- Create: `src/screens/Training/CreateRace.tsx`
- Create: `src/screens/Training/CreateAlignment.tsx`
- Create: `src/screens/Training/CreateAttributes.tsx` — ロール + 振り分け
- Create: `src/screens/Training/CreateClass.tsx` — 資格のある職業のみ表示
- Create: `src/screens/Training/CreateConfirm.tsx`
- Create: `src/screens/Training/CharacterInspect.tsx`
- Create: `src/screens/Training/Training.css`
- Test: `tests/screens/Training.test.tsx` (E2E 風: smoke + 完全フロー 1 本)

### Phase E: Tavern (パーティ編成)
- Modify: `src/engine/state/types.ts` — TavernSubState
- Create: `src/engine/state/reduceTavern.ts`
- Test: `tests/engine/state/reduceTavern.test.ts`
- Modify: `src/screens/Tavern/index.tsx` — placeholder から実画面へ
- Create: `src/screens/Tavern/TavernMenu.tsx`
- Create: `src/screens/Tavern/AddMember.tsx`
- Create: `src/screens/Tavern/PartyView.tsx`

### Phase F: Boltac (売買)
- Modify: `src/engine/state/types.ts` — BoltacSubState
- Create: `src/engine/state/reduceBoltac.ts`
- Create: `src/engine/rules/inventory.ts` — addItem, removeItem, sellPrice 計算
- Test: `tests/engine/state/reduceBoltac.test.ts`
- Test: `tests/engine/rules/inventory.test.ts`
- Modify: `src/screens/Boltac/index.tsx`
- Create: `src/screens/Boltac/BoltacMenu.tsx`
- Create: `src/screens/Boltac/BuyerPick.tsx`
- Create: `src/screens/Boltac/BuyList.tsx`
- Create: `src/screens/Boltac/SellList.tsx`

### Phase G: Inn (Stables のみ)
- Modify: `src/engine/state/types.ts` — InnSubState
- Create: `src/engine/state/reduceInn.ts`
- Test: `tests/engine/state/reduceInn.test.ts`
- Modify: `src/screens/Inn/index.tsx`
- Create: `src/screens/Inn/InnMenu.tsx`
- Create: `src/screens/Inn/PickGuest.tsx`
- Create: `src/screens/Inn/RestStables.tsx`

### Phase H: 統合 + i18n + デプロイ
- Modify: `src/engine/state/reduce.ts` — placeholder から外す reducer のリワイヤリング
- Modify: `src/i18n/messages.ts` — 全画面の文字列追加
- Modify: `src/store/internalEventTypes.ts` — 必要なら追加
- Modify: `CHANGELOG.md`, `README.md`
- 動作確認 → push → CI → Vercel

---

## Phase A: ゲームデータ + RNG (P50: 0.5 日)

### Task A1: mulberry32 RNG

**Files:**
- Create: `src/engine/rng/mulberry32.ts`
- Test: `tests/engine/rng/mulberry32.test.ts`

- [ ] **Step A1.1: テスト先行**

```typescript
// tests/engine/rng/mulberry32.test.ts
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/engine/rng/mulberry32";

describe("mulberry32", () => {
  it("produces deterministic sequence for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequence for different seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(43);
    expect(a()).not.toBe(b());
  });

  it("returns floats in [0, 1)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step A1.2: 実装**

```typescript
// src/engine/rng/mulberry32.ts

/**
 * mulberry32: シード固定可能な 32bit pseudo-random number generator。
 * Tomas Wang による軽量実装で、ゲームの決定論的テストに十分な品質。
 * 戻り値は [0, 1) の float。
 *
 * 使い方:
 *   const rng = mulberry32(42);
 *   const x = rng();        // 0.0..1.0
 *   const i = Math.floor(rng() * 10);  // 0..9 の int
 */
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1..n の整数を返す（dice roll 用）。 */
export function rollDie(rng: RNG, sides: number): number {
  return 1 + Math.floor(rng() * sides);
}

/** [min, max] の整数を返す。 */
export function rollIntInclusive(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
```

- [ ] **Step A1.3: テスト**

```bash
pnpm test mulberry32
```

期待: 3/3 PASS

- [ ] **Step A1.4: コミット**

```bash
git add src/engine/rng/mulberry32.ts tests/engine/rng/mulberry32.test.ts
git commit -m "feat(rng): mulberry32 PRNG with rollDie helper"
```

### Task A2: alignments / races / classes / items 定数

**Files:**
- Create: `src/engine/data/alignments.ts`
- Create: `src/engine/data/races.ts`
- Create: `src/engine/data/classes.ts`
- Create: `src/engine/data/items.ts`
- Test: `tests/engine/data/races.test.ts`
- Test: `tests/engine/data/classes.test.ts`

- [ ] **Step A2.1: alignments.ts**

```typescript
// src/engine/data/alignments.ts
export const ALIGNMENTS = ["good", "neutral", "evil"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];
```

- [ ] **Step A2.2: races.ts**

データソース: [docs/reference/wiz1/data-tables/races.md](../../reference/wiz1/data-tables/races.md)

```typescript
// src/engine/data/races.ts
// Reference: docs/reference/wiz1/data-tables/races.md (🟡 二次ソース)

export const RACES = {
  human: { id: "human", base: { str: 8, iq: 8, pie: 5, vit: 8, agi: 8, luk: 9 } },
  elf: { id: "elf", base: { str: 7, iq: 10, pie: 10, vit: 6, agi: 9, luk: 6 } },
  dwarf: { id: "dwarf", base: { str: 10, iq: 7, pie: 10, vit: 10, agi: 5, luk: 6 } },
  gnome: { id: "gnome", base: { str: 7, iq: 7, pie: 10, vit: 8, agi: 10, luk: 7 } },
  hobbit: { id: "hobbit", base: { str: 5, iq: 7, pie: 7, vit: 6, agi: 10, luk: 15 } },
} as const;

export type RaceId = keyof typeof RACES;
export const RACE_IDS = Object.keys(RACES) as RaceId[];
```

- [ ] **Step A2.3: classes.ts**

データソース: [docs/reference/wiz1/data-tables/classes.md](../../reference/wiz1/data-tables/classes.md)

```typescript
// src/engine/data/classes.ts
// Reference: docs/reference/wiz1/data-tables/classes.md (🟡 二次ソース)
import type { Alignment } from "./alignments";

interface ClassDef {
  id: string;
  minStats: Partial<{ str: number; iq: number; pie: number; vit: number; agi: number; luk: number }>;
  alignments: ReadonlyArray<Alignment>;
}

export const CLASSES = {
  fighter: { id: "fighter", minStats: { str: 11 }, alignments: ["good", "neutral", "evil"] },
  mage: { id: "mage", minStats: { iq: 11 }, alignments: ["good", "neutral", "evil"] },
  priest: { id: "priest", minStats: { pie: 11 }, alignments: ["good", "evil"] },
  thief: { id: "thief", minStats: { agi: 11 }, alignments: ["neutral", "evil"] },
  bishop: { id: "bishop", minStats: { iq: 12, pie: 12 }, alignments: ["good", "evil"] },
  samurai: {
    id: "samurai",
    minStats: { str: 15, iq: 11, pie: 10, vit: 14, agi: 10 },
    alignments: ["good", "neutral"],
  },
  lord: {
    id: "lord",
    minStats: { str: 15, iq: 12, pie: 12, vit: 15, agi: 14, luk: 15 },
    alignments: ["good"],
  },
  ninja: {
    id: "ninja",
    minStats: { str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 },
    alignments: ["evil"],
  },
} as const satisfies Record<string, ClassDef>;

export type ClassId = keyof typeof CLASSES;
export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
```

- [ ] **Step A2.4: items.ts**

データソース: [docs/reference/wiz1/data-tables/items.md](../../reference/wiz1/data-tables/items.md)

```typescript
// src/engine/data/items.ts
// Reference: docs/reference/wiz1/data-tables/items.md (🟡 二次ソース、Chapter 1 範囲)
import type { ClassId } from "./classes";

export type ItemSlot = "weapon" | "armor" | "shield" | "helmet";

export interface ItemDef {
  id: string;
  slot: ItemSlot;
  cost: number;
  /** 武器のみ: ダメージダイス { dice: 1, sides: 8 } = 1d8 */
  damage?: { dice: number; sides: number };
  /** 防具・盾・兜のみ: AC ボーナス (負の値が良い) */
  acBonus?: number;
  allowedClasses: ReadonlyArray<ClassId>;
}

const F_S_L_N: ReadonlyArray<ClassId> = ["fighter", "samurai", "lord", "ninja"];
const F_S_L_T_N: ReadonlyArray<ClassId> = ["fighter", "samurai", "lord", "thief", "ninja"];
const ALL_FRONT: ReadonlyArray<ClassId> = ["fighter", "priest", "samurai", "lord"];
const ALL_CASTER: ReadonlyArray<ClassId> = ["mage", "priest", "bishop"];
const ALL_CLASSES: ReadonlyArray<ClassId> = [
  "fighter",
  "mage",
  "priest",
  "thief",
  "bishop",
  "samurai",
  "lord",
  "ninja",
];

export const ITEMS = {
  longSword: {
    id: "longSword",
    slot: "weapon",
    cost: 25,
    damage: { dice: 1, sides: 8 },
    allowedClasses: F_S_L_N,
  },
  shortSword: {
    id: "shortSword",
    slot: "weapon",
    cost: 15,
    damage: { dice: 1, sides: 6 },
    allowedClasses: F_S_L_T_N,
  },
  mace: {
    id: "mace",
    slot: "weapon",
    cost: 30,
    damage: { dice: 2, sides: 3 },
    allowedClasses: [...ALL_FRONT, "bishop", "ninja"],
  },
  staff: {
    id: "staff",
    slot: "weapon",
    cost: 5,
    damage: { dice: 1, sides: 4 },
    allowedClasses: [...ALL_CASTER, ...ALL_FRONT],
  },
  dagger: {
    id: "dagger",
    slot: "weapon",
    cost: 5,
    damage: { dice: 1, sides: 4 },
    allowedClasses: ALL_CLASSES,
  },
  leatherArmor: {
    id: "leatherArmor",
    slot: "armor",
    cost: 50,
    acBonus: -1,
    allowedClasses: [...F_S_L_N, "thief"],
  },
  chainMail: {
    id: "chainMail",
    slot: "armor",
    cost: 90,
    acBonus: -2,
    allowedClasses: ALL_FRONT,
  },
  breastPlate: {
    id: "breastPlate",
    slot: "armor",
    cost: 200,
    acBonus: -3,
    allowedClasses: ALL_FRONT,
  },
  plateMail: {
    id: "plateMail",
    slot: "armor",
    cost: 750,
    acBonus: -4,
    allowedClasses: ["fighter", "samurai", "lord"],
  },
  smallShield: {
    id: "smallShield",
    slot: "shield",
    cost: 20,
    acBonus: -1,
    allowedClasses: [...ALL_FRONT, "thief", "ninja"],
  },
  largeShield: {
    id: "largeShield",
    slot: "shield",
    cost: 40,
    acBonus: -2,
    allowedClasses: ALL_FRONT,
  },
  helm: {
    id: "helm",
    slot: "helmet",
    cost: 100,
    acBonus: -1,
    allowedClasses: [...ALL_FRONT, "ninja"],
  },
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Boltac の売却価格 = 購入価格の 50% (1981 オリジナル準拠の暫定値、Pascal 確認待ち) */
export const SELL_RATIO = 0.5;
```

- [ ] **Step A2.5: races テスト (smoke)**

```typescript
// tests/engine/data/races.test.ts
import { RACES, RACE_IDS } from "@/engine/data/races";
import { describe, expect, it } from "vitest";

describe("RACES", () => {
  it("has 5 races", () => {
    expect(RACE_IDS).toHaveLength(5);
  });

  it.each(RACE_IDS)("%s base attributes are valid 1..18", (id) => {
    const base = RACES[id].base;
    for (const v of Object.values(base)) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(18);
    }
  });
});
```

- [ ] **Step A2.6: classes テスト (smoke)**

```typescript
// tests/engine/data/classes.test.ts
import { CLASSES, CLASS_IDS } from "@/engine/data/classes";
import { describe, expect, it } from "vitest";

describe("CLASSES", () => {
  it("has 8 classes", () => {
    expect(CLASS_IDS).toHaveLength(8);
  });

  it.each(CLASS_IDS)("%s has alignments and minStats", (id) => {
    const k = CLASSES[id];
    expect(k.alignments.length).toBeGreaterThan(0);
    expect(Object.keys(k.minStats).length).toBeGreaterThan(0);
  });

  it("ninja requires 17 in all stats and evil alignment", () => {
    const n = CLASSES.ninja;
    expect(n.minStats).toEqual({ str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 });
    expect(n.alignments).toEqual(["evil"]);
  });
});
```

- [ ] **Step A2.7: テスト + コミット**

```bash
pnpm test data
pnpm typecheck
git add src/engine/data/ tests/engine/data/
git commit -m "feat(data): add RACES/CLASSES/ITEMS/ALIGNMENTS constants from M0 tables"
```

---

## Phase B: キャラクター型 + 永続化レイヤ拡張 (P50: 0.5 日)

### Task B1: types.ts に Character 関連の型を追加

**Files:**
- Modify: `src/engine/state/types.ts`

- [ ] **Step B1.1: Character / Attributes / CharacterStatus を追加**

`types.ts` の先頭 (PartyState の前) に挿入:

```typescript
import type { Alignment } from "@/engine/data/alignments";
import type { ClassId } from "@/engine/data/classes";
import type { ItemId } from "@/engine/data/items";
import type { RaceId } from "@/engine/data/races";

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
  gold: number; // 個人 gold (Wizardry オリジナル)。なお M3 の買い物はパーティ gold で行う設計判断
  ac: number;
  age: number;
  /** Inn での休息回数 (年齢加算判定に使用、Chapter 2 で実装) */
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
  slotId: number; // 紐付くセーブスロット
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
  baseAttributes: Attributes; // 種族 base
  attributes: Attributes; // base + 振り分け
  bonusPointsRemaining: number;
  selectedClass: ClassId | null;
}
```

- [ ] **Step B1.2: PartyState を Character 参照型に**

既存の PartyState は `members: (CharacterId | null)[]` のままで OK (CharacterId = number で id を参照)。M2 で確立済み。

- [ ] **Step B1.3: TrainingSubState を詳細化**

既存の `SimpleSubState` 共有から外し、専用 union を追加:

```typescript
export type TrainingSubState =
  | { kind: "menu" }
  | { kind: "creating"; step: CreatingStep; draft: CharacterDraft }
  | { kind: "inspecting"; characterId: CharacterId }
  | { kind: "deleteConfirm"; characterId: CharacterId };

export type CreatingStep =
  | "name"
  | "race"
  | "alignment"
  | "rollAttributes"
  | "allocateBonus"
  | "pickClass"
  | "confirm";
```

GameState の training entry を更新:

```typescript
// 既存
| { phase: "training"; sub: SimpleSubState; party: PartyState }
// → 変更
| { phase: "training"; sub: TrainingSubState; party: PartyState }
```

- [ ] **Step B1.4: TavernSubState / BoltacSubState / InnSubState を追加**

```typescript
export type TavernSubState =
  | { kind: "menu" }
  | { kind: "addMember"; rosterIds: CharacterId[] }
  | { kind: "inspecting"; slot: SlotIndex };

export type BoltacSubState =
  | { kind: "menu" }
  | { kind: "pickBuyer"; mode: "buy" | "sell" }
  | { kind: "buyList"; buyer: CharacterId }
  | { kind: "sellList"; seller: CharacterId };

export type InnSubState =
  | { kind: "menu" }
  | { kind: "pickGuest" }
  | { kind: "rest"; guest: CharacterId };

// GameState の対応 phase を SimpleSubState から差し替え
| { phase: "tavern"; sub: TavernSubState; party: PartyState }
| { phase: "boltac"; sub: BoltacSubState; party: PartyState }
| { phase: "inn"; sub: InnSubState; party: PartyState }
```

- [ ] **Step B1.5: GameEvent 拡張**

Training・Tavern・Boltac・Inn の操作イベントを追加:

```typescript
// Training
| { type: "startCreate" }
| { type: "inputName"; name: string }
| { type: "pickRace"; race: RaceId }
| { type: "pickAlignment"; alignment: Alignment }
| { type: "attributesRolled"; attributes: Attributes; bonus: number }   // UI で roll 計算後に発火
| { type: "allocateBonus"; attribute: AttributeKey; delta: -1 | 1 }
| { type: "proceedToClass" }                                            // bonus 残 0 で次画面へ
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
```

- [ ] **Step B1.6: typecheck**

```bash
pnpm typecheck
```

期待: 既存の reduceCastle, reduceTavern (placeholder), reduceBoltac (placeholder) など SimpleSubState を期待してた箇所がエラーになる。**この段階では OK**。Phase C-G で順次解消する。

- [ ] **Step B1.7: コミット**

```bash
git add src/engine/state/types.ts
git commit -m "feat(types): add Character, sub-states, and events for M3"
```

### Task B2: persist/schema.ts と db.ts に character API を追加

**Files:**
- Modify: `src/persist/schema.ts`
- Modify: `src/persist/db.ts`
- Create: `tests/persist/character.test.ts`

- [ ] **Step B2.1: schema.ts の character 型を Character に統一**

```typescript
import type { Character } from "@/engine/state/types";

// 既存 character エントリを置き換え
character: {
  key: number;
  value: Character;  // 既存の { id, slotId, name, data: string } 構造を捨てて型を統一
  indexes: { "by-slotId": number };
};
```

- [ ] **Step B2.2: db.ts に character CRUD API を追加**

`db` オブジェクトに以下メソッドを追加:

```typescript
// src/persist/db.ts (db オブジェクト内に追加)
async listCharacters(slotId: number): Promise<Character[]> {
  const idb = await openWizardryDB();
  return idb.getAllFromIndex("character", "by-slotId", slotId);
},

async addCharacter(c: Omit<Character, "id">): Promise<number> {
  const idb = await openWizardryDB();
  return idb.add("character", c as Character) as Promise<number>;
},

async updateCharacter(c: Character): Promise<void> {
  const idb = await openWizardryDB();
  await idb.put("character", c);
},

async getCharacter(id: number): Promise<Character | undefined> {
  const idb = await openWizardryDB();
  return idb.get("character", id);
},

async deleteCharacter(id: number): Promise<void> {
  const idb = await openWizardryDB();
  await idb.delete("character", id);
},
```

import を追加:

```typescript
import type { Character } from "@/engine/state/types";
```

- [ ] **Step B2.3: テスト**

```typescript
// tests/persist/character.test.ts
import { db, resetDbInstance } from "@/persist/db";
import type { Character } from "@/engine/state/types";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

const sample = (slotId = 1): Omit<Character, "id"> => ({
  slotId,
  name: "Conan",
  race: "human",
  class: "fighter",
  alignment: "good",
  attributes: { str: 14, iq: 8, pie: 8, vit: 12, agi: 10, luk: 9 },
  status: {
    hp: 10,
    hpMax: 10,
    mp: { mage: 0, priest: 0 },
    mpMax: { mage: 0, priest: 0 },
    level: 1,
    exp: 0,
    gold: 100,
    ac: 10,
    age: 18,
    restCount: 0,
  },
  inventory: [],
  statusFlag: "ok",
  createdAt: Date.now(),
});

describe("db character API", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("adds and retrieves a character", async () => {
    const id = await db.addCharacter(sample());
    const c = await db.getCharacter(id);
    expect(c?.name).toBe("Conan");
    expect(c?.id).toBe(id);
  });

  it("lists characters by slotId", async () => {
    await db.addCharacter(sample(1));
    await db.addCharacter(sample(1));
    await db.addCharacter(sample(2));
    const list1 = await db.listCharacters(1);
    const list2 = await db.listCharacters(2);
    expect(list1).toHaveLength(2);
    expect(list2).toHaveLength(1);
  });

  it("updates an existing character", async () => {
    const id = await db.addCharacter(sample());
    const before = await db.getCharacter(id);
    if (!before) throw new Error("missing");
    await db.updateCharacter({ ...before, name: "Aragorn" });
    const after = await db.getCharacter(id);
    expect(after?.name).toBe("Aragorn");
  });

  it("deletes a character", async () => {
    const id = await db.addCharacter(sample());
    await db.deleteCharacter(id);
    expect(await db.getCharacter(id)).toBeUndefined();
  });
});
```

- [ ] **Step B2.4: テスト**

```bash
pnpm test character
```

期待: 4/4 PASS

- [ ] **Step B2.5: コミット**

```bash
git add src/persist tests/persist/character.test.ts
git commit -m "feat(persist): add character CRUD API with by-slotId index"
```

---

## Phase C: キャラ作成ロジック + Training reducer (P50: 1 日)

### Task C1: rules/character.ts のテスト先行

**Files:**
- Create: `tests/engine/rules/character.test.ts`

- [ ] **Step C1.1: テスト**

```typescript
// tests/engine/rules/character.test.ts
import { CLASSES } from "@/engine/data/classes";
import { RACES } from "@/engine/data/races";
import {
  applyBonus,
  eligibleClasses,
  rollBonus,
  startDraft,
} from "@/engine/rules/character";
import { mulberry32 } from "@/engine/rng/mulberry32";
import { describe, expect, it } from "vitest";

describe("rollBonus", () => {
  it("returns at least 5 with seeded RNG", () => {
    const rng = mulberry32(42);
    const v = rollBonus(rng);
    expect(v).toBeGreaterThanOrEqual(5);
    expect(v).toBeLessThanOrEqual(35);
  });

  it("is deterministic for a given seed", () => {
    const a = rollBonus(mulberry32(7));
    const b = rollBonus(mulberry32(7));
    expect(a).toBe(b);
  });
});

describe("startDraft", () => {
  it("initializes attributes from race base + bonus", () => {
    const rng = mulberry32(1);
    const draft = startDraft({ name: "Test", race: "human", alignment: "good" }, rng);
    expect(draft.baseAttributes).toEqual(RACES.human.base);
    expect(draft.attributes).toEqual(RACES.human.base);
    expect(draft.bonusPointsRemaining).toBeGreaterThanOrEqual(5);
  });
});

describe("applyBonus", () => {
  const baseDraft = {
    name: "Test",
    race: "human" as const,
    alignment: "good" as const,
    baseAttributes: { ...RACES.human.base },
    attributes: { ...RACES.human.base },
    bonusPointsRemaining: 10,
    selectedClass: null,
  };

  it("+1 increases attribute, decrements remaining", () => {
    const next = applyBonus(baseDraft, "str", 1);
    expect(next.attributes.str).toBe(baseDraft.attributes.str + 1);
    expect(next.bonusPointsRemaining).toBe(9);
  });

  it("-1 cannot go below race base", () => {
    const draft = { ...baseDraft, attributes: { ...baseDraft.baseAttributes } };
    const next = applyBonus(draft, "str", -1);
    // base から下げられないので変化なし
    expect(next.attributes.str).toBe(draft.baseAttributes.str);
    expect(next.bonusPointsRemaining).toBe(draft.bonusPointsRemaining);
  });

  it("+1 cannot exceed 18", () => {
    const draft = { ...baseDraft, attributes: { ...baseDraft.attributes, str: 18 } };
    const next = applyBonus(draft, "str", 1);
    expect(next.attributes.str).toBe(18);
    expect(next.bonusPointsRemaining).toBe(draft.bonusPointsRemaining);
  });

  it("+1 with no bonus remaining is rejected", () => {
    const draft = { ...baseDraft, bonusPointsRemaining: 0 };
    const next = applyBonus(draft, "str", 1);
    expect(next).toBe(draft);
  });
});

describe("eligibleClasses", () => {
  it("returns Fighter for STR 11+ with any alignment", () => {
    const list = eligibleClasses(
      { str: 11, iq: 8, pie: 8, vit: 8, agi: 8, luk: 8 },
      "good",
    );
    expect(list).toContain("fighter");
    expect(list).not.toContain("ninja");
  });

  it("returns Ninja only when all 17+ and evil", () => {
    const max = { str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 };
    expect(eligibleClasses(max, "evil")).toContain("ninja");
    expect(eligibleClasses(max, "good")).not.toContain("ninja");
  });

  it("excludes Priest for neutral alignment", () => {
    const stats = { str: 8, iq: 8, pie: 11, vit: 8, agi: 8, luk: 8 };
    expect(eligibleClasses(stats, "neutral")).not.toContain("priest");
    expect(eligibleClasses(stats, "good")).toContain("priest");
  });

  it("excludes Lord when alignment is not good", () => {
    const high = { str: 15, iq: 12, pie: 12, vit: 15, agi: 14, luk: 15 };
    expect(eligibleClasses(high, "good")).toContain("lord");
    expect(eligibleClasses(high, "neutral")).not.toContain("lord");
    expect(eligibleClasses(high, "evil")).not.toContain("lord");
  });
});
```

- [ ] **Step C1.2: テスト失敗確認**

```bash
pnpm test rules/character
```

期待: モジュール未実装で FAIL

### Task C2: rules/character.ts 実装

**Files:**
- Create: `src/engine/rules/character.ts`

- [ ] **Step C2.1: 実装**

```typescript
// src/engine/rules/character.ts
import type { Alignment } from "@/engine/data/alignments";
import { CLASSES, type ClassId, CLASS_IDS } from "@/engine/data/classes";
import { RACES, type RaceId } from "@/engine/data/races";
import type { RNG } from "@/engine/rng/mulberry32";
import type { Attributes, AttributeKey, CharacterDraft } from "@/engine/state/types";

const ATTRIBUTE_MAX = 18;

/**
 * ボーナスポイントロール (1981 オリジナル準拠の暫定式)。
 * 5 + d6 の基本ロールに加え、1/10 で +10 ボーナスが連鎖する。
 * 期待値 ≈ 8、最大 ≈ 25 (1/100)。
 *
 * Reference: docs/reference/wiz1/algorithms/character-creation.md
 */
export function rollBonus(rng: RNG): number {
  let bonus = 5 + Math.floor(rng() * 6); // 5..10
  if (Math.floor(rng() * 10) === 0) {
    bonus += 10;
    if (Math.floor(rng() * 10) === 0) {
      bonus += 10;
    }
  }
  return bonus;
}

interface DraftSeed {
  name: string;
  race: RaceId;
  alignment: Alignment;
}

export function startDraft(seed: DraftSeed, rng: RNG): CharacterDraft {
  const base = { ...RACES[seed.race].base };
  return {
    name: seed.name,
    race: seed.race,
    alignment: seed.alignment,
    baseAttributes: base,
    attributes: { ...base },
    bonusPointsRemaining: rollBonus(rng),
    selectedClass: null,
  };
}

export function applyBonus(
  draft: CharacterDraft,
  attribute: AttributeKey,
  delta: -1 | 1,
): CharacterDraft {
  const current = draft.attributes[attribute];
  const baseLimit = draft.baseAttributes[attribute];

  if (delta === 1) {
    if (draft.bonusPointsRemaining <= 0) return draft;
    if (current >= ATTRIBUTE_MAX) return draft;
    return {
      ...draft,
      attributes: { ...draft.attributes, [attribute]: current + 1 },
      bonusPointsRemaining: draft.bonusPointsRemaining - 1,
    };
  }
  // delta === -1
  if (current <= baseLimit) return draft;
  return {
    ...draft,
    attributes: { ...draft.attributes, [attribute]: current - 1 },
    bonusPointsRemaining: draft.bonusPointsRemaining + 1,
  };
}

export function rerollBonus(draft: CharacterDraft, rng: RNG): CharacterDraft {
  // 振り直し: 既に振った分を base に戻し、bonus を再ロール
  return {
    ...draft,
    attributes: { ...draft.baseAttributes },
    bonusPointsRemaining: rollBonus(rng),
  };
}

export function eligibleClasses(attrs: Attributes, alignment: Alignment): ClassId[] {
  return CLASS_IDS.filter((cid) => {
    const k = CLASSES[cid];
    for (const [key, min] of Object.entries(k.minStats)) {
      if (typeof min !== "number") continue;
      if (attrs[key as AttributeKey] < min) return false;
    }
    if (!k.alignments.includes(alignment)) return false;
    return true;
  });
}
```

- [ ] **Step C2.2: テスト**

```bash
pnpm test rules/character
```

期待: 全 PASS

- [ ] **Step C2.3: コミット**

```bash
git add src/engine/rules/character.ts tests/engine/rules/character.test.ts
git commit -m "feat(rules): character creation pure functions (rollBonus, applyBonus, eligibleClasses)"
```

### Task C3: makeCharacterFromDraft (確定 → Character オブジェクト)

**Files:**
- Modify: `src/engine/rules/character.ts`
- Modify: `tests/engine/rules/character.test.ts`

- [ ] **Step C3.1: テスト追加**

```typescript
// tests/engine/rules/character.test.ts に追加
import { makeCharacterFromDraft } from "@/engine/rules/character";

describe("makeCharacterFromDraft", () => {
  it("converts a confirmed draft into a full Character", () => {
    const draft = {
      name: "Aragorn",
      race: "human" as const,
      alignment: "good" as const,
      baseAttributes: RACES.human.base,
      attributes: { str: 15, iq: 8, pie: 8, vit: 12, agi: 10, luk: 9 },
      bonusPointsRemaining: 0,
      selectedClass: "fighter" as const,
    };
    const c = makeCharacterFromDraft(draft, 1, 1700000000000);
    expect(c.name).toBe("Aragorn");
    expect(c.race).toBe("human");
    expect(c.class).toBe("fighter");
    expect(c.alignment).toBe("good");
    expect(c.attributes).toEqual(draft.attributes);
    expect(c.slotId).toBe(1);
    expect(c.status.level).toBe(1);
    expect(c.status.hp).toBeGreaterThan(0);
    expect(c.status.hpMax).toBe(c.status.hp);
    expect(c.statusFlag).toBe("ok");
    expect(c.inventory).toEqual([]);
    expect(c.createdAt).toBe(1700000000000);
  });

  it("throws when selectedClass is null", () => {
    const draft = {
      name: "X",
      race: "human" as const,
      alignment: "good" as const,
      baseAttributes: RACES.human.base,
      attributes: { ...RACES.human.base },
      bonusPointsRemaining: 0,
      selectedClass: null,
    };
    expect(() => makeCharacterFromDraft(draft, 1, 0)).toThrow();
  });
});
```

- [ ] **Step C3.2: 実装追加**

```typescript
// src/engine/rules/character.ts の末尾に追加
import type { Character } from "@/engine/state/types";

/**
 * draft を確定して Character を作る。
 * HP の初期値は class と vit に基づく簡易計算 (Chapter 2 で本格的な式に置換予定)。
 *
 * Note: omits "id" because IndexedDB autoIncrement で割り当てる。
 */
export function makeCharacterFromDraft(
  draft: CharacterDraft,
  slotId: number,
  now: number,
): Omit<Character, "id"> {
  if (!draft.selectedClass) {
    throw new Error("makeCharacterFromDraft: selectedClass is null");
  }

  // 初期 HP の簡易計算 (Chapter 2 で正式な公式に差し替え)
  // Fighter: 10 + vit/2, Mage: 6 + vit/4, etc — 暫定で「全職業 8 + vit/2」
  const hp = 8 + Math.floor(draft.attributes.vit / 2);

  return {
    slotId,
    name: draft.name,
    race: draft.race,
    class: draft.selectedClass,
    alignment: draft.alignment,
    attributes: draft.attributes,
    status: {
      hp,
      hpMax: hp,
      mp: { mage: 0, priest: 0 },
      mpMax: { mage: 0, priest: 0 },
      level: 1,
      exp: 0,
      gold: 100, // 初期所持金 100 GP (Wizardry オリジナル)
      ac: 10, // 装備なし AC
      age: 18, // 暫定: 18 歳固定。Chapter 2 で Inn 休息や蘇生時の年齢加算とともに正式化
      restCount: 0,
    },
    inventory: [],
    statusFlag: "ok",
    createdAt: now,
  };
}
```

> 注: `age` 部分の `Math.random` は本来 RNG DI すべきだが、Chapter 2 で年齢が意味を持つようになるまで暫定。M3 では値表示用のフレーバー扱い。

- [ ] **Step C3.3: テスト + コミット**

```bash
pnpm test rules/character
git add src/engine/rules/character.ts tests/engine/rules/character.test.ts
git commit -m "feat(rules): makeCharacterFromDraft converts confirmed draft to Character"
```

### Task C4: reduceTraining のテストと実装

**Files:**
- Create: `src/engine/state/reduceTraining.ts`
- Create: `tests/engine/state/reduceTraining.test.ts`
- Modify: `src/engine/state/reduce.ts` — placeholder から外す

- [ ] **Step C4.1: テスト**

```typescript
// tests/engine/state/reduceTraining.test.ts
import { RACES } from "@/engine/data/races";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const baseTraining: GameState = {
  phase: "training",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("training phase reducer", () => {
  it("startCreate moves to creating.name with a fresh draft", () => {
    const next = reduce(baseTraining, { type: "startCreate" });
    expect(next.phase).toBe("training");
    if (next.phase !== "training") return;
    expect(next.sub.kind).toBe("creating");
    if (next.sub.kind !== "creating") return;
    expect(next.sub.step).toBe("name");
    expect(next.sub.draft.name).toBe("");
  });

  it("inputName moves from name → race step", () => {
    const s1 = reduce(baseTraining, { type: "startCreate" });
    const s2 = reduce(s1, { type: "inputName", name: "Conan" });
    if (s2.phase !== "training" || s2.sub.kind !== "creating") {
      throw new Error("unexpected state");
    }
    expect(s2.sub.draft.name).toBe("Conan");
    expect(s2.sub.step).toBe("race");
  });

  it("pickRace moves to alignment step and updates baseAttributes", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "elf" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("alignment");
    expect(s.sub.draft.race).toBe("elf");
    expect(s.sub.draft.baseAttributes).toEqual(RACES.elf.base);
  });

  it("cancelCreate returns to training menu", () => {
    const s1 = reduce(baseTraining, { type: "startCreate" });
    const s2 = reduce(s1, { type: "cancelCreate" });
    expect(s2).toEqual(baseTraining);
  });

  it("goBack from menu returns to edgeOfTown", () => {
    const next = reduce(baseTraining, { type: "goBack" });
    expect(next).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step C4.2: テスト失敗確認**

```bash
pnpm test reduceTraining
```

### Task C5: reduceTraining.ts 実装

**Files:**
- Create: `src/engine/state/reduceTraining.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step C5.1: reduceTraining.ts**

```typescript
// src/engine/state/reduceTraining.ts
import { RACES } from "@/engine/data/races";
import { applyBonus, eligibleClasses, rerollBonus, startDraft } from "@/engine/rules/character";
import { mulberry32 } from "@/engine/rng/mulberry32";
import type { CharacterDraft, GameEvent, GameState } from "./types";

const FRESH_DRAFT: CharacterDraft = {
  name: "",
  race: "human",
  alignment: "good",
  baseAttributes: RACES.human.base,
  attributes: RACES.human.base,
  bonusPointsRemaining: 0,
  selectedClass: null,
};

export function reduceTraining(
  state: Extract<GameState, { phase: "training" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  // メニューから創造フローへ / メニュー操作
  if (sub.kind === "menu") {
    switch (event.type) {
      case "startCreate":
        return {
          ...state,
          sub: { kind: "creating", step: "name", draft: FRESH_DRAFT },
        };
      case "inspectCharacter":
        return { ...state, sub: { kind: "inspecting", characterId: event.characterId } };
      case "deleteCharacter":
        return { ...state, sub: { kind: "deleteConfirm", characterId: event.characterId } };
      case "goBack":
        return { phase: "edgeOfTown", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "creating") {
    return reduceCreating(state, sub, event);
  }

  if (sub.kind === "inspecting") {
    if (event.type === "closeInspect") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "deleteConfirm") {
    if (event.type === "confirmDelete" || event.type === "cancelDelete") {
      // 実際の削除は副作用 (db.deleteCharacter) で。reducer は menu に戻すだけ
      return { ...state, sub: { kind: "menu" } };
    }
    return state;
  }

  return state;
}

function reduceCreating(
  state: Extract<GameState, { phase: "training" }>,
  sub: { kind: "creating"; step: import("./types").CreatingStep; draft: CharacterDraft },
  event: GameEvent,
): GameState {
  if (event.type === "cancelCreate") {
    return { ...state, sub: { kind: "menu" } };
  }

  switch (sub.step) {
    case "name":
      if (event.type === "inputName") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "race",
            draft: { ...sub.draft, name: event.name },
          },
        };
      }
      return state;

    case "race":
      if (event.type === "pickRace") {
        const base = RACES[event.race].base;
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "alignment",
            draft: {
              ...sub.draft,
              race: event.race,
              baseAttributes: base,
              attributes: base,
            },
          },
        };
      }
      return state;

    case "alignment":
      if (event.type === "pickAlignment") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "rollAttributes",
            draft: { ...sub.draft, alignment: event.alignment },
          },
        };
      }
      return state;

    case "rollAttributes":
      // 純関数を保つため、roll 結果は UI 側で計算して event に乗せる。
      // event 名: "attributesRolled" (新設、bonus と attributes を payload で受け取る)
      if (event.type === "attributesRolled") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "allocateBonus",
            draft: {
              ...sub.draft,
              baseAttributes: event.attributes,
              attributes: event.attributes,
              bonusPointsRemaining: event.bonus,
            },
          },
        };
      }
      return state;

    case "allocateBonus":
      if (event.type === "allocateBonus") {
        const next = applyBonus(sub.draft, event.attribute, event.delta);
        return { ...state, sub: { kind: "creating", step: "allocateBonus", draft: next } };
      }
      if (event.type === "attributesRolled") {
        // 振り直し
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "allocateBonus",
            draft: {
              ...sub.draft,
              attributes: event.attributes,
              bonusPointsRemaining: event.bonus,
            },
          },
        };
      }
      if (event.type === "proceedToClass" && sub.draft.bonusPointsRemaining === 0) {
        return { ...state, sub: { kind: "creating", step: "pickClass", draft: sub.draft } };
      }
      return state;

    case "pickClass":
      if (event.type === "pickClass") {
        const eligible = eligibleClasses(sub.draft.attributes, sub.draft.alignment);
        if (!eligible.includes(event.klass)) return state;
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "confirm",
            draft: { ...sub.draft, selectedClass: event.klass },
          },
        };
      }
      return state;

    case "confirm":
      if (event.type === "confirmCharacter") {
        // 副作用 (db.addCharacter) は store の effect runner で処理
        // reducer は menu に戻すだけ
        return { ...state, sub: { kind: "menu" } };
      }
      return state;
  }

  return state;
}
```

- [ ] **Step C5.2: reduce.ts に training を分離**

```typescript
// 既存 placeholder ケースから training を抜き、専用 reducer へ
import { reduceTraining } from "./reduceTraining";

case "training":
  return reduceTraining(state, event);

case "utilities":
case "maze":
case "tavern":  // ← Phase E までは placeholder のまま
case "boltac":  // ← Phase F まで
case "temple":
case "inn":     // ← Phase G まで
  return reducePlaceholder(state, event);
```

(Phase E〜G で順次 placeholder から外す)

- [ ] **Step C5.3: テスト**

```bash
pnpm test reduceTraining
pnpm typecheck
```

期待: 既存 placeholder テストが training を期待していなければ PASS

- [ ] **Step C5.4: コミット**

```bash
git add src/engine/state/reduceTraining.ts src/engine/state/reduce.ts tests/engine/state/reduceTraining.test.ts
git commit -m "feat(engine): training reducer with creating-step state machine"
```

---

## Phase D: Training Grounds 画面 (P50: 1.5 日)

> Training は M3 の中で最も画面数が多く UI が複雑。各画面はキャラ作成のステップに対応。

### Task D1: Training/index.tsx を画面ルータに

**Files:**
- Modify: `src/screens/Training/index.tsx`
- Create: `src/screens/Training/Training.css`

- [ ] **Step D1.1: index.tsx をルータ化**

```typescript
// src/screens/Training/index.tsx
import { useGameStore } from "@/store/gameStore";
import { CharacterInspect } from "./CharacterInspect";
import { CharacterList } from "./CharacterList";
import { CreateAlignment } from "./CreateAlignment";
import { CreateAttributes } from "./CreateAttributes";
import { CreateClass } from "./CreateClass";
import { CreateConfirm } from "./CreateConfirm";
import { CreateName } from "./CreateName";
import { CreateRace } from "./CreateRace";
import { DeleteConfirm } from "./DeleteConfirm";
import "./Training.css";

export function Training() {
  const sub = useGameStore((s) => (s.state.phase === "training" ? s.state.sub : null));
  if (!sub) return null;

  switch (sub.kind) {
    case "menu":
      return <CharacterList />;
    case "inspecting":
      return <CharacterInspect characterId={sub.characterId} />;
    case "deleteConfirm":
      return <DeleteConfirm characterId={sub.characterId} />;
    case "creating":
      switch (sub.step) {
        case "name":
          return <CreateName draft={sub.draft} />;
        case "race":
          return <CreateRace draft={sub.draft} />;
        case "alignment":
          return <CreateAlignment draft={sub.draft} />;
        case "rollAttributes":
        case "allocateBonus":
          return <CreateAttributes draft={sub.draft} step={sub.step} />;
        case "pickClass":
          return <CreateClass draft={sub.draft} />;
        case "confirm":
          return <CreateConfirm draft={sub.draft} />;
      }
  }
}
```

- [ ] **Step D1.2: 共通 CSS**

```css
/* src/screens/Training/Training.css */
.training-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.training-input {
  background: var(--color-bg);
  color: var(--color-fg);
  border: var(--vp) solid var(--color-fg);
  font-family: inherit;
  font-size: var(--font-size-glyph);
  padding: calc(1 * var(--vp)) calc(2 * var(--vp));
  width: calc(20 * var(--vp));
}

.attribute-row {
  display: flex;
  align-items: center;
  gap: calc(2 * var(--vp));
  font-size: var(--font-size-glyph);
}
```

### Task D2: CharacterList 画面 (ロスター + メニュー)

**Files:**
- Create: `src/screens/Training/CharacterList.tsx`

- [ ] **Step D2.1: 実装**

```typescript
// src/screens/Training/CharacterList.tsx
import { useEffect, useState } from "react";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CharacterList() {
  const t = useT();
  const lang = useGameStore((s) => s.lang); // 言語切替で再描画
  const [roster, setRoster] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setRoster); // M3 ではスロット ID = 1 固定 (M5 で動的に)
  }, [lang]);

  const items = [
    {
      hotkey: "C",
      label: t("training.menu.create"),
      onSelect: () => dispatch({ type: "startCreate" }),
    },
    ...roster.flatMap((c, idx) => [
      {
        hotkey: String(idx + 1),
        label: `${c.name}  L${c.status.level} ${c.race} ${c.class}`,
        onSelect: () => dispatch({ type: "inspectCharacter", characterId: c.id }),
      },
    ]),
    {
      hotkey: "B",
      label: t("common.back"),
      onSelect: () => dispatch({ type: "goBack" }),
    },
  ];

  return (
    <div className="menu-screen">
      <Frame title={t("training.title")}>
        {roster.length === 0 && <p>{t("training.empty")}</p>}
        <Menu items={items} />
      </Frame>
    </div>
  );
}
```

### Task D3: CreateName 画面 (テキスト入力)

**Files:**
- Create: `src/screens/Training/CreateName.tsx`

- [ ] **Step D3.1: 実装**

```typescript
// src/screens/Training/CreateName.tsx
import { useState } from "react";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateName({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  const [name, setName] = useState(draft.name);

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.name.title")}>
        <p>{t("training.create.name.prompt")}</p>
        <input
          type="text"
          className="training-input"
          maxLength={8}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              dispatch({ type: "inputName", name: name.trim() });
            }
          }}
          // biome-ignore lint/a11y/noAutofocus: this is the only input on the screen
          autoFocus
        />
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: () =>
                name.trim() && dispatch({ type: "inputName", name: name.trim() }),
              disabled: !name.trim(),
            },
            {
              hotkey: "C",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D4: CreateRace 画面

**Files:**
- Create: `src/screens/Training/CreateRace.tsx`

- [ ] **Step D4.1: 実装**

```typescript
// src/screens/Training/CreateRace.tsx
import { RACE_IDS } from "@/engine/data/races";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const HOTKEYS: Record<string, string> = {
  human: "H",
  elf: "E",
  dwarf: "D",
  gnome: "G",
  hobbit: "O",
};

export function CreateRace({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.race.title")}>
        <p>
          {t("training.create.race.prompt", { name: draft.name })}
        </p>
        <Menu
          items={[
            ...RACE_IDS.map((id) => ({
              hotkey: HOTKEYS[id] ?? id[0]!.toUpperCase(),
              label: t(`race.${id}` as never),
              onSelect: () => dispatch({ type: "pickRace", race: id }),
            })),
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D5: CreateAlignment 画面

**Files:**
- Create: `src/screens/Training/CreateAlignment.tsx`

- [ ] **Step D5.1: 実装**

```typescript
// src/screens/Training/CreateAlignment.tsx
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateAlignment({ draft: _draft }: { draft: CharacterDraft }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.alignment.title")}>
        <Menu
          items={[
            {
              hotkey: "G",
              label: t("alignment.good"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "good" }),
            },
            {
              hotkey: "N",
              label: t("alignment.neutral"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "neutral" }),
            },
            {
              hotkey: "E",
              label: t("alignment.evil"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "evil" }),
            },
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D6: CreateAttributes 画面 (ロール + 振り分け)

**Files:**
- Create: `src/screens/Training/CreateAttributes.tsx`

- [ ] **Step D6.1: 実装**

`step` を prop として受け取り、`rollAttributes` ステップでは Roll ボタン、`allocateBonus` では振り分け UI を表示する (reference equality バグ回避)。Roll ボタン押下時は **UI 側で mulberry32 に Date.now をシードして bonus を算出**し、`attributesRolled` event を dispatch する (reducer は純関数のまま)。

```typescript
// src/screens/Training/CreateAttributes.tsx
import { RACES } from "@/engine/data/races";
import { rollBonus } from "@/engine/rules/character";
import { mulberry32 } from "@/engine/rng/mulberry32";
import type { AttributeKey, CharacterDraft, CreatingStep } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const ATTR_KEYS: AttributeKey[] = ["str", "iq", "pie", "vit", "agi", "luk"];

function freshSeed(): number {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function rollFor(draft: CharacterDraft): { attributes: typeof draft.baseAttributes; bonus: number } {
  const rng = mulberry32(freshSeed());
  const base = RACES[draft.race].base;
  return { attributes: { ...base }, bonus: rollBonus(rng) };
}

export function CreateAttributes({ draft, step }: { draft: CharacterDraft; step: CreatingStep }) {
  const t = useT();

  if (step === "rollAttributes") {
    return (
      <div className="menu-screen">
        <Frame title={t("training.create.roll.title")}>
          <p>{t("training.create.roll.prompt")}</p>
          <Menu
            items={[
              {
                hotkey: "R",
                label: t("training.create.roll.action"),
                onSelect: () => {
                  const { attributes, bonus } = rollFor(draft);
                  dispatch({ type: "attributesRolled", attributes, bonus });
                },
              },
              {
                hotkey: "X",
                label: t("common.cancel"),
                onSelect: () => dispatch({ type: "cancelCreate" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.allocate.title")}>
        <p>
          {t("training.create.allocate.remaining", {
            n: draft.bonusPointsRemaining,
          })}
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {ATTR_KEYS.map((k) => (
            <li key={k} className="attribute-row">
              <span style={{ width: "calc(4 * var(--vp))" }}>
                {t(`attribute.${k}` as never)}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "allocateBonus", attribute: k, delta: -1 })}
              >
                -
              </button>
              <span style={{ width: "calc(3 * var(--vp))", textAlign: "center" }}>
                {draft.attributes[k]}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "allocateBonus", attribute: k, delta: 1 })}
              >
                +
              </button>
            </li>
          ))}
        </ul>
        <Menu
          items={[
            {
              hotkey: "R",
              label: t("training.create.allocate.reroll"),
              onSelect: () => {
                const { attributes, bonus } = rollFor(draft);
                dispatch({ type: "attributesRolled", attributes, bonus });
              },
            },
            {
              hotkey: "O",
              label: t("training.create.allocate.proceed"),
              onSelect: () => dispatch({ type: "pickClass", klass: "fighter" }),
              // proceed は次画面 (CreateClass) に行くだけ。実際の class 選択はそこで
              // 一時的に "fighter" を渡しているのは reducer が pickClass で次に進む合図にする実装上の都合。
              // → やめて、専用 "proceedToClass" event を追加する方が綺麗 (Task D6.2 で修正)
              disabled: draft.bonusPointsRemaining > 0,
            },
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step D6.2: proceedToClass イベントを追加 (D6.1 の "fighter" hack を解消)**

`types.ts` に追加:

```typescript
| { type: "proceedToClass" }
```

`reduceTraining.ts` の `allocateBonus` 段階に追加:

```typescript
if (event.type === "proceedToClass" && sub.draft.bonusPointsRemaining === 0) {
  return { ...state, sub: { kind: "creating", step: "pickClass", draft: sub.draft } };
}
```

`CreateAttributes.tsx` の "proceed" ボタンを修正:

```typescript
{
  hotkey: "O",
  label: t("training.create.allocate.proceed"),
  onSelect: () => dispatch({ type: "proceedToClass" }),
  disabled: draft.bonusPointsRemaining > 0,
},
```

### Task D7: CreateClass 画面 (資格のある職業のみ)

**Files:**
- Create: `src/screens/Training/CreateClass.tsx`

- [ ] **Step D7.1: 実装**

```typescript
// src/screens/Training/CreateClass.tsx
import { eligibleClasses } from "@/engine/rules/character";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateClass({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  const eligible = eligibleClasses(draft.attributes, draft.alignment);

  if (eligible.length === 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("training.create.class.title")}>
          <p>{t("training.create.class.noneEligible")}</p>
          <Menu
            items={[
              {
                hotkey: "R",
                label: t("training.create.allocate.reroll"),
                onSelect: () => dispatch({ type: "rollAttributes" }),
              },
              {
                hotkey: "X",
                label: t("common.cancel"),
                onSelect: () => dispatch({ type: "cancelCreate" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.class.title")}>
        <Menu
          items={[
            ...eligible.map((cid, i) => ({
              hotkey: String(i + 1),
              label: t(`class.${cid}` as never),
              onSelect: () => dispatch({ type: "pickClass", klass: cid }),
            })),
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D8: CreateConfirm (UI 直接 db 呼出)

**Files:**
- Create: `src/screens/Training/CreateConfirm.tsx`

> **設計判断**: bindEffect は state diff ベースで `confirmCharacter` (Yes) と `cancelCreate` (No) のいずれも `step: confirm → menu` 遷移になり区別できない。**addCharacter は UI 側で直接 db を呼ぶ** (DeleteConfirm/Boltac と同じパターン)。Effect.addCharacter は導入しない。

- [ ] **Step D8.3: CreateConfirm.tsx**

```typescript
// src/screens/Training/CreateConfirm.tsx
import { makeCharacterFromDraft } from "@/engine/rules/character";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const SLOT_ID = 1; // M3 では固定 (M5 で動的)

export function CreateConfirm({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.confirm.title")}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            {t("common.label.name")}: {draft.name}
          </li>
          <li>
            {t("common.label.race")}: {t(`race.${draft.race}` as never)}
          </li>
          <li>
            {t("common.label.alignment")}: {t(`alignment.${draft.alignment}` as never)}
          </li>
          <li>
            {t("common.label.class")}:{" "}
            {draft.selectedClass ? t(`class.${draft.selectedClass}` as never) : ""}
          </li>
        </ul>
        <Menu
          items={[
            {
              hotkey: "Y",
              label: t("common.yes"),
              onSelect: async () => {
                try {
                  const c = makeCharacterFromDraft(draft, SLOT_ID, Date.now());
                  await db.addCharacter(c);
                  dispatch({ type: "confirmCharacter" });
                } catch (err) {
                  console.error("addCharacter failed", err);
                  dispatch({ type: "cancelCreate" });
                }
              },
            },
            {
              hotkey: "N",
              label: t("common.no"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D9: CharacterInspect 画面 (詳細表示)

**Files:**
- Create: `src/screens/Training/CharacterInspect.tsx`

- [ ] **Step D9.1: 実装**

```typescript
// src/screens/Training/CharacterInspect.tsx
import { useEffect, useState } from "react";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CharacterInspect({ characterId }: { characterId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(characterId).then(setC);
  }, [characterId]);

  if (!c) return <p>{t("common.loading")}</p>;
  const a = c.attributes;

  return (
    <div className="menu-screen">
      <Frame title={c.name}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            L{c.status.level} {t(`race.${c.race}` as never)} {t(`class.${c.class}` as never)}
          </li>
          <li>
            {t("common.label.alignment")}: {t(`alignment.${c.alignment}` as never)}
          </li>
          <li>
            HP: {c.status.hp}/{c.status.hpMax}
          </li>
          <li>
            STR {a.str} IQ {a.iq} PIE {a.pie} VIT {a.vit} AGI {a.agi} LUK {a.luk}
          </li>
          <li>
            AC {c.status.ac} Gold {c.status.gold} Age {c.status.age}
          </li>
        </ul>
        <Menu
          items={[
            {
              hotkey: "D",
              label: t("training.menu.delete"),
              onSelect: () => dispatch({ type: "deleteCharacter", characterId }),
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "closeInspect" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

### Task D10: DeleteConfirm 画面

**Files:**
- Create: `src/screens/Training/DeleteConfirm.tsx`
- Modify: `src/engine/effects/orchestrator.ts` — confirmDelete 用エフェクト

- [ ] **Step D10.1: Effect に deleteCharacter を追加**

```typescript
// types.ts
| { type: "deleteCharacter"; characterId: CharacterId }

// orchestrator.ts bindEffect: deleteConfirm → menu に戻った瞬間 + イベントが confirmDelete か検出
// シンプルな方法: reducer 側で deleteConfirm から menu への遷移時にエフェクトを decode するために
// confirmDelete のときだけ削除する設計が必要。reducer に「削除予約」フラグを sub に持たせる。
```

> **設計補足**: confirmDelete と cancelDelete の両方が `menu` に戻るため、bindEffect で区別できない。解決:
>
> 1. `deleteConfirm` sub に `pending` フラグを足す → 複雑
> 2. reducer ではなく、UI コンポーネント側で `db.deleteCharacter` を直接呼んで dispatch する → 簡単
>
> 簡単な方を採用: `DeleteConfirm.tsx` で直接 `db.deleteCharacter` を呼んでから dispatch する。

- [ ] **Step D10.2: DeleteConfirm.tsx**

```typescript
// src/screens/Training/DeleteConfirm.tsx
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function DeleteConfirm({ characterId }: { characterId: number }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.delete.title")}>
        <p>{t("training.delete.body")}</p>
        <Menu
          items={[
            {
              hotkey: "Y",
              label: t("common.yes"),
              onSelect: async () => {
                await db.deleteCharacter(characterId);
                dispatch({ type: "confirmDelete" });
              },
            },
            {
              hotkey: "N",
              label: t("common.no"),
              onSelect: () => dispatch({ type: "cancelDelete" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

> 注: ここで `await` に伴う dispatch は input queue ロックを経由しない直接呼出になる。UI ハンドラから副作用→dispatch のパターンは設計書 Section 4 の "副作用 Orchestration" に従い `effects/orchestrator.ts` で扱うのが理想だが、削除確定は単純なため UI 側で扱う割り切り (Plan で要レビュー)。

### Task D11: Training E2E スモークテスト

**Files:**
- Create: `tests/screens/Training.test.tsx`

- [ ] **Step D11.1: テスト**

```typescript
// tests/screens/Training.test.tsx
import { App } from "@/App";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { gameStore } from "@/store/gameStore";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

describe("<Training>", () => {
  beforeEach(() => {
    cleanup();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    gameStore.setState({
      state: { phase: "training", sub: { kind: "menu" }, party: EMPTY_PARTY } as GameState,
      lang: "en",
      isAnimating: false,
      isBusy: false,
      inputQueue: [],
    });
  });

  it("renders character list with empty roster initially", async () => {
    render(<App />);
    expect(await screen.findByText(/No characters yet/i)).toBeInTheDocument();
  });

  it("Create starts the creation flow at name input", async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Create new character/i));
    expect(await screen.findByText(/Enter name/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step D11.2: 動作確認 + コミット**

```bash
pnpm test Training
pnpm lint && pnpm typecheck
git add src/screens/Training tests/screens/Training.test.tsx src/engine
git commit -m "feat(screens): Training Grounds with full character creation flow"
```

---

## Phase E: Tavern (P50: 0.5 日)

### Task E1: reduceTavern + テスト

**Files:**
- Create: `src/engine/state/reduceTavern.ts`
- Create: `tests/engine/state/reduceTavern.test.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step E1.1: テスト**

```typescript
// tests/engine/state/reduceTavern.test.ts
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "tavern",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("tavern reducer", () => {
  it("openAddMember moves to addMember sub", () => {
    const next = reduce(init, { type: "openAddMember" });
    expect(next).toEqual({
      ...init,
      sub: { kind: "addMember", rosterIds: [] },
    });
  });

  it("addToParty places character at given slot and returns to menu", () => {
    const inAdd: GameState = {
      ...init,
      sub: { kind: "addMember", rosterIds: [10, 11] },
    };
    const next = reduce(inAdd, { type: "addToParty", characterId: 10, slot: 0 });
    if (next.phase !== "tavern") throw new Error();
    expect(next.party.members[0]).toBe(10);
    expect(next.sub).toEqual({ kind: "menu" });
  });

  it("removeFromParty clears slot", () => {
    const filled: GameState = {
      ...init,
      party: { ...EMPTY_PARTY, members: [10, null, null, null, null, null] },
    };
    const next = reduce(filled, { type: "removeFromParty", slot: 0 });
    if (next.phase !== "tavern") throw new Error();
    expect(next.party.members[0]).toBeNull();
  });

  it("leaveTavern returns to castle", () => {
    expect(reduce(init, { type: "leaveTavern" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("goBack also returns to castle (alias for leaveTavern)", () => {
    expect(reduce(init, { type: "goBack" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step E1.2: 実装**

```typescript
// src/engine/state/reduceTavern.ts
import type { GameEvent, GameState } from "./types";

export function reduceTavern(
  state: Extract<GameState, { phase: "tavern" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "openAddMember":
        return { ...state, sub: { kind: "addMember", rosterIds: [] } };
      case "removeFromParty": {
        const next = [...party.members];
        next[event.slot] = null;
        return { ...state, party: { ...party, members: next } };
      }
      case "inspectMember":
        return { ...state, sub: { kind: "inspecting", slot: event.slot } };
      case "leaveTavern":
      case "goBack":
        return { phase: "castle", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "addMember") {
    if (event.type === "addToParty") {
      const next = [...party.members];
      next[event.slot] = event.characterId;
      return {
        ...state,
        sub: { kind: "menu" },
        party: { ...party, members: next },
      };
    }
    if (event.type === "closeAddMember") {
      return { ...state, sub: { kind: "menu" } };
    }
    return state;
  }

  if (sub.kind === "inspecting") {
    if (event.type === "closeInspect") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
```

- [ ] **Step E1.3: reduce.ts に反映**

```typescript
import { reduceTavern } from "./reduceTavern";

case "tavern":
  return reduceTavern(state, event);
```

placeholder ケースから tavern を除外。

- [ ] **Step E1.4: テスト + コミット**

```bash
pnpm test reduceTavern
git add src/engine tests/engine/state/reduceTavern.test.ts
git commit -m "feat(engine): tavern reducer for party formation"
```

### Task E2: Tavern 画面

**Files:**
- Modify: `src/screens/Tavern/index.tsx`
- Create: `src/screens/Tavern/TavernMenu.tsx`
- Create: `src/screens/Tavern/AddMember.tsx`

- [ ] **Step E2.1: index.tsx を ルータ化**

```typescript
// src/screens/Tavern/index.tsx
import { useGameStore } from "@/store/gameStore";
import { AddMember } from "./AddMember";
import { TavernMenu } from "./TavernMenu";

export function Tavern() {
  const sub = useGameStore((s) => (s.state.phase === "tavern" ? s.state.sub : null));
  if (!sub) return null;
  if (sub.kind === "addMember") return <AddMember rosterIds={sub.rosterIds} />;
  return <TavernMenu />;
}
```

- [ ] **Step E2.2: TavernMenu.tsx — パーティ表示 + Add/Remove メニュー**

```typescript
// src/screens/Tavern/TavernMenu.tsx
import { useEffect, useState } from "react";
import type { Character, SlotIndex } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function TavernMenu() {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "tavern" ? s.state.party : null));
  const [chars, setChars] = useState<Map<number, Character>>(new Map());

  useEffect(() => {
    db.listCharacters(1).then((list) => {
      setChars(new Map(list.map((c) => [c.id, c])));
    });
  }, []);

  if (!party) return null;

  const items = [
    {
      hotkey: "A",
      label: t("tavern.menu.addMember"),
      onSelect: () => dispatch({ type: "openAddMember" }),
    },
    ...party.members.flatMap((memberId, slot) => {
      if (memberId === null) return [];
      const c = chars.get(memberId);
      if (!c) return [];
      return [
        {
          hotkey: String(slot + 1),
          label: `${slot + 1}: ${c.name} L${c.status.level} ${c.race} ${c.class} (R)emove`,
          onSelect: () => dispatch({ type: "removeFromParty", slot: slot as SlotIndex }),
        },
      ];
    }),
    {
      hotkey: "B",
      label: t("common.back"),
      onSelect: () => dispatch({ type: "leaveTavern" }),
    },
  ];

  return (
    <div className="menu-screen">
      <Frame title={t("tavern.title")}>
        <Menu items={items} />
      </Frame>
    </div>
  );
}
```

- [ ] **Step E2.3: AddMember.tsx — 利用可能なキャラ一覧から選んでパーティへ**

```typescript
// src/screens/Tavern/AddMember.tsx
import { useEffect, useState } from "react";
import type { Character, SlotIndex } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function AddMember({ rosterIds: _ }: { rosterIds: number[] }) {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "tavern" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;

  // 既にパーティにいるキャラを除外
  const available = chars.filter((c) => !party.members.includes(c.id));
  // 空いているスロット
  const firstFreeSlot = party.members.findIndex((m) => m === null);

  const items =
    firstFreeSlot < 0
      ? [
          {
            hotkey: "B",
            label: t("tavern.partyFull"),
            onSelect: () => dispatch({ type: "closeAddMember" }),
          },
        ]
      : [
          ...available.map((c, i) => ({
            hotkey: String(i + 1),
            label: `${c.name} L${c.status.level} ${c.race} ${c.class}`,
            onSelect: () =>
              dispatch({
                type: "addToParty",
                characterId: c.id,
                slot: firstFreeSlot as SlotIndex,
              }),
          })),
          {
            hotkey: "B",
            label: t("common.back"),
            onSelect: () => dispatch({ type: "closeAddMember" }),
          },
        ];

  return (
    <div className="menu-screen">
      <Frame title={t("tavern.addMember.title")}>
        {available.length === 0 && firstFreeSlot >= 0 && (
          <p>{t("tavern.addMember.noneAvailable")}</p>
        )}
        <Menu items={items} />
      </Frame>
    </div>
  );
}
```

- [ ] **Step E2.4: テスト + コミット**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add src/screens/Tavern src/engine
git commit -m "feat(screens): Tavern with party add/remove"
```

---

## Phase F: Boltac (P50: 0.7 日)

### Task F1: rules/inventory.ts (純関数)

**Files:**
- Create: `src/engine/rules/inventory.ts`
- Create: `tests/engine/rules/inventory.test.ts`

- [ ] **Step F1.1: テスト**

```typescript
// tests/engine/rules/inventory.test.ts
import { ITEMS } from "@/engine/data/items";
import { addItem, calcSellPrice, removeItem } from "@/engine/rules/inventory";
import { describe, expect, it } from "vitest";

describe("inventory rules", () => {
  it("addItem appends a fresh entry", () => {
    const next = addItem([], "longSword");
    expect(next).toHaveLength(1);
    expect(next[0]).toEqual({
      itemId: "longSword",
      identified: true,
      cursed: false,
      equipped: false,
    });
  });

  it("removeItem removes by index", () => {
    const inv = addItem(addItem([], "longSword"), "dagger");
    const next = removeItem(inv, 0);
    expect(next).toHaveLength(1);
    expect(next[0]?.itemId).toBe("dagger");
  });

  it("calcSellPrice returns half of cost (rounded down)", () => {
    expect(calcSellPrice("longSword")).toBe(Math.floor(ITEMS.longSword.cost * 0.5));
    expect(calcSellPrice("plateMail")).toBe(Math.floor(ITEMS.plateMail.cost * 0.5));
  });
});
```

- [ ] **Step F1.2: 実装**

```typescript
// src/engine/rules/inventory.ts
import { ITEMS, type ItemId, SELL_RATIO } from "@/engine/data/items";
import type { InventoryItem } from "@/engine/state/types";

export function addItem(inv: InventoryItem[], itemId: ItemId): InventoryItem[] {
  return [...inv, { itemId, identified: true, cursed: false, equipped: false }];
}

export function removeItem(inv: InventoryItem[], index: number): InventoryItem[] {
  return inv.filter((_, i) => i !== index);
}

export function calcSellPrice(itemId: ItemId): number {
  return Math.floor(ITEMS[itemId].cost * SELL_RATIO);
}
```

- [ ] **Step F1.3: テスト + コミット**

```bash
pnpm test inventory
git add src/engine/rules/inventory.ts tests/engine/rules/inventory.test.ts
git commit -m "feat(rules): inventory add/remove + sell price calc"
```

### Task F2: reduceBoltac + テスト

**Files:**
- Create: `src/engine/state/reduceBoltac.ts`
- Create: `tests/engine/state/reduceBoltac.test.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step F2.1: テスト**

```typescript
// tests/engine/state/reduceBoltac.test.ts
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "boltac",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("boltac reducer (state transitions only; mutations via effects)", () => {
  it("openBuy → pickBuyer with mode=buy", () => {
    expect(reduce(init, { type: "openBuy" })).toEqual({
      ...init,
      sub: { kind: "pickBuyer", mode: "buy" },
    });
  });

  it("openSell → pickBuyer with mode=sell", () => {
    expect(reduce(init, { type: "openSell" })).toEqual({
      ...init,
      sub: { kind: "pickBuyer", mode: "sell" },
    });
  });

  it("pickBuyer (buy mode) → buyList", () => {
    const at: GameState = { ...init, sub: { kind: "pickBuyer", mode: "buy" } };
    expect(reduce(at, { type: "pickBuyer", characterId: 5 })).toEqual({
      ...init,
      sub: { kind: "buyList", buyer: 5 },
    });
  });

  it("pickBuyer (sell mode) → sellList", () => {
    const at: GameState = { ...init, sub: { kind: "pickBuyer", mode: "sell" } };
    expect(reduce(at, { type: "pickBuyer", characterId: 5 })).toEqual({
      ...init,
      sub: { kind: "sellList", seller: 5 },
    });
  });

  it("leaveBoltac → castle", () => {
    expect(reduce(init, { type: "leaveBoltac" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step F2.2: 実装**

```typescript
// src/engine/state/reduceBoltac.ts
import type { GameEvent, GameState } from "./types";

export function reduceBoltac(
  state: Extract<GameState, { phase: "boltac" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "openBuy":
        return { ...state, sub: { kind: "pickBuyer", mode: "buy" } };
      case "openSell":
        return { ...state, sub: { kind: "pickBuyer", mode: "sell" } };
      case "leaveBoltac":
      case "goBack":
        return { phase: "castle", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "pickBuyer") {
    if (event.type === "pickBuyer") {
      return {
        ...state,
        sub:
          sub.mode === "buy"
            ? { kind: "buyList", buyer: event.characterId }
            : { kind: "sellList", seller: event.characterId },
      };
    }
    if (event.type === "leaveBoltac") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "buyList" || sub.kind === "sellList") {
    // 実購入/売却は副作用 (db.updateCharacter + party.gold 更新) で処理
    // reducer は遷移のみ。完了後は menu に戻す
    if (event.type === "buyItem" || event.type === "sellItem") {
      return { ...state, sub: { kind: "menu" } };
    }
    if (event.type === "leaveBoltac") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
```

- [ ] **Step F2.3: reduce.ts に反映 + Boltac の placeholder ルートを外す**

```typescript
import { reduceBoltac } from "./reduceBoltac";
case "boltac":
  return reduceBoltac(state, event);
```

- [ ] **Step F2.4: テスト + コミット**

```bash
pnpm test reduceBoltac
git add src/engine
git commit -m "feat(engine): boltac reducer for buy/sell flow"
```

### Task F3: 副作用 (購入・売却) の orchestrator 拡張

**Files:**
- Modify: `src/engine/effects/orchestrator.ts`
- Modify: `src/engine/state/types.ts` — Effect に buyItem / sellItem 追加

- [ ] **Step F3.1: types.ts**

```typescript
export type Effect =
  | { type: "load"; slotId: SaveSlotId }
  | { type: "addCharacter"; draft: CharacterDraft; slotId: number }
  | { type: "buyItem"; characterId: number; itemId: ItemId }
  | { type: "sellItem"; characterId: number; itemIndex: number };
```

- [ ] **Step F3.2: bindEffect 拡張**

```typescript
// boltac の buyList → menu 遷移を検知し、event が buyItem だった場合のみ副作用発火
// 設計補足: bindEffect は state pair しか受けないため、event を直接見れない。
// → reducer 側で「最後の event」を sub に保持する手か、bindEffect に event も渡すか。
// もっとシンプル: UI ハンドラから直接 db を呼んで dispatch する (DeleteConfirm と同じパターン)
```

> **設計補足 (重要)**: 副作用 Orchestration は state diff ベースなので、reducer が同じ next state を返すと event の違いを検知できない。Boltac 購入/売却は **UI コンポーネント側で直接 db 操作 + party 更新を行う** 割り切り (DeleteConfirm と同じ)。orchestrator 経由は addCharacter のみ。
>
> Plan で要レビュー: 一貫性のため orchestrator 経由に統一すべきか、簡易な側で割り切るべきか。M3 は「割り切り」で進め、M4 以降で必要なら refactor。

- [ ] **Step F3.3: 説明コメントを orchestrator.ts に追加**

```typescript
// src/engine/effects/orchestrator.ts に追記
//
// 副作用パターン:
// 1. orchestrator 経由 (state 遷移のみで判定可能なもの): load, addCharacter
// 2. UI コンポーネント直 (event ごとに固有処理が必要なもの): deleteCharacter, buyItem,
//    sellItem, restStables (M3)
//
// (2) は dispatch 前後でコンポーネント内で副作用を実行する。M3 では割り切りとして
// この方針を採用。M4 以降で event-aware orchestrator に refactor 予定。
```

### Task F4: Boltac 画面

**Files:**
- Modify: `src/screens/Boltac/index.tsx`
- Create: `src/screens/Boltac/BoltacMenu.tsx`
- Create: `src/screens/Boltac/BuyerPick.tsx`
- Create: `src/screens/Boltac/BuyList.tsx`
- Create: `src/screens/Boltac/SellList.tsx`

- [ ] **Step F4.1: index.tsx ルータ**

```typescript
// src/screens/Boltac/index.tsx
import { useGameStore } from "@/store/gameStore";
import { BoltacMenu } from "./BoltacMenu";
import { BuyerPick } from "./BuyerPick";
import { BuyList } from "./BuyList";
import { SellList } from "./SellList";

export function Boltac() {
  const sub = useGameStore((s) => (s.state.phase === "boltac" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <BoltacMenu />;
    case "pickBuyer":
      return <BuyerPick mode={sub.mode} />;
    case "buyList":
      return <BuyList buyerId={sub.buyer} />;
    case "sellList":
      return <SellList sellerId={sub.seller} />;
  }
}
```

- [ ] **Step F4.2: BoltacMenu.tsx**

```typescript
// src/screens/Boltac/BoltacMenu.tsx
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BoltacMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("boltac.title")}>
        <Menu
          items={[
            { hotkey: "B", label: t("boltac.menu.buy"), onSelect: () => dispatch({ type: "openBuy" }) },
            { hotkey: "S", label: t("boltac.menu.sell"), onSelect: () => dispatch({ type: "openSell" }) },
            { hotkey: "X", label: t("common.back"), onSelect: () => dispatch({ type: "leaveBoltac" }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step F4.3: BuyerPick.tsx**

パーティから誰が買う/売るか選ぶ。

```typescript
// src/screens/Boltac/BuyerPick.tsx
import { useEffect, useState } from "react";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BuyerPick({ mode }: { mode: "buy" | "sell" }) {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "boltac" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;
  const inParty = chars.filter((c) => party.members.includes(c.id));

  return (
    <div className="menu-screen">
      <Frame title={mode === "buy" ? t("boltac.pickBuyer.title.buy") : t("boltac.pickBuyer.title.sell")}>
        <Menu
          items={[
            ...inParty.map((c, i) => ({
              hotkey: String(i + 1),
              label: `${c.name}  ${c.status.gold} GP`,
              onSelect: () => dispatch({ type: "pickBuyer", characterId: c.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveBoltac" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step F4.4: BuyList.tsx — 購入処理 (UI 側で db 直)**

```typescript
// src/screens/Boltac/BuyList.tsx
import { useEffect, useState } from "react";
import { ITEMS, type ItemId } from "@/engine/data/items";
import { addItem } from "@/engine/rules/inventory";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BuyList({ buyerId }: { buyerId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(buyerId).then(setC);
  }, [buyerId]);
  if (!c) return null;

  const items = (Object.keys(ITEMS) as ItemId[]).filter((id) =>
    ITEMS[id].allowedClasses.includes(c.class),
  );

  return (
    <div className="menu-screen">
      <Frame title={t("boltac.buy.title", { name: c.name, gold: c.status.gold })}>
        <Menu
          items={[
            ...items.map((id, i) => {
              const def = ITEMS[id];
              const affordable = c.status.gold >= def.cost;
              return {
                hotkey: String(i + 1),
                label: `${t(`item.${id}` as never)}  ${def.cost} GP`,
                disabled: !affordable,
                onSelect: async () => {
                  if (!affordable) return;
                  const updated: Character = {
                    ...c,
                    status: { ...c.status, gold: c.status.gold - def.cost },
                    inventory: addItem(c.inventory, id),
                  };
                  await db.updateCharacter(updated);
                  dispatch({ type: "buyItem", itemId: id });
                },
              };
            }),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveBoltac" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step F4.5: SellList.tsx — 売却処理**

```typescript
// src/screens/Boltac/SellList.tsx
import { useEffect, useState } from "react";
import { calcSellPrice, removeItem } from "@/engine/rules/inventory";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SellList({ sellerId }: { sellerId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(sellerId).then(setC);
  }, [sellerId]);
  if (!c) return null;

  return (
    <div className="menu-screen">
      <Frame title={t("boltac.sell.title", { name: c.name, gold: c.status.gold })}>
        <Menu
          items={[
            ...c.inventory.map((it, i) => ({
              hotkey: String(i + 1),
              label: `${t(`item.${it.itemId}` as never)}  ${calcSellPrice(it.itemId)} GP`,
              disabled: it.equipped,
              onSelect: async () => {
                const price = calcSellPrice(it.itemId);
                const updated: Character = {
                  ...c,
                  status: { ...c.status, gold: c.status.gold + price },
                  inventory: removeItem(c.inventory, i),
                };
                await db.updateCharacter(updated);
                dispatch({ type: "sellItem", itemIndex: i });
              },
            })),
            {
              hotkey: "B",
              label: c.inventory.length === 0 ? t("boltac.sell.noItems") : t("common.back"),
              onSelect: () => dispatch({ type: "leaveBoltac" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step F4.6: コミット**

```bash
git add src/screens/Boltac
git commit -m "feat(screens): Boltac buy/sell with character gold and inventory mutation"
```

---

## Phase G: Inn (Stables のみ) (P50: 0.3 日)

### Task G1: reduceInn + テスト

**Files:**
- Create: `src/engine/state/reduceInn.ts`
- Create: `tests/engine/state/reduceInn.test.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step G1.1: テスト**

```typescript
// tests/engine/state/reduceInn.test.ts
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "inn",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("inn reducer", () => {
  it("openInnGuest → pickGuest", () => {
    expect(reduce(init, { type: "openInnGuest" })).toEqual({
      ...init,
      sub: { kind: "pickGuest" },
    });
  });

  it("pickGuest → rest sub-state", () => {
    const at: GameState = { ...init, sub: { kind: "pickGuest" } };
    expect(reduce(at, { type: "pickGuest", characterId: 7 })).toEqual({
      ...init,
      sub: { kind: "rest", guest: 7 },
    });
  });

  it("restStables (Stables: time only, no HP recovery) → menu", () => {
    const at: GameState = { ...init, sub: { kind: "rest", guest: 7 } };
    // reducer は遷移のみ。実際の age 加算は副作用
    expect(reduce(at, { type: "restStables" })).toEqual({
      ...init,
      sub: { kind: "menu" },
    });
  });

  it("leaveInn → castle", () => {
    expect(reduce(init, { type: "leaveInn" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step G1.2: 実装**

```typescript
// src/engine/state/reduceInn.ts
import type { GameEvent, GameState } from "./types";

export function reduceInn(
  state: Extract<GameState, { phase: "inn" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openInnGuest") return { ...state, sub: { kind: "pickGuest" } };
    if (event.type === "leaveInn" || event.type === "goBack") {
      return { phase: "castle", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "pickGuest") {
    if (event.type === "pickGuest") {
      return { ...state, sub: { kind: "rest", guest: event.characterId } };
    }
    if (event.type === "leaveInn") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "rest") {
    if (event.type === "restStables") return { ...state, sub: { kind: "menu" } };
    if (event.type === "leaveInn") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
```

- [ ] **Step G1.3: reduce.ts に反映**

```typescript
import { reduceInn } from "./reduceInn";
case "inn":
  return reduceInn(state, event);
```

- [ ] **Step G1.4: テスト + コミット**

```bash
pnpm test reduceInn
git add src/engine
git commit -m "feat(engine): inn reducer (Stables tier only for M3)"
```

### Task G2: Inn 画面

**Files:**
- Modify: `src/screens/Inn/index.tsx`
- Create: `src/screens/Inn/InnMenu.tsx`
- Create: `src/screens/Inn/PickGuest.tsx`
- Create: `src/screens/Inn/RestStables.tsx`

- [ ] **Step G2.1: index.tsx ルータ**

```typescript
// src/screens/Inn/index.tsx
import { useGameStore } from "@/store/gameStore";
import { InnMenu } from "./InnMenu";
import { PickGuest } from "./PickGuest";
import { RestStables } from "./RestStables";

export function Inn() {
  const sub = useGameStore((s) => (s.state.phase === "inn" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <InnMenu />;
    case "pickGuest":
      return <PickGuest />;
    case "rest":
      return <RestStables guest={sub.guest} />;
  }
}
```

- [ ] **Step G2.2: InnMenu.tsx**

```typescript
// src/screens/Inn/InnMenu.tsx
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function InnMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("inn.title")}>
        <Menu
          items={[
            { hotkey: "S", label: t("inn.menu.stay"), onSelect: () => dispatch({ type: "openInnGuest" }) },
            { hotkey: "B", label: t("common.back"), onSelect: () => dispatch({ type: "leaveInn" }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step G2.3: PickGuest.tsx**

```typescript
// src/screens/Inn/PickGuest.tsx
import { useEffect, useState } from "react";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function PickGuest() {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "inn" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;
  const inParty = chars.filter((c) => party.members.includes(c.id));

  if (inParty.length === 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("inn.pickGuest.title")}>
          <p>{t("inn.pickGuest.partyEmpty")}</p>
          <Menu items={[{ hotkey: "B", label: t("common.back"), onSelect: () => dispatch({ type: "leaveInn" }) }]} />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("inn.pickGuest.title")}>
        <Menu
          items={[
            ...inParty.map((c, i) => ({
              hotkey: String(i + 1),
              label: `${c.name}  HP ${c.status.hp}/${c.status.hpMax}`,
              onSelect: () => dispatch({ type: "pickGuest", characterId: c.id }),
            })),
            { hotkey: "B", label: t("common.back"), onSelect: () => dispatch({ type: "leaveInn" }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step G2.4: RestStables.tsx**

```typescript
// src/screens/Inn/RestStables.tsx
import { useEffect, useState } from "react";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function RestStables({ guest }: { guest: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(guest).then(setC);
  }, [guest]);
  if (!c) return null;

  return (
    <div className="menu-screen">
      <Frame title={t("inn.rest.title", { name: c.name })}>
        <p>{t("inn.rest.body")}</p>
        <Menu
          items={[
            {
              hotkey: "S",
              label: t("inn.rest.stables"),  // "Stables (Free) — time only"
              onSelect: async () => {
                // 1981 原典: Stables は HP 回復なし、年齢のみ加算 (Chapter 2 で年齢加算判定が意味を持つ)
                const updated: Character = {
                  ...c,
                  status: { ...c.status, restCount: c.status.restCount + 1 },
                };
                await db.updateCharacter(updated);
                dispatch({ type: "restStables" });
              },
            },
            { hotkey: "C", label: t("inn.rest.cot"),     onSelect: () => {}, disabled: true },
            { hotkey: "E", label: t("inn.rest.economy"), onSelect: () => {}, disabled: true },
            { hotkey: "M", label: t("inn.rest.merchant"), onSelect: () => {}, disabled: true },
            { hotkey: "R", label: t("inn.rest.royal"),   onSelect: () => {}, disabled: true },
            { hotkey: "B", label: t("common.back"),      onSelect: () => dispatch({ type: "leaveInn" }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

> 注: Stables は restCount を +1 するのみで HP 回復なし。Cot 以降は **Chapter 2 で経験値・レベルアップと一緒に実装** するため M3 では disabled で並べておく (UI 上に存在を示しておく)。

- [ ] **Step G2.3: コミット**

```bash
git add src/screens/Inn
git commit -m "feat(screens): Inn with Stables tier (time advances only)"
```

---

## Phase H: 統合 + i18n + デプロイ (P50: 0.5 日)

### Task H1: i18n メッセージ全追加

**Files:**
- Modify: `src/i18n/messages.ts`

- [ ] **Step H1.1: 全画面の文字列を追加 (en/ja 両方)**

種族・職業・属性・アライメント・アイテム・training/tavern/boltac/inn の全 UI 文字列。リスト省略 (実装中に必要なキーをチェックして拡充)。

主要キー:

```
race.{human,elf,dwarf,gnome,hobbit}
class.{fighter,mage,priest,thief,bishop,samurai,lord,ninja}
alignment.{good,neutral,evil}
attribute.{str,iq,pie,vit,agi,luk}
item.{longSword,shortSword,mace,staff,dagger,leatherArmor,...}
training.menu.create / training.menu.delete / training.empty
training.create.{name,race,alignment,roll,allocate,class,confirm}.{title,prompt,...}
training.delete.{title,body}
tavern.menu.addMember / tavern.partyFull / tavern.addMember.{title,noneAvailable}
boltac.menu.{buy,sell} / boltac.{pickBuyer,buy,sell}.title
inn.menu.{rest} / inn.pickGuest.title / inn.rest.{stables,cot,...}
common.{ok,cancel,yes,no,back,loading,label.{name,race,alignment,class}}
```

- [ ] **Step H1.2: コミット**

```bash
git add src/i18n/messages.ts
git commit -m "feat(i18n): add all M3 UI messages (en/ja)"
```

### Task H2: 統合テスト + デプロイ

- [ ] **Step H2.1: フル CI 同等チェック**

```bash
pnpm biome check --write src tests
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

期待: 全クリーン、bundle ~70 KB gzip 以内

- [ ] **Step H2.2: 開発サーバで E2E 手動チェック**

```bash
pnpm dev
```

確認手順:
- [ ] Title → New Game → Edge of Town → Training Grounds
- [ ] Create new character → 名前入力 → 種族 → 属性 → ロール → 振り分け → 職業 → 確認 → ロスター追加
- [ ] 別キャラを 5 体作って合計 6 体に
- [ ] Training menu でキャラ詳細表示・削除
- [ ] Edge of Town → Castle → Tavern → Add member で 6 人組成
- [ ] Castle → Boltac → Buy: メンバーを選んで装備購入 (gold 減・inventory 増)
- [ ] Castle → Boltac → Sell: 装備売却 (gold 増・inventory 減)
- [ ] Castle → Inn → Stables 休息 (age 加算のみ・HP 回復なしを確認)
- [ ] 全画面でカーソル ↑↓ + Enter / ホットキー / マウスが動く
- [ ] 言語切替 (EN/JA) で全テキストが切り替わる
- [ ] ブラウザリロードでロスターが永続化されている

### Task H3: CHANGELOG + README + デプロイ

- [ ] **Step H3.1: CHANGELOG.md** に M3 エントリ追加

(M2 の形式を踏襲)

- [ ] **Step H3.2: README.md** の進捗状況を更新 (M3 ✅)

- [ ] **Step H3.3: コミット + push**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: M3 release notes"
git push origin main
```

- [ ] **Step H3.4: GitHub Actions CI 成功を確認**

```bash
gh run watch --exit-status
```

- [ ] **Step H3.5: Vercel 本番動作確認**

`https://wizardry-proving-grounds.vercel.app` で M3 機能を再現確認。

---

## 完了基準 (Definition of Done for M3)

- [ ] 5 種族 × 8 職業 × 3 属性のキャラ作成が完成 (ボーナスロール、振り分け、職業フィルタ動作)
- [ ] ロスターが IndexedDB `character` objectStore に永続化
- [ ] Tavern でパーティ 6 人組成 (Add/Remove/Inspect)
- [ ] Boltac で 12 種の装備を売買 (gold・inventory 増減)
- [ ] Inn で Stables 休息 (age 加算のみ、HP 回復なし — 1981 原典準拠)
- [ ] 全画面でカーソル + ホットキー + マウス操作可
- [ ] EN/JA 切替が全画面で動作
- [ ] 全テスト PASS、CI が main で成功
- [ ] Vercel 本番に反映、URL で全フロー再現可能
- [ ] CHANGELOG/README 更新済み

完了したら次の Plan: `2026-XX-XX-chapter1-m4-maze-walking.md` (迷宮 1F 描画 + 歩行 + 1F 上り階段から脱出) を作成して進める。
