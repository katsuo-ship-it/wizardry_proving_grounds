# Wizardry Proving Grounds - Chapter 1 / M5 Temple Save & Restore Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 寺院 (Temple of Cant) でゲーム状態をセーブし、タイトルの "Continue" でロードできるようにする。Camp の Quit to Town で party を OUT 状態として記録し、Utilities の "Restart Out Party" で迷宮内最終位置から復帰できる。JSON エクスポート/インポートとプライベートブラウジング向けフォールバックを完備。

**Architecture:** IndexedDB の `saveSlot` と `character` を **単一トランザクション** で原子的に書き込み・読み出し (設計書 Section 6 「トランザクション制御」)。GameState の永続化は JSON シリアライズ + character は ID 参照のみ保持の "single source of truth" パターン。副作用は orchestrator (save/load) と UI-direct (export/import) を使い分け。

**Tech Stack:** 既存スタック (Vite + React 18 + TypeScript strict + Zustand + idb + Vitest + Biome)。新規依存追加なし。

**Reference:** [設計書 Section 6 (データ層)](../specs/2026-05-04-wizardry-proving-grounds-design.md) / [Plan M0+M1](2026-05-04-chapter1-m0-m1-foundation.md) (副作用 Orchestration の基盤)

---

## File Structure

### Phase A: Save/Load 永続化 API (トランザクション安全)
- Modify: `src/persist/db.ts` — listSlots, createSlot, deleteSlot, saveStateAtomic, loadStateAtomic, exportAll, importAll
- Modify: `src/persist/schema.ts` — (必要なら version 据え置き、saveSlot value を再確認)
- Create: `src/persist/serialize.ts` — GameState の JSON 変換 (character 詳細を ID 参照に置換、ロード時に逆変換)
- Test: `tests/persist/save.test.ts` — saveStateAtomic + loadStateAtomic
- Test: `tests/persist/serialize.test.ts` — シリアライズ/デシリアライズの可逆性

### Phase B: Effect / GameEvent 拡張
- Modify: `src/engine/state/types.ts` — Effect に save/load 完成、新イベント (saveStarted/Succeeded/Failed/loadStarted/Succeeded/Failed/dismissSaveResult/dismissLoadResult)
- Modify: `src/engine/effects/orchestrator.ts` — bindEffect + runEffect でセーブ・ロードを発火
- Modify: `src/store/internalEventTypes.ts` — 内部イベント追加

### Phase C: Temple of Cant 実画面
- Modify: `src/engine/state/types.ts` — TempleSubState (menu / savePicker / saveConfirm / saving / saveDone / saveError)
- Create: `src/engine/state/reduceTemple.ts`
- Modify: `src/engine/state/reduce.ts` — placeholder から外す
- Modify: `src/engine/state/reducePlaceholder.ts` — temple を除外
- Modify: `src/screens/Temple/index.tsx` — phase router
- Create: `src/screens/Temple/TempleMenu.tsx`
- Create: `src/screens/Temple/SavePicker.tsx`
- Create: `src/screens/Temple/SaveNameInput.tsx`
- Create: `src/screens/Temple/SaveProgress.tsx` — saving/saveDone/saveError 共通
- Test: `tests/engine/state/reduceTemple.test.ts`

### Phase D: Title Continue 実装
- Modify: `src/engine/state/types.ts` — TitleSubState の `continueMenu` で実セーブスロット表示用にフィールド追加 (既に `slots` あり、シリアライズ調整のみ)
- Modify: `src/screens/Title/index.tsx` — TitleContinue で db.listSlots、選択 → loadStarted dispatch
- Modify: `src/engine/state/reduceTitle.ts` — `continueGame; slotId` event を継続、loadStarted 遷移
- Test: `tests/engine/state/reduceTitle.test.ts` 拡張

### Phase E: Utilities Restart Out Party
- Modify: `src/engine/state/types.ts` — UtilitiesSubState (menu / restartList) を `SimpleSubState` から差し替え
- Create: `src/engine/state/reduceUtilities.ts`
- Modify: `src/engine/state/reduce.ts` — placeholder から外す
- Modify: `src/screens/Utilities/index.tsx` — phase router
- Create: `src/screens/Utilities/UtilitiesMenu.tsx`
- Create: `src/screens/Utilities/RestartList.tsx`
- Test: `tests/engine/state/reduceUtilities.test.ts`

### Phase F: フォールバック検出 + JSON Export/Import UI
- Create: `src/persist/health.ts` — IndexedDB の動作確認 (1 件 put → get → delete)、in-memory fallback フラグ
- Modify: `src/main.tsx` — bootstrap 時に health check
- Modify: `src/store/gameStore.ts` — `isStorageHealthy: boolean` フィールド追加
- Modify: `src/screens/Title/index.tsx` — TitleMain で警告バナー (storage 不健全時)
- Modify: `src/screens/Title/index.tsx` — Settings 画面に Export/Import ボタン追加
- Create: `src/screens/Title/ExportImportRow.tsx`

### Phase G: 統合テスト + デプロイ
- Modify: `src/i18n/messages.ts` — Temple/Continue/Utilities/Settings 文字列追加
- Modify: `CHANGELOG.md`, `README.md`
- 動作確認 → push → CI → Vercel

---

## Phase A: Save/Load 永続化 API (P50: 0.7 日)

### Task A1: serialize.ts — GameState の JSON 変換

**Files:**
- Create: `src/persist/serialize.ts`
- Test: `tests/persist/serialize.test.ts`

設計書 Section 6 の「真理の所在」より、`character` テーブルが唯一の真理。`saveSlot.gameState` は characterId 参照のみを保持する。

- [ ] **Step A1.1: テスト**

```typescript
// tests/persist/serialize.test.ts
import { describe, expect, it } from "vitest";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { deserializeState, serializeState } from "@/persist/serialize";

describe("serialize", () => {
  it("title state round-trips", () => {
    const original: GameState = { phase: "title", sub: { kind: "main" } };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("edgeOfTown with party round-trips", () => {
    const original: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, members: [1, 2, null, null, null, null] },
    };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("maze state with pos round-trips", () => {
    const original: GameState = {
      phase: "maze",
      pos: { level: 1, x: 3, y: 5, dir: "e" },
      party: { ...EMPTY_PARTY, status: "inMaze", members: [1, null, null, null, null, null] },
    };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("rejects malformed JSON gracefully", () => {
    expect(() => deserializeState("not json")).toThrow();
    expect(() => deserializeState("{}")).toThrow();
  });
});
```

- [ ] **Step A1.2: テスト失敗確認**

```bash
pnpm test serialize
```

期待: モジュール未実装で FAIL

- [ ] **Step A1.3: 実装**

```typescript
// src/persist/serialize.ts
import type { GameState } from "@/engine/state/types";

/**
 * GameState を JSON 文字列に変換する。
 * 注: GameState は既に characterId 参照のみを保持しているので、特別な変換は不要。
 * (キャラ実体は character objectStore に別途保存される。)
 */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

const VALID_PHASES = [
  "title",
  "edgeOfTown",
  "castle",
  "training",
  "utilities",
  "tavern",
  "boltac",
  "temple",
  "inn",
  "maze",
  "camp",
] as const;

export function deserializeState(json: string): GameState {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("deserializeState: not an object");
  }
  const obj = parsed as { phase?: unknown };
  if (typeof obj.phase !== "string" || !VALID_PHASES.includes(obj.phase as never)) {
    throw new Error(`deserializeState: invalid phase ${obj.phase}`);
  }
  // 詳細な構造検証は省略 (信頼境界: 自分の DB に書いた JSON を読むだけ)
  return parsed as GameState;
}
```

- [ ] **Step A1.4: テスト**

```bash
pnpm test serialize
```

期待: 4/4 PASS

- [ ] **Step A1.5: コミット**

```bash
git add src/persist/serialize.ts tests/persist/serialize.test.ts
git commit -m "feat(persist): GameState serialize/deserialize with phase validation"
```

### Task A2: db.ts に saveSlot CRUD + transaction-safe save/load

**Files:**
- Modify: `src/persist/db.ts`
- Test: `tests/persist/save.test.ts`

- [ ] **Step A2.1: db.ts の `db` オブジェクトに以下を追加**

```typescript
// src/persist/db.ts (既存 db 内に追加)
import { deserializeState, serializeState } from "./serialize";
import type { GameState } from "@/engine/state/types";

export interface SaveSlotInfo {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

// db オブジェクトに追加 (既存メソッドの後ろに):

async listSlots(): Promise<SaveSlotInfo[]> {
  const idb = await openWizardryDB();
  const all = await idb.getAll("saveSlot");
  return all
    .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
},

async deleteSlot(id: number): Promise<void> {
  const idb = await openWizardryDB();
  const tx = idb.transaction(["saveSlot", "character"], "readwrite");
  // スロットに紐付く character も削除
  const charsToDelete = await tx.objectStore("character").index("by-slotId").getAllKeys(id);
  for (const ck of charsToDelete) {
    await tx.objectStore("character").delete(ck);
  }
  await tx.objectStore("saveSlot").delete(id);
  await tx.done;
},

/**
 * セーブを単一トランザクションで原子的に書き込む。
 * 設計書 Section 6 「トランザクション制御」準拠。
 *
 * - slotId が undefined: 新規スロット作成 (autoIncrement で id 採番)
 * - slotId が number: 既存スロットを上書き
 * - changedCharacters: 同時に更新するキャラ群 (HP/Gold/Inventory 等の差分)
 */
async saveStateAtomic(args: {
  slotId: number | undefined;
  name: string;
  state: GameState;
  changedCharacters: Character[];
}): Promise<number> {
  const idb = await openWizardryDB();
  const tx = idb.transaction(["saveSlot", "character"], "readwrite");
  const now = Date.now();

  for (const c of args.changedCharacters) {
    await tx.objectStore("character").put(c);
  }

  let id: number;
  if (args.slotId === undefined) {
    id = (await tx.objectStore("saveSlot").add({
      // id は autoIncrement
      name: args.name,
      createdAt: now,
      updatedAt: now,
      gameState: serializeState(args.state),
    } as never)) as number;
  } else {
    id = args.slotId;
    const existing = await tx.objectStore("saveSlot").get(id);
    if (!existing) throw new Error(`saveSlot ${id} not found`);
    await tx.objectStore("saveSlot").put({
      ...existing,
      name: args.name,
      updatedAt: now,
      gameState: serializeState(args.state),
    });
  }

  await tx.done;
  return id;
},

/**
 * セーブを単一読み取りトランザクションでロードする。
 * 戻り値: { state, characters }
 */
async loadStateAtomic(slotId: number): Promise<{ state: GameState; characters: Character[] }> {
  const idb = await openWizardryDB();
  const tx = idb.transaction(["saveSlot", "character"], "readonly");
  const slot = await tx.objectStore("saveSlot").get(slotId);
  const chars = await tx.objectStore("character").index("by-slotId").getAll(slotId);
  await tx.done;
  if (!slot) throw new Error(`saveSlot ${slotId} not found`);
  return {
    state: deserializeState(slot.gameState),
    characters: chars,
  };
},

/**
 * 全データを JSON Blob としてエクスポート。
 */
async exportAll(): Promise<Blob> {
  const idb = await openWizardryDB();
  const tx = idb.transaction(["saveSlot", "character", "settings", "meta"], "readonly");
  const data = {
    version: 1,
    exportedAt: Date.now(),
    saveSlot: await tx.objectStore("saveSlot").getAll(),
    character: await tx.objectStore("character").getAll(),
    settings: await tx.objectStore("settings").getAll(),
    meta: await tx.objectStore("meta").getAll(),
  };
  await tx.done;
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
},

/**
 * JSON Blob からインポート。
 * mode='replace': 既存データを全消去してから書き込み
 * mode='merge': 既存に追加 (id 衝突時は新規 id 採番)
 *
 * M5 では replace のみ実装。merge は将来。
 */
async importAll(json: Blob, mode: "replace" | "merge"): Promise<void> {
  if (mode !== "replace") {
    throw new Error("importAll merge mode not implemented (M5)");
  }
  const text = await json.text();
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("importAll: invalid JSON structure");
  }
  const idb = await openWizardryDB();
  const tx = idb.transaction(["saveSlot", "character", "settings", "meta"], "readwrite");
  await tx.objectStore("saveSlot").clear();
  await tx.objectStore("character").clear();
  await tx.objectStore("settings").clear();
  await tx.objectStore("meta").clear();
  for (const s of parsed.saveSlot ?? []) await tx.objectStore("saveSlot").put(s);
  for (const c of parsed.character ?? []) await tx.objectStore("character").put(c);
  for (const s of parsed.settings ?? []) await tx.objectStore("settings").put(s);
  for (const m of parsed.meta ?? []) await tx.objectStore("meta").put(m);
  await tx.done;
},
```

- [ ] **Step A2.2: テスト**

```typescript
// tests/persist/save.test.ts
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_PARTY, type Character, type GameState } from "@/engine/state/types";
import { db, resetDbInstance } from "@/persist/db";

const sampleChar = (slotId: number, name: string): Character => ({
  id: 0, // fake-indexeddb が autoIncrement で採番
  slotId,
  name,
  race: "human",
  class: "fighter",
  alignment: "good",
  attributes: { str: 10, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 },
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

describe("save/load atomic", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("creates a new save slot and loads it back", async () => {
    const charId = await db.addCharacter(sampleChar(1, "Aragorn"));
    const c = await db.getCharacter(charId);
    if (!c) throw new Error("char missing");

    const state: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, members: [charId, null, null, null, null, null] },
    };
    const slotId = await db.saveStateAtomic({
      slotId: undefined,
      name: "Slot1",
      state,
      changedCharacters: [c],
    });

    const loaded = await db.loadStateAtomic(slotId);
    expect(loaded.state).toEqual(state);
    expect(loaded.characters).toHaveLength(1);
    expect(loaded.characters[0]?.name).toBe("Aragorn");
  });

  it("listSlots returns slots ordered by updatedAt desc", async () => {
    const c1 = await db.addCharacter(sampleChar(1, "A"));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "First",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Second",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    const slots = await db.listSlots();
    expect(slots).toHaveLength(2);
    expect(slots[0]?.name).toBe("Second"); // 最新が先頭
    expect(c1).toBeDefined();
  });

  it("deleteSlot removes the slot and its characters", async () => {
    const c = await db.addCharacter(sampleChar(0, "Test"));
    const ch = await db.getCharacter(c);
    if (!ch) throw new Error();
    const slotId = await db.saveStateAtomic({
      slotId: undefined,
      name: "ToDelete",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [{ ...ch, slotId: 0 }],
    });
    // character の slotId を実 slotId に更新
    await db.updateCharacter({ ...ch, slotId, id: c });

    await db.deleteSlot(slotId);
    expect(await db.listSlots()).toHaveLength(0);
    expect(await db.listCharacters(slotId)).toHaveLength(0);
  });

  it("exportAll → importAll round-trips data", async () => {
    await db.addCharacter(sampleChar(1, "A"));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Backup",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    const blob = await db.exportAll();
    expect(blob.type).toBe("application/json");

    // 全消去後に import
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    resetDbInstance();
    await db.init();
    expect(await db.listSlots()).toHaveLength(0);

    await db.importAll(blob, "replace");
    expect(await db.listSlots()).toHaveLength(1);
    expect(await db.listCharacters(1)).toHaveLength(1);
  });
});
```

- [ ] **Step A2.3: テスト**

```bash
pnpm test save
```

期待: 4/4 PASS

- [ ] **Step A2.4: コミット**

```bash
git add src/persist/db.ts tests/persist/save.test.ts
git commit -m "feat(persist): atomic save/load with transactions + export/import"
```

---

## Phase B: Effect / GameEvent 拡張 (P50: 0.5 日)

### Task B1: types.ts の Effect と GameEvent を拡張

**Files:**
- Modify: `src/engine/state/types.ts`

- [ ] **Step B1.1: Effect 型を拡張**

```typescript
// 既存の Effect 型を置き換え
export type Effect =
  | { type: "load"; slotId: SaveSlotId }
  | { type: "save"; slotId: SaveSlotId | undefined; name: string };
```

- [ ] **Step B1.2: GameEvent に save/load ライフサイクルイベントを追加**

`GameEvent` union に追加 (Inn 系の後、loadStarted/loadFailed の前に挿入):

```typescript
  // Save/Load (M5)
  | { type: "saveStarted" }
  | { type: "saveSucceeded"; slotId: SaveSlotId }
  | { type: "saveFailed"; reason: string }
  | { type: "dismissSaveResult" }
  | { type: "loadSucceeded"; state: GameState; characterIds: number[] }
  | { type: "dismissLoadResult" }
  | { type: "openSavePicker" }
  | { type: "pickSlot"; slotId: SaveSlotId | "new" }
  | { type: "inputSaveName"; name: string }
  | { type: "confirmSave" }
  | { type: "cancelSave" }
  | { type: "continueGame"; slotId: SaveSlotId }
  | { type: "openRestartList" }
  | { type: "restartParty"; slotId: SaveSlotId }
```

> 注: 既存の `loadStarted`/`loadFailed` はそのまま残す。

- [ ] **Step B1.3: typecheck**

```bash
pnpm typecheck
```

期待: orchestrator.ts や reduceTitle.ts などで `Effect` が変わったことによるエラー多数。**この段階では OK**。

- [ ] **Step B1.4: コミット**

```bash
git add src/engine/state/types.ts
git commit -m "feat(types): extend Effect and GameEvent for M5 save/load"
```

### Task B2: orchestrator の bindEffect/runEffect 拡張

**Files:**
- Modify: `src/engine/effects/orchestrator.ts`
- Modify: `src/store/internalEventTypes.ts`

- [ ] **Step B2.1: orchestrator.ts**

```typescript
// src/engine/effects/orchestrator.ts (置き換え)
import { db } from "@/persist/db";
import type { Effect, GameEvent, GameState } from "@/engine/state/types";

/**
 * 状態遷移から副作用を決定する。
 * - title: loading sub-state への遷移 → load effect
 * - temple: saving sub-state への遷移 → save effect
 */
export function bindEffect(prev: GameState, next: GameState): Effect | null {
  // load トリガ: title.loading への新規遷移
  const prevLoading = prev.phase === "title" && prev.sub.kind === "loading";
  const nextLoading = next.phase === "title" && next.sub.kind === "loading";
  if (nextLoading && !prevLoading) {
    if (next.phase !== "title" || next.sub.kind !== "loading") return null;
    return { type: "load", slotId: next.sub.slotId };
  }

  // save トリガ: temple.saving への新規遷移
  const prevSaving = prev.phase === "temple" && prev.sub.kind === "saving";
  const nextSaving = next.phase === "temple" && next.sub.kind === "saving";
  if (nextSaving && !prevSaving) {
    if (next.phase !== "temple" || next.sub.kind !== "saving") return null;
    return { type: "save", slotId: next.sub.slotId, name: next.sub.name };
  }

  return null;
}

/**
 * 副作用を実行し、完了時に内部イベントを dispatch する。
 */
export async function runEffect(
  effect: Effect,
  dispatch: (e: GameEvent) => void,
): Promise<void> {
  if (effect.type === "load") {
    try {
      const { state, characters } = await db.loadStateAtomic(effect.slotId);
      dispatch({
        type: "loadSucceeded",
        state,
        characterIds: characters.map((c) => c.id),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "loadFailed", reason });
    }
    return;
  }

  if (effect.type === "save") {
    try {
      const slotId = await db.saveStateAtomic({
        slotId: effect.slotId,
        name: effect.name,
        state: getCurrentState(),
        changedCharacters: [], // M5 段階では state 経由のキャラは別管理 (M3 で UI-direct 更新済み)
      });
      dispatch({ type: "saveSucceeded", slotId });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "saveFailed", reason });
    }
  }
}

// 副作用ランナーから現在の state を取るためのフック (循環 import 回避)
let _getState: (() => GameState) | null = null;
export function setStateGetter(getter: () => GameState): void {
  _getState = getter;
}
function getCurrentState(): GameState {
  if (!_getState) throw new Error("setStateGetter not called");
  return _getState();
}
```

- [ ] **Step B2.2: gameStore で setStateGetter を呼ぶ**

`src/store/gameStore.ts` の `createGameStore` 末尾あたりに追加:

```typescript
import { setStateGetter } from "@/engine/effects/orchestrator";
// createGameStore 内、return store の前:
setStateGetter(() => store.getState().state);
```

- [ ] **Step B2.3: internalEventTypes.ts に新イベントを追加**

```typescript
// src/store/internalEventTypes.ts
export const INTERNAL_EVENT_TYPES: ReadonlyArray<GameEvent["type"]> = [
  "loadStarted",
  "loadFailed",
  "loadSucceeded",
  "saveStarted",
  "saveSucceeded",
  "saveFailed",
];
```

- [ ] **Step B2.4: typecheck + コミット**

```bash
pnpm typecheck
git add src/engine src/store
git commit -m "feat(orchestrator): bindEffect+runEffect cover load/save with current-state getter"
```

---

## Phase C: Temple of Cant 実画面 (P50: 0.7 日)

### Task C1: TempleSubState + reduceTemple

**Files:**
- Modify: `src/engine/state/types.ts`
- Create: `src/engine/state/reduceTemple.ts`
- Modify: `src/engine/state/reduce.ts`
- Modify: `src/engine/state/reducePlaceholder.ts`
- Test: `tests/engine/state/reduceTemple.test.ts`

- [ ] **Step C1.1: types.ts に TempleSubState を追加**

既存の `temple` phase が `SimpleSubState` を使っていたのを差し替え:

```typescript
// types.ts に追加
import type { SaveSlotInfo } from "@/persist/db";

export type TempleSubState =
  | { kind: "menu" }
  | { kind: "savePicker"; slots: SaveSlotInfo[] }
  | { kind: "saveNameInput"; slotId: SaveSlotId | undefined }
  | { kind: "saving"; slotId: SaveSlotId | undefined; name: string }
  | { kind: "saveDone"; slotId: SaveSlotId }
  | { kind: "saveError"; reason: string };
```

GameState union の `temple` entry を更新:

```typescript
// 既存:
//   | { phase: "temple"; sub: SimpleSubState; party: PartyState }
// 変更後:
| { phase: "temple"; sub: TempleSubState; party: PartyState }
```

- [ ] **Step C1.2: reduceTemple.ts**

```typescript
// src/engine/state/reduceTemple.ts
import type { GameEvent, GameState } from "./types";

export function reduceTemple(
  state: Extract<GameState, { phase: "temple" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openSavePicker") {
      return { ...state, sub: { kind: "savePicker", slots: [] } };
    }
    if (event.type === "goBack") {
      return { phase: "castle", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "savePicker") {
    if (event.type === "pickSlot") {
      return {
        ...state,
        sub: {
          kind: "saveNameInput",
          slotId: event.slotId === "new" ? undefined : event.slotId,
        },
      };
    }
    if (event.type === "cancelSave") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "saveNameInput") {
    if (event.type === "inputSaveName") {
      return {
        ...state,
        sub: { kind: "saving", slotId: sub.slotId, name: event.name },
      };
    }
    if (event.type === "cancelSave") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "saving") {
    if (event.type === "saveSucceeded") {
      return { ...state, sub: { kind: "saveDone", slotId: event.slotId } };
    }
    if (event.type === "saveFailed") {
      return { ...state, sub: { kind: "saveError", reason: event.reason } };
    }
    return state;
  }

  if (sub.kind === "saveDone" || sub.kind === "saveError") {
    if (event.type === "dismissSaveResult") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
```

- [ ] **Step C1.3: reduce.ts に temple を追加 + placeholder から外す**

```typescript
// reduce.ts
import { reduceTemple } from "./reduceTemple";
case "temple":
  return reduceTemple(state, event);

// reducePlaceholder.ts: PlaceholderPhase から "temple" を除く
type PlaceholderPhase = "utilities";
```

- [ ] **Step C1.4: テスト**

```typescript
// tests/engine/state/reduceTemple.test.ts
import { describe, expect, it } from "vitest";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";

const init: GameState = {
  phase: "temple",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("temple reducer", () => {
  it("openSavePicker → savePicker sub", () => {
    const next = reduce(init, { type: "openSavePicker" });
    expect(next.phase).toBe("temple");
    if (next.phase !== "temple") return;
    expect(next.sub.kind).toBe("savePicker");
  });

  it("goBack from menu → castle", () => {
    expect(reduce(init, { type: "goBack" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("savePicker + pickSlot 'new' → saveNameInput with slotId undefined", () => {
    const at: GameState = { ...init, sub: { kind: "savePicker", slots: [] } };
    const next = reduce(at, { type: "pickSlot", slotId: "new" });
    if (next.phase !== "temple" || next.sub.kind !== "saveNameInput") throw new Error();
    expect(next.sub.slotId).toBeUndefined();
  });

  it("savePicker + pickSlot existing → saveNameInput with slotId", () => {
    const at: GameState = { ...init, sub: { kind: "savePicker", slots: [] } };
    const next = reduce(at, { type: "pickSlot", slotId: 5 });
    if (next.phase !== "temple" || next.sub.kind !== "saveNameInput") throw new Error();
    expect(next.sub.slotId).toBe(5);
  });

  it("saveNameInput + inputSaveName → saving", () => {
    const at: GameState = { ...init, sub: { kind: "saveNameInput", slotId: undefined } };
    const next = reduce(at, { type: "inputSaveName", name: "MySave" });
    if (next.phase !== "temple" || next.sub.kind !== "saving") throw new Error();
    expect(next.sub.name).toBe("MySave");
  });

  it("saving + saveSucceeded → saveDone", () => {
    const at: GameState = {
      ...init,
      sub: { kind: "saving", slotId: undefined, name: "x" },
    };
    const next = reduce(at, { type: "saveSucceeded", slotId: 7 });
    if (next.phase !== "temple" || next.sub.kind !== "saveDone") throw new Error();
    expect(next.sub.slotId).toBe(7);
  });

  it("saving + saveFailed → saveError", () => {
    const at: GameState = {
      ...init,
      sub: { kind: "saving", slotId: undefined, name: "x" },
    };
    const next = reduce(at, { type: "saveFailed", reason: "quota" });
    if (next.phase !== "temple" || next.sub.kind !== "saveError") throw new Error();
    expect(next.sub.reason).toBe("quota");
  });

  it("saveDone + dismissSaveResult → menu", () => {
    const at: GameState = { ...init, sub: { kind: "saveDone", slotId: 1 } };
    const next = reduce(at, { type: "dismissSaveResult" });
    if (next.phase !== "temple") throw new Error();
    expect(next.sub.kind).toBe("menu");
  });

  it("cancelSave from any input sub returns to menu", () => {
    const inPicker: GameState = { ...init, sub: { kind: "savePicker", slots: [] } };
    const next1 = reduce(inPicker, { type: "cancelSave" });
    if (next1.phase !== "temple") throw new Error();
    expect(next1.sub.kind).toBe("menu");
  });
});
```

- [ ] **Step C1.5: テスト + コミット**

```bash
pnpm test reduceTemple
git add src/engine tests/engine/state/reduceTemple.test.ts
git commit -m "feat(engine): temple reducer with save flow (menu/picker/input/saving/done/error)"
```

### Task C2: Temple 画面の実装

**Files:**
- Modify: `src/screens/Temple/index.tsx`
- Create: `src/screens/Temple/TempleMenu.tsx`
- Create: `src/screens/Temple/SavePicker.tsx`
- Create: `src/screens/Temple/SaveNameInput.tsx`
- Create: `src/screens/Temple/SaveProgress.tsx`

- [ ] **Step C2.1: index.tsx をルータ化**

```typescript
// src/screens/Temple/index.tsx
import { useGameStore } from "@/store/gameStore";
import { SaveNameInput } from "./SaveNameInput";
import { SavePicker } from "./SavePicker";
import { SaveProgress } from "./SaveProgress";
import { TempleMenu } from "./TempleMenu";

export function Temple() {
  const sub = useGameStore((s) => (s.state.phase === "temple" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <TempleMenu />;
    case "savePicker":
      return <SavePicker slots={sub.slots} />;
    case "saveNameInput":
      return <SaveNameInput slotId={sub.slotId} />;
    case "saving":
    case "saveDone":
    case "saveError":
      return <SaveProgress sub={sub} />;
  }
}
```

- [ ] **Step C2.2: TempleMenu.tsx**

```typescript
// src/screens/Temple/TempleMenu.tsx
import { useEffect } from "react";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function TempleMenu() {
  const t = useT();

  // savePicker に遷移する直前にスロット一覧を読み込む
  // → openSavePicker dispatch 後、effect 経由ではなく UI 側で listSlots してから sub に slots を渡したい
  // 設計: dispatch 後、useEffect で sub が savePicker になった時点で list を呼ぶ方式は循環するので、
  // ここで「Pray」ボタンを押した瞬間に list → openSavePicker (slots 付き) を dispatch する
  // → openSavePicker event の payload に slots を含める方式に変更したい...が、event は state に payload として保持させる側で list する
  //
  // 単純化: openSavePicker dispatch 直前に UI で list して、event 自体は payload を持たない。
  // SavePicker コンポーネント側で list → setState の形にする。

  return (
    <div className="menu-screen">
      <Frame title={t("temple.title")}>
        <p>{t("temple.greeting")}</p>
        <Menu
          items={[
            {
              hotkey: "P",
              label: t("temple.menu.pray"),
              onSelect: () => dispatch({ type: "openSavePicker" }),
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "goBack" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

> 設計補足: SavePicker は最初 `slots: []` でレンダリングされ、その useEffect で `db.listSlots()` を呼んでローカル state を更新する。

- [ ] **Step C2.3: SavePicker.tsx**

```typescript
// src/screens/Temple/SavePicker.tsx
import { useEffect, useState } from "react";
import type { SaveSlotInfo } from "@/persist/db";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SavePicker({ slots: _initialSlots }: { slots: SaveSlotInfo[] }) {
  const t = useT();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    db.listSlots().then(setSlots);
  }, []);

  return (
    <div className="menu-screen">
      <Frame title={t("temple.savePicker.title")}>
        <Menu
          items={[
            {
              hotkey: "N",
              label: t("temple.savePicker.newSlot"),
              onSelect: () => dispatch({ type: "pickSlot", slotId: "new" }),
            },
            ...slots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "pickSlot", slotId: slot.id }),
            })),
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelSave" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step C2.4: SaveNameInput.tsx**

```typescript
// src/screens/Temple/SaveNameInput.tsx
import { useState } from "react";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SaveNameInput({ slotId: _ }: { slotId: number | undefined }) {
  const t = useT();
  const [name, setName] = useState("");

  const submit = (): void => {
    const trimmed = name.trim();
    if (trimmed) dispatch({ type: "inputSaveName", name: trimmed });
  };

  return (
    <div className="menu-screen">
      <Frame title={t("temple.saveNameInput.title")}>
        <p>{t("temple.saveNameInput.prompt")}</p>
        <input
          type="text"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            e.stopPropagation();
          }}
          // biome-ignore lint/a11y/noAutofocus: only input on screen
          autoFocus
        />
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: submit,
              disabled: !name.trim(),
            },
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelSave" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step C2.5: SaveProgress.tsx**

```typescript
// src/screens/Temple/SaveProgress.tsx
import type { TempleSubState } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SaveProgress({
  sub,
}: {
  sub: Extract<TempleSubState, { kind: "saving" | "saveDone" | "saveError" }>;
}) {
  const t = useT();

  if (sub.kind === "saving") {
    return (
      <div className="menu-screen">
        <Frame title={t("temple.saving.title")}>
          <p>{t("temple.saving.body")}</p>
        </Frame>
      </div>
    );
  }

  if (sub.kind === "saveDone") {
    return (
      <div className="menu-screen">
        <Frame title={t("temple.saveDone.title")}>
          <p>{t("temple.saveDone.body")}</p>
          <Menu
            items={[
              {
                hotkey: "O",
                label: t("common.ok"),
                onSelect: () => dispatch({ type: "dismissSaveResult" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("temple.saveError.title")}>
        <p>{sub.reason}</p>
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: () => dispatch({ type: "dismissSaveResult" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step C2.6: コミット**

```bash
git add src/screens/Temple
git commit -m "feat(screens): Temple of Cant save flow (menu/picker/input/progress)"
```

---

## Phase D: Title Continue 実装 (P50: 0.4 日)

### Task D1: reduceTitle で continueGame / loadSucceeded ハンドリング

**Files:**
- Modify: `src/engine/state/reduceTitle.ts`
- Modify: `tests/engine/state/reduceTitle.test.ts`

- [ ] **Step D1.1: reduceTitle.ts に追加**

```typescript
// 既存 case の前に追加
case "continueGame":
  if (sub.kind === "continueMenu") {
    return { phase: "title", sub: { kind: "loading", slotId: event.slotId } };
  }
  return state;

case "loadSucceeded":
  // 注: state は新ロード後の state なので、Reducer はそのまま返す。
  // 実体は store の dispatch で setState({ state: event.state }) する形が必要
  // → ただし event payload を Reducer ベースで返すこともできる。シンプルに後者を採用:
  if (sub.kind === "loading") {
    return event.state; // 完全置き換え
  }
  return state;
```

- [ ] **Step D1.2: テスト追加**

```typescript
// reduceTitle.test.ts に追加
it("continueGame from continueMenu → loading", () => {
  const at: GameState = {
    phase: "title",
    sub: { kind: "continueMenu", slots: [{ id: 1, name: "X", updatedAt: 0 }] },
  };
  const next = reduce(at, { type: "continueGame", slotId: 1 });
  expect(next).toEqual({
    phase: "title",
    sub: { kind: "loading", slotId: 1 },
  });
});

it("loadSucceeded from loading → replaces state with loaded", () => {
  const loading: GameState = {
    phase: "title",
    sub: { kind: "loading", slotId: 1 },
  };
  const loaded: GameState = {
    phase: "edgeOfTown",
    sub: { kind: "menu" },
    party: EMPTY_PARTY,
  };
  const next = reduce(loading, {
    type: "loadSucceeded",
    state: loaded,
    characterIds: [],
  });
  expect(next).toEqual(loaded);
});
```

- [ ] **Step D1.3: テスト + コミット**

```bash
pnpm test reduceTitle
git add src/engine tests/engine
git commit -m "feat(engine): title reducer handles continueGame and loadSucceeded"
```

### Task D2: TitleContinue 画面の実装

**Files:**
- Modify: `src/screens/Title/index.tsx`

- [ ] **Step D2.1: TitleContinue を実画面に**

```typescript
// src/screens/Title/index.tsx の TitleContinue を置き換え
function TitleContinue() {
  const t = useT();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    db.listSlots()
      .then(setSlots)
      .catch(() => setHealthy(false));
  }, []);

  return (
    <div className="menu-screen">
      <Frame title={t("title.continue.title")}>
        {!healthy && <p className="title-warning">{t("storage.unavailable")}</p>}
        {healthy && slots.length === 0 && <p>{t("title.continue.noSaves")}</p>}
        <Menu
          items={[
            ...slots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "continueGame", slotId: slot.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "closeContinueMenu" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

import 追加が必要:

```typescript
import { useEffect, useState } from "react";
import { db, type SaveSlotInfo } from "@/persist/db";
```

- [ ] **Step D2.2: TitleLoading 表示 (loading sub-state)**

`Title` ルータの `loading` ケースを実装:

```typescript
case "loading":
  return (
    <div className="menu-screen">
      <Frame title={t("common.loading")}>
        <p>{t("title.loading.body")}</p>
      </Frame>
    </div>
  );
case "loadError":
  return (
    <div className="menu-screen">
      <Frame title={t("title.loadError.title")}>
        <p>{sub.reason}</p>
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: () => dispatch({ type: "closeContinueMenu" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
```

- [ ] **Step D2.3: コミット**

```bash
git add src/screens/Title
git commit -m "feat(screens): Title Continue lists save slots and dispatches load"
```

---

## Phase E: Utilities Restart Out Party (P50: 0.4 日)

### Task E1: UtilitiesSubState + reduceUtilities

**Files:**
- Modify: `src/engine/state/types.ts`
- Create: `src/engine/state/reduceUtilities.ts`
- Modify: `src/engine/state/reduce.ts`
- Modify: `src/engine/state/reducePlaceholder.ts`
- Test: `tests/engine/state/reduceUtilities.test.ts`

- [ ] **Step E1.1: types.ts に UtilitiesSubState を追加**

```typescript
import type { SaveSlotInfo } from "@/persist/db";

export type UtilitiesSubState =
  | { kind: "menu" }
  | { kind: "restartList"; outParties: SaveSlotInfo[] };
```

GameState の utilities entry を変更:

```typescript
| { phase: "utilities"; sub: UtilitiesSubState; party: PartyState }
```

- [ ] **Step E1.2: reduceUtilities.ts**

```typescript
// src/engine/state/reduceUtilities.ts
import type { GameEvent, GameState } from "./types";

export function reduceUtilities(
  state: Extract<GameState, { phase: "utilities" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    if (event.type === "openRestartList") {
      return { ...state, sub: { kind: "restartList", outParties: [] } };
    }
    if (event.type === "goBack") {
      return { phase: "edgeOfTown", sub: { kind: "menu" }, party };
    }
    return state;
  }

  if (sub.kind === "restartList") {
    if (event.type === "restartParty") {
      // ロード後 loadSucceeded で完全に state 置き換え (party.status === 'inMaze' に上書き)
      return { phase: "title", sub: { kind: "loading", slotId: event.slotId } };
    }
    if (event.type === "goBack") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  return state;
}
```

- [ ] **Step E1.3: reduce.ts に utilities を追加 + placeholder から外す**

```typescript
// reduce.ts
import { reduceUtilities } from "./reduceUtilities";
case "utilities":
  return reduceUtilities(state, event);

// reducePlaceholder.ts: PlaceholderPhase 空に (= placeholder reducer は使わなくなる)
// ファイル自体は残しておく (将来別の placeholder が出るかも)
```

`reducePlaceholder.ts` を空配列対応にするか、削除するか判断。M5 では空 phase で残す:

```typescript
// reducePlaceholder.ts
type PlaceholderPhase = never;
const BACK_TARGET: Record<string, never> = {};

export function reducePlaceholder(
  _state: never,
  _event: GameEvent,
): GameState {
  return _state;
}
```

> または PlaceholderPhase 空でファイルを削除し、reduce.ts の他 case ですべて handled になることを確認。**M5 では削除を選択** (`reducePlaceholder.ts` と `reducePlaceholder.test.ts` を削除)。

- [ ] **Step E1.4: テスト**

```typescript
// tests/engine/state/reduceUtilities.test.ts
import { describe, expect, it } from "vitest";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";

const init: GameState = {
  phase: "utilities",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("utilities reducer", () => {
  it("openRestartList → restartList sub", () => {
    const next = reduce(init, { type: "openRestartList" });
    if (next.phase !== "utilities") throw new Error();
    expect(next.sub.kind).toBe("restartList");
  });

  it("restartParty → title.loading", () => {
    const at: GameState = {
      ...init,
      sub: { kind: "restartList", outParties: [] },
    };
    const next = reduce(at, { type: "restartParty", slotId: 5 });
    expect(next).toEqual({
      phase: "title",
      sub: { kind: "loading", slotId: 5 },
    });
  });

  it("goBack from menu → edgeOfTown", () => {
    expect(reduce(init, { type: "goBack" })).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step E1.5: テスト + コミット**

```bash
pnpm test reduceUtilities
git add src/engine tests/engine/state/reduceUtilities.test.ts
# placeholder の削除も同コミットで
git rm src/engine/state/reducePlaceholder.ts tests/engine/state/reducePlaceholder.test.ts
git commit -m "feat(engine): utilities reducer (Restart Out Party); remove unused placeholder"
```

> 削除前に reduce.ts の `case "utilities"` `case "temple"` などが reducePlaceholder を参照していないか確認。Phase C で `temple` を専用 reducer に、Phase E で `utilities` を専用 reducer にしたので、reducePlaceholder は使用箇所なし。

### Task E2: Utilities 画面

**Files:**
- Modify: `src/screens/Utilities/index.tsx`
- Create: `src/screens/Utilities/UtilitiesMenu.tsx`
- Create: `src/screens/Utilities/RestartList.tsx`

- [ ] **Step E2.1: index.tsx ルータ**

```typescript
// src/screens/Utilities/index.tsx
import { useGameStore } from "@/store/gameStore";
import { RestartList } from "./RestartList";
import { UtilitiesMenu } from "./UtilitiesMenu";

export function Utilities() {
  const sub = useGameStore((s) => (s.state.phase === "utilities" ? s.state.sub : null));
  if (!sub) return null;
  if (sub.kind === "restartList") return <RestartList />;
  return <UtilitiesMenu />;
}
```

- [ ] **Step E2.2: UtilitiesMenu**

```typescript
// src/screens/Utilities/UtilitiesMenu.tsx
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function UtilitiesMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("utilities.title")}>
        <Menu
          items={[
            {
              hotkey: "R",
              label: t("utilities.menu.restart"),
              onSelect: () => dispatch({ type: "openRestartList" }),
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "goBack" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step E2.3: RestartList**

```typescript
// src/screens/Utilities/RestartList.tsx
import { useEffect, useState } from "react";
import { type SaveSlotInfo, db } from "@/persist/db";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function RestartList() {
  const t = useT();
  const [outSlots, setOutSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    // OUT 状態の party を含むスロットを抽出するため、各スロットをロードして status を見る
    // 実装簡略化: 全スロットをリストし、ロード時に status をチェックして警告 (M5 範囲)
    db.listSlots().then(setOutSlots);
  }, []);

  return (
    <div className="menu-screen">
      <Frame title={t("utilities.restart.title")}>
        {outSlots.length === 0 && <p>{t("utilities.restart.empty")}</p>}
        <Menu
          items={[
            ...outSlots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "restartParty", slotId: slot.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "goBack" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

> 注: M5 では「全スロットを Restart 可能リストとして表示」する簡略実装。本来は `state.party.status === 'out'` のスロットのみ表示すべきだが、それには各スロットを部分ロード (gameState 解析) する必要があり M5 範囲外。Chapter 4 以降で改善。

- [ ] **Step E2.4: コミット**

```bash
git add src/screens/Utilities
git commit -m "feat(screens): Utilities menu + Restart Out Party slot picker"
```

---

## Phase F: フォールバック検出 + Settings の Export/Import (P50: 0.3 日)

### Task F1: persist/health.ts でストレージ動作確認

**Files:**
- Create: `src/persist/health.ts`

- [ ] **Step F1.1: health check**

```typescript
// src/persist/health.ts
import { openWizardryDB } from "./db";

const TEST_KEY = "__healthcheck__";

/**
 * IndexedDB が動作するか簡易検証する。
 * 1 件 put → get → delete を試みて、例外が出ないかつ値が一致すれば healthy。
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    if (typeof indexedDB === "undefined") return false;
    const idb = await openWizardryDB();
    await idb.put("settings", "ok", TEST_KEY);
    const v = await idb.get("settings", TEST_KEY);
    await idb.delete("settings", TEST_KEY);
    return v === "ok";
  } catch {
    return false;
  }
}
```

- [ ] **Step F1.2: gameStore に isStorageHealthy 追加**

```typescript
// src/store/gameStore.ts の GameStoreShape に追加
isStorageHealthy: boolean;

// initialState
isStorageHealthy: true,
```

- [ ] **Step F1.3: bootstrap で health check**

```typescript
// src/main.tsx
import { checkStorageHealth } from "@/persist/health";
import { gameStore } from "@/store/gameStore";

async function bootstrap(): Promise<void> {
  await Promise.all([waitForPixelFontsReady(), initLanguage()]);
  const healthy = await checkStorageHealth();
  gameStore.setState({ isStorageHealthy: healthy });
  subscribeScaleToWindow();
  // ... 既存の render
}
```

- [ ] **Step F1.4: コミット**

```bash
git add src/persist/health.ts src/store/gameStore.ts src/main.tsx
git commit -m "feat(persist): IndexedDB health check + isStorageHealthy flag"
```

### Task F2: Settings に Export/Import ボタン

**Files:**
- Modify: `src/screens/Title/index.tsx`

- [ ] **Step F2.1: ExportImportRow を Settings に追加**

```typescript
// src/screens/Title/index.tsx の TitleSettings に追加
function TitleSettings() {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onExport = async (): Promise<void> => {
    const blob = await db.exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wizardry-save-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(t("settings.import.confirm"))) return;
    await db.importAll(file, "replace");
    location.reload();
  };

  // Menu items に以下追加 (E/J/B の前):
  const menuItems = [
    // ... 既存 E/J
    {
      hotkey: "X",
      label: t("settings.export"),
      onSelect: () => void onExport(),
    },
    {
      hotkey: "I",
      label: t("settings.import"),
      onSelect: () => fileInputRef.current?.click(),
    },
    {
      hotkey: "B",
      label: t("settings.back"),
      onSelect: () => dispatch({ type: "closeSettings" }),
    },
  ];

  return (
    <div className="menu-screen">
      <Frame title={t("settings.title")}>
        <p className="settings-heading">{t("settings.language")}</p>
        <Menu items={menuItems} />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => void onImport(e)}
        />
      </Frame>
    </div>
  );
}
```

import 追加:

```typescript
import { useRef } from "react";
import { db } from "@/persist/db";
```

- [ ] **Step F2.2: コミット**

```bash
git add src/screens/Title
git commit -m "feat(screens): Settings export/import buttons + JSON file IO"
```

---

## Phase G: 統合 + i18n + デプロイ (P50: 0.3 日)

### Task G1: i18n 全追加

**Files:**
- Modify: `src/i18n/messages.ts`

- [ ] **Step G1.1: 全 M5 メッセージを追加 (en/ja)**

主要キー:

```
// Temple
temple.greeting / temple.menu.pray / temple.savePicker.{title,newSlot}
temple.saveNameInput.{title,prompt}
temple.saving.{title,body} / temple.saveDone.{title,body} / temple.saveError.title

// Continue
title.continue.{title,noSaves} / title.loading.body / title.loadError.title

// Utilities
utilities.menu.restart / utilities.restart.{title,empty}

// Storage
storage.unavailable

// Settings
settings.export / settings.import / settings.import.confirm
```

(en/ja 両方を実装)

- [ ] **Step G1.2: コミット**

```bash
git add src/i18n/messages.ts
git commit -m "feat(i18n): add M5 messages (Temple/Continue/Utilities/Storage/Settings export-import)"
```

### Task G2: 統合 + デプロイ

- [ ] **Step G2.1: フル CI 同等チェック**

```bash
pnpm biome check --write src tests
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

期待: 全グリーン、bundle ~80 KB gzip 以内

- [ ] **Step G2.2: 開発サーバで E2E**

```bash
pnpm dev
```

確認:
- [ ] Title → New Game → キャラ作成 → パーティ編成 → Castle → Temple → Pray → New Slot → 名前入力 → Save 成功
- [ ] Title → Continue → スロット選択 → ロード → Edge of Town に遷移
- [ ] 別の冒険で Camp → Quit to Town → Edge of Town → Utilities → Restart → スロット選択 → Maze に復帰
- [ ] Settings → Export → JSON ダウンロード
- [ ] Settings → Import → JSON 読み込み → リロード後にデータ復元
- [ ] プライベートブラウジング (Firefox) で警告バナー表示

- [ ] **Step G2.3: CHANGELOG + README**

```markdown
### Chapter 1 / M5 - 2026-XX-XX

#### Added
- Temple of Cant save with single-store transactional safety
- Title Continue lists save slots and restores game
- Utilities Restart Out Party (M5 では全スロット表示の簡易実装)
- Settings JSON Export/Import for backup
- IndexedDB health check + warning banner on storage failure

#### Tests
- N tests / M files / Bundle: ~K KB gzip
```

```bash
git add CHANGELOG.md README.md
git commit -m "docs: M5 release notes"
git push origin main
```

- [ ] **Step G2.4: GitHub Actions + Vercel 確認**

```bash
gh run watch --exit-status
```

`https://wizardry-proving-grounds.vercel.app` で全フロー再現確認。

---

## 完了基準 (Definition of Done for M5)

- [ ] Temple of Cant でセーブが動作 (新規作成・上書き)
- [ ] Title の Continue でスロット一覧表示・ロード復元
- [ ] Camp の Quit to Town で party が OUT 状態に (M4 で実装済み、動作確認のみ)
- [ ] Utilities の Restart Out Party でスロットからロード復帰
- [ ] Settings から JSON Export/Import 動作
- [ ] IndexedDB 利用不可時に警告バナー
- [ ] 全テスト PASS、CI が main で成功
- [ ] Vercel 本番に反映、URL で全フロー再現可能
- [ ] CHANGELOG/README 更新済み

完了したら次の Plan: M6 (i18n 仕上げ + 設定詳細 + エラー UI 統一) または M7 (統合テスト + ドキュメント整備)。
