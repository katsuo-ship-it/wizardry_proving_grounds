# CLASSES データ表

**信頼度**: 🟡 二次ソース (Pascal 抽出後に検証予定)
**Source (一次)**: TBD — `pascal-sources/Wiz1?/GLOBAL.TEXT` の `CLASSES` 配列および `CLASS_REQUIREMENTS`
**Source (二次)**: [Wizardry Wiki: Class](https://wizardry.wiki.gg/wiki/Class) / [tk421 Walkthrough](https://www.tk421.net/wizardry/wiz1walk.shtml)

## 職業条件 (能力値最低値)

各職業に転職するために必要な能力値の最低値。1981 オリジナル基準。

| Class   | STR | IQ  | PIE | VIT | AGI | LUK |
|---------|-----|-----|-----|-----|-----|-----|
| Fighter | 11  | -   | -   | -   | -   | -   |
| Mage    | -   | 11  | -   | -   | -   | -   |
| Priest  | -   | -   | 11  | -   | -   | -   |
| Thief   | -   | -   | -   | -   | 11  | -   |
| Bishop  | -   | 12  | 12  | -   | -   | -   |
| Samurai | 15  | 11  | 10  | 14  | 10  | -   |
| Lord    | 15  | 12  | 12  | 15  | 14  | 15  |
| Ninja   | 17  | 17  | 17  | 17  | 17  | 17  |

## 職業条件 (アライメント制限)

| Class   | Good | Neutral | Evil |
|---------|------|---------|------|
| Fighter | ✓    | ✓       | ✓    |
| Mage    | ✓    | ✓       | ✓    |
| Priest  | ✓    | ✗       | ✓    |
| Thief   | ✗    | ✓       | ✓    |
| Bishop  | ✓    | ✗       | ✓    |
| Samurai | ✓    | ✓       | ✗    |
| Lord    | ✓    | ✗       | ✗    |
| Ninja   | ✗    | ✗       | ✓    |

## 職業の特性 (一般情報)

| Class   | 役割     | HP 成長 | 呪文           | 武器/防具制限       |
|---------|----------|---------|----------------|---------------------|
| Fighter | 戦士     | 高      | なし           | 全武器・全鎧        |
| Mage    | 魔術師   | 低      | Mage 呪文      | 短剣・ローブのみ    |
| Priest  | 僧侶     | 中      | Priest 呪文    | 鈍器・全鎧          |
| Thief   | 盗賊     | 中      | なし           | 短剣・革鎧のみ      |
| Bishop  | 司祭     | 中低    | 両方 (遅成長)  | 鈍器・全鎧          |
| Samurai | 侍       | 高      | Mage 呪文 (遅) | 全武器 (Lord 系防具)|
| Lord    | 君主     | 高      | Priest 呪文 (遅)| 全武器・全鎧       |
| Ninja   | 忍者     | 中高    | なし           | 短剣・素手強化      |

呪文の成長レート、武器制限の正確なリストは Chapter 2 / 3 で Pascal を参照して埋める。

## 経験値テーブル

各職業ごとに「次のレベルまでの経験値」が定義される。Chapter 2 で扱う (Inn でレベルアップを実装する時点)。本ファイルでは省略。

## 不明点 (open-questions.md にも記録)

- [ ] **Q-002**: ボーナスポイントの正確な分布式 (Pascal `BONUS` プロシージャ要再確認)
- [ ] **Q-003**: 能力値上限が 18 で正しいか (Pascal で確認)
- [ ] **Q-007**: 職業変更時の能力値・経験値・装備の挙動 (Chapter 2)

## TypeScript 移植時の構造案

```typescript
// src/engine/data/classes.ts (M3 で実装)
export const CLASSES = {
  fighter: { id: 'fighter', minStats: { str: 11 },                                              alignments: ['good','neutral','evil'] },
  mage:    { id: 'mage',    minStats: { iq: 11 },                                               alignments: ['good','neutral','evil'] },
  priest:  { id: 'priest',  minStats: { pie: 11 },                                              alignments: ['good','evil'] },
  thief:   { id: 'thief',   minStats: { agi: 11 },                                              alignments: ['neutral','evil'] },
  bishop:  { id: 'bishop',  minStats: { iq: 12, pie: 12 },                                      alignments: ['good','evil'] },
  samurai: { id: 'samurai', minStats: { str: 15, iq: 11, pie: 10, vit: 14, agi: 10 },           alignments: ['good','neutral'] },
  lord:    { id: 'lord',    minStats: { str: 15, iq: 12, pie: 12, vit: 15, agi: 14, luk: 15 },  alignments: ['good'] },
  ninja:   { id: 'ninja',   minStats: { str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 },  alignments: ['evil'] },
} as const;
```

## 検証チェックリスト

- [ ] minStats の数値が Pascal と一致
- [ ] alignments の制限が Pascal と一致
- [ ] 1981 オリジナルが対象であることを再確認 (v3.2 では Ninja 17→15 等の緩和がある)
