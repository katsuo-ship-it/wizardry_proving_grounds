# L1 迷宮 20×20 完全データ取り込み — 設計書

**Status**: Draft
**Author**: katsuo.ito + Claude Opus 4.7
**Date**: 2026-05-06
**Predecessor**: M4 (4×4 テストマップ)、M5 (Temple Save & Restore)
**Successor**: M6 (i18n 仕上げ)、Chapter 2 (戦闘・呪文・トラップ実機能)

## 1. 目的

`src/engine/data/maze/level1.ts` に格納されている 4×4 のテストマップ
(M4 開発用の暫定データ) を、20×20 の完全な L1 (Proving Grounds 1F) データ
に差し替える。型定義・歩行ロジック・3D ワイヤーフレーム描画は M4 完了時点
で 20×20 想定済のため変更しない。

## 2. データソース

**wizardryarchives.com の L1 マップ** を一次取り込み元とする。

- URL: <https://wizardryarchives.com/maps/w1map1.gif>
- 形式: 800×600 GIF、20×20 グリッド + 凡例
- 信頼度: 🟡 二次ソース
- 取り込み手段: 画像を `tmp` にダウンロードし、Read ツール (Claude のマルチ
  モーダル機能) で直接読み取って TypeScript 定数に書き起こす

**選定理由** (代替案比較):

| 選択肢 | 工数 | 信頼度 | 採否 |
|---|---|---|---|
| Pascal `.DSK` 抽出 (snafaru/Wizardry.Code + CiderPress) | 数日〜不確定 | 🟢 | ✗ — 約1年棚上げ。今回着手すべき範囲を超える |
| tk421 マップを目視書き起こし | 半日〜1日 | 🟡 | ✗ — 画像 (PNG) 中心で凡例が読み取りにくい |
| **wizardryarchives.com マップを画像読み取り** | 数十分 + 検証 | 🟡 | **✓** — 凡例が完備しており Claude が直接読める |

Pascal 抽出による 🟢 昇格は将来の独立タスクとして保留。

## 3. スコープ

### 取り込む (最小スコープ)

既存型 (`src/engine/data/maze/types.ts`) でカバーできる範囲のみ:

- **CellEdge**: `open` / `wall` / `door` / `secretDoor`
- **SpecialTile**: `none` / `stairsUp` / `stairsDown` / `darkness` / `spinner` / `teleport`

wizardryarchives 凡例とのマッピング:

| 凡例 | 本実装での扱い |
|---|---|
| Wall (太線) | `CellEdge.wall` |
| Door (□) | `CellEdge.door` |
| One Way Door (▼/▲) | `CellEdge.door` (簡略化、Chapter 1 では効果同等) |
| U (Up Stair) | `SpecialTile.stairsUp` |
| D (Down Stair) | `SpecialTile.stairsDown` |
| Dark (網掛け) | `SpecialTile.darkness` |
| T (Turn Table) | `SpecialTile.spinner` |
| X / X' (Warp) | `SpecialTile.teleport` (両方 — Chapter 1 では効果なし) |
| P (Pit) | `SpecialTile.teleport` (落下 = 別座標へ移動と解釈、効果なし) |
| E (Elevator) | `SpecialTile.teleport` (効果なし) |
| S (Shoot) | `SpecialTile.teleport` (効果なし) |
| K (Key Item) | `SpecialTile.none` (アイテム配置は Chapter 2 で別途) |

### 取り込まない (M6+ または Chapter 2 へ持ち越し)

- One Way Door の独立扱い (`CellEdge` の型拡張)
- Pit / Elevator / Warp / Shoot の効果実装と独立 SpecialTile 化
- Key Item の配置データ (アイテム配列)
- メッセージマス (Q-011: wizardryarchives 版に該当無し)
- B2F〜B10F のマップデータ (Chapter 4 以降)

## 4. 座標系変換

**画像座標** (wizardryarchives) と **TS 座標** (本プロジェクト) の対応:

| 軸 | 画像 | TS |
|---|---|---|
| X | 西 → 東 (0 → 19) | 西 → 東 (0 → 19) |
| Y | **南 → 北** (0 = 下端、19 = 上端) | **北 → 南** (0 = 上端、19 = 下端) |

**変換ルール**: 画像上の `(x_img, y_img)` を TS では
`grid[19 - y_img][x_img]` に格納する。エッジの方向 (n/w) 自体は変わらない
(画像で「セルの北壁」は TS でも北壁)。

**開始位置と階段の確定値** (画像から目視確認済):

- 開始位置: 画像 `(0, 0)` (左下の "U" マーカー) → TS `{x: 0, y: 19, dir: "n"}`
- 上り階段: 開始位置と同じ
- 下り階段: 画像 `(0, 9)` 付近 → TS `grid[10][0]` 付近 (書き起こし時に最終確定)

## 5. 作業フロー

```
1. 画像を C:\Users\伊藤勝夫\AppData\Local\Temp\wiz1maps\w1map1.gif にダウンロード済
2. Phase 4-A: 画像左下 (X 0-9, Y 0-9) を読み取り → TS grid[10..19][0..9] を生成
3. Phase 4-B: 画像右下 (X 10-19, Y 0-9) を読み取り → TS grid[10..19][10..19]
4. Phase 4-C: 画像左上 (X 0-9, Y 10-19) を読み取り → TS grid[0..9][0..9]
5. Phase 4-D: 画像右上 (X 10-19, Y 10-19) を読み取り → TS grid[0..9][10..19]
6. southBoundary[20], eastBoundary[20] を埋める (境界全周は wall)
7. テスト実行 (level1.test.ts) で構造妥当性・整合性・到達可能性を検証
8. 失敗箇所は画像を再 Read して修正
9. 全テスト green → 1 コミット (書き起こしは 1 コミットにまとめる)
10. ドキュメント更新 → 2 コミット目
```

各 Phase 後に部分テスト (10×10 ブロックの境界整合性) を流してエラーを早期
検出する。中間状態のコミットは作らない (Edge 対称性が部分的に崩れている
ためテストが通らない可能性が高い)。

## 6. テスト戦略

`tests/engine/data/maze/level1.test.ts` を 4×4 前提から 20×20 前提へ
書き換え。検証内容:

### 6-1. 構造の妥当性
- `grid.length === 20`
- すべての `y` で `grid[y].length === 20`
- `southBoundary.length === 20`、`eastBoundary.length === 20`

### 6-2. 開始位置と階段
- `startPosition` のセル (`grid[19][0]`) が `special === "stairsUp"`
- `stairsUp` の総数 = 1
- `stairsDown` が 1 個以上存在

### 6-3. 境界エッジ
- すべての `x` で `grid[0][x].edges.n === "wall"` (北端)
- すべての `y` で `grid[y][0].edges.w === "wall"` (西端)
- `southBoundary` の全 20 要素が `"wall"`
- `eastBoundary` の全 20 要素が `"wall"`

### 6-4. 特殊マス分布
- `darkness` の総数 = 期待値 (書き起こし完了時に確定。マジックナンバー
  は冒頭の定数に集約)
- `spinner` の総数 = 期待値
- `teleport` の総数 = 期待値

### 6-5. 到達可能性
- BFS で開始位置から `stairsDown` まで到達可能 (扉は通過可、壁不可)
- 孤立セル (どこからも到達できないセル) の数 = 0、もしくは期待値 (書き
  起こし時に決定。例えば壁で完全に囲まれた小部屋がある可能性)

### 6-6. 既存の影響
- `tests/engine/rules/movement.test.ts` 等は独立した `Cell[][]` を構築する
  ので `MAZE_L1` 差し替えの影響を受けない
- `tests/engine/data/maze/lookup.test.ts` は API のみテストしており
  `MAZE_L1` の中身に依存しない

## 7. ファイル変更

### 修正

- `src/engine/data/maze/level1.ts` — 4×4 → 20×20 完全データ
- `tests/engine/data/maze/level1.test.ts` — 4×4 前提のテストを廃棄、6 章の
  検証で書き直し
- `docs/reference/wiz1/data-tables/maze-l1.md` — 信頼度マーキングを更新、
  座標表 (画像 + TS) を実値で記載
- `docs/chapters/1/open-questions.md` — Q-005 / Q-006 / Q-012 を解消マーク
- `CHANGELOG.md` / `README.md` — マイルストーン状況を更新

### 変更なし

- `src/engine/data/maze/types.ts` (型定義)
- `src/engine/rules/movement.ts` (歩行ロジック)
- `src/engine/state/reduceMaze.ts` (迷宮状態遷移)
- `src/render/maze/*` (3D ワイヤーフレーム描画)
- `src/screens/Maze/*` (Maze 画面)

これらは M4 完了時点で 20×20 想定で実装済のため、データ差し替えに
追従する変更は不要。

## 8. 未解決事項の解消

| ID | 元の問い | 解消内容 |
|---|---|---|
| Q-005 | Edge 正規化スクリプトを書くか | 不要。テストで担保 (R 方式) |
| Q-006 | L1 暗闇マス座標 | 書き起こし完了で確定。`maze-l1.md` の座標表に記載 |
| Q-011 | L1 メッセージ文言 | 保留 (wizardryarchives 版に該当無し。Pascal 抽出時に再検討) |
| Q-012 | 開始位置座標 | 画像 (0, 0) 北向き = TS `{x: 0, y: 19, dir: "n"}` で確定 |

## 9. コミット粒度

```
feat(maze): L1 20×20 complete map data from wizardryarchives.com
docs: L1 maze release notes
```

書き起こし本体は 1 コミット (Phase A〜D + テスト + 内部ドキュメント)、
リリースノート (CHANGELOG/README) は別コミット。M3〜M5 の慣行と統一。

## 10. 成功基準

- `pnpm typecheck` — 0 エラー
- `pnpm lint` — 0 エラー (M5 完了時点の警告 7 件から増えない)
- `pnpm test` — 181 + 新テスト数 すべて green
- `pnpm build` — gzip 200 KB 以内 (現状 64.81 KB から +0.5 KB 程度を許容)
- 開始位置から下り階段まで BFS で到達可能 (テストで保証)
- GitHub Actions CI green
- Vercel デプロイ後、ブラウザで Maze に入って 20×20 のフロアを歩けること
  (手動確認)

## 11. リスクと緩和策

| リスク | 緩和策 |
|---|---|
| 画像の誤読 (Edge の食い違い) | 4 象限に分けて段階的に検証。BFS 到達可能性テストで連結性を保証 |
| 凡例マッピングの解釈ミス (例: P を teleport にしたが原典では別挙動) | 「Chapter 1 では効果なし」方針なので機能差は出ない。Chapter 2 で型拡張時に再検討 |
| One Way Door を door に簡略化したことによる原典との挙動差 | Chapter 1 では効果なし。Chapter 2 で `oneWayDoor` を `CellEdge` に追加して再書き起こし |
| 書き起こしに想定以上の時間 | 4 象限に分けてあるので途中で中断しても次のセッションで継続可能。中間 TS は WIP コミットせず、ローカルで保持 |

## 12. スコープ外 (将来のマイルストーン)

- B2F〜B10F のマップデータ → Chapter 4
- One Way Door / Pit / Elevator / Warp / Shoot の効果実装 → Chapter 2+
- Key Item の配置と取得実装 → Chapter 2
- L1 メッセージマスの追加 (Q-011) → Pascal 抽出後
- 一次ソース (Pascal) による 🟡 → 🟢 昇格 → Pascal 抽出環境構築後
