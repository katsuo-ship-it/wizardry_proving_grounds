# Restart Out Party — OUT 状態フィルタ設計書

**Status**: Draft
**Author**: katsuo.ito + Claude Opus 4.7
**Date**: 2026-05-10
**Predecessor**: M5 (Temple Save & Restore、Restart Out Party 簡易版)
**Successor**: M6 以降 (i18n 仕上げ等は無関係、独立したタスク)

## 1. 目的

M5 で実装した Utilities 配下の "Restart Out Party" 画面は、現状すべての save
スロットを表示する暫定実装である (`src/screens/Utilities/RestartList.tsx:17`
コメント "M5 範囲: 全スロットをリスト表示。OUT 状態判定は将来")。本タスクは
OUT 状態のパーティが入っているスロットのみを表示するように絞り込む。

1981 オリジナルの "Restart Out Party" は、迷宮内に居残っているパーティ (= 死亡
／キャンプ→Quit 等で OUT 扱いになった一行) を再開する機能であり、Town に居る
パーティをここに混ぜて表示するのはユーザー混乱の元になる。

## 2. スコープ

### 含む

- `db.listSlots()` の戻り値に `partyStatus` (および "out" 時のみ `outAtPosition`) を含める
- `RestartList.tsx` で `partyStatus === "out"` のスロットのみ表示
- "OUT のパーティが居ない" 時の専用空メッセージ (i18n キー新設)
- vitest で `db.listSlots()` の新フィールドを検証

### 含まない

- Title 画面の Continue メニューの挙動変更 (Continue は全スロット表示が正しい)
- `outAtPosition` の UI 表示 (例: "L1 (5,10) N") — 今回はリストに position を出さない
- `saveSlot` IndexedDB スキーマの変更 (`partyStatus` は永続化レコード自体には含めない)
- `partyStatus` 専用の IndexedDB index 追加
- 既存テストの大規模なリファクタリング

### 不変

- `saveSlot` レコードの永続化フォーマット (= 既存セーブとの後方互換)
- save / load の挙動 (`saveStateAtomic` / `loadStateAtomic`)
- reducer / state / event 定義
- Restart 動作 (`restartParty` event handler) — 選択スロットのロジックは変えない

## 3. 採用アプローチと却下案

| 選択肢 | 説明 | 採否 |
|---|---|---|
| **list 時に gameState を deserialize して抽出** | 既存 `saveSlot.gameState` (JSON 文字列) を `listSlots` 内で都度 deserialize し、`party.status` / `party.outAtPosition` を抽出 | **✓** |
| `saveSlot` レコードに `partyStatus` を denormalize | save 時に `partyStatus` を別カラムとして書き込み、list は単純読み出し | ✗ — schema バージョン更新と既存セーブの migration が必要、現規模ではオーバーキル |

選定理由:
- セーブスロット数は通常一桁。list 毎に全件 deserialize するコストは無視できる
- データスキーマ変更を伴わないため、後方互換性が完全に保たれる
- 既存セーブも追加処理なしでフィルタ対象になる

## 4. 設計

### 4.1 型定義の拡張 (`src/engine/state/types.ts`)

`SaveSlotInfo` に 2 フィールドを追加。`outAtPosition` は status="out" のときのみセット
される (status の値で識別可能なので、`partyStatus !== "out"` 時は undefined)。

```typescript
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  createdAt: number;
  updatedAt: number;
  partyStatus: "inTown" | "inMaze" | "out";  // 新規
  outAtPosition?: MazePosition;               // 新規 (status === "out" 時のみ)
}
```

### 4.2 `db.listSlots()` の拡張 (`src/persist/db.ts`)

各スロットの `gameState` (JSON 文字列) を `deserializeState()` で復元し、
`party.status` と `party.outAtPosition` を抽出して新フィールドに載せる。
ソート順 (`updatedAt` 降順) は不変。

```typescript
async listSlots(): Promise<SaveSlotInfo[]> {
  const idb = await openWizardryDB();
  const all = await idb.getAll("saveSlot");
  return all
    .map(({ id, name, createdAt, updatedAt, gameState }) => {
      const state = deserializeState(gameState);
      return {
        id,
        name,
        createdAt,
        updatedAt,
        partyStatus: state.party.status,
        outAtPosition: state.party.outAtPosition,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
```

注: `deserializeState` は既に export 済 (`src/persist/serialize.ts`) で
`db.loadStateAtomic` が利用している。新規の依存追加なし。

### 4.3 `RestartList.tsx` の絞り込み

```typescript
const outSlots = slots.filter((s) => s.partyStatus === "out");
```

表示メニュー項目は `outSlots` から生成。空の場合のメッセージ分岐:
- `slots.length === 0` (= セーブが 1 件もない): 既存 `utilities.restart.empty` キー
- `slots.length > 0 && outSlots.length === 0` (= セーブはあるが OUT が無い):
  新規 `utilities.restart.noOutParty` キー

### 4.4 i18n 文言追加 (`src/i18n/messages.ts`)

```typescript
"utilities.restart.noOutParty": {
  en: "No out parties.",
  ja: "OUT のパーティはいません。",
}
```

(キー命名は既存の `utilities.restart.empty` と同じ階層に揃える。)

## 5. テスト戦略

### 5.1 `tests/persist/save.test.ts` (または同等の場所、既存に合わせる)

`db.listSlots()` の新フィールドを検証する 1 ブロック追加:

```typescript
describe("listSlots party status extraction", () => {
  it("includes partyStatus and outAtPosition for each slot", async () => {
    // fake-indexeddb で 3 スロット作成 (inTown / inMaze / out)
    // listSlots() の戻り値が新フィールドを含むことを assertion
    // out スロットの outAtPosition が正しく設定されていることを assertion
    // inTown / inMaze の outAtPosition が undefined であることを assertion
  });
});
```

想定追加テスト数: 1〜2 件。

### 5.2 既存テストの調整

`SaveSlotInfo` を生成する既存テストヘルパーや mock があれば、新フィールドを
任意プロパティではなく必須として渡すよう更新 (TypeScript strict が壊れる箇所
だけが対象)。

### 5.3 UI コンポーネントテストは追加しない

`RestartList.tsx` のフィルタ + 空メッセージ分岐は 4-5 行の単純ロジックで、
`db.listSlots` のテストでデータ層は担保される。UI 文言判定だけのために
react-testing-library テストを書くコスト見合わず YAGNI。手動プレイテスト
時に Title → New Game → Camp → Quit → Utilities → Restart の流れで動作確認。

## 6. 移行計画

1. types.ts に新フィールド追加 → 既存呼び出し側 (Title `Continue` 等) は新フィールドを無視するだけなので影響なし
2. db.ts の `listSlots` 拡張 + テスト
3. RestartList.tsx のフィルタ + 空メッセージ分岐
4. messages.ts に新 i18n キー (en/ja)
5. 手動プレイテスト

PR 単位は 1 つにまとめる想定 (機能変更が小規模で論理単位が分割しにくい)。

## 7. リスク

| リスク | 影響 | 対策 |
|---|---|---|
| `deserializeState` が malformed gameState で throw | listSlots() が一切のスロットを返せなくなる | `try/catch` で 1 スロットの失敗が他をブロックしないようにする (失敗スロットは partyStatus を `"inTown"` でフォールバックして表示はするが Restart には選ばれない) |
| 既存セーブの `party.status` が undefined | (現実的にはあり得ないが、保険) | deserializeState 後に `state.party?.status ?? "inTown"` でフォールバック |
| listSlots のパフォーマンス劣化 | スロット数 n に対して O(n) deserialize、JSON.parse + バリデーション | スロット数が二桁にとどまる限り無視できる。10 スロットで <5ms 想定 |

## 8. オープン項目

なし。
