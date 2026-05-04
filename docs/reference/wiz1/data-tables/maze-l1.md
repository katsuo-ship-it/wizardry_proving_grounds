# MAZE Level 1 データ

**信頼度**: 🟡 二次ソース予定 (M4 着手時に [tk421 maps](https://www.tk421.net/wizardry/wiz1maps.shtml) を参照して人手書き起こし、または Pascal 抽出成功時は一次ソースから)
**Source (一次)**: TBD — `pascal-sources/Wiz1?/MAZEDATA` (バイナリパック形式、解読要)
**Source (二次)**: [tk421 Wizardry I Maps](https://www.tk421.net/wizardry/wiz1maps.shtml)

## 形式

- **グリッド**: 20×20 セル
- **各セル**: 北・東・南・西の 4 辺それぞれに `wall | door | secretDoor | open` の状態
- **特殊マス**: stairsUp / stairsDown / message / darkness / spinner / teleport
- **本実装の保持方法**: 北・西の Edge のみを真理として保持し、南・東は隣接セルから導出 (設計書 Section 7「Edge の正規化ルール」)

## L1 の概要 (tk421 参照)

- **開始位置**: (0, 0) で北向き
- **上り階段 (Castle へ脱出)**: (0, 0) — Maze 進入時の同位置にある
- **下り階段 (B2F へ)**: 1 箇所程度 (詳細は M4 で書き起こし、Chapter 1 では機能しない)
- **暗闇マス**: 数か所 (Chapter 1 では効果なし、データのみ保持)
- **回転床・テレポート**: L1 にはほぼ無し / あっても Chapter 1 では効果なし
- **メッセージ**: L1 には数個 (例: "STAIRS LEADING DOWN" 系)

## L1 のテキスト概略 (tk421 ベース、後で詳細書き起こし)

L1 は迷路としては比較的シンプル。回廊と部屋がいくつかあり、初心者向けに探索しやすい構造。

ASCII 略図 (M4 で正式化):

```
   N  → 北 (y=0)
   ↑
W ←   → E
   ↓
   S  → 南 (y=19)
   x=0 ............. x=19
```

## セルデータ (CSV 形式 — M4 で TS に変換)

```csv
x,y,n,e,s,w,special,messageId
0,0,wall,door,wall,wall,stairsUp,
0,1,wall,wall,door,wall,none,
... (M4 で 400 セル全て埋める)
```

> M4 着手時、tk421 の地図画像を見ながら Excel/CSV 風の表に書き起こし、`scripts/maze-csv-to-ts.ts` などで TypeScript 定数に変換する。
> 1F は 20×20 = 400 セルなので人手作業で半日〜1日。

## TypeScript 移植時の構造案

```typescript
// src/engine/data/maze/level1.ts (M4 で実装)
export type CellEdge = 'open' | 'wall' | 'door' | 'secretDoor';
export type SpecialTile = 'none' | 'stairsUp' | 'stairsDown' | 'darkness' | 'spinner' | 'teleport' | 'message';

export interface Cell {
  edges: { n: CellEdge; w: CellEdge };  // 北と西のみ真理 (南・東は隣接セルから導出)
  special: SpecialTile;
  messageId?: string;
}

export const MAZE_L1: Cell[][] = [/* 20×20 = 400 セル、M4 で埋める */];
export const MAZE_L1_BOUNDARY = {
  south: [/* y=19 行の南エッジ 20 個 */],
  east:  [/* x=19 列の東エッジ 20 個 */],
};
```

## 不明点

- [ ] **Q-005**: Edge 正規化スクリプトを書くか (M4 着手時に判断)
- [ ] **Q-006**: 暗闇マス座標の確定 (tk421 で目視確認)
- [ ] **Q-011**: L1 のメッセージ文言 (英語 / 日本語ローカライズ用)
- [ ] **Q-012**: 開始位置の正確な座標 ((0, 0) で正しいか tk421 の地図と照合)

## 検証チェックリスト (M4 完了時)

- [ ] 400 セル全ての edge が tk421 地図と一致
- [ ] 上り階段の位置が tk421 と一致
- [ ] 隣接セルの edge 整合性が取れている (北/西の対称チェック)
- [ ] Pascal MAZEDATA 抽出に成功した場合、二次ソースとの差分を `extraction-log.md` に記録
