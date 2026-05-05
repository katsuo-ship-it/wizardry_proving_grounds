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
- **仕様参照**: snafaru/Wizardry.Code の `.DSK` から CiderPress で抽出した Pascal ソースを `docs/reference/` に配置し、コード実装と並べて参照する。Pascal で読み解けない部分は二次ソースを使う（[付録 B](#付録-b-参考資料) 参照）

### 章割り（リリース計画）

- **Chapter 1**: 街全体（Castle ハブと全施設）+ ダンジョン 1F の歩行（戦闘なし）
- **Chapter 2**: 戦闘システム + Camp + 死亡・蘇生
- **Chapter 3**: 呪文（Mage 25 種 + Priest 25 種）
- **Chapter 4 以降**: B2F〜B10F の迷宮データ、ボス（Werdna）、エンディング、識別済み/呪われた装備

### 画面トポロジ（1981 オリジナルマニュアル準拠）

**Castle メニュー** (キーバインド: G/B/T/A/E):
- (G)ilgamesh's Tavern — パーティ編成
- (B)oltac's Trading Post — 売買・識別・呪い解除（Chapter 1 は売買のみ）
- (T)emple of Cant — 状態異常治療・蘇生（Chapter 1 はセーブのみ）
- (A)dventurer's Inn — 休息・レベルアップ（Chapter 1 は休息のみ）
- (E)dge of Town — Edge of Town へ移動

**Edge of Town メニュー** (キーバインド: T/M/C/U/L):
- (T)raining Grounds — キャラクター作成・職業変更・キャラ削除
- (M)aze — 迷宮へ進入
- (C)astle — Castle へ戻る
- (U)tilities — Restart an OUT Party 等（Chapter 1 は Restart のみ実装）
- (L)eave Game — タイトルへ戻る

**重要**: Training Grounds は Edge of Town 配下であり Castle 配下ではない。

### Chapter 1 の Definition of Done

ブラウザで以下が一通りプレイ可能:

1. タイトル画面（Apple II 風）
2. New Game → Edge of Town へ遷移
3. Edge of Town → Training Grounds でキャラ 6 人作成（種族・職業・属性・名前・能力値振り分け）
4. Edge of Town → Castle へ移動 → 各施設が選択可能
5. Castle → Gilgamesh's Tavern でパーティ編成（最大 6 人）
6. Castle → Adventurer's Inn で Stables 休息（**時間経過のみ・HP 回復なし** が 1981 原典挙動。Cot 以降の有料ティアは Chapter 2）
7. Castle → Boltac's Trading Post で買い物（Chapter 1 装備のみ。所持金・所持品は実際に増減する。装備による戦闘パラメータ計算は Chapter 2 で実装するため、Chapter 1 では「数値表示のみで効果は未反映」とする）
8. Edge of Town → Maze へ進入
9. 1F の壁・扉・階段に従って歩行（前進・後退・左回転・右回転）
10. 1F の壁・扉・階段を Apple II 原典のワイヤーフレーム 3D 視点で描画する（**自動マッピングは実装しない** — 原典通り、プレイヤーが手書きでマッピングする体験を維持）
11. 迷宮内 Camp（最低限）→ Edge of Town へ Quit（戻る）
12. 1F 上り階段でも Edge of Town へ脱出
13. Castle → Temple of Cant でセーブ → タイトル → Continue で復元（**独自追加機能**）
14. 設定で日本語/英語切替（プレイ中の動的切替対応）
15. ブラウザリロードしても状態が永続化されている
16. ウィンドウリサイズで整数倍スケールを維持

### Chapter 1 で行わないこと

- 戦闘・モンスター遭遇・攻撃
- 呪文使用
- レベルアップ判定（Inn での経験値 → レベル変換）
- 死亡・蘇生
- Camp の詳細機能（呪文詠唱、装備変更、アイテム使用 — Chapter 2/3 で実装）
- 罠・宝箱
- B2F 以降の迷宮
- BGM/SE
- 識別フロー、呪われた装備の挙動
- 自動マッピング（原典踏襲のため永続的に実装しない）
- Inn の Cot / Economy / Merchant / Royal Suite ティア（Chapter 2 で経験値計算と同時に実装）
- Inn 休息による HP 回復（Stables は 1981 原典通り「時間経過のみ」のため）
- Boltac の識別・呪い解除（Chapter 4 で実装）
- Temple の蘇生・状態治療（Chapter 2 で実装）
- 職業変更（Chapter 2 で実装）

### 独自追加機能の明示一覧

「1981 オリジナル準拠」を貫きつつ、以下の機能のみ独自追加とする:

| 独自追加 | 動機 / フレーバー解釈 |
|---|---|
| Temple of Cant でのセーブ機能 | 神官の年代記に旅路を記す（明示の独自要件） |
| パーティ共有 Gold（キャラ別ではない） | UX 簡略化（1981 原典はキャラ別）。Boltac の「誰が払うか」フリクションを排除 |
| 入力キュー (1 操作先行入力) | モダン Web ブラウザの操作感に合わせた QoL（原典は同期実行のみ） |
| 矢印キー + Enter のメニュー操作 | キーボード UX（原典はホットキー直接選択のみ）。ホットキーは引き続き有効 |
| i18n 動的切替（英語/日本語） | 多言語対応（原典は英語のみ） |
| ピクセル整数倍スケーリング | モダンディスプレイでの可読性確保（原典は固定 280x192） |

「Apple II の挙動・見た目を忠実に再現する」コア体験は維持しつつ、「Web 環境の必然」と「単独プレイの QoL」のみ独自追加とする。**戦闘・呪文・モンスター・経験値・死亡などゲームメカニクスは原典厳守。**

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
| 永続化 | IndexedDB (via `idb` ラッパライブラリ) | クライアント完結・全モダンブラウザ対応 |
| 描画 (迷宮) | HTML5 Canvas 2D | HGR 風ワイヤーフレーム |
| 描画 (UI) | HTML + CSS | Apple II 風フォント・配色 |
| Lint/Format | Biome | ESLint + Prettier 代替 |
| テスト | Vitest + fake-indexeddb | jsdom 環境含む / 非同期副作用テストでは IDB をモック |
| E2E | Playwright (Chapter 2 以降) | Chapter 1 は手動チェック |
| ホスティング | Vercel | 静的サイト（`vite build` の `dist/` を配信） |
| CI | GitHub Actions | lint + test + build |

### 採用しないもの

- **Next.js**: SPA 用途には過剰。SSR 不要、ルーティングはステートマシン内で完結
- **react-i18next**: 自作の薄いプロバイダで十分（バンドル削減）
- **Redux / XState**: 自作 reducer + discriminated union で軽量に
- **Tailwind**: Apple II 風の特殊な見た目には素の CSS の方が制御しやすい
- **認証 / クラウド DB**: Chapter 1 の段階では不要、将来も導入予定なし
- **SQLite WASM (sqlite-wasm + OPFS)**: セーブデータ規模 (数 KB〜数十 KB) に対しオーバースペック。WASM ロードに 600KB かかり Lighthouse スコアを毀損。OPFS 非対応環境のフォールバックも複雑化するため不採用

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
│   │   ├── Title/                      # New Game / Continue / 設定
│   │   ├── EdgeOfTown/                 # T/M/C/U/L メニュー
│   │   ├── Training/                   # Edge of Town 配下: キャラ作成
│   │   ├── Utilities/                  # Edge of Town 配下: Restart OUT Party 他
│   │   ├── Castle/                     # G/B/T/A/E メニュー
│   │   ├── Tavern/                     # Castle 配下: パーティ編成
│   │   ├── Boltac/                     # Castle 配下: 売買
│   │   ├── Temple/                     # Castle 配下: セーブ（独自）
│   │   ├── Inn/                        # Castle 配下: 休息
│   │   ├── Maze/                       # 迷宮 (Canvas 描画含む)
│   │   └── Camp/                       # 迷宮内 Camp (最低限)
│   ├── render/
│   │   ├── canvas/                     # HGR 風 line/rect ラッパ
│   │   └── maze/                       # 視点→線分配列の変換
│   ├── store/gameStore.ts              # Zustand ストア
│   ├── persist/
│   │   ├── db.ts                       # IndexedDB 接続・API (idb ラッパ)
│   │   ├── schema.ts                   # objectStore 定義・バージョン管理
│   │   └── exporter.ts                 # JSON エクスポート/インポート
│   ├── i18n/
│   │   ├── messages.ts                 # MESSAGES.{en, ja}
│   │   └── useT.ts                     # フック
│   ├── ui/                             # 共通 UI（罫線・メニュー枠）
│   └── audio/                          # （Chapter 2 以降）
├── tests/
│   ├── engine/                         # reducer/rules の単体テスト
│   └── persist/                        # IndexedDB 永続化テスト
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
- **`persist/`** は IndexedDB 操作の境界。engine から直接呼ばず、store 経由

---

## 4. ステートマシン設計

ゲーム全体を有限ステートマシンで表現する。XState は使わず、自作 reducer + discriminated union を採用。

### 共通型定義

```typescript
// パーティ・キャラ
type CharacterId = number;
type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5;   // パーティの並び順 (前列 0-2、後列 3-5)

interface PartyState {
  members: (CharacterId | null)[];        // 長さ 6、null は空席
  gold: number;                           // パーティ共有 Gold (独自追加 - 「独自追加機能の明示一覧」参照)
  status: 'inTown' | 'inMaze' | 'out';    // OUT 状態管理 (詳細は「OUT 状態の表現」節)
  outAtPosition?: MazePosition;           // OUT 時の迷宮内最終位置 (Restart Out Party で復帰先)
}

// 迷宮位置
type Direction = 'n' | 'e' | 's' | 'w';
interface MazePosition {
  level: number;     // 1〜10 (Chapter 1 では 1 のみ)
  x: number;         // 0〜19
  y: number;         // 0〜19
  dir: Direction;    // プレイヤーの向いている方向
}

// キャラクター作成草稿 (Training Grounds 内の作業中データ)
interface CharacterDraft {
  name: string;
  race: RaceId;
  alignment: 'good' | 'neutral' | 'evil';
  rolledAttributes: Attributes;          // 種族 base + ボーナス振り分け後
  bonusPointsRemaining: number;          // d10 で振った残り
  selectedClass: ClassId | null;         // 確定すると null から決定値へ
}

// 各画面の Sub-state
type TitleSubState =
  | { kind: 'main' }
  | { kind: 'continueMenu'; slots: SaveSlotInfo[] }
  | { kind: 'loading'; slotId: SaveSlotId }                  // 非同期ロード中 (入力ブロック)
  | { kind: 'loadError'; reason: string }                    // ロード失敗
  | { kind: 'settings' };
type TrainingSubState =
  | { kind: 'menu' }                                              // ロスター一覧
  | { kind: 'creating'; step: 'name' | 'race' | 'alignment' | 'rollAttributes' | 'allocateBonus' | 'pickClass' | 'confirm'; draft: CharacterDraft }
  | { kind: 'inspecting'; characterId: CharacterId }
  | { kind: 'deleting'; characterId: CharacterId };
type TavernSubState =
  | { kind: 'menu' }
  | { kind: 'addMember'; rosterIds: CharacterId[] }
  | { kind: 'removeMember'; slot: SlotIndex }
  | { kind: 'inspecting'; slot: SlotIndex };
type BoltacSubState =
  | { kind: 'menu' }
  | { kind: 'pickBuyer'; }
  | { kind: 'browse'; buyer: SlotIndex; cursor: number }
  | { kind: 'sell'; buyer: SlotIndex; itemIndex: number };
type TempleSubState =
  | { kind: 'menu' }
  | { kind: 'savePicker'; slots: SaveSlotInfo[]; mode: 'overwrite' | 'newSlot' }     // 独自追加
  | { kind: 'saveConfirm'; slotId: SaveSlotId | 'new'; name: string }                // 独自追加
  | { kind: 'saving'; slotId: SaveSlotId | 'new'; name: string }                     // 非同期書き込み中 (入力ブロック)
  | { kind: 'saveDone' }                                                             // 成功
  | { kind: 'saveError'; reason: string };                                           // 失敗 (容量不足等)
type InnSubState =
  | { kind: 'menu' }
  | { kind: 'pickGuest' }
  | { kind: 'pickRoom'; guest: SlotIndex }                                           // Chapter 1 は Stables のみ表示
  | { kind: 'resting'; guest: SlotIndex; tier: 'stables' };
type CampSubState =
  | { kind: 'menu' };                                                                // Chapter 1 は Quit のみ機能
type UtilitiesSubState =
  | { kind: 'menu' }
  | { kind: 'restartParty'; outParties: SaveSlotInfo[] };                            // Chapter 1 は OUT 状態の検出と復帰のみ
```

### トップレベル状態

```typescript
type GameState =
  | { phase: 'title';     sub: TitleSubState }
  | { phase: 'edgeOfTown'; party: PartyState }
  | { phase: 'training';  sub: TrainingSubState;  party: PartyState }   // Edge of Town 配下
  | { phase: 'utilities'; sub: UtilitiesSubState; party: PartyState }   // Edge of Town 配下
  | { phase: 'castle';    party: PartyState }
  | { phase: 'tavern';    sub: TavernSubState;    party: PartyState }   // Castle 配下
  | { phase: 'boltac';    sub: BoltacSubState;    party: PartyState }   // Castle 配下
  | { phase: 'temple';    sub: TempleSubState;    party: PartyState }   // Castle 配下
  | { phase: 'inn';       sub: InnSubState;       party: PartyState }   // Castle 配下
  | { phase: 'maze';      pos: MazePosition;      party: PartyState }
  | { phase: 'camp';      sub: CampSubState;      pos: MazePosition; party: PartyState };
  // Chapter 2+ : combat, levelUp, dead, etc.
```

### イベント

```typescript
type GameEvent =
  // Title
  | { type: 'startGame' }
  | { type: 'openContinue' }
  | { type: 'continueGame'; slotId: SaveSlotId }
  | { type: 'openSettings' }
  | { type: 'closeSettings' }
  | { type: 'changeLanguage'; lang: 'en' | 'ja' }

  // Edge of Town
  | { type: 'goToTraining' }
  | { type: 'goToMaze' }
  | { type: 'goToCastle' }
  | { type: 'goToUtilities' }
  | { type: 'leaveGame' }

  // Training Grounds
  | { type: 'startCreate' }
  | { type: 'inputName'; name: string }
  | { type: 'pickRace'; race: RaceId }
  | { type: 'pickAlignment'; alignment: 'good' | 'neutral' | 'evil' }
  | { type: 'rollAttributes' }                              // 種族 base + ボーナス d10 ロール
  | { type: 'allocateBonus'; attribute: AttributeKey; delta: -1 | 1 }
  | { type: 'pickClass'; klass: ClassId }
  | { type: 'confirmCharacter' }
  | { type: 'cancelCreate' }
  | { type: 'inspectCharacter'; characterId: CharacterId }
  | { type: 'deleteCharacter'; characterId: CharacterId }

  // Castle (G/B/T/A/E)
  | { type: 'enterTavern' }
  | { type: 'enterBoltac' }
  | { type: 'enterTemple' }
  | { type: 'enterInn' }
  | { type: 'leaveCastle' }                                 // → Edge of Town

  // Tavern
  | { type: 'addToParty'; characterId: CharacterId; slot: SlotIndex }
  | { type: 'removeFromParty'; slot: SlotIndex }
  | { type: 'inspectMember'; slot: SlotIndex }

  // Boltac
  | { type: 'pickBuyer'; slot: SlotIndex }
  | { type: 'buyItem'; itemId: ItemId }
  | { type: 'sellItem'; itemIndex: number }

  // Temple (独自セーブ機能) — 同期操作
  | { type: 'openSaveMenu' }
  | { type: 'pickSlot'; slot: SaveSlotId | 'new' }
  | { type: 'inputSlotName'; name: string }
  | { type: 'confirmSave' }                                 // ユーザー押下 → 内部で saveStarted へ
  | { type: 'cancelSave' }
  | { type: 'dismissSaveResult' }                           // saveDone / saveError から menu へ戻る

  // 非同期ライフサイクル (内部 dispatch)
  | { type: 'saveStarted' }                                 // db.saveState 着手 (state を 'saving' に)
  | { type: 'saveSucceeded'; slotId: SaveSlotId }           // 完了
  | { type: 'saveFailed'; reason: string }                  // 失敗 (例: QuotaExceededError)
  | { type: 'loadStarted'; slotId: SaveSlotId }             // db.loadState 着手 (state を 'loading' に)
  | { type: 'loadSucceeded'; state: GameState; characters: Character[] }
  | { type: 'loadFailed'; reason: string }

  // Inn
  | { type: 'pickGuest'; slot: SlotIndex }
  | { type: 'pickRoom'; tier: 'stables' }                   // Chapter 1 は Stables のみ
  | { type: 'finishRest' }

  // Maze
  | { type: 'moveForward' }
  | { type: 'turnLeft' }
  | { type: 'turnRight' }
  | { type: 'moveBackward' }
  | { type: 'openCamp' }
  | { type: 'descendStairs' }                               // Chapter 1 は B2F なし → エラーメッセージ
  | { type: 'ascendStairs' }                                // 1F の上り階段 → Edge of Town へ脱出 (1981 オリジナル踏襲)

  // Camp (Chapter 1 範囲)
  | { type: 'leaveCamp' }                                   // 迷宮へ戻る
  | { type: 'quitToTown' };                                 // → Edge of Town (パーティが OUT 状態に)
```

### 状態遷移図 (Chapter 1 範囲)

```
title
  ├── (startGame) ──→ edgeOfTown
  └── (continueGame) ──→ <復元先 phase>

edgeOfTown
  ├── (goToTraining) ─→ training
  ├── (goToMaze)     ─→ maze (パーティが空なら拒否)
  ├── (goToCastle)   ─→ castle
  ├── (goToUtilities)─→ utilities
  └── (leaveGame)    ─→ title

training ──(cancelCreate / 完了)──→ edgeOfTown
utilities ──(完了 / cancel)──────→ edgeOfTown

castle
  ├── (enterTavern) ─→ tavern  ──→ castle
  ├── (enterBoltac) ─→ boltac  ──→ castle
  ├── (enterTemple) ─→ temple  ──→ castle (セーブ後)
  ├── (enterInn)    ─→ inn     ──→ castle
  └── (leaveCastle) ─→ edgeOfTown

maze
  ├── (move/turn)   ─→ maze
  ├── (openCamp)    ─→ camp
  └── (ascendStairs:1F上り) ─→ edgeOfTown

camp
  ├── (leaveCamp)   ─→ maze
  └── (quitToTown)  ─→ edgeOfTown (party は OUT 状態として記録)
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

### Zustand 連携 (入力キュー対応・基本形)

> 以下は **入力キューの最小実装例**。実装時は次節「非同期副作用の統合」で `isBusy` と `runEffect` を組み込んだ最終形を採用する。

```typescript
const MAX_QUEUED_INPUTS = 1;     // 先行入力の許容数 (1 = 「次の 1 操作を予約」可能)
const QUEUE_TIMEOUT_MS = 5000;   // 5 秒経っても演出が終わらないなら強制クリア

const useGameStore = create<GameStore>((set, get) => ({
  state: { phase: 'title', sub: { kind: 'main' } },
  isAnimating: false,
  inputQueue: [] as GameEvent[],

  dispatch: (event) => {
    if (get().isAnimating) {
      // 演出中: キューに追加 (上限まで)
      const queue = get().inputQueue;
      if (queue.length < MAX_QUEUED_INPUTS) {
        set({ inputQueue: [...queue, event] });
      }
      // それ以上は無視 (連打抑制)
      return;
    }

    // 通常時: 即座に処理
    const next = reduce(get().state, event);
    const anim = bindAnimation(get().state, next);

    if (anim) {
      set({ isAnimating: true });
      const safetyTimer = setTimeout(() => {
        // 演出が異常に長い場合の安全装置
        set({ isAnimating: false, inputQueue: [] });
      }, QUEUE_TIMEOUT_MS);

      runAnimation(anim, () => {
        clearTimeout(safetyTimer);
        set({ state: next, isAnimating: false });

        // キューに溜まっていた次の入力を 1 つ取り出して再 dispatch
        const queued = get().inputQueue;
        if (queued.length > 0) {
          const [head, ...rest] = queued;
          set({ inputQueue: rest });
          // 次のフレームで処理 (再帰呼出による型不整合の回避)
          queueMicrotask(() => get().dispatch(head));
        }
      });
    } else {
      set({ state: next });
    }
  },
}));
```

**設計ポイント**:

- `MAX_QUEUED_INPUTS = 1`: 「現在の演出 + 次の 1 操作」までキューイング。複数溜め込むと長押し連打で意図しない遠方移動が発生するため抑制
- `QUEUE_TIMEOUT_MS = 5000`: 演出が完了しないバグが起きても 5 秒で復帰。本番では発生しない想定
- `queueMicrotask`: 演出完了コールバック内で直接 dispatch すると、まれに React の更新タイミングと衝突するため microtask に逃がす
- キーリピート方針: 「移動系のみ抑制 / メニュー操作は許可」のコンテキスト依存ポリシー (詳細は Section 9)

### 非同期副作用の統合 (Side-effect Orchestration)

Reducer は純関数だが、**永続化 (IndexedDB I/O)** は非同期。これを安全に繋ぐため「**コマンドイベント / 完了イベント**」の 2 段階ディスパッチ方式を採用する。Redux で言うと thunk + lifecycle action のミニマル版。

#### パターン

```
ユーザー操作 (例: confirmSave)
  ↓ dispatch
Reducer: state を 'saving' に遷移 (= 入力ブロック状態に入る)
  ↓ store.dispatchEffect が発火を検知
副作用ランナー: await db.saveState(...) を裏で実行
  ↓ 完了
内部 dispatch: saveSucceeded / saveFailed
  ↓ Reducer
state を 'saveDone' / 'saveError' に遷移
```

#### 入力ブロックの拡張

`isBusy` フラグを `isAnimating` と並列に追加し、両方 false のときだけ入力を即時処理:

```typescript
const useGameStore = create<GameStore>((set, get) => ({
  state: { phase: 'title', sub: { kind: 'main' } },
  isAnimating: false,
  isBusy: false,                 // 非同期処理中
  inputQueue: [] as GameEvent[],

  dispatch: (event) => {
    // 内部発火イベント (saveStarted/Succeeded/Failed 等) は常に通す
    const isInternal = INTERNAL_EVENT_TYPES.includes(event.type);

    if (!isInternal && (get().isAnimating || get().isBusy)) {
      const queue = get().inputQueue;
      if (queue.length < MAX_QUEUED_INPUTS) {
        set({ inputQueue: [...queue, event] });
      }
      return;
    }

    const next = reduce(get().state, event);
    const anim = bindAnimation(get().state, next);
    set({ state: next });

    // 副作用が必要な遷移を検知
    const effect = bindEffect(get().state, next);
    if (effect) {
      set({ isBusy: true });
      runEffect(effect, get().dispatch).finally(() => {
        set({ isBusy: false });
        flushQueue(get, set);
      });
    }

    if (anim) {
      set({ isAnimating: true });
      runAnimation(anim, () => {
        set({ isAnimating: false });
        flushQueue(get, set);
      });
    }
  },
}));
```

#### 副作用バインダー

```typescript
type Effect =
  | { type: 'save'; slotId: SaveSlotId | 'new'; name: string }
  | { type: 'load'; slotId: SaveSlotId };

function bindEffect(prev: GameState, next: GameState): Effect | null {
  // saving 状態への遷移を検知 → save エフェクトを起動
  if (next.phase === 'temple' && next.sub.kind === 'saving') {
    return { type: 'save', slotId: next.sub.slotId, name: next.sub.name };
  }
  if (next.phase === 'title' && next.sub.kind === 'loading') {
    return { type: 'load', slotId: next.sub.slotId };
  }
  return null;
}

async function runEffect(effect: Effect, dispatch: (e: GameEvent) => void): Promise<void> {
  if (effect.type === 'save') {
    try {
      const slotId = await db.saveState(/* ... */);
      dispatch({ type: 'saveSucceeded', slotId });
    } catch (err) {
      dispatch({ type: 'saveFailed', reason: errorMessage(err) });
    }
  }
  if (effect.type === 'load') {
    try {
      const { state, characters } = await db.loadState(effect.slotId);
      dispatch({ type: 'loadSucceeded', state, characters });
    } catch (err) {
      dispatch({ type: 'loadFailed', reason: errorMessage(err) });
    }
  }
}
```

#### Reducer 側の責務

Reducer は **エフェクトを直接実行しない**。代わりに:

- `confirmSave` を受け取ったら → `temple.sub` を `'saveConfirm'` から `'saving'` に遷移 (これだけ)
- `saveSucceeded` を受け取ったら → `'saveDone'` に遷移
- `saveFailed` を受け取ったら → `'saveError'` に遷移
- `dismissSaveResult` で `'menu'` に戻る (ユーザーが結果メッセージを閉じる)

Reducer は純粋なまま、副作用の指示は state の `kind: 'saving'` に込められる。`bindEffect` がそれを翻訳する。

#### 競合防止の不変条件

- `isBusy` または `isAnimating` の間は、内部発火イベント以外の dispatch は一律キューイング
- 内部イベント (`saveStarted`/`saveSucceeded`/`saveFailed`/`loadStarted`/...) は **入力キューを経由せず即時処理**
- 副作用ランナーは「state が `saving` になった瞬間」だけ起動。同じ state が連続して `saving` になっても重複起動しないよう、`prev.kind !== 'saving' && next.kind === 'saving'` の遷移のみで起動
- `inputQueue` のフラッシュは `isBusy` と `isAnimating` の **両方が false に戻ったとき**

#### テスト戦略

- **Reducer**: 副作用イベント (`saveSucceeded` 等) を引数に渡したときの遷移をテーブルテスト
- **bindEffect**: state ペアからの Effect 判定を純関数として網羅
- **runEffect**: db をモックして saveState 成功/失敗の両ケースをテスト
- **Store integration**: Vitest jsdom + 偽 IDB (fake-indexeddb) で end-to-end フロー検証

### GameStore のトップレベル構造

`GameState` (= phase + sub) はゲーム進行用、それ以外のセッション設定は GameStore 直下に保持する:

```typescript
interface GameStore {
  // ゲーム進行 (永続化対象)
  state: GameState;

  // セッション設定 (永続化対象、settings objectStore)
  lang: 'en' | 'ja';
  scaleMode: 'auto' | 1 | 2 | 3 | 4;          // 'auto' は computeScale() に委譲

  // 一時状態 (永続化非対象)
  isAnimating: boolean;
  isBusy: boolean;
  inputQueue: GameEvent[];

  dispatch: (event: GameEvent) => void;
}
```

`changeLanguage` イベントは Reducer ではなく **store 直下の `lang` フィールドだけを更新** する (Reducer 関心事ではない)。

```typescript
// store/gameStore.ts (一部)
dispatch: (event) => {
  // 設定系イベントは Reducer を経由しない
  if (event.type === 'changeLanguage') {
    set({ lang: event.lang });
    db.setSetting('lang', event.lang);
    return;
  }
  // ... 通常のフロー
}
```

### OUT 状態の表現

迷宮内 Camp で `quitToTown` を選んだ場合、パーティは **「OUT 状態」** として記録される。1981 原典では「ディスクに OUT として書き込まれ、Castle 経由では再開できない」という挙動。

#### 格納場所

- `PartyState.status === 'out'` がフラグ
- `PartyState.outAtPosition` が迷宮内最終位置
- これらは `saveSlot.gameState` JSON にシリアライズされる（character は無関係）

#### 挙動

- パーティが OUT 状態のとき:
  - Edge of Town からの (M)aze 選択 → **拒否**（"Your party is OUT, restart from Utilities"）
  - Castle からの (E)dge of Town → 通常通り遷移
  - Edge of Town → (U)tilities → "Restart an OUT Party" → 該当パーティを `inMaze` に戻し、`outAtPosition` から復帰

#### 寺院セーブとの相互作用

寺院セーブは `inTown` 状態のときだけ可能（迷宮内では Temple に行けないので自然）。OUT 状態のセーブデータをロードしたら、即 Utilities へ誘導するモーダルを表示。

### エラー UI のデザイン方針

`saveError` / `loadError` 等の失敗ステートを表示する UI は **Apple II 風のメッセージ枠（モーダルではなくインライン）** を使用:

```
┌──────────────────────────────────┐
│ THE CHRONICLER ERRS                  │
│                                       │
│ Quota exceeded. Free space and try    │
│ again.                                │
│                                       │
│ [Press ENTER to dismiss]              │
└──────────────────────────────────┘
```

- DOM レイヤで現在画面の中央にオーバーレイ
- 既存メニューと同じ罫線・フォント・配色を使用（モダンな赤いダイアログにしない）
- Enter または Escape で `dismissSaveResult` / `dismissLoadResult` イベントが dispatch されて元の SubState (menu 等) に戻る
- a11y: `role="alertdialog"` + `aria-live="assertive"` で読み上げ対応

### Leave Game の挙動

Edge of Town の (L)eave Game は **タイトル画面に戻るだけで、自動セーブは行わない**。1981 原典は autosave するが、本実装は Temple セーブのみという独自方針なので、ユーザーに確認ダイアログを出す:

```
┌──────────────────────────────────┐
│ LEAVE GAME?                          │
│                                       │
│ Unsaved progress will be lost unless  │
│ saved at the Temple.                  │
│                                       │
│ [Y] Yes, leave    [N] No, stay        │
└──────────────────────────────────┘
```

Yes → タイトルへ。No → Edge of Town に留まる。

実装は新たな SubState を追加せず、`edgeOfTown` 内に確認モード:

```typescript
// edgeOfTown phase に optional な confirmLeave フラグを追加してもよいが、シンプルに
// SubState 化する案も検討余地。Plan で確定。
```

Plan 段階で「edgeOfTown を SubState 化する」か「単純にコンポーネント側 state で確認モーダル管理」かを決定する。

### セーブとの関係

- **セーブ** = `state` を JSON シリアライズして IndexedDB の `saveSlot` objectStore に保存（character は `character` objectStore へ別途）
- **ロード** = JSON から `state` を復元 + `character` objectStore からキャラ実体を引いて合成、`useGameStore` に投入
- **オートセーブなし**（1981 仕様の autosave は意図的に削除し、Temple セーブのみとする独自方針）
- **Leave Game でも保存しない**: 直前に Temple セーブしていない作業は失われる旨を確認ダイアログで明示

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
内部 viewport: 280×192 (= 仮想ピクセルグリッド)
  ↓
CSS transform: scale(N) で整数倍 (1x / 2x / 3x / 4x)
  ↓
ウィンドウからはみ出す場合は縮小、最小は 1x
```

`image-rendering: pixelated` でアンチエイリアス無効。

### DOM ↔ Canvas のピクセルアライメント

ハイブリッド方式 (Canvas + HTML/CSS) において、両者を **同じ仮想ピクセルグリッド (280×192)** に揃える必要がある。揃わないと Apple II 風の「パキッとした」表示が崩れ、現代風アンチエイリアスや 0.5px ズレが目立つ。

#### 仮想ピクセル単位 `--vp` を CSS 変数として定義

```css
/* src/ui/global.css */
:root {
  /* 起動時に JS から動的セット: ウィンドウサイズに合わせ整数倍 */
  --scale: 3;                          /* 1, 2, 3, 4 のいずれか */
  --vp: calc(1px * var(--scale));      /* 仮想ピクセル 1 個分の実 px */
  --viewport-width:  calc(280 * var(--vp));  /* 全体幅 */
  --viewport-height: calc(192 * var(--vp));  /* 全体高 */
  --font-size-glyph: calc(8 * var(--vp));    /* 7×8 グリフ → 8vp 高で表示 */
}

#root {
  width: var(--viewport-width);
  height: var(--viewport-height);
  position: relative;     /* Canvas と DOM オーバーレイの基準 */
}

.menu-frame {
  /* すべて vp 単位 → 整数倍スケールに完全同期 */
  padding: calc(2 * var(--vp));
  border: var(--vp) solid white;
  font-size: var(--font-size-glyph);
  line-height: var(--font-size-glyph);
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--viewport-width);
  height: var(--viewport-height);
  image-rendering: pixelated;
}
```

#### 仮想ピクセル運用の鉄則

1. **DOM 要素のサイズ・余白・フォントは常に `var(--vp)` の整数倍**: `padding: 0.5em;` のような相対単位を禁止
2. **`--scale` は整数のみ**: `2.5x` や `1.5x` は禁止 (サブピクセルが発生する)
3. **フォントサイズは 7vp / 8vp / 14vp / 16vp の固定値**: グリフが整数倍にスケールされて鋭く描画される
4. **`transform` を使う場合は `translateZ(0)`** でレイヤを GPU 合成に押し上げ、サブピクセル sub-pixel snap を有効化
5. **Canvas 内部解像度は 280×192 のまま固定**: CSS で拡大するだけ。`canvas.width = window.innerWidth` のようにリサイズしてはいけない

#### スケール計算ロジック

```typescript
// src/ui/scale.ts
export function computeScale(winWidth: number, winHeight: number): number {
  const sx = Math.floor(winWidth  / 280);
  const sy = Math.floor(winHeight / 192);
  return Math.max(1, Math.min(sx, sy));   // 整数化 + 最小 1
}

window.addEventListener('resize', () => {
  const s = computeScale(innerWidth, innerHeight);
  document.documentElement.style.setProperty('--scale', String(s));
});
```

#### Canvas / DOM の境界

| 描画対象 | レイヤ | 理由 |
|---|---|---|
| 迷宮 3D ワイヤーフレーム | Canvas | 線分の動的計算が必要 |
| メニュー枠・ASCII 罫線 | DOM (CSS) | テキスト選択・アクセシビリティ・i18n が容易 |
| キャラステータス文字列 | DOM | i18n 対応・ホットリロード |
| メッセージウィンドウ | DOM | 同上 |
| Apple II ピクセルロゴ等 | Canvas もしくは画像 | 画像要素なら `image-rendering: pixelated` で OK |

DOM レイヤと Canvas レイヤは絶対配置で重ね、両方とも同じ vp グリッドに従うため、見た目はシームレスに統合される。

### Canvas 層（迷宮ビュー）

- 280×192 の `<canvas>` を内部解像度として保持
- `drawLine` / `drawRect` の極小ラッパのみ実装
- 描画は state 変化時のみ（RAF を常時回さない、演出時のみ起動）

### 迷宮 3D ワイヤーフレーム描画アルゴリズム

Apple II 版 Wizardry の 3D 視点は「**事前計算された遠近線分テーブル**」をルックアップする方式で、3D ジオメトリを毎フレーム計算しているわけではない。本実装も同方式を採用する。

#### 視野定義

```
プレイヤーの向いている方向に対して:
- 前方 4 セル分まで描画（depth = 0 ～ 3）
  - depth 0: プレイヤー自身のセル
  - depth 1: 1 マス先
  - depth 2: 2 マス先
  - depth 3: 3 マス先（最遠）
- 左右 1 セルずつの「サイドビュー」を描画
  - rel = -1 (左), 0 (中央), +1 (右)
- 視野範囲: 4 (depth) × 3 (左/中/右) = 12 セル
```

#### 線分テーブルの構造

```typescript
// src/render/maze/wireframeTable.ts
// 各 (depth, rel) ごとに「壁・扉・階段」を描く線分の固定座標を定義

interface SegmentSet {
  /** 前面の壁 (このセルの正面が壁の場合に描く) */
  frontWall: LineSegment[];
  /** 左面の壁 (このセルの左が壁の場合に描く) */
  leftWall: LineSegment[];
  /** 右面の壁 */
  rightWall: LineSegment[];
  /** 扉 (壁の代わりに描画) */
  frontDoor: LineSegment[];
  leftDoor: LineSegment[];
  rightDoor: LineSegment[];
  /** 階段マーカー (上り/下り) */
  stairsUp: LineSegment[];
  stairsDown: LineSegment[];
}

const WIREFRAME_TABLE: Record<Depth, Record<RelPos, SegmentSet>> = {
  0: { '-1': {...}, '0': {...}, '+1': {...} },
  1: { '-1': {...}, '0': {...}, '+1': {...} },
  2: { '-1': {...}, '0': {...}, '+1': {...} },
  3: { '-1': {...}, '0': {...}, '+1': {...} },
};
```

座標値は Pascal の対応定数または tk421 ソースから抽出する。**抽出に失敗した場合のフォールバック**として、Apple II 実機スクリーンショット（Internet Archive で公開されている）から座標を実測する。

#### 描画ルール

1. プレイヤー位置 `pos` と方向 `dir` から、視野 12 セルのワールド座標を計算
2. 各セル (depth, rel) について、`MAZE_L1` から壁・扉・特殊マスを引く
3. **遠いセル → 近いセル** の順に描画（隠面消去のため）
4. 各 (depth, rel) で `WIREFRAME_TABLE[depth][rel]` の対応セグメントを `drawLine` で描画
5. 階段マーカーは `special` が `stairsUp`/`stairsDown` のときのみ追加

#### 隠面消去（簡易）

Wizardry の原典は「奥のセルから手前へ順に描き、手前の壁が背景を上書きする」という単純な方式。本実装も同じ:

```typescript
function renderMazeView(pos: MazePosition, ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 280, 192);
  ctx.strokeStyle = 'white';

  // 奥から手前へ
  for (const depth of [3, 2, 1, 0]) {
    for (const rel of [-1, 0, 1]) {
      const cell = lookupCell(pos, depth, rel);
      drawCellSegments(ctx, depth, rel, cell);
    }
  }
}
```

#### 視野範囲の制限

- 壁にぶつかった先のセルは「視野ブロック」されるべきだが、Apple II 原典では**全セル一律で描画**する単純実装。本実装も忠実にこれを踏襲（壁の向こうがチラ見えする原典の挙動を再現）
- ただし `darkness` マスに入った場合は描画範囲を depth=0 のみに制限（Chapter 4 で実装）

#### テスト戦略

`renderMazeView` 自体の Canvas 出力比較は煩雑なため、**「視野計算ロジック」と「描画呼び出しシーケンス」を分離**してテストする:

```typescript
// 視野 12 セルのワールド座標計算 → 純関数 → Vitest で網羅
function computeViewport(pos: MazePosition): ViewportCell[];

// セグメント決定 → 純関数 → Vitest
function selectSegments(cell: Cell, depth: Depth, rel: RelPos): LineSegment[];
```

ピクセル単位の最終 Canvas 比較は手動 E2E に任せる。

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

### 演出と入力の関係 (先行入力対応)

演出中の入力ハンドリングは **キューイング方式**。即座に捨てるのではなく次の 1 操作までを予約として保持し、演出完了後に処理する。

```
ユーザー入力
  ↓
isAnimating === true ?
  ├─ Yes → inputQueue.length < 1 ? → push / discard
  └─ No  → 通常 dispatch (state 遷移 → 演出開始)
              ↓ 演出完了
              キューに残りがあれば dequeue して再 dispatch
```

**得られる UX**:
- 「前進 → 前進 → 前進」と素早く 3 回押した場合、1 歩目の演出中に 2 歩目を予約、2 歩目開始時に 3 歩目は捨てる (= 連打を 1 段先読みのみ許す)
- 「右回転 → 前進」のように違う操作を続けて押した場合、回転完了後に前進が連続実行される (探索の快適性が大幅向上)

### キーリピートのコンテキスト依存ポリシー

ブラウザの auto-repeat (キー長押し) は `event.repeat === true` で検出可能。ただし **無条件に抑制すると UI 操作性を損なう** ため、画面ごとにポリシーを変える。

#### コンテキスト分類

| カテゴリ | 対象 phase / sub | リピート挙動 |
|---|---|---|
| **移動系** (連打抑制) | `maze` 内の moveForward/Backward/turnLeft/Right | リピート無効 (1 タップ = 1 移動) |
| **メニュー系** (リピート許可) | `tavern`, `boltac`, `temple`, `inn`, `training` の各メニュー、settings | リピート有効 (押しっぱなしでカーソル送り) |
| **テキスト入力** (OS 委譲) | キャラ名入力、セーブスロット名入力 | リピート挙動は OS / IME に委ねる |

#### 実装

入力ハンドラ層で `event.repeat` をチェックし、**コンテキストに応じた dispatch** を行う:

```typescript
// src/ui/keyHandler.ts
function handleKeydown(event: KeyboardEvent): void {
  const { phase } = useGameStore.getState().state;

  // 移動系のリピート抑制 (maze 内の移動コマンドのみ)
  const isMovement = phase === 'maze' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  if (isMovement && event.repeat) return;   // リピートは無視

  // それ以外は通常 dispatch (リピートも有効)
  const gameEvent = mapKeyToEvent(event, phase);
  if (gameEvent) {
    useGameStore.getState().dispatch(gameEvent);
  }
}
```

#### キーリピート遅延

メニューでカーソル送りリピートが効きすぎると意図せず項目を飛ばす可能性があるため、**追加の throttle** を入れる:

- 初回押下: 即時 dispatch
- 連続リピート: 100ms ごとに 1 回 dispatch (= 1 秒で 10 項目移動)
- ブラウザのデフォルトリピート速度より少し遅め

これは入力ハンドラ層のローカル state で実現する (Zustand には乗せない)。

**実装の詳細**: Section 4「Zustand 連携 (入力キュー対応)」のコード例 + 上記キーハンドラを参照。

---

## 6. データ層 (IndexedDB)

### ライブラリ

- **`idb`** ([jakearchibald/idb](https://github.com/jakearchibald/idb)): IndexedDB の Promise ベース薄いラッパ
- バンドル: ~6 KB / gzip 後 ~2.5 KB（誤差レベル）
- IndexedDB 自体はブラウザ標準 API なので追加ペイロードなし
- 採用理由: SQLite WASM (~600KB gzip) はセーブデータ規模 (数十 KB) に対しオーバースペック。IndexedDB は Chrome 24+, Edge 12+, Firefox 16+, Safari 10+ という超広範な対応で、本プロジェクトの全ターゲット環境を網羅する

### スキーマ (Chapter 1)

IndexedDB の **objectStore** で表現する。`idb` の型推論を活かすため `DBSchema` で型定義:

```typescript
// src/persist/schema.ts
import type { DBSchema } from 'idb';

export interface WizardryDB extends DBSchema {
  saveSlot: {
    key: number;                            // autoIncrement
    value: {
      id: number;
      name: string;
      createdAt: number;                    // epoch ms
      updatedAt: number;
      gameState: string;                    // JSON シリアライズ済み GameState (characterId 参照のみ含む)
    };
    indexes: { 'by-updatedAt': number };    // 最新セーブを引く用
  };

  character: {
    key: number;                            // autoIncrement
    value: {
      id: number;
      slotId: number;                       // 紐付くスロット
      name: string;
      race: RaceId;
      class: ClassId;
      alignment: 'good' | 'neutral' | 'evil';
      attributes: Attributes;
      status: CharacterStatus;              // hp, mp, level, exp, gold, ac, ...
      inventory: InventoryItem[];
      statusFlags: StatusFlags;
      createdAt: number;
    };
    indexes: { 'by-slotId': number };       // スロット内のキャラを引く用
  };

  settings: {
    key: string;                            // 'lang' | 'scaleMode' | ...
    value: string;
  };

  meta: {
    key: string;                            // 'dbVersion' | 'lastPlayed'
    value: string | number;
  };
}

export const DB_NAME = 'wizardry-proving-grounds';
export const DB_VERSION = 1;                // Chapter 1 では 1, 章ごとに上げる
```

### 設計判断

- **objectStore に schema-less な value**: Wizardry のキャラは項目数が多く章ごとに増える → 型レベルで定義しつつデータは柔軟に保持
- **character の `gameState` JSON は文字列**: `idb` の `put` には Object のまま渡せるが、ブラウザ間で structuredClone の挙動差を避けるため明示的に JSON.stringify で文字列化する
- **`saveSlot` 1 レコード = 冒険 1 つ**: 複数セーブ管理可
- **`character` はスロット紐付き**: 1981 仕様の「ロスター」共有プールではなく、UX 重視でスロット独立 (`by-slotId` インデックスで検索)。将来「他スロットからインポート」機能で代替可

### 真理の所在 (single source of truth)

`saveSlot.gameState` (JSON 文字列) と `character` objectStore の関係:

- **`character` objectStore が唯一の真理**（characters は `id` で識別）
- **`saveSlot.gameState` 内のパーティ・ロスターは `characterId` の参照のみを保持** (キャラの中身は持たない)
- ロード時のフロー:
  1. `saveSlot.gameState` から JSON をデコード
  2. JSON 内の `characterId` リストを使い、`character` objectStore (index `by-slotId`) からキャラ実体を引いて GameState に注入
  3. その合成された state を `useGameStore` に投入
- セーブ時のフロー:
  1. キャラの差分（HP・装備・Gold 等）は `character.put` で objectStore を直接更新
  2. ステートマシンの位置・選択状態などは `saveSlot.gameState` JSON に書く

これにより同じキャラを 2 箇所で管理する重複が排除される。

### トランザクション制御 (重要)

複数の objectStore (`saveSlot` + `character`) を跨ぐ更新は **必ず単一トランザクション内でアトミックに実行する**。タブクラッシュ・電源断・タブクローズが書き込み中に発生しても、データ不整合 (キャラだけ更新されてセーブスロットの参照が古いまま等) を防ぐため。

```typescript
// src/persist/db.ts
export async function saveStateAtomic(
  slotId: SaveSlotId,
  state: GameState,
  changedCharacters: Character[]
): Promise<void> {
  const idb = await openWizardryDB();
  // saveSlot と character を同一トランザクションでロック
  const tx = idb.transaction(['saveSlot', 'character'], 'readwrite');
  try {
    // 1. キャラ差分を全件 put
    for (const c of changedCharacters) {
      await tx.objectStore('character').put(c);
    }
    // 2. セーブスロットを更新
    await tx.objectStore('saveSlot').put({
      id: slotId,
      name: ...,
      createdAt: ...,
      updatedAt: Date.now(),
      gameState: JSON.stringify(serializableState(state)),
    });
    // 3. コミット (idb は tx.done を await で待つ)
    await tx.done;
  } catch (err) {
    // tx は自動 abort される
    throw new SaveFailedError(err);
  }
}
```

#### 守るべき不変条件

- **書き込みは常にトランザクションで囲う**: 単一 store の `put` でも、エラー時のロールバック挙動が予測しやすくなる
- **読み取り後の書き込みは同一トランザクション内**: 「キャラ HP を読んで → 計算 → 書き戻す」のようなパターンは別 tx だと race condition が起きうる
- **トランザクション中は await チェーンを切らない**: トランザクションは「次の microtask」で auto-commit されるため、間に非同期処理 (fetch 等) を挟むと閉じてしまう
- **エラー時は tx.abort() を呼ぶ**: idb は例外時に自動 abort するが、明示的に呼ぶケースもあり

#### ロード時のトランザクション

ロード時 (`loadState`) も `readonly` トランザクションで両 store を読む:

```typescript
const tx = idb.transaction(['saveSlot', 'character'], 'readonly');
const slot = await tx.objectStore('saveSlot').get(slotId);
const chars = await tx.objectStore('character').index('by-slotId').getAll(slotId);
await tx.done;
```

これにより「読み取り中に他タブで書き込まれて状態がブレる」リスクを排除する (同一タブ内であれば原子性が保証される)。

### バージョン管理 (マイグレーション)

IndexedDB の `onupgradeneeded` で版数管理する。`idb` の `openDB` API:

```typescript
// src/persist/db.ts
import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, type WizardryDB } from './schema';

export async function openWizardryDB() {
  return openDB<WizardryDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      if (oldVersion < 1) {
        const slots = db.createObjectStore('saveSlot', { keyPath: 'id', autoIncrement: true });
        slots.createIndex('by-updatedAt', 'updatedAt');

        const chars = db.createObjectStore('character', { keyPath: 'id', autoIncrement: true });
        chars.createIndex('by-slotId', 'slotId');

        db.createObjectStore('settings');
        db.createObjectStore('meta');
      }
      // Chapter 2 以降では if (oldVersion < 2) { ... } を追加
    },
  });
}
```

### API

```typescript
export const db = {
  init(): Promise<void>;
  listSlots(): Promise<SaveSlot[]>;
  createSlot(name: string): Promise<SaveSlotId>;
  deleteSlot(id: SaveSlotId): Promise<void>;

  // 永続化はすべて単一トランザクションで実行 (詳細は「トランザクション制御」節)
  saveState(id: SaveSlotId, state: GameState, changedCharacters: Character[]): Promise<void>;
  loadState(id: SaveSlotId): Promise<{ state: GameState; characters: Character[] }>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  // JSON エクスポート/インポート (バックアップ・端末移行用)
  // exportAll は readonly トランザクション、importAll は readwrite トランザクションで全 store を更新
  exportAll(): Promise<Blob>;                           // 全 DB 内容を JSON Blob で返す
  importAll(json: Blob, mode: 'replace' | 'merge'): Promise<void>;
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

### IndexedDB の挙動と注意点

- ブラウザの IndexedDB に `wizardry-proving-grounds` という DB 名で保持
- 開発者ツール → Application → Storage → IndexedDB から確認可能
- ブラウザのキャッシュクリアで消える点を README/設定画面で告知
- 容量: 各オリジン数十 MB〜数 GB（ブラウザ依存）/ Wizardry セーブデータには十分すぎる

### プライベートモード/容量制限環境のフォールバック

IndexedDB は **ほぼ全ブラウザでサポート** されているが、以下の状況で失敗しうる:

| 状況 | 挙動 |
|---|---|
| Safari Private Browsing | IndexedDB は使えるが容量制限が厳しい (ブラウザ閉じると消える可能性) |
| Firefox Private Browsing | IndexedDB は in-memory として動作 (ブラウザ閉じると消える) |
| ストレージ完全無効化 | `indexedDB === undefined` → 検出して警告表示 |

#### フォールバック方針

```
1. アプリ起動時に IndexedDB API と "saveSlot" objectStore の動作確認 (1 件 put → get → delete)
   ─→ 動作した場合: 通常モード

2. 動作しなかった場合 (= 上記 3 番目のケース):
   ─→ メモリ内 fallback (Map ベース) で起動
   ─→ タイトル画面とセーブ画面で警告バナーを表示
       "ブラウザのストレージが利用できません。閉じるとデータは消えます。"
       "Browser storage is unavailable. Data will be lost when you close."

3. プライベートモードまたは容量制限環境 (上記 1, 2 番目のケース) は:
   ─→ 通常通り動作するが、永続性が保証されない可能性を README に記載

4. 全ケースで JSON エクスポート/インポート機能を提供 (Chapter 1 範囲):
   ─→ "Export save as file (.json)" ボタンでローカルファイルに保存
   ─→ "Import save from file" で復元
```

これにより環境依存のセーブ消失リスクをユーザー側で回避可能にする。動作確認は手動 E2E チェックリストに含める。

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

### キャラクター作成アルゴリズム

Wizardry のキャラ作成は仕様が複雑なため、設計書段階で骨格を固定する。Pascal の `MAKECHARACTER` / `BONUS` プロシージャに対応。

#### フロー

```
1. 名前入力 (最大 8 文字、英数字)
   ↓
2. 種族選択 (Human / Elf / Dwarf / Gnome / Hobbit)
   ↓
3. 属性選択 (Good / Neutral / Evil)
   ↓
4. 能力値ロール:
   ・各能力値 = 種族 base 値で初期化
   ・ボーナスポイント = roll d10 (1〜10) + 任意のリロール (確率的に高ロール)
   ・1981 オリジナルの正確な式は Pascal で要確認 (推測補完しない)
   ・ボーナスポイントは振り直し可能 (再度 d10)
   ↓
5. ボーナスポイント振り分け (任意の能力値に +1/-1)
   ・能力値の上限は 18 (Pascal 確認)
   ↓
6. 職業選択:
   ・現在の能力値 + 属性で資格のある職業のみ選択肢に表示
   ・職業条件 (Pascal CLASS_REQUIREMENTS):
     - Fighter: STR >= 11
     - Mage: IQ >= 11
     - Priest: PIE >= 11, alignment != Neutral
     - Thief: AGI >= 11, alignment != Good
     - Bishop: IQ >= 12 AND PIE >= 12, alignment != Neutral
     - Samurai: STR >= 15, IQ >= 11, PIE >= 10, VIT >= 14, AGI >= 10, alignment != Evil
     - Lord: STR >= 15, IQ >= 12, PIE >= 12, VIT >= 15, AGI >= 14, LUK >= 15, alignment == Good
     - Ninja: 全能力値 >= 17, alignment == Evil
   ↓
7. 確認 → ロスター追加
```

#### 属性制限まとめ

| 職業 | 善 | 中立 | 悪 |
|---|---|---|---|
| Fighter | ✓ | ✓ | ✓ |
| Mage    | ✓ | ✓ | ✓ |
| Priest  | ✓ | × | ✓ |
| Thief   | × | ✓ | ✓ |
| Bishop  | ✓ | × | ✓ |
| Samurai | ✓ | ✓ | × |
| Lord    | ✓ | × | × |
| Ninja   | × | × | ✓ |

#### 数値の最終確定タイミング

「Pascal で要確認」と書いてある数値（ボーナスロールの確率分布、能力値上限など）は、**M3 の最初のタスクとして CiderPress で Pascal を抽出し、表を埋める**。Plan で具体的なステップとして明記する。

#### テスト

```typescript
// tests/engine/rules/character-creation.test.ts
describe('class qualification', () => {
  it.each([
    [{ str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17, alignment: 'evil' }, ['fighter','mage','thief','ninja', /* ... */]],
    [{ str: 11, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10, alignment: 'good' }, ['fighter']],
    // ...
  ])('attrs %o → eligible classes %o', (attrs, expected) => {
    expect(eligibleClasses(attrs).sort()).toEqual(expected.sort());
  });
});
```

### 迷宮データ

```typescript
export type CellEdge = 'open' | 'wall' | 'door' | 'secretDoor';
export type SpecialTile =
  | 'none'
  | 'stairsUp'
  | 'stairsDown'
  | 'darkness'      // Chapter 1 では「移動可能・視界制限なし」として扱う（演出は Chapter 4）
  | 'spinner'       // Chapter 1 では「無効」として扱う（実装は Chapter 4）
  | 'teleport'      // Chapter 1 では「無効」として扱う（実装は Chapter 4）
  | 'message';      // Chapter 1 で実装（i18n の messageId 経由）

export interface Cell {
  edges: { n: CellEdge; e: CellEdge; s: CellEdge; w: CellEdge };
  special: SpecialTile;
  messageId?: string;
}

export const MAZE_L1: Cell[][] = [/* 20×20 = 400 セル */];
```

### Edge の正規化ルール

隣接セルの壁が矛盾しないよう、**北と西側の Edge のみを真理**として保持し、南・東は隣接セルの北・西から導出する:

- セル `(x, y)` の南エッジ = セル `(x, y+1)` の北エッジ
- セル `(x, y)` の東エッジ = セル `(x+1, y)` の西エッジ
- 端のセル（`y == 19` の南、`x == 19` の東）は別途 `boundaryEdges: { south: CellEdge[]; east: CellEdge[] }` を保持

データ抽出時は冗長に持って良いが、エクスポート前に整合性チェックを走らせる。

### Chapter 1 における特殊マスの扱い

L1 にはオリジナルで暗闇マス・回転床・テレポートが存在するが、Chapter 1 では:

- **`stairsUp` / `stairsDown` / `message`**: 実装する
- **`darkness`**: マス情報としては保持するが、Chapter 1 では「通常マスとして表示」（演出を Chapter 4 で追加）
- **`spinner` / `teleport`**: マス情報としては保持するが、Chapter 1 では「踏んでも何も起きない」（Chapter 4 で挙動実装）

このため Chapter 1 のテストでは「特殊マス上で歩行できる」「データが正しく読まれる」までを確認し、特殊効果の発動はテスト対象外とする。

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
// 日本語訳は PC-9801 / FC 版 Wizardry の用語に準拠 (カタカナ表記中心)
export const MESSAGES = {
  en: {
    'edgeOfTown.title': 'Edge of Town',
    'castle.title': 'Castle',
    'temple.menu.pray': 'Pray to record your journey',
    'race.human': 'Human',
    'race.elf': 'Elf',
    'race.dwarf': 'Dwarf',
    'race.gnome': 'Gnome',
    'race.hobbit': 'Hobbit',
    'class.fighter': 'Fighter',
    'class.mage': 'Mage',
    'class.priest': 'Priest',
    'class.thief': 'Thief',
  },
  ja: {
    'edgeOfTown.title': 'まちのはずれ',
    'castle.title': 'おしろ',
    'temple.menu.pray': 'いのりをささげる',
    'race.human': 'ヒューマン',
    'race.elf': 'エルフ',
    'race.dwarf': 'ドワーフ',
    'race.gnome': 'ノーム',
    'race.hobbit': 'ホビット',
    'class.fighter': 'せんし',
    'class.mage': 'まほうつかい',
    'class.priest': 'そうりょ',
    'class.thief': 'とうぞく',
  },
} as const;
```

種族名はカタカナ（PC 版 Wizardry 準拠）、地名・施設名・職業名はひらがな（PC-9801 版の表記習慣）を採用。FC 版とは一部表記が異なるため、Plan 段階で実際の Wizardry 翻訳テーブルを参考に最終確定する。

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

### 切替とホットリロード

- 設定画面/タイトル画面に Language トグル
- 選択は `settings` テーブルに永続化
- 初回起動: `navigator.language` 判定（`ja*` なら ja、それ以外 en）

#### プレイ中の動的切替

`useT()` フックは内部で `useGameStore((s) => s.lang)` を購読する Zustand セレクタなので、`changeLanguage` イベントで `lang` フィールドが変わると、フックを使っている **すべての React コンポーネントが自動再描画**される。これにより:

- 設定画面で言語を切り替え → 即座に全画面のテキストが新しい言語に更新
- 迷宮内で切り替えても OK（メッセージ・ステータス全て即時反映）
- 例外: Canvas 内に直接描画した文字列は再描画トリガが必要 → state 変化時に再描画する既存の仕組みに乗る

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
    [{ phase: 'castle', party }, { type: 'enterTavern' },  { phase: 'tavern',  sub: { kind: 'menu' }, party }],
    [{ phase: 'castle', party }, { type: 'enterBoltac' },  { phase: 'boltac',  sub: { kind: 'menu' }, party }],
    [{ phase: 'castle', party }, { type: 'enterTemple' },  { phase: 'temple',  sub: { kind: 'menu' }, party }],
    [{ phase: 'castle', party }, { type: 'enterInn' },     { phase: 'inn',     sub: { kind: 'menu' }, party }],
    [{ phase: 'castle', party }, { type: 'leaveCastle' },  { phase: 'edgeOfTown', party }],
  ])('castle: reduce(%o, %o) == %o', (state, event, expected) => {
    expect(reduce(state, event)).toEqual(expected);
  });
});

describe('edgeOfTown phase', () => {
  it.each([
    [{ phase: 'edgeOfTown', party }, { type: 'goToTraining' }, { phase: 'training',  sub: { kind: 'menu' }, party }],
    [{ phase: 'edgeOfTown', party }, { type: 'goToMaze' },     { phase: 'maze', pos: START_POS, party }],
    [{ phase: 'edgeOfTown', party }, { type: 'goToCastle' },   { phase: 'castle', party }],
    [{ phase: 'edgeOfTown', party }, { type: 'goToUtilities' },{ phase: 'utilities', sub: { kind: 'menu' }, party }],
  ])('edgeOfTown: reduce(%o, %o) == %o', (state, event, expected) => {
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

### Pascal 一致の検証方法

「Pascal の挙動と一致するか」を具体化するため、以下の三段階アプローチを取る:

#### 段階 1: Pascal ソースの**手動翻訳**による期待値抽出

CiderPress で抽出した Pascal ファイル（例: `MAKECHARACTER.TEXT`）を読み、ロジックを TypeScript の純関数に**手で翻訳**する。翻訳の妥当性は人間がレビューする（Plan 段階でレビュー手順を明記）。

#### 段階 2: テストフィクスチャの **Pascal 直接対応**

各テスト fixture には Pascal の対応箇所を明示する:

```typescript
// tests/engine/rules/character-creation.test.ts
// Reference: docs/reference/wiz1/Pascal/MAKECHARACTER.TEXT lines 45-67
describe('eligibleClasses (per Pascal MAKECHARACTER lines 45-67)', () => {
  // ...
});
```

#### 段階 3: **Apple II エミュレータでのスポットチェック** (任意)

迷宮データ・キャラ作成・呪文効果など「数値の妥当性が外見的に分からない」ものは、AppleWin 等で実機動作を確認し、本実装の出力と比較する。これは「不一致が疑われた時のみ」のスポット作業で、自動化はしない。

#### 自動化テストの限界明記

Apple II 実機との完全自動比較（output diff）は本プロジェクトのスコープ外。`docs/chapters/<n>/pascal-conformity.md` に「Pascal のどの関数を翻訳元とし、どのテストで検証したか」のマッピングを章ごとに残す。

### 手動 E2E チェックリスト (Chapter 1)

```
□ タイトル → New Game → Edge of Town へ遷移
□ Edge of Town → Training Grounds でキャラ 6 人作成
□ Edge of Town → Castle へ移動
□ Castle → Tavern でパーティ編成（6 人）
□ Castle → Inn で Stables 休息（HP 全快を確認）
□ Castle → Boltac で買い物（所持金が減り inventory に追加）
□ Castle → Edge of Town へ戻る
□ Edge of Town → Maze 進入
□ 北・東・南・西へ移動、壁ブロック挙動の確認
□ ドア通過、階段マーカー表示の確認
□ 1F 上り階段で Castle 帰還
□ Castle → Temple でセーブ → タイトル → Continue で状態復元
□ ブラウザリロード → タイトル → Continue → 状態復元（IndexedDB 永続化確認）
□ プレイ中の言語切替（EN ⇄ JA / 即時反映）
□ ウィンドウサイズ変更で整数倍スケール維持
□ Firefox プライベートブラウジング等のメモリ内 IndexedDB 環境でフォールバック警告が出る
□ JSON エクスポート/インポート (フォールバック機能) の動作確認
```

### CI

`.github/workflows/ci.yml`:
- `pnpm install` → `pnpm biome check` → `pnpm vitest run` → `pnpm build`
- main への push で Vercel が自動デプロイ
- PR でも build/test が走る

---

## 11. Chapter 1 マイルストーン

| マイルストーン | 内容 | P50 | P80 |
|---|---|---|---|
| M0 | **Pascal CiderPress 抽出 + 解析** (races, classes, items, MAZEDATA, MAKECHARACTER 等の仕様読解) → `docs/reference/wiz1/` に整理、`docs/chapters/1/open-questions.md` 起票 | 3 日 | 6 日 |
| M1 | プロジェクト基盤 + **入力キュー含む Zustand 基盤** + 副作用 Orchestration + Apple II UI 基盤 (フォント・スケール・罫線) + Title 画面 + 初回 Vercel デプロイ | 4 日 | 6 日 |
| M2 | Edge of Town メニュー + Castle ハブ + 全施設のメニュー画面 (機能未実装、メニュー遷移のみ) + Leave Game 確認ダイアログ | 3 日 | 5 日 |
| M3 | キャラ作成完成 (M0 の解析結果を反映) + Tavern パーティ編成 + Boltac 売買 + Inn Stables (時間経過のみ) + Utilities | 5 日 | 8 日 |
| M4 | 迷宮データ抽出 (M0 の Pascal データ or tk421 フォールバック) + Wireframe テーブル構築 + Canvas 描画 + 歩行 + 1F 上り階段で Edge of Town へ | 6 日 | 10 日 |
| M5 | IndexedDB セーブ・ロード (寺院セーブ) + Camp の OUT 状態管理 + JSON エクスポート/インポート (フォールバック) + Restart Out Party | 2 日 | 4 日 |
| M6 | i18n 仕上げ (EN/JA 切替・ホットリロード) + 設定画面 + エラー UI (saveError/loadError) | 2 日 | 3 日 |
| M7 | 統合テスト + バグ修正 + デプロイ + README + CHANGELOG | 2 日 | 3 日 |

**P50 合計**: 27 営業日 (約 5.5 週間)
**P80 合計**: 45 営業日 (約 9 週間)

**変更点**:
- **M0 (Pascal 抽出) を独立タスク化**: 当初 M3 に同居していたが、M3/M4 双方が依存するため前倒し。研究的タスクは早く着手して不確実性を解消する
- **入力キューを M1 へ移動**: 当初 M5 だったが、M2-M4 のすべての入力ハンドラに影響するため基盤として最初に実装
- **OUT 状態管理を M5 に明示**: PartyState の status / outAtPosition フィールド、Restart Out Party の実装を含む
- **エラー UI を M6 に明示**: saveError / loadError の Apple II 風メッセージ枠

P50 = 中央値 (50% の確率で完了する見積)、P80 = 楽観的でないバッファ込み (80% の確率で完了する見積)。

研究的タスク (Pascal 抽出・MAZEDATA リバースエンジニアリング・Wireframe 座標抽出) を含む M3/M4 は不確実性が高く、P50 と P80 の差が大きい。

### バンドルサイズ予算

クライアント完結 SPA としての配信サイズを以下に制限:

| 項目 | 目標 (gzip) | 上限 (gzip) |
|---|---|---|
| 初期ロード JS + CSS (React + Zustand + idb + アプリコード) | 200 KB | 350 KB |
| フォント (Print Char 21 + 美咲フォント) | 80 KB | 120 KB |
| 全体ペイロード (gzip 後) | 300 KB | 500 KB |

SQLite WASM 不採用により、当初予算 (1.5 MB / 2.0 MB) から大幅に削減。Lighthouse スコア 95+ を狙える水準。

CI で `vite build` 後にバンドルサイズを計測し、上限超過は警告 → 翌週内に対処する。Lighthouse スコア 90+ を目標とする。

---

## 12. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| Pascal MAZEDATA のフォーマット解読困難 | M4 遅延 | tk421 地図を二次ソースに切替（人手書き起こし、半日程度のバッファあり） |
| Pascal Wireframe 座標の抽出困難 | 迷宮 3D 描画品質低下 | Internet Archive の Apple II 実機スクリーンショットから実測する代替手段あり |
| プライベートブラウジング・ストレージ無効化環境 | セーブ消失リスク | メモリ内 fallback + JSON エクスポート/インポート (Chapter 1 範囲で実装)、警告バナー表示 |
| Apple II 風フォントのライセンス | リリース不可 | M1 着手前に Print Char 21 / 美咲フォントのライセンス再確認、商用利用可フォントへの切替経路を準備 |
| 1981 オリジナル仕様の数値が不確定 | 再現精度低下 | Pascal を最優先、tk421 / Wizardry Wiki を補助、不明点は `docs/chapters/1/open-questions.md` に記録 |
| Chapter 1 が長期化 | モチベ低下 | M1 完了時点で Vercel に上げて毎週進捗を可視化、P80 を超えそうなら M3/M4 のスコープを再交渉 |
| バンドル上限超過 | Lighthouse スコア低下、初回起動遅延 | M5 完了時点で計測、上限超過なら React の代替 (Preact 等) や code-splitting を検討 |
| 入力キューのデッドロック | 演出が終わらず操作不能 | 入力キューに タイムアウト (5 秒) を設け、超過時は state を強制復元しキューをクリア |

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
| ディスク I/O | IndexedDB |
| キーボード入力 | DOM keydown イベント |
| Roster (キャラ共有プール) | save_slot ごとに独立した character テーブル |

## 付録 B: 参考資料

- snafaru/Wizardry.Code: <https://github.com/snafaru/Wizardry.Code>
- tk421 Wizardry 地図: <https://www.tk421.net/wizardry/wiz1maps.shtml>
- Wizardry I 公式情報: <https://www.zimlab.com/wizardry>
