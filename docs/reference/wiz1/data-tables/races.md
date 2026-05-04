# RACES データ表

**信頼度**: 🟡 二次ソース (Pascal 抽出後に検証予定)
**Source (一次)**: TBD — `pascal-sources/Wiz1?/GLOBAL.TEXT` または `DEFINITIONS.TEXT` の `RACES` 配列
**Source (二次)**: [Wizardry Wiki: Race](https://wizardry.wiki.gg/wiki/Race) / 旧来の攻略本

## 種族別 base 能力値

各種族のキャラ作成時の能力値「初期値」(振り分け前):

| Race    | STR | IQ  | PIE | VIT | AGI | LUK |
|---------|-----|-----|-----|-----|-----|-----|
| Human   | 8   | 8   | 5   | 8   | 8   | 9   |
| Elf     | 7   | 10  | 10  | 6   | 9   | 6   |
| Dwarf   | 10  | 7   | 10  | 10  | 5   | 6   |
| Gnome   | 7   | 7   | 10  | 8   | 10  | 7   |
| Hobbit  | 5   | 7   | 7   | 6   | 10  | 15  |

合計値はすべて 46 (= バランスのため設計上の不変量と推測される)。

## 種族別の特徴 (一般情報)

| Race    | 抵抗特性 (推定) | アライメント傾向 |
|---------|-----------------|------------------|
| Human   | バランス型       | Any              |
| Elf     | 魔法寄り         | Any              |
| Dwarf   | 物理寄り         | Any              |
| Gnome   | バランス + 賢明  | Any              |
| Hobbit  | 運に恵まれる     | Any              |

戦闘・抵抗ボーナスの正確な仕様は Chapter 2 で Pascal を参照して埋める。

## TypeScript 移植時の構造案

```typescript
// src/engine/data/races.ts (M3 で実装)
export const RACES = {
  human:  { id: 'human',  base: { str: 8,  iq: 8,  pie: 5,  vit: 8,  agi: 8,  luk: 9  } },
  elf:    { id: 'elf',    base: { str: 7,  iq: 10, pie: 10, vit: 6,  agi: 9,  luk: 6  } },
  dwarf:  { id: 'dwarf',  base: { str: 10, iq: 7,  pie: 10, vit: 10, agi: 5,  luk: 6  } },
  gnome:  { id: 'gnome',  base: { str: 7,  iq: 7,  pie: 10, vit: 8,  agi: 10, luk: 7  } },
  hobbit: { id: 'hobbit', base: { str: 5,  iq: 7,  pie: 7,  vit: 6,  agi: 10, luk: 15 } },
} as const;
```

## 検証チェックリスト (Pascal 抽出完了後)

- [ ] base 能力値 6 種 × 5 種族の数値が Pascal `RACES` 配列と一致
- [ ] 種族別の HP 計算式 (Chapter 2)
- [ ] 種族別の年齢加算ルール (Inn 利用時、Chapter 2)
- [ ] 種族別の AC ボーナスの有無 (Chapter 2)
