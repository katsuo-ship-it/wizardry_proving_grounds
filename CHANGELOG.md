# Changelog

## [Unreleased]

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
