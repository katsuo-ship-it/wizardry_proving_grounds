# Wizardry Proving Grounds — 設計書

- **作成日**: 2026-05-04
- **対象**: Apple II 版 Wizardry #1 "Proving Grounds of the Mad Overlord" (1981) の Web 再現プロジェクト
- **方針**: D アプローチ（snafaru/Wizardry.Code の Pascal ソースを仕様書として参照）+ A アプローチ（TypeScript でゼロから実装）
- **リポジトリ名**: `wizardry_proving_grounds`

---

## 1. 目標とスコープ

### プロジェクトゴール

1981 年版 Apple II Wizardry #1 の挙動・見た目・体験をブラウザで忠実に再現する。最終的にはゲーム全体の完全再現を目指し、章ごとに段階リリースする。

### 仕様の基準

- **ターゲット仕様**: 1981 年オリジナル Apple II 版（v3.2 ではなく原典）
- **独自追加**: 寺院 (Temple of Cant) でのセーブ機能のみ。フレーバー上は「神官の年代記に旅路を記す」と読み替える
- **仕様参照**: snafaru/Wizardry.Code の `.DSK` から CiderPress で抽出した Pascal ソースを `docs/reference/` に配置し、コード実装と並べて参照する。Pascal で読み解けない部分は <https://www.tk421.net/wizardry/wiz1maps.shtml> を二次ソースとする

### 章割り（リリース計画）

- **Chapter 1**: 街全体（Castle ハブと全施設）+ ダンジョン 1F の歩行（戦闘なし）
- **Chapter 2**: 戦闘システム + Camp + 死亡・蘇生
- **Chapter 3**: 呪文（Mage 25 種 + Priest 25 種）
- **Chapter 4 以降**: B2F〜B10F の迷宮データ、ボス（Werdna）、エンディング、識別済み/呪われた装備

### Chapter 1 の Definition of Done

ブラウザで以下が一通りプレイ可能:

1. タイトル画面（Apple II 風）
2. New Game → Edge of Town へ遷移
3. Castle へ移動 → 各施設が選択可能
4. Training Grounds でキャラ 6 人作成（種族・職業・属性・名前・能力値振り分け）
5. Tavern でパーティ編成（最大 6 人）
6. Inn で休息（HP 全快のみ。レベルアップは Chapter 2）
7. Boltac's Trading Post で買い物（Chapter 1 装備のみ、フレーバー）
8. Edge of Town → Maze 1F に進入
9. 1F の壁・扉・階段に従って歩行（前進・後退・左回転・右回転）
10. 自動マッピング表示
11. Castle 帰還
12. Temple でセーブ → タイトル → Continue で復元
13. 設定で日本語/英語切替
14. ブラウザリロードしても状態が永続化されている
15. ウィンドウリサイズで整数倍スケールを維持

### Chapter 1 で行わないこと

- 戦闘・モンスター遭遇・攻撃
- 呪文使用
- レベルアップ判定
- 死亡・蘇生
- Camp の詳細機能
- 罠・宝箱
- B2F 以降の迷宮
- BGM/SE
- 識別フロー、呪われた装備の挙動

---

## 2. 技術スタック

| 領域 | 採用技術 | 備考 |
|---|---|---|
| ランタイム | Node.js 20+ | 開発環境 |
| パッケージ | pnpm | 高速・disk 効率◎ |
| バンドラ | Vite 5+ | SPA 構成 |
| 言語 | TypeScript 5+ (strict) | 型安全最優先 |
| UI | React 18+ | 画面コンポーネント |
| 状態管理 | Zustand | 自作 reducer の薄いラッパー |
| 永続化 | `@sqlite.org/sqlite-wasm` (OPFS VFS) | クライアント完結 |
| 描画 (迷宮) | HTML5 Canvas 2D | HGR 風ワイヤーフレーム |
| 描画 (UI) | HTML + CSS | Apple II 風フォント・配色 |
| Lint/Format | Biome | ESLint + Prettier 代替 |
| テスト | Vitest | jsdom 環境含む |
| E2E | Playwright (Chapter 2 以降) | Chapter 1 は手動チェック |
| ホスティング | Vercel | 静的サイト（`vite build` の `dist/` を配信） |
| CI | GitHub Actions | lint + test + build |

### 採用しないもの

- **Next.js**: SPA 用途には過剰。SSR 不要、ルーティングはステートマシン内で完結
- **react-i18next**: 自作の薄いプロバイダで十分（バンドル削減）
- **Redux / XState**: 自作 reducer + discriminated union で軽量に
- **Tailwind**: Apple II 風の特殊な見た目には素の CSS の方が制御しやすい
- **認証 / クラウド DB**: Chapter 1 の段階では不要、将来も導入予定なし

---

## 3. ディレクトリ構成

```
wizardry_proving_grounds/
├── .github/workflows/ci.yml            # GitHub Actions
├── docs/
│   ├── superpowers/specs/              # 設計書
│   ├── reference/wiz1/                 # CiderPress 抽出の Pascal ソース
│   └── chapters/                       # 章ごとの実装計画
├── public/
│   └── fonts/
│       ├── PrintChar21.ttf             # 英語: Apple II 風
│       └── misaki_gothic.ttf           # 日本語: 美咲フォント 8x8
├── scripts/
│   └── extract-maze.ts                 # Pascal MAZEDATA → TS 変換ツール
├── src/
│   ├── main.tsx                        # エントリ
│   ├── App.tsx                         # ルートコンポーネント
│   ├── engine/                         # 純粋ロジック（React/DOM 非依存）
│   │   ├── state/
│   │   │   ├── types.ts                # GameState / GameEvent 型定義
│   │   │   └── reduce.ts               # トップレベル reducer
│   │   ├── rules/
│   │   │   ├── character.ts            # キャラ作成・能力値ボーナス
│   │   │   ├── party.ts                # パーティ編成ルール
│   │   │   └── movement.ts             # 迷宮移動ロジック
│   │   ├── data/
│   │   │   ├── races.ts
│   │   │   ├── classes.ts
│   │   │   ├── alignments.ts
│   │   │   ├── items.ts
│   │   │   └── maze/level1.ts
│   │   ├── animation/orchestrator.ts   # 状態遷移→アニメ種別判定
│   │   └── rng/                        # 乱数 DI（mulberry32 等）
│   ├── screens/
│   │   ├── Title/
│   │   ├── EdgeOfTown/
│   │   ├── Castle/
│   │   ├── Training/
│   │   ├── Tavern/
│   │   ├── Boltac/
│   │   ├── Temple/
│   │   ├── Inn/
│   │   └── Maze/
│   ├── render/
│   │   ├── canvas/                     # HGR 風 line/rect ラッパ
│   │   └── maze/                       # 視点→線分配列の変換
│   ├── store/gameStore.ts              # Zustand ストア
│   ├── persist/
│   │   ├── db.ts                       # SQLite 接続・API
│   │   └── migrations/
│   │       └── 001_initial.sql
│   ├── i18n/
│   │   ├── messages.ts                 # MESSAGES.{en, ja}
│   │   └── useT.ts                     # フック
│   ├── ui/                             # 共通 UI（罫線・メニュー枠）
│   └── audio/                          # （Chapter 2 以降）
├── tests/
│   ├── engine/                         # reducer/rules の単体テスト
│   └── persist/                        # SQLite 永続化テスト
├── biome.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── CHANGELOG.md
```

### 設計上の境界

- **`engine/`** は React も DOM も触らない純粋 TypeScript。Vitest で完全カバレッジが目標
- **`screens/`** は engine の state を表示するだけの dumb component
- **`store/`** が両者を繋ぐ薄いレイヤ
- **`render/`** は Canvas 描画ユーティリティのみ
- **`persist/`** は SQLite 操作の境界。engine から直接呼ばず、store 経由

---

## 4. ステートマシン設計

ゲーム全体を有限ステートマシンで表現する。XState は使わず、自作 reducer + discriminated union を採用。

### トップレベル状態

```typescript
type GameState =
  | { phase: 'title' }
  | { phase: 'edgeOfTown'; party: PartyState }
  | { phase: 'castle'; party: PartyState }
  | { phase: 'training'; sub: TrainingSubState; party: PartyState }
  | { phase: 'tavern'; sub: TavernSubState; party: PartyState }
  | { phase: 'boltac'; sub: BoltacSubState; party: PartyState }
  | { phase: 'temple'; sub: TempleSubState; party: PartyState }
  | { phase: 'inn'; sub: InnSubState; party: PartyState }
  | { phase: 'maze'; pos: MazePosition; party: PartyState };
  // Chapter 2+ : combat, camp, levelUp, dead など
```

### イベント

```typescript
type GameEvent =
  | { type: 'startGame' }
  | { type: 'enterCastle' }
  | { type: 'enterTraining' }
  | { type: 'createCharacter'; data: CharacterDraft }
  | { type: 'enterTavern' }
  | { type: 'addToParty'; characterId: number }
  | { type: 'removeFromParty'; slot: number }
  | { type: 'enterBoltac' }
  | { type: 'buyItem'; itemId: string; characterId: number }
  | { type: 'enterTemple' }
  | { type: 'saveAtTemple'; slotName: string }    // 独自追加
  | { type: 'loadFromTemple'; slotId: number }    // 独自追加
  | { type: 'enterInn' }
  | { type: 'rest'; characterId: number }
  | { type: 'enterMaze' }
  | { type: 'moveForward' }
  | { type: 'turnLeft' }
  | { type: 'turnRight' }
  | { type: 'returnToTown' };
```

### Reducer

```typescript
function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'title': return reduceTitle(state, event);
    case 'castle': return reduceCastle(state, event);
    case 'maze': return reduceMaze(state, event);
    // ...
  }
}
```

各 phase の reducer は純粋関数。Vitest でテーブルテスト可能。

### Zustand 連携

```typescript
const useGameStore = create<GameStore>((set, get) => ({
  state: { phase: 'title' },
  isAnimating: false,
  dispatch: (event) => {
    if (get().isAnimating) return;
    const next = reduce(get().state, event);
    const anim = bindAnimation(get().state, next);
    if (anim) {
      set({ isAnimating: true });
      runAnimation(anim, () => set({ state: next, isAnimating: false }));
    } else {
      set({ state: next });
    }
  },
}));
```

### セーブとの関係

- **セーブ** = `state` を JSON シリアライズして SQLite に保存
- **ロード** = JSON から `state` を復元して `useGameStore` に投入
- **オートセーブなし**（1981 仕様尊重 / 寺院セーブのみ）

---

## 5. レンダリング層

### Apple II 表示仕様の再現

| 項目 | Apple II 原典 | 本実装 |
|---|---|---|
| HGR 解像度 | 280×192 | 内部 280×192 → 整数倍スケール |
| グリフ | 7×8 ピクセル | 7×8 ビットマップフォント |
| 配色 | 黒・白・緑・紫・橙 (HGR 制約) | 黒背景・白前景中心、迷宮ワイヤーフレームは白 |
| アスペクト | 4:3 寄り | 4:3 を維持してウィンドウに合わせ scale |

### スケーリング戦略

```
ウィンドウサイズ
  ↓
内部 viewport: 280×192
  ↓
CSS transform: scale() で整数倍 (1x / 2x / 3x / 4x)
  ↓
ウィンドウからはみ出す場合は縮小、最小は 1x
```

`image-rendering: pixelated` でアンチエイリアス無効。

### Canvas 層（迷宮ビュー）

- 280×192 の `<canvas>` を内部解像度として保持
- `drawLine` / `drawRect` の極小ラッパのみ実装
- 視点情報 (`pos: {x, y, dir, level}`) から見える壁・扉・階段を計算 → 線分配列 → Canvas
- 描画は state 変化時のみ（RAF を常時回さない、演出時のみ起動）

### HTML/CSS 層（メニュー・テキスト・ステータス）

- Apple II 風 Web フォント（**Print Char 21**, Free）
- `font-smoothing: none; -webkit-font-smoothing: none;`
- 罫線は CSS の `border-image` で Apple II ASCII 風
- 配色は黒背景・白文字・緑/橙のアクセント

### 日本語フォント

英語と日本語で別フォントを使い分ける:

- **英語**: Print Char 21（7×8 Apple II 風）
- **日本語**: 美咲フォント 8×8（8 ビット PC 風日本語ピクセルフォント）

「Apple II 風」の純度はやや下がるが、PC-9801 風レトロ感として許容範囲。

### 演出 RAF

| 演出 | 持続時間 | 実装 |
|---|---|---|
| 街⇄迷宮フェード | 300ms | CSS opacity トランジション |
| 前進 | 150ms | Canvas で前後フレーム補間 |
| 回転 | 200ms | Canvas で水平スライド |
| ドア開閉 | 250ms | Canvas で扉の線分を段階移動 |
| メッセージ開閉 | 100ms | CSS `transform: scaleY()` |

### 演出と入力の関係

演出中は入力を受け付けない（連打による暴走防止）。`isAnimating` フラグで dispatch をブロック。

---

## 6. データ層 (SQLite + OPFS)

### ライブラリ

- `@sqlite.org/sqlite-wasm` (公式 WASM ビルド、OPFS VFS 同梱)
- バンドル: ~1.2 MB / gzip 後 ~600 KB（初回ロードのみ）

### スキーマ (Chapter 1)

```sql
CREATE TABLE save_slot (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  game_state   TEXT NOT NULL          -- GameState の JSON
);

CREATE TABLE character (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id      INTEGER NOT NULL REFERENCES save_slot(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  race         TEXT NOT NULL,
  class        TEXT NOT NULL,
  alignment    TEXT NOT NULL,
  attributes   TEXT NOT NULL,         -- {str, iq, pie, vit, agi, luk}
  status       TEXT NOT NULL,         -- {hp, mp, level, exp, gold, ac, ...}
  inventory    TEXT NOT NULL,
  status_flags TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL                 -- db_version 等
);
```

### 設計判断

- **JSON カラム多用**: Wizardry のキャラは項目数が多く章ごとに増える → JSON で柔軟性確保。検索クエリ非投入なので問題なし
- **save_slot 1 行 = 冒険 1 つ**: 複数セーブ管理可
- **character はスロット紐付き**: 1981 仕様の「ロスター」共有プールではなく、UX 重視でスロット独立。将来「他スロットからインポート」機能で代替可

### マイグレーション

```
src/persist/migrations/
├── 001_initial.sql   # Chapter 1
├── 002_*.sql         # Chapter 2 で追加
```

`meta` テーブルの `db_version` で管理。

### API

```typescript
export const db = {
  init(): Promise<void>;
  listSlots(): Promise<SaveSlot[]>;
  createSlot(name: string): Promise<SaveSlotId>;
  deleteSlot(id: SaveSlotId): Promise<void>;
  saveState(id: SaveSlotId, state: GameState): Promise<void>;
  loadState(id: SaveSlotId): Promise<GameState>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
};
```

### 寺院セーブのフロー

```
寺院に入る → "Pray to record your journey" メニュー
  ↓
スロット選択（既存上書き or 新規作成）
  ↓
db.saveState(slotId, currentGameState)
  ↓
"The chronicler scribes your tale" メッセージ
```

ロードはタイトルの "Continue" → スロット一覧 → 選択 → 復元。

### OPFS の挙動

- ブラウザの Origin Private File System に `wizardry.sqlite` として保持
- ユーザーから直接見えない
- ブラウザのキャッシュクリアで消える点を README/設定画面で告知
- 将来「DB エクスポート→ファイル保存」機能の余地を残す

---

## 7. ゲームデータ

### Chapter 1 で必要

| テーブル | 内容 | データソース |
|---|---|---|
| Races | 5 種（Human, Elf, Dwarf, Gnome, Hobbit） | Pascal `RACES` |
| Classes | 8 種（Fighter, Mage, Priest, Thief, Bishop, Samurai, Lord, Ninja） | Pascal `CLASSES` |
| Alignments | Good, Neutral, Evil | 定数 |
| Class Requirements | 各職業の能力値・属性条件 | Pascal `CLASS_REQUIREMENTS` |
| Items (shop) | Boltac 取扱品（Chapter 1 装備のみ） | Pascal `ITEMS` |
| Maze L1 | 1 階のセル情報 | Pascal `MAZEDATA` または tk421 地図 |

### 定義スタイル

```typescript
// src/engine/data/races.ts
// Reference: docs/reference/wiz1/Pascal/RACES.TEXT
export const RACES = {
  human:  { id: 'human',  base: { str: 8, iq: 8, pie: 5, vit: 8, agi: 8, luk: 9 } },
  elf:    { id: 'elf',    base: { str: 7, iq:10, pie:10, vit: 6, agi: 9, luk: 6 } },
  dwarf:  { id: 'dwarf',  base: { str:10, iq: 7, pie:10, vit:10, agi: 5, luk: 6 } },
  gnome:  { id: 'gnome',  base: { str: 7, iq: 7, pie:10, vit: 8, agi:10, luk: 7 } },
  hobbit: { id: 'hobbit', base: { str: 5, iq: 7, pie: 7, vit: 6, agi:10, luk:15 } },
} as const;
```

- `as const` で型推論を強くする
- 数値は Pascal から 1:1 で書き起こし、推測補完しない
- 各ファイル先頭に Pascal の対応箇所をコメント

### 迷宮データ

```typescript
export type CellEdge = 'open' | 'wall' | 'door' | 'secretDoor';
export type SpecialTile = 'none' | 'stairsUp' | 'stairsDown' | 'darkness' | 'spinner' | 'message';

export interface Cell {
  edges: { n: CellEdge; e: CellEdge; s: CellEdge; w: CellEdge };
  special: SpecialTile;
  messageId?: string;
}

export const MAZE_L1: Cell[][] = [/* 20×20 = 400 セル */];
```

### 抽出戦略

```
[第一選択] docs/reference/wiz1/MAZEDATA を解読
  ↓ 解読困難な場合
[フォールバック] tk421.net Wizardry 1 地図ページ
  ↓
人手で TS 定数に書き起こし（20×20、半日程度）
```

抽出スクリプト: `scripts/extract-maze.ts`（Node 実行）

---

## 8. i18n

### 構成

`react-i18next` 不採用、自作プロバイダ（バンドル削減・型安全性向上）。

```typescript
// src/i18n/messages.ts
export const MESSAGES = {
  en: {
    'edgeOfTown.title': 'Edge of Town',
    'castle.title': 'Castle',
    'temple.menu.pray': 'Pray to record your journey',
    'race.human': 'Human',
    'class.fighter': 'Fighter',
  },
  ja: {
    'edgeOfTown.title': '街のはずれ',
    'castle.title': '城',
    'temple.menu.pray': '祈りで旅路を記す',
    'race.human': '人間',
    'class.fighter': '戦士',
  },
} as const;
```

### フック

```typescript
export function useT() {
  const lang = useGameStore((s) => s.lang);
  return (key: MessageKey, vars?: Record<string, string | number>) => {
    let str = MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
    return str;
  };
}
```

### 切替

- 設定画面/タイトル画面に Language トグル
- 選択は `settings` テーブルに永続化
- 初回起動: `navigator.language` 判定（`ja*` なら ja、それ以外 en）

### ポリシー

- **キーは英語ベース**（例: `temple.menu.pray`）
- **メッセージ ID は階層的**（screen.section.detail）
- **日本語版用語**は PC 版 Wizardry 準拠（マロール、ロクトフェイト、ボルタック等）
- フォールバック順: ja → en → key string

---

## 9. アニメーション層

### 状態遷移とアニメのバインド

```typescript
function bindAnimation(prev: GameState, next: GameState): AnimationKind | null {
  if (prev.phase === 'castle' && next.phase === 'maze') return 'fade';
  if (prev.phase === 'maze' && next.phase === 'castle') return 'fade';
  if (prev.phase === 'maze' && next.phase === 'maze') {
    if (prev.pos.x !== next.pos.x || prev.pos.y !== next.pos.y) return 'mazeStep';
    if (prev.pos.dir !== next.pos.dir) return 'mazeTurn';
  }
  return null;
}
```

### `runAnimation` の実装

```typescript
function runAnimation(kind: AnimationKind, onDone: () => void) {
  const duration = ANIM_DURATION[kind];
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration);
    applyAnimationFrame(kind, t);
    if (t < 1) requestAnimationFrame(tick);
    else onDone();
  }
  requestAnimationFrame(tick);
}
```

- 演出層は state 遷移と独立 → reducer のテストに影響しない
- アニメ自体のテストは E2E (Chapter 2 以降の Playwright)

---

## 10. テスト戦略

### 三層

| 層 | 対象 | ツール | カバレッジ目標 |
|---|---|---|---|
| Unit | `engine/` (reducer・rules・data) | Vitest | 90%+ |
| Integration | persist・i18n・store 連携 | Vitest (jsdom) | 主要パス |
| E2E | 画面遷移シナリオ | 手動 (Chapter 1) → Playwright (Chapter 2+) | クリティカルパス |

### Unit (最重要)

ステートマシン・純粋ロジックを徹底テーブルテスト:

```typescript
describe('castle phase', () => {
  it.each([
    [{ phase: 'castle', party }, { type: 'enterTraining' }, { phase: 'training', sub: 'menu', party }],
    [{ phase: 'castle', party }, { type: 'enterTavern' },   { phase: 'tavern',   sub: 'menu', party }],
    [{ phase: 'castle', party }, { type: 'enterMaze' },     { phase: 'maze',     pos: START_POS, party }],
  ])('reduce(%o, %o) == %o', (state, event, expected) => {
    expect(reduce(state, event)).toEqual(expected);
  });
});
```

### 乱数の DI

すべてのランダム要素は依存性注入された RNG を使う:

```typescript
const rng = mulberry32(42);  // テスト時は決定論的
expect(rollBonus(rng)).toBe(7);
```

本番時は `Math.random` ベース。リプレイ機能（将来）への布石でもある。

### TDD ポリシー

- **`engine/` 内のロジックは TDD 必須**（テスト先行 / 仕様 = テスト）
- **`screens/` の React 層は TDD 不要**（手動検証で十分）
- Pascal を仕様書とする以上、テストは「Pascal の挙動と一致するか」を検証する手段になる

### 手動 E2E チェックリスト (Chapter 1)

```
□ タイトル → New Game → Edge of Town へ遷移
□ Edge of Town → Castle → Training Grounds でキャラ作成
□ パーティ編成 → 6 人組成
□ Castle → Maze 入口 → 1F 進入
□ 北・東・南・西へ移動、壁ブロック
□ ドア通過、階段表示
□ Castle 帰還、Temple でセーブ
□ ブラウザリロード → タイトル → Continue → 状態復元
□ 言語切替（EN ⇄ JA）
□ ウィンドウサイズ変更で整数倍スケール維持
```

### CI

`.github/workflows/ci.yml`:
- `pnpm install` → `pnpm biome check` → `pnpm vitest run` → `pnpm build`
- main への push で Vercel が自動デプロイ
- PR でも build/test が走る

---

## 11. Chapter 1 マイルストーン

| マイルストーン | 内容 | 目安 |
|---|---|---|
| M1 | プロジェクト基盤 + Apple II UI 基盤 + Title 画面 + 初回 Vercel デプロイ | 2-3 日 |
| M2 | Castle ハブ + 全施設のガラ画面（メニューだけ機能） | 3-4 日 |
| M3 | キャラ作成完成 + パーティ編成 | 3-4 日 |
| M4 | 迷宮データ + Canvas 描画 + 歩行 | 5-7 日 |
| M5 | SQLite セーブ・ロード + i18n 仕上げ + バグ修正 | 3-4 日 |
| M6 | 統合テスト・デプロイ・README | 1-2 日 |

合計: 20〜25 営業日 (4〜5 週間 / フルタイム近い投入で 3〜4 週間)。

---

## 12. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| Pascal MAZEDATA のフォーマット解読困難 | M4 遅延 | tk421 地図を二次ソースに切替（人手書き起こし） |
| OPFS 非対応ブラウザ | セーブ機能不可 | 起動時検出 → エラーメッセージ + 「対応ブラウザの案内」 |
| WASM SQLite のロード遅延 | 初回起動 UX 悪化 | スプラッシュ画面でロード進捗表示 |
| Apple II 風フォントのライセンス | リリース不可 | 起用前に Print Char 21 / 美咲フォントのライセンス再確認 |
| 1981 オリジナル仕様の数値が不確定 | 再現精度低下 | Pascal を最優先、tk421 / Wizardry Wiki を補助、明記 |
| Chapter 1 が長期化 | モチベ低下 | M1 完了時点で Vercel に上げて毎週進捗を可視化 |

---

## 13. 著作権・ライセンス方針

- **本実装のソースコード**: MIT ライセンスでオープンソース化
- **元仕様の参照**: snafaru/Wizardry.Code の Pascal ソースは「仕様書」として参照のみ。コードを直接コピーしない（クリーンルーム実装）
- **Wizardry の商標・著作権**: Sir-Tech / 現在の権利者に帰属。本プロジェクトは非営利・教育目的のファン実装として扱う
- **README に明記**: 元著作権者への謝辞、本プロジェクトの非公式・非営利の旨、商用利用禁止

---

## 14. 将来の拡張（Chapter 2 以降）

- Chapter 2: 戦闘システム、Camp、死亡・蘇生、モンスターデータ、戦闘 UI、ステートマシン拡張
- Chapter 3: 呪文システム（50 種）、呪文 UI、呪文ターゲット選択
- Chapter 4: 罠・宝箱、識別フロー、呪われた装備
- Chapter 5: B2F〜B10F の迷宮データ、特殊マス（テレポート、暗闇、回転床）
- Chapter 6: ボス（Werdna）、エンディング
- Chapter 7+: BGM/SE、Playwright E2E、設定の細部、アクセシビリティ

---

## 付録 A: Apple II 用語と本実装の対応

| Apple II 原典 | 本実装での扱い |
|---|---|
| HGR (Hi-Res Graphics 280×192) | Canvas 内部解像度 280×192 + 整数倍 scale |
| Mouse Text フォント | Print Char 21 Web フォント |
| UCSD Pascal | TypeScript（Pascal を仕様書として参照） |
| ディスク I/O | OPFS + SQLite |
| キーボード入力 | DOM keydown イベント |
| Roster (キャラ共有プール) | save_slot ごとに独立した character テーブル |

## 付録 B: 参考資料

- snafaru/Wizardry.Code: <https://github.com/snafaru/Wizardry.Code>
- tk421 Wizardry 地図: <https://www.tk421.net/wizardry/wiz1maps.shtml>
- Wizardry I 公式情報: <https://www.zimlab.com/wizardry>
