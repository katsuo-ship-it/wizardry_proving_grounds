# キャラクター作成アルゴリズム

**信頼度**: 🟡 二次ソース (Pascal 抽出後に検証予定)
**Source (一次)**: TBD — `pascal-sources/Wiz1?/MAKECHARACTER.TEXT` または `BONUS.TEXT`
**Source (二次)**: [Wizardry Wiki: Character Creation](https://wizardry.wiki.gg/wiki/Character_Creation) / 旧来の攻略本

## 全体フロー

```
1. 名前入力 (最大 8 文字、英数字)
   ↓
2. 種族選択 (Human / Elf / Dwarf / Gnome / Hobbit)
   ↓
3. 属性選択 (Good / Neutral / Evil)
   ↓
4. 能力値ロール:
   ・各能力値 = 種族 base 値で初期化 (RACES.<race>.base)
   ・ボーナスポイント = `rollBonus(rng)` で算出
   ・ボーナスポイントは振り直し可能 (再度 `rollBonus`)
   ↓
5. ボーナスポイント振り分け (任意の能力値に +1/-1):
   ・能力値の上限は 18 (Pascal で要確認)
   ・全ポイント振り終わるまで職業選択不可
   ↓
6. 職業選択:
   ・現在の能力値 + 属性で資格のある職業のみ表示 (CLASSES の minStats / alignments)
   ↓
7. 確認 → ロスター追加
```

## ボーナスポイント計算 (`BONUS` プロシージャ)

> **重要**: 1981 オリジナルの正確な分布式は Pascal で要確認。以下は Wizardry Wiki と二次資料の総合からの **暫定** 仕様。

### 暫定仕様

```typescript
function rollBonus(rng: () => number): number {
  let bonus = 5 + Math.floor(rng() * 6);  // 5..10 の一様分布
  // 1/10 の確率で +10 ボーナス追加 (希に高ロール)
  if (Math.floor(rng() * 10) === 0) {
    bonus += 10;
    // さらに 1/10 で連鎖 (極めて稀に 25 以上)
    if (Math.floor(rng() * 10) === 0) {
      bonus += 10;
    }
  }
  return bonus;
}
```

期待値 ≈ 8 ポイント (中央値 7-8)、最大値 ≈ 25 (確率 1/100 程度)。

### 検証方法

Pascal 抽出後に `BONUS` プロシージャを精読し、以下を確認:
- 1d10? 1d6? どの dice か
- 連鎖の挙動 (再ロールなのか積算なのか)
- "lucky shot" 系の特殊判定の有無

## 振り分けルール

- 各能力値の上限: **18** (Pascal 確認待ち、種族・職業で上限が異なる可能性あり)
- 各能力値の下限: 種族 base 値 (それ以下に下げられない)
- ポイントは「全部使い切る」必要がある (Pascal 確認待ち、未使用キャンセル可能性あり)

## 職業判定 (`eligibleClasses`)

```typescript
function eligibleClasses(
  attrs: Attributes,
  alignment: Alignment,
): ClassId[] {
  return CLASS_IDS.filter((cid) => {
    const klass = CLASSES[cid];
    // 能力値条件
    for (const [k, min] of Object.entries(klass.minStats)) {
      if (attrs[k] < min) return false;
    }
    // アライメント条件
    if (!klass.alignments.includes(alignment)) return false;
    return true;
  });
}
```

## 不明点 (open-questions.md にも記録)

- [ ] **Q-002**: ボーナスポイント分布の正確な式 (上記は暫定)
- [ ] **Q-003**: 能力値上限が 18 で正しいか / 種族別の上限差異
- [ ] **Q-004**: HP 初期値計算式 (Chapter 2 で本格的に必要、M3 のキャラ作成時にも HP を保持する必要あり)
- [ ] **Q-013**: Bishop の呪文初期 MP の計算 (Chapter 3 で必要)

## TypeScript 移植時の構造案

```typescript
// src/engine/rules/character.ts (M3 で実装)
export function rollAttributes(race: RaceId, rng: RNG): { attrs: Attributes; bonus: number } {
  const base = RACES[race].base;
  return { attrs: { ...base }, bonus: rollBonus(rng) };
}

export function applyBonus(attrs: Attributes, key: AttributeKey, delta: 1 | -1): Attributes {
  const next = { ...attrs };
  next[key] = Math.max(RACES[/* race */].base[key], Math.min(18, next[key] + delta));
  return next;
}

export function eligibleClasses(attrs: Attributes, alignment: Alignment): ClassId[] {
  // 上記疑似コードを実装
}
```

## テスト戦略

```typescript
// tests/engine/rules/character.test.ts (M3 で実装)
describe('eligibleClasses', () => {
  it.each([
    [{ str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 }, 'evil', ['fighter','mage','thief','bishop','ninja']],
    [{ str: 11, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 }, 'good', ['fighter']],
    // ...
  ])('attrs %o + %s → %o', (attrs, alignment, expected) => {
    expect(eligibleClasses(attrs, alignment).sort()).toEqual(expected.sort());
  });
});

describe('rollBonus distribution', () => {
  it('returns within reasonable range', () => {
    const rng = mulberry32(42);
    const samples = Array.from({ length: 1000 }, () => rollBonus(rng));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...samples)).toBeLessThanOrEqual(35);
  });
});
```
