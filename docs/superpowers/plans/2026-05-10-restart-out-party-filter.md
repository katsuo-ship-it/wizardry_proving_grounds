# Restart Out Party — OUT 状態フィルタ Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Utilities → "Restart Out Party" 画面が、OUT 状態 (= Camp Quit 等で迷宮内に居残り中) のパーティが入っているスロットのみを表示するようにする。

**Architecture:** `db.listSlots()` を拡張して各スロットの `gameState` を `deserializeState` で復元し、`partyStatus` + `outAtPosition` を `SaveSlotInfo` に載せる。`RestartList.tsx` で `partyStatus === "out"` フィルタ + 空メッセージ分岐を追加。i18n キーを 1 個新設。saveSlot IndexedDB スキーマは不変、既存セーブと完全後方互換。

**Tech Stack:** TypeScript strict / React 18 / Vitest + fake-indexeddb / Biome / pnpm 10

**Spec:** [`docs/superpowers/specs/2026-05-10-restart-out-party-filter-design.md`](../specs/2026-05-10-restart-out-party-filter-design.md)

---

## ファイル構成

| File | 変更内容 |
|---|---|
| `src/engine/state/types.ts` | `SaveSlotInfo` に `partyStatus` + `outAtPosition?` 2 フィールド追加 |
| `src/persist/db.ts` | `listSlots()` 内で `deserializeState` を呼んで新フィールドを抽出。失敗スロットは try/catch で隔離 |
| `src/screens/Utilities/RestartList.tsx` | `partyStatus === "out"` でフィルタ、空メッセージ分岐を 2 ケースに |
| `src/i18n/messages.ts` | `utilities.restart.noOutParty` キー追加 (en/ja) |
| `tests/persist/save.test.ts` | `listSlots party status extraction` describe ブロック追加 (1〜2 件) |

新規ファイルなし。すべて既存ファイルへの追記/書き換え。

---

## Phase 0: 事前確認 (no commit)

- [ ] **Step 0.1: ベースラインテスト**

```bash
pnpm test 2>&1 | grep -E "Test Files|Tests" | tail -2
```

Expected: `Test Files 30 passed (30)` / `Tests 189 passed (189)` (or whatever current main count is — not the 210 from feature/maze-3d-render branch since this plan is on main)

- [ ] **Step 0.2: lint + typecheck baseline**

```bash
pnpm typecheck && pnpm lint 2>&1 | tail -5
```

Expected: typecheck clean, lint shows pre-existing CRLF errors only (note count for later comparison)

---

## Task 1: `SaveSlotInfo` 型に新フィールド追加

**Files:**
- Modify: `src/engine/state/types.ts:11-16`

- [ ] **Step 1.1: 型定義を編集**

`src/engine/state/types.ts:11-16` の既存:

```typescript
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  createdAt: number;
  updatedAt: number;
}
```

を以下に置換:

```typescript
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** パーティの居場所状態。"out" は Camp→Quit 等で迷宮内に居残り中。 */
  partyStatus: "inTown" | "inMaze" | "out";
  /** "out" 時のみ、最後にいた位置 (Restart 時の復帰先)。他の状態では undefined。 */
  outAtPosition?: MazePosition;
}
```

- [ ] **Step 1.2: typecheck — `db.listSlots` 戻り値が型不一致になり破綻するはず**

```bash
pnpm typecheck
```

Expected: FAIL — `src/persist/db.ts` の `listSlots()` の戻り値型が `SaveSlotInfo[]` なのに新フィールドを返していない、というエラー。これは Task 2 で解消する。

(typecheck エラーが出ない場合 = MazePosition の import が漏れている可能性があるので、import 文に `MazePosition` が含まれているか確認。既存の `types.ts` 内で `MazePosition` が定義済みなのでファイル内で参照可能、import は不要のはず。)

- [ ] **Step 1.3: 一旦コミットせずに Task 2 へ進む**

このタスクの commit は Task 2 と統合する (型追加だけでは typecheck が壊れるため)。

---

## Task 2: `db.listSlots()` の拡張 (TDD)

**Files:**
- Modify: `src/persist/db.ts:86-92`
- Modify: `tests/persist/save.test.ts` (末尾に describe ブロック追加)

### Test first

- [ ] **Step 2.1: `tests/persist/save.test.ts` の末尾に新 describe を追加**

既存ファイルの末尾 (`describe("save/load atomic", ...)` の `})` の後) に追記。`EMPTY_PARTY` と `GameState` は既存 import 文 (1 行目) に含まれているので追加 import 不要:

```typescript
describe("listSlots party status extraction", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("includes partyStatus + outAtPosition extracted from gameState", async () => {
    // 3 つのスロットを作成: inTown / inMaze / out
    const stateInTown: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "inTown" },
    };
    const stateInMaze: GameState = {
      phase: "maze",
      pos: { level: 1, x: 0, y: 19, dir: "n" },
      party: { ...EMPTY_PARTY, status: "inMaze" },
    };
    const outPos = { level: 1, x: 5, y: 10, dir: "e" } as const;
    const stateOut: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "out", outAtPosition: outPos },
    };

    await db.saveStateAtomic({
      slotId: undefined,
      name: "Town",
      state: stateInTown,
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Maze",
      state: stateInMaze,
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Out",
      state: stateOut,
      changedCharacters: [],
    });

    const slots = await db.listSlots();
    expect(slots).toHaveLength(3);

    // updatedAt desc order: Out, Maze, Town
    const out = slots.find((s) => s.name === "Out");
    const maze = slots.find((s) => s.name === "Maze");
    const town = slots.find((s) => s.name === "Town");
    if (!out || !maze || !town) throw new Error("missing slot");

    expect(out.partyStatus).toBe("out");
    expect(out.outAtPosition).toEqual(outPos);

    expect(maze.partyStatus).toBe("inMaze");
    expect(maze.outAtPosition).toBeUndefined();

    expect(town.partyStatus).toBe("inTown");
    expect(town.outAtPosition).toBeUndefined();
  });
});
```

- [ ] **Step 2.2: テスト失敗を確認**

```bash
pnpm test tests/persist/save.test.ts 2>&1 | tail -20
```

Expected: 新テストが FAIL (現在の `listSlots` は `partyStatus`/`outAtPosition` を返していないため、`out.partyStatus` が undefined)。既存 4 件は依然 pass。

(または Task 1 の型追加により、型エラーで test ファイル自体がコンパイルできない可能性もある。その場合は Step 2.3 の実装を入れて typecheck を通してから再実行。)

### Implement

- [ ] **Step 2.3: `db.listSlots()` を書き換え**

`src/persist/db.ts:86-92` の既存:

```typescript
async listSlots(): Promise<SaveSlotInfo[]> {
  const idb = await openWizardryDB();
  const all = await idb.getAll("saveSlot");
  return all
    .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
},
```

を以下に置換:

```typescript
async listSlots(): Promise<SaveSlotInfo[]> {
  const idb = await openWizardryDB();
  const all = await idb.getAll("saveSlot");
  return all
    .map(({ id, name, createdAt, updatedAt, gameState }) => {
      // 1 スロットの deserialize 失敗が他をブロックしないよう個別に try/catch。
      // 失敗時は安全な inTown フォールバック (= Restart リストには出ない)。
      try {
        const state = deserializeState(gameState);
        return {
          id,
          name,
          createdAt,
          updatedAt,
          partyStatus: state.party.status,
          outAtPosition: state.party.outAtPosition,
        };
      } catch {
        return {
          id,
          name,
          createdAt,
          updatedAt,
          partyStatus: "inTown" as const,
        };
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
},
```

注: `deserializeState` は同ファイル冒頭で既に import 済 (`import { deserializeState, serializeState } from "./serialize";`)。追加 import 不要。

- [ ] **Step 2.4: テストパス確認 + 既存全テストのパス確認**

```bash
pnpm test tests/persist/save.test.ts 2>&1 | tail -5
```

Expected: 5/5 pass (既存 4 + 新規 1)。

```bash
pnpm test 2>&1 | grep -E "Test Files|Tests" | tail -2
```

Expected: 全件 pass、テスト数が +1 増加。

- [ ] **Step 2.5: typecheck**

```bash
pnpm typecheck
```

Expected: clean。Task 1 で出ていた型エラーが解消される。

- [ ] **Step 2.6: コミット (Task 1 + Task 2 統合)**

```bash
git add src/engine/state/types.ts src/persist/db.ts tests/persist/save.test.ts
git commit -m "feat(persist): expose partyStatus + outAtPosition in listSlots()"
```

---

## Task 3: `RestartList.tsx` の OUT フィルタ + 空メッセージ分岐

**Files:**
- Modify: `src/screens/Utilities/RestartList.tsx`

- [ ] **Step 3.1: 書き換え**

`src/screens/Utilities/RestartList.tsx` 全体を以下に置換:

```typescript
import type { SaveSlotInfo } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function RestartList() {
  const t = useT();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    db.listSlots().then(setSlots);
  }, []);

  // OUT 状態のスロットのみ表示 (1981 原典の Restart Out Party 仕様準拠)
  const outSlots = slots.filter((s) => s.partyStatus === "out");

  // 空メッセージは 2 ケース:
  // - そもそもセーブが 1 件もない → "empty"
  // - セーブはあるが OUT のパーティが居ない → "noOutParty"
  const emptyMessage =
    slots.length === 0 ? t("utilities.restart.empty") : t("utilities.restart.noOutParty");

  return (
    <div className="menu-screen">
      <Frame title={t("utilities.restart.title")}>
        {outSlots.length === 0 && <p>{emptyMessage}</p>}
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

- [ ] **Step 3.2: typecheck**

```bash
pnpm typecheck
```

Expected: FAIL — `t("utilities.restart.noOutParty")` が i18n キーの型に存在しない。Task 4 で解消する。

(もし `useT` が string 型をそのまま受けるユルい実装なら typecheck は通る。その場合はそのまま進む。)

- [ ] **Step 3.3: 一旦コミットせず Task 4 へ**

---

## Task 4: i18n キー追加

**Files:**
- Modify: `src/i18n/messages.ts:157` (en) と `:321` (ja)

- [ ] **Step 4.1: en に追加**

`src/i18n/messages.ts:157` の `"utilities.restart.empty": "No saved parties to restart.",` の直後に追加:

```typescript
    "utilities.restart.noOutParty": "No out parties.",
```

- [ ] **Step 4.2: ja に追加**

`src/i18n/messages.ts:321` の `"utilities.restart.empty": "ふっき できる パーティは ありません。",` の直後に追加:

```typescript
    "utilities.restart.noOutParty": "OUT パーティは いません。",
```

- [ ] **Step 4.3: typecheck + test**

```bash
pnpm typecheck && pnpm test 2>&1 | grep -E "Test Files|Tests" | tail -2
```

Expected: typecheck clean、全テスト pass。

- [ ] **Step 4.4: コミット (Task 3 + Task 4 統合)**

```bash
git add src/screens/Utilities/RestartList.tsx src/i18n/messages.ts
git commit -m "feat(screens): RestartList only shows OUT parties + dedicated empty message"
```

---

## Task 5: 手動プレイテスト + ビルド確認

- [ ] **Step 5.1: ビルド**

```bash
pnpm build 2>&1 | grep -E "kB|gzip|built|error" | tail -5
```

Expected: build succeed。バンドルサイズが大幅変動していないことを確認 (本変更は数行レベルなので ±0.1KB 程度のはず)。

- [ ] **Step 5.2: 手動プレイテスト** (`pnpm dev`)

```bash
pnpm dev
```

ブラウザで:

1. **空状態の確認**: 起動直後 (セーブなし) で `Edge of Town → Utilities → Restart Out Party` を開き、`No saved parties to restart.` (= "empty" メッセージ) が出ることを確認
2. **inTown セーブのケース**: `New Game → キャラ作成 → Castle → Temple → Save (任意の名前)` でセーブ。`Edge of Town → Utilities → Restart Out Party` を開いた時、いま作った inTown のセーブが**表示されない** (代わりに `OUT パーティは いません` メッセージ) ことを確認
3. **out セーブのケース**: 上記から `Maze` に入り、`C` で Camp、`Quit to Town` を選択 (= status="out" になる)。再度 Temple で Save し直す (status="out" 状態を保存)。`Utilities → Restart Out Party` を開いた時、いま作った out のセーブが**表示される**ことを確認
4. **Restart 動作**: 上記 OUT スロットを選択 → `restartParty` event が発火し、迷宮の outAtPosition に復帰することを確認

**問題があれば修正後に再テスト**。

- [ ] **Step 5.3: 最終 lint + typecheck + test**

```bash
pnpm test && pnpm typecheck && pnpm lint 2>&1 | tail -3
```

Expected:
- test: 全件 pass (Phase 0 baseline +1)
- typecheck: clean
- lint: pre-existing CRLF と同数 (新規エラーなし)

---

## 完了チェックリスト

- [ ] `SaveSlotInfo` に `partyStatus` + `outAtPosition?` 追加
- [ ] `db.listSlots()` が `gameState` から両フィールドを抽出
- [ ] `db.listSlots()` の deserialize 失敗が個別 try/catch で隔離されている
- [ ] `RestartList.tsx` が `partyStatus === "out"` でフィルタ
- [ ] 空メッセージ分岐 2 ケース (slots.length === 0 vs outSlots.length === 0)
- [ ] i18n キー `utilities.restart.noOutParty` 追加 (en/ja)
- [ ] `db.listSlots party status extraction` テスト追加 (3 スロット fixture で検証)
- [ ] 手動プレイテスト 4 シナリオ確認 (空 / inTown / out / restart 動作)
- [ ] `saveSlot` IndexedDB スキーマ不変、既存セーブと後方互換 (deserialize 失敗時のフォールバックで担保)
