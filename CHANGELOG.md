# Changelog

## [Unreleased]

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
