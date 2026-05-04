# ITEMS データ表 (Chapter 1 範囲)

**信頼度**: 🟡 二次ソース (Pascal 抽出後に検証予定)
**Source (一次)**: TBD — `pascal-sources/Wiz1?/?.TEXT` の `ITEMS` 配列 (実ファイル名は抽出時に確定)
**Source (二次)**: [tk421 Items](https://www.tk421.net/wizardry/wiz1items.shtml) / [Wizardry Wiki](https://wizardry.wiki.gg/)

## スコープ (Chapter 1 範囲)

- **対象**: Boltac's Trading Post で Chapter 1 開始時点に売られている **Lv1 装備のみ**
- **除外**: 戦闘・呪文・冒険報酬で得られる装備 → Chapter 2 以降
- **除外**: 識別済み名 / 未識別名の二重表記 → Chapter 4
- **除外**: 呪われた装備 → Chapter 4
- **挙動**: Chapter 1 では「数値表示のみで効果は未反映」(設計書 DoD #7 参照)

## 武器

| ID | Name (EN)        | Name (JA)        | Cost (GP) | Damage | Class                    |
|----|------------------|------------------|-----------|--------|--------------------------|
| W01 | Long Sword       | ロングソード      | 25        | 1d8    | F / S / L / N            |
| W02 | Short Sword      | ショートソード    | 15        | 1d6    | F / S / L / N / T        |
| W03 | Anointed Mace    | アノイントメイス  | 30        | 2d3    | F / P / B / S / L / N    |
| W04 | Anointed Flail   | アノイントフレイル| 150       | 2d4    | F / P / B / S / L        |
| W05 | Staff            | スタッフ          | 5         | 1d4    | F / M / P / B / S / L    |
| W06 | Dagger           | ダガー            | 5         | 1d4    | F / M / T / B / S / L / N|

> **凡例 (Class)**: F=Fighter, M=Mage, P=Priest, T=Thief, B=Bishop, S=Samurai, L=Lord, N=Ninja

## 防具 (鎧)

| ID  | Name (EN)        | Name (JA)        | Cost (GP) | AC Bonus | Class                |
|-----|------------------|------------------|-----------|----------|----------------------|
| A01 | Leather Armor    | レザーアーマー    | 50        | -1       | F / T / S / L / N    |
| A02 | Chain Mail       | チェインメイル    | 90        | -2       | F / P / S / L        |
| A03 | Breast Plate     | ブレストプレート  | 200       | -3       | F / P / S / L        |
| A04 | Plate Mail       | プレートメイル    | 750       | -4       | F / S / L            |

## 盾

| ID  | Name (EN)        | Name (JA)        | Cost (GP) | AC Bonus | Class                  |
|-----|------------------|------------------|-----------|----------|------------------------|
| S01 | Small Shield     | スモールシールド  | 20        | -1       | F / P / T / S / L / N  |
| S02 | Large Shield     | ラージシールド    | 40        | -2       | F / P / S / L          |

## 兜

| ID  | Name (EN)        | Name (JA)        | Cost (GP) | AC Bonus | Class                  |
|-----|------------------|------------------|-----------|----------|------------------------|
| H01 | Helm             | ヘルム            | 100       | -1       | F / P / S / L / N      |

## 装備スロット (情報)

Wizardry I では各キャラ 8 スロット:
1. 武器
2. 鎧
3. 盾
4. 兜
5. 篭手 (Chapter 2 以降)
6-8. その他

Chapter 1 では 1〜4 のスロットへの装備を可能にする (装備効果は未反映なので AC 等の表示変動なし)。

## TypeScript 移植時の構造案

```typescript
// src/engine/data/items.ts (M3 で実装)
export type ItemSlot = 'weapon' | 'armor' | 'shield' | 'helmet';
export type ItemId = 'longSword' | 'shortSword' | /* ... */;

export const ITEMS = {
  longSword: { id: 'longSword', slot: 'weapon', cost: 25, damage: { dice: 1, sides: 8 }, allowedClasses: ['fighter','samurai','lord','ninja'] },
  // ...
} as const;
```

## 不明点

- [ ] **Q-008**: Boltac の初期在庫数 / 補充タイミング (1981 オリジナルの挙動確認)
- [ ] **Q-009**: 売却価格の計算式 (購入価格の何割か)
- [ ] **Q-010**: Chapter 1 で実装すべき装備の最終確定 (上記リストは推定)

## 検証チェックリスト

- [ ] 各装備の Cost / Damage / AC が Pascal と一致
- [ ] 各装備の Class 制限が Pascal と一致
- [ ] アイテム ID 体系の最終確定 (上記 W01/A01 等は仮)
