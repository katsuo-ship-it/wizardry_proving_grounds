# Changelog

## [Unreleased]

### Chapter 1 / 迷宮 3D 描画再設計 (Q-014) - 2026-05-10

#### Added

- Three.js ベースの新しい迷宮 3D レンダラ
  (`src/render/maze/{camera,geom,materials,overlay,scene,view,types}.ts`)
- 5 つの merged BufferGeometry: 壁/床/天井/扉/階段マーカー (= 5 draw call)
  L1 全マップ静的 mesh + frustum culling
- `MeshLambertMaterial` + `Fog`(near=3.0, far=8.0, black) +
  `AmbientLight`(0.7) + `DirectionalLight`(0.8) で shaded surfaces
- 白フレーム輪郭線 (EdgesGeometry + LineSegments) で視認性向上
  (Apple II 原典 wireframe 感も少し戻す)
- カメラ滑らか補間 (`CameraAnimator`、easeInOutQuad、
  前進 150ms / 回転 200ms、中断時は現在補間値から再スタート)
- 階段マーカー (床上に上向き三角の `CanvasTexture`、
  上り/下りとも同じ texture を使用 — MVP)
- Playwright スクリーンショット回帰テスト
  (8 視点 × 4 方向 = 32 baseline、`tests/visual/maze.spec.ts`)
- DEV 専用 debug API
  (`window.__wpgDev.devEnterMazeAt` / `isMazeAnimating`) —
  テスト専用、production では no-op
- CI に Playwright step 追加 (Chromium キャッシュ、
  初回ブートストラップで baseline 自動生成 + GitHub Actions warning でフラグ)

#### Changed

- `src/screens/Maze/MazeView.tsx` を outer/inner split に再構成
  (StrictMode/null guard 安全化、phantom animation 短絡)
- ルート設計書 `docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md`
  Section 5 を新方式の 16 行サマリに書き換え
  (詳細は 2026-05-09 設計書へ参照)

#### Removed

- 旧 per-cell rect wireframe renderer
  (`src/render/maze/{render,segments,viewport,wireframeTable}.ts` + 2 tests)
- orphan `src/render/canvas/draw.ts`
- 旧型 `LineSegment` / `SegmentSet` / `WireframeTable`
  (`src/render/maze/types.ts` から)

#### Notes

- Q-014 解決: 連続壁の境界で線が中途半端に途切れる構造的描画バグを根本解消
- `wip/maze-render-polish-attempt` ブランチは参考用に残置 (削除しない)
- 当初 brainstorming では range-scan 方式 (純 2D) を候補としたが、
  最終的に Three.js + Shaded Walls (3D エンジン) に方向転換
- 配色 (`materials.ts` の hex 値) と Fog 範囲 (`scene.ts` の Fog near/far) は
  手動プレイテスト中の調整で決定。今後 polish 余地あり

#### Tests

- 210 tests passing across 31 files (旧 189 → +21)
- 32 Playwright screenshot tests
  (Linux baselines を CI 初回 run で生成 — ローカル Windows では skip)
- Bundle: 195.53 KB gzip JS (spec target 220 KB 以下; 3D エンジン追加で
  65.77 → 195.53 KB)
- typecheck / build clean; lint エラーは既存の CRLF 問題のみ (新規なし)

### Chapter 1 / L1 完全マップデータ - 2026-05-04

#### Added

- 20×20 完全な L1 マップデータ取り込み (M4 で延期した分の解消)
- 出典: [davemoore22/sorcery](https://github.com/davemoore22/sorcery)
  プロジェクトの `dat/maps.json` (Grid Cartographer 形式、GPL v2+)
  経由で Wizardry I L1 (floor index = -1) を抽出
- `scripts/import-l1-from-sorcery.mjs` — 一回限りの取り込みスクリプト
  (再現性 / 監査用にリポジトリに保持)
- 開始位置 (0, 19) 北向き = Castle 帰還用 stairsUp と一致
- 下り階段、暗闇マス (38 セル)、テレポート (5 個) の座標確定
  (Chapter 1 では効果なし、データのみ保持)
- BFS 到達可能性テスト (開始位置から 100 セル以上に直接歩行で到達)
- 特殊マスカウントテスト (darkness/spinner/teleport/stairsDown)

#### Changed

- M4 で導入した 4×4 テストマップを廃棄
- 既存テスト (`movement.test.ts`, `reduceMaze.test.ts`,
  `reduceEdgeOfTown.test.ts`, `segments.test.ts`) を新 startPosition
  `(0, 19)` に合わせて書き直し
- `docs/reference/wiz1/data-tables/maze-l1.md` を実データ確定状態に更新
- `docs/chapters/1/open-questions.md`: Q-005 / Q-006 / Q-012 を解消マーク

#### Notes

- 信頼度 🟡 (二次ソース)。Pascal MAZEDATA からの一次抽出による 🟢 昇格は
  将来課題
- 一方向通路 (Grid Cartographer edge value 5/6/8/9) は本実装の対称型 edge
  に合わせて双方向 door/secretDoor に簡略化 (Chapter 1 では効果差なし)
- One Way Wall (7/10) と Secret Wall (13) は wall に簡略化
- Pit / Elevator / Warp / Chute は SpecialTile = teleport に統合 (効果は
  Chapter 2+ で実装)
- Message / Notice / Ladder マーカーは取り込まず none (Q-011 保留、Pascal
  抽出時に再検討)
- 境界全周は強制 wall (Sorcery のトロイダルラップは非対応)

#### Tests

- 189 tests passing across 30 files (M5 から +5 件)
- Bundle: 65.77 KB gzip JS (200 KB 目標内、+0.96 KB 増)

### Chapter 1 / M5 - 2026-05-04

#### Added

- IndexedDB save/load with atomic transaction across `saveSlot` + `character`
  stores (single readwrite tx; characters serialized separately, gameState JSON
  references characterId)
- `serializeState` / `deserializeState` with phase whitelist validation
- `db.listSlots` / `deleteSlot` / `saveStateAtomic` / `loadStateAtomic`
- `db.exportAll` (Blob) / `importAll` (replace mode) for JSON dump/restore;
  FileReader-based blob→text for jsdom + native compatibility
- Temple of Cant save flow: menu → save picker (existing slot or "New") →
  name input → progress → done/error (auto-back on done)
- Title screen: Continue lists save slots from IndexedDB; selecting a slot
  fires `load` effect that replaces full GameState
- Settings screen: Export Save (download JSON) + Import Save (file input,
  warns "all data overwritten")
- Utilities → Restart Out Party: lists all slots (M5 simplified — full
  OUT-state filter deferred)
- `checkStorageHealth` IndexedDB sanity probe at bootstrap; Title shows red
  warning banner when storage is unavailable
- Effect orchestrator: `bindEffect` detects `temple.saving` / `title.loading`
  state transitions; `runEffect` dispatches `loadStarted` / `saveStarted`
  then resolves to `*Succeeded` / `*Failed`
- 6 internal events for save/load lifecycle (`loadStarted`, `loadSucceeded`,
  `loadFailed`, `saveStarted`, `saveSucceeded`, `saveFailed`)

#### Notes

- `runEffect` now takes `getState: () => GameState` as a parameter (was
  module-level closure) — keeps store the single source of truth
- Placeholder screen/reducer removed (now redundant — all phases route to
  dedicated reducers)
- `INTERNAL_EVENT_TYPES` (input-queue bypass) extended for save/load events

#### Tests

- 181 tests passing across 30 files (+14 from M4)
- New: `serialize.test.ts`, `save.test.ts`, `reduceTemple.test.ts`,
  expanded `reduceTitle.test.ts`
- Bundle: 64.81 KB gzip JS (still under 200 KB target)

### Chapter 1 / M4 - 2026-05-06

#### Added

- Maze data types (Cell / CellEdge / SpecialTile / MazeLevel) with edge-normalized
  storage (north/west on cell, south/east derived from neighbor)
- `MAZE_L1` minimal 4x4 test map with up-stairs and a door (full 20x20 from
  tk421 deferred)
- Movement rules (pure functions): turnLeft/turnRight/reverse, canPassEdge,
  canMoveForward, advance
- Viewport calculation: `worldFromView` (pos+dir → world coord) and
  `computeViewport` returning 12 visible cells
- WIREFRAME_TABLE with 12 entries (4 depths × 3 rel positions) using nested
  perspective rectangles + lateral parallax shifts
- `selectSegments` per-cell renderer choosing wall/door/stairs based on edges
- Canvas drawing helpers: clear + drawLines (pixel-aligned)
- `renderMazeView` with depth-first occlusion (far-to-near order)
- `reduceMaze` with movement, camp transition, stairs-to-edgeOfTown
- `reduceCamp` with leave (back to maze) and quit-to-town (party becomes OUT)
- Maze screen: Canvas + keyboard input (Arrow/WASD/C/Enter)
- Camp screen: Menu with Leave / Quit
- Edge of Town now blocks Maze entry on empty party and uses
  MAZE_L1.startPosition

#### Notes

- 9 movement events added to GameEvent: moveForward/moveBackward/turnLeft/
  turnRight/openCamp/ascendStairs/descendStairs/leaveCamp/quitToTown
- maze phase now carries `pos` instead of `sub`. camp phase has both `sub`
  and `pos` (preserves location while in camp menu)
- Wireframe coordinates are provisional — Apple II accuracy requires Pascal
  extraction (deferred)
- Full 20x20 L1 cell data ingestion deferred to a separate task

#### Tests

- 167/167 tests passing across 29 files
- Bundle: 62.06 KB gzip JS (still under 200 KB target)

### Chapter 1 / M3 - 2026-05-05

#### Added

- Game data constants from M0 reference: 5 races, 8 classes, 12 items, 3 alignments
- mulberry32 PRNG with rollDie helper for deterministic testing
- Character type with full status (HP/MP/level/exp/gold/AC/age/restCount), inventory, status flag
- IndexedDB character CRUD: listCharacters / addCharacter / updateCharacter / getCharacter / deleteCharacter
- Character creation rules (pure functions): rollBonus, applyBonus, eligibleClasses, makeCharacterFromDraft
- Inventory rules: addItem, removeItem, calcSellPrice (50% of cost)
- 7-step character creation flow at Training Grounds: name → race → alignment → roll → allocate → class → confirm
- Class qualification filter (e.g., Ninja requires all 17+ and evil)
- Tavern with party formation (Add/Remove/Inspect, slot-based 6-member party)
- Boltac's Trading Post: Buy and Sell with class restrictions, gold/inventory mutation, equipped items locked
- Adventurer's Inn: Stables tier (free, restCount++ only, no HP recovery per 1981 original)
  with Cot/Economy/Merchant/Royal Suite shown disabled until Chapter 2
- Character detail inspect screen with delete confirmation
- Character roster persistence across browser sessions

#### Notes

- All character creation and town services are now functional. M4 will add maze walking.
- M5 will add Temple-of-Cant save, Restart Out Party, and Inn Cot+ tiers.
- 118 tests passing across 22 files. Bundle: 60 KB gzip JS (still under 200 KB target).

### Chapter 1 / M2 - 2026-05-05

#### Added

- Edge of Town menu (T/M/C/U/L) with hotkey navigation
- Castle hub menu (G/B/T/A/E)
- Leave Game confirmation dialog (Y/N)
- Placeholder screens for Training, Utilities, Tavern, Boltac, Temple, Inn, Maze
- Reusable `Menu` component with hotkey support (global keydown listener)
- Reusable `Placeholder` component with `goBack` event routing
- New game flow: Title "New Game" now transitions to Edge of Town with empty party
- i18n messages for Edge of Town, Castle, and 7 sub-screen titles/placeholders

#### Notes

- All sub-screens (Training, Tavern, etc.) display "available in M{n}" placeholders
- M3 will implement Training/Tavern/Boltac/Inn (Stables only) and Utilities
- M4 will implement Maze (3D wireframe view + 1F walking)
- M5 will implement Temple save and Restart Out Party

#### Tests

- 57/57 tests passing across 12 test files
- Bundle size: 52.28 KB gzip JS (target ≤ 200 KB)

### Chapter 1 / M0 + M1 - 2026-05-04

#### Added

**M0: Pascal 抽出インフラ**

- `docs/reference/wiz1/` - 抽出ガイド・データ表 (二次ソース由来、Pascal 検証待ち)
- `scripts/extract-dsk.ps1` - CiderPress II CLI ラッパー
- `docs/chapters/1/open-questions.md` - 不明点トラッキング (Q-001〜Q-013)

**M1: プロジェクト基盤**

- Vite 5 + React 18 + TypeScript strict + pnpm 10
- Apple II 仮想ピクセルグリッド (`--vp` CSS 変数、整数倍スケール 1x/2x/3x/4x)
- Print Char 21 (英語) / 美咲フォント (日本語) 用の `@font-face` 定義
- ステートマシン基盤:
  - 自作 reducer + discriminated union (XState 不採用)
  - Zustand vanilla store + React フック
  - 入力キュー (1 操作先行、リピート抑制、5 秒安全タイムアウト)
  - 副作用 Orchestration (純 reducer + bindEffect/runEffect 分離)
  - `isAnimating` / `isBusy` の二重ロックと flushQueue 冪等性
- IndexedDB 永続化スケルトン (`idb` ラッパ、settings API のみ)
- i18n 基盤 (en/ja、Zustand 購読でホットリロード)
- Title 画面 (main / settings / continue / loading / loadError sub-states)
- GitHub Actions CI (lint + typecheck + test + build)
- Vercel デプロイ設定

#### Notes

- 戦闘・呪文・キャラ作成・迷宮・セーブ機能は Chapter 1 / M2 以降の各マイルストーンで実装
- フォントファイル本体はリポジトリ非含有 (各自で取得、`public/fonts/README.md` 参照)
- Pascal `.DSK` 抽出は手動作業 (CiderPress II が必要、`docs/reference/wiz1/README.md` 参照)

#### Tests

- 26 tests passing across 7 files (engine state, store, persist, i18n, ui, screens)
- Bundle size: 50.53 KB gzip (target ≤ 200 KB / ceiling 350 KB)
