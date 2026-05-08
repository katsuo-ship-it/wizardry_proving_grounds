# MAZE Level 1 データ

**信頼度**: 🟡 二次ソース (Sorcery プロジェクト経由で書き起こし完了 — 2026-05-04)
**Source (一次)**: TBD — Sir-Tech 1981 Apple II 版 `WIZARDRY.CODE` の `MAZEDATA` (Pascal 抽出は将来課題)
**Source (二次)**:
  - [davemoore22/sorcery](https://github.com/davemoore22/sorcery) の `dat/maps.json` (GPL v2+)
    — Grid Cartographer 形式で Wizardry I 全 10 階層を保持。本ファイル取り込み元
  - [wizardryarchives.com Wizardry I Maps](https://wizardryarchives.com/maps/WizardryIMaps.html)
    — 視覚的検証 (画像) に使用

## 取り込み手順

1. Sorcery の `maps.json` を取得
2. `scripts/import-l1-from-sorcery.mjs <maps.json>` で `src/engine/data/maze/level1.ts` を生成
3. `pnpm vitest run tests/engine/data/maze/level1.test.ts` で構造妥当性 + 整合性 + BFS 到達可能性を検証

## 形式

- **グリッド**: 20×20 セル
- **各セル**: 北・東・南・西の 4 辺それぞれに `open | wall | door | secretDoor` の状態
- **特殊マス**: `none / stairsUp / stairsDown / darkness / spinner / teleport`
- **本実装の保持方法**: 北・西の Edge のみを真理として保持し、南・東は隣接セルから導出 (設計書 Section 7「Edge の正規化ルール」)

## L1 の概要 (実データ確定済)

- **開始位置**: 画像座標 (0, 0) = TS 座標 `{x: 0, y: 19, dir: "n"}` (北向き) ✅ Q-012 解消
- **上り階段 (Castle へ脱出)**: 開始位置と同位置 (1 箇所)
- **下り階段 (B2F へ)**: 1 箇所 — 画像座標 (0, 10) = TS `grid[9][0]` 付近
- **暗闇マス**: 38 セル (主に X=10..11 の縦帯) ✅ Q-006 解消
- **回転床 (spinner)**: 0 個 (L1 には無い)
- **テレポート (Warp 1↔1' / Pit / Elevator / Chute / Shoot 等を統合)**: 5 個
- **メッセージ**: 取り込み対象外 (Q-011 保留 — 本実装では SpecialTile に message なし)

## 凡例マッピング (Grid Cartographer → 本実装)

`scripts/import-l1-from-sorcery.mjs` で適用される変換ルール:

### Edge values

| GC | 意味 | 本実装 |
|---|---|---|
| 0 | NO_EDGE | `open` |
| 1 | WALL | `wall` |
| 2, 3, 12, 33 | UNLOCKED_DOOR / LOCKED_DOOR | `door` |
| 4, 29 | HIDDEN_DOOR / SECRET_DOOR | `secretDoor` |
| 5, 8 | ONE_WAY_DOOR (双方向に簡略化) | `door` |
| 6, 9 | ONE_WAY_HIDDEN_DOOR (双方向に簡略化) | `secretDoor` |
| 7, 10 | ONE_WAY_WALL | `wall` |
| 13 | SECRET_WALL | `wall` |

### Markers

| GC | 意味 | 本実装 |
|---|---|---|
| 1 | STAIRS_UP | `stairsUp` |
| 2 | STAIRS_DOWN | `stairsDown` |
| 4, 5 | TELEPORT_FROM / TELEPORT_TO | `teleport` |
| 7 | PIT | `teleport` |
| 11 | SPINNER | `spinner` |
| 21 | ELEVATOR | `teleport` |
| 50 | CHUTE | `teleport` |
| 25, 108 | MESSAGE / NOTICE | `none` (本実装ではメッセージ機能なし) |
| 26, 27 | LADDER_UP / LADDER_DOWN | `none` (1981 原典で stairsUp は startPosition のみ) |

### その他

- `d="1"` (darkness flag): marker が無い場合 `darkness`、ある場合は marker 優先
- 一方向通路 (5/6/8/9): 本実装は edge を 1 値で持つため、双方向 door として簡略化
  (Chapter 1 では機能差なし、Chapter 2+ で型拡張時に再書き起こし)
- 境界 (北端/南端/西端/東端): 強制的に `wall` (Sorcery のトロイダルラップは非対応)

## 座標系変換

| 軸 | 画像/Sorcery | TS (本実装) |
|---|---|---|
| X | 西 → 東 (0 → 19) | 西 → 東 (0 → 19) |
| Y | **南 → 北** (0 = 下、19 = 上) | **北 → 南** (0 = 上、19 = 下) |

変換ルール: 本実装 `grid[y][x]` ↔ Sorcery `(x, 19 - y)` ([注] Sorcery のグリッドは
`bottom_left.x = -1` のため、データ参照時は `x_abs = -1 + start + i` で算出)

## 不明点

- [x] **Q-005**: Edge 正規化スクリプトを書くか → 不要 (テストで担保)
- [x] **Q-006**: 暗闇マス座標の確定 → 38 セル、確定 (実データ参照)
- [ ] **Q-011**: L1 のメッセージ文言 → 保留 (Pascal 抽出時に再検討)
- [x] **Q-012**: 開始位置の正確な座標 → (0, 19) 北向き、確定

## 検証ステータス

- [x] 20×20 グリッド構造、境界全周 wall
- [x] 開始位置 = stairsUp (1 個のみ)
- [x] 下り階段 1 個以上存在
- [x] 特殊マス分布カウント (darkness=38, spinner=0, teleport=5)
- [x] BFS 到達可能性 (開始位置から 100 セル以上に直接歩行で到達可能)
- [ ] Pascal MAZEDATA 抽出成功時に Sorcery データと差分検証 → `extraction-log.md` に記録予定 (将来)
