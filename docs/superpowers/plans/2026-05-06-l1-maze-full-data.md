# L1 迷宮 20×20 完全データ取り込み Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/engine/data/maze/level1.ts` の 4×4 テストマップを wizardryarchives.com の L1 マップ画像から書き起こした 20×20 完全データに置き換え、構造妥当性 + 整合性 + 到達可能性をテストで保証する。

**Architecture:** TDD で構造妥当性テストを先に書き、20×20 全 wall の骨組みで通したあと、画像を 4 象限に分割して書き起こす。書き起こし完了後に特殊マスカウントを確定させ、BFS 到達可能性テストで連結性を保証する。

**Tech Stack:** TypeScript strict / Vitest / fake-indexeddb (本タスクでは未使用) / Biome / pnpm 10

**Spec:** [docs/superpowers/specs/2026-05-06-l1-maze-full-data-design.md](../specs/2026-05-06-l1-maze-full-data-design.md)

---

## File Structure

| パス | 役割 | 変更種別 |
|---|---|---|
| `src/engine/data/maze/level1.ts` | L1 セルデータ (20×20) と境界エッジ | 修正 (4×4 → 20×20) |
| `tests/engine/data/maze/level1.test.ts` | 構造妥当性 + Edge 整合性 + 特殊マスカウント + BFS 到達可能性 | 修正 (4×4 前提を廃棄、書き直し) |
| `docs/reference/wiz1/data-tables/maze-l1.md` | L1 内部リファレンス。座標表 + 信頼度 | 修正 (座標表を実値で記載) |
| `docs/chapters/1/open-questions.md` | 未解決事項追跡 | 修正 (Q-005/006/012 解消) |
| `CHANGELOG.md` | リリースノート | 修正 (M5 後の本作業を追記) |
| `README.md` | マイルストーン進捗 | 修正 |

**変更しないもの** (M4 完了時点で 20×20 想定済):

- `src/engine/data/maze/types.ts`
- `src/engine/data/maze/lookup.ts`
- `src/engine/rules/movement.ts`
- `src/engine/state/reduceMaze.ts`
- `src/render/maze/*`

---

## 凡例マッピング (再掲)

書き起こし時、画像の凡例を以下にマップする (Spec Section 3 より):

| wizardryarchives 凡例 | 本実装 |
|---|---|
| Wall (太線) | `CellEdge: "wall"` |
| Door (□) | `CellEdge: "door"` |
| One Way Door (▼/▲) | `CellEdge: "door"` (簡略化) |
| グレー塗り (進入不可ブロック) | 全周 `wall` のセル (`special: "none"`) |
| 通常通路 (太線・ドア無し) | `CellEdge: "open"` |
| U (Up Stair) | `SpecialTile: "stairsUp"` |
| D (Down Stair) | `SpecialTile: "stairsDown"` |
| Dark (網掛け) | `SpecialTile: "darkness"` |
| T (Turn Table) | `SpecialTile: "spinner"` |
| X / X' (Warp) | `SpecialTile: "teleport"` |
| P (Pit) | `SpecialTile: "teleport"` |
| E (Elevator) | `SpecialTile: "teleport"` |
| S (Shoot) | `SpecialTile: "teleport"` |
| K (Key Item) | `SpecialTile: "none"` (アイテム配置は Chapter 2) |

座標変換 (再掲): 画像 `(x_img, y_img)` → TS `grid[19 - y_img][x_img]`

---

## Task 1: 既存 4×4 テストを廃棄、構造妥当性テストの骨組みを書く

**Files:**
- Modify: `tests/engine/data/maze/level1.test.ts` (全面書き直し)

**目的:** L1 が 20×20 で境界が wall、開始位置が `stairsUp`、`stairsDown` が 1 個以上、という構造的な不変条件を最初にテスト化する。

- [ ] **Step 1.1: 既存テストを廃棄して新しいテストを書く**

`tests/engine/data/maze/level1.test.ts` を以下に書き換え (期待値は冒頭定数に集約。書き起こし完了時に Task 7 で確定):

```typescript
import { MAZE_L1 } from "@/engine/data/maze/level1";
import { getEdge } from "@/engine/data/maze/lookup";
import { MAZE_SIZE } from "@/engine/data/maze/types";
import { describe, expect, it } from "vitest";

// 書き起こし完了時 (Task 7) に実値で締める
const EXPECTED_DARKNESS_COUNT = -1; // TBD
const EXPECTED_SPINNER_COUNT = -1; // TBD
const EXPECTED_TELEPORT_COUNT = -1; // TBD
const EXPECTED_STAIRS_DOWN_COUNT = -1; // TBD

describe("MAZE_L1 structural integrity", () => {
  it("has 20×20 grid", () => {
    expect(MAZE_L1.grid).toHaveLength(MAZE_SIZE);
    for (const row of MAZE_L1.grid) {
      expect(row).toHaveLength(MAZE_SIZE);
    }
  });

  it("south/east boundary arrays have length 20", () => {
    expect(MAZE_L1.southBoundary).toHaveLength(MAZE_SIZE);
    expect(MAZE_L1.eastBoundary).toHaveLength(MAZE_SIZE);
  });

  it("north boundary (y=0) is all walls", () => {
    for (let x = 0; x < MAZE_SIZE; x++) {
      expect(getEdge(MAZE_L1, x, 0, "n")).toBe("wall");
    }
  });

  it("west boundary (x=0) is all walls", () => {
    for (let y = 0; y < MAZE_SIZE; y++) {
      expect(getEdge(MAZE_L1, 0, y, "w")).toBe("wall");
    }
  });

  it("south boundary array is all walls", () => {
    for (const e of MAZE_L1.southBoundary) {
      expect(e).toBe("wall");
    }
  });

  it("east boundary array is all walls", () => {
    for (const e of MAZE_L1.eastBoundary) {
      expect(e).toBe("wall");
    }
  });
});

describe("MAZE_L1 stairs and start", () => {
  it("startPosition is (0, 19) facing north", () => {
    expect(MAZE_L1.startPosition).toEqual({ x: 0, y: 19, dir: "n" });
  });

  it("startPosition cell is stairsUp", () => {
    const { x, y } = MAZE_L1.startPosition;
    expect(MAZE_L1.grid[y]?.[x]?.special).toBe("stairsUp");
  });

  it("stairsUp count = 1", () => {
    let count = 0;
    for (const row of MAZE_L1.grid) {
      for (const cell of row) {
        if (cell.special === "stairsUp") count++;
      }
    }
    expect(count).toBe(1);
  });
});
```

(特殊マスカウントテストは Task 7 で追加。BFS テストは Task 8 で追加。)

- [ ] **Step 1.2: テストを実行して fail を確認**

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

期待: `MAZE_L1` の現状 4×4 マップでは `startPosition = {x:1,y:1,dir:"n"}` なので `startPosition is (0, 19)` 等が fail する。

---

## Task 2: level1.ts を 20×20 全 wall + startPosition のみの骨組みに置き換え

**Files:**
- Modify: `src/engine/data/maze/level1.ts` (全面書き直し)

**目的:** Task 1 の構造テストを通すため、20×20 を完全な壁で埋め、開始位置のセルだけ `stairsUp` にする骨組みを作る。実データはまだ入れない。

- [ ] **Step 2.1: level1.ts を骨組みに置き換え**

```typescript
import type { Cell, CellEdge, MazeLevel } from "./types";
import { MAZE_SIZE } from "./types";

// 全周壁・特殊マスなしのデフォルトセル
const SOLID_CELL: Cell = {
  edges: { n: "wall", w: "wall" },
  special: "none",
};

function makeSolidRow(): Cell[] {
  return Array.from({ length: MAZE_SIZE }, () => ({
    edges: { ...SOLID_CELL.edges },
    special: SOLID_CELL.special,
  }));
}

const grid: Cell[][] = Array.from({ length: MAZE_SIZE }, () => makeSolidRow());

// 開始位置 (画像座標 (0,0) = TS 座標 (0, 19)) に上り階段
grid[19]![0] = {
  edges: { n: "wall", w: "wall" },
  special: "stairsUp",
};

const allWalls: CellEdge[] = Array.from({ length: MAZE_SIZE }, () => "wall" as const);

export const MAZE_L1: MazeLevel = {
  grid,
  southBoundary: allWalls,
  eastBoundary: allWalls,
  startPosition: { x: 0, y: 19, dir: "n" },
};
```

- [ ] **Step 2.2: 構造テストが通ることを確認**

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

期待: 全テスト pass (8 件)。特殊マスカウント / BFS のテストはまだ追加していないので関係ない。

- [ ] **Step 2.3: 全体 typecheck と全テスト**

```powershell
pnpm typecheck; pnpm test
```

期待: typecheck 0 エラー、全テスト pass。`movement.test.ts` 等は独立した `Cell[][]` を使うので影響しない。

---

## Task 3: 画像 Phase 4-A (左下象限) を書き起こす

**画像範囲:** X = 0..9, Y = 0..9 (画像座標)
**TS 範囲:** `grid[10..19][0..9]`
**主な特殊マス (Spec から):** U (開始位置・上り階段) @ (0,0)、Dark 帯の一部

**Files:**
- Modify: `src/engine/data/maze/level1.ts` (左下象限)

- [ ] **Step 3.1: 画像を Read して左下象限を確認**

`C:\Users\伊藤勝夫\AppData\Local\Temp\wiz1maps\w1map1.gif` を Read (画像ダウンロード済)。
左下象限 (X=0..9, Y=0..9) の壁・扉・特殊マスを目視で確認する。

- [ ] **Step 3.2: 該当セルの edges と special を level1.ts に書き込む**

各セル `grid[19-y_img][x_img]` について `edges.n`、`edges.w`、`special` を画像に従って設定。
書き込みパターン例:

```typescript
// 例: 画像 (3, 5) に通路 (北壁なし、西扉) なら
grid[14]![3] = { edges: { n: "open", w: "door" }, special: "none" };
```

(具体的な値は画像を Read してから決まる。)

書き込みの順序: y_img 小 → 大 (TS では y 大 → 小)、各行内で x_img 小 → 大。

- [ ] **Step 3.3: Phase 4-A 部分テスト**

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

期待: 既存テスト全 pass (この段階では特殊マスカウントテストはまだ追加していない)。

- [ ] **Step 3.4: 部分目視確認**

書き込んだ範囲を `Read` で再確認し、画像 (Read 経由) と突き合わせて誤読がないか check。
不整合があれば Step 3.2 に戻って修正。

---

## Task 4: 画像 Phase 4-B (右下象限) を書き起こす

**画像範囲:** X = 10..19, Y = 0..9
**TS 範囲:** `grid[10..19][10..19]`
**主な特殊マス:** E (Elevator) @ (10, 8)、Warp 1/1' @ (13, 3)、K (Key Item) @ (13, 3)、Dark 帯の一部

**Files:**
- Modify: `src/engine/data/maze/level1.ts` (右下象限)

- [ ] **Step 4.1: 画像を Read して右下象限を確認**

- [ ] **Step 4.2: 該当セルの edges と special を level1.ts に書き込む**

K (Key Item) は `special: "none"` で記載 (アイテム配置は Chapter 2)。
E、Warp、P は `special: "teleport"` (Spec Section 3 凡例マッピング参照)。

- [ ] **Step 4.3: Phase 4-B 部分テスト**

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

- [ ] **Step 4.4: 部分目視確認**

---

## Task 5: 画像 Phase 4-C (左上象限) を書き起こす

**画像範囲:** X = 0..9, Y = 10..19
**TS 範囲:** `grid[0..9][0..9]`
**主な特殊マス:** D (下り階段) @ (0, 9-10) 付近 — TS では `grid[10][0]` 付近、Dark 帯の一部

**Files:**
- Modify: `src/engine/data/maze/level1.ts` (左上象限)

- [ ] **Step 5.1: 画像を Read して左上象限を確認**

特に下り階段 D の正確な座標を確定する (Spec Recommendation 1: 確定後は exact-match で固定)。

- [ ] **Step 5.2: 該当セルの edges と special を level1.ts に書き込む**

下り階段の例:

```typescript
// 仮に画像 (0, 9) が D なら TS では grid[10][0]
grid[10]![0] = { edges: { n: "open", w: "wall" }, special: "stairsDown" };
```

- [ ] **Step 5.3: Phase 4-C 部分テスト**

- [ ] **Step 5.4: 部分目視確認**

---

## Task 6: 画像 Phase 4-D (右上象限) を書き起こす

**画像範囲:** X = 10..19, Y = 10..19
**TS 範囲:** `grid[0..9][10..19]`
**主な特殊マス:** K (Key Item) @ (12, 17) 付近、Dark 帯の一部

**Files:**
- Modify: `src/engine/data/maze/level1.ts` (右上象限)

- [ ] **Step 6.1: 画像を Read して右上象限を確認**

- [ ] **Step 6.2: 該当セルの edges と special を level1.ts に書き込む**

- [ ] **Step 6.3: Phase 4-D 部分テスト**

- [ ] **Step 6.4: 部分目視確認**

---

## Task 7: 特殊マスカウントの確定とテスト締め

**目的:** 全 4 象限を書き終えた段階で実際の特殊マスカウントを抽出し、テスト定数に反映させる (Spec Recommendation 2: 「書き起こし → カウント抽出 → テスト反映」を独立 step として明示)。

**Files:**
- Modify: `tests/engine/data/maze/level1.test.ts` (定数を実値で更新、特殊マスカウントテストを追加)

- [ ] **Step 7.1: テストファイルに一時的な DEBUG テストを追加してカウントを抽出**

`tests/engine/data/maze/level1.test.ts` の末尾に **一時的に** 追加 (Step 7.4 で削除する):

```typescript
it.only("DEBUG: print special counts", () => {
  const counts: Record<string, number> = {};
  for (const row of MAZE_L1.grid) {
    for (const cell of row) {
      counts[cell.special] = (counts[cell.special] ?? 0) + 1;
    }
  }
  console.log("special counts:", counts);
  expect(true).toBe(true);
});
```

実行:

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

コンソール出力から `darkness` / `spinner` / `teleport` / `stairsDown` の実数値を読み取る。

- [ ] **Step 7.2: テスト定数を実値で更新**

`tests/engine/data/maze/level1.test.ts` 冒頭の `EXPECTED_*_COUNT` を実値に置き換える:

```typescript
const EXPECTED_DARKNESS_COUNT = N; // 実測値
const EXPECTED_SPINNER_COUNT = N;
const EXPECTED_TELEPORT_COUNT = N;
const EXPECTED_STAIRS_DOWN_COUNT = N;
```

- [ ] **Step 7.3: 特殊マスカウントテストを追加**

```typescript
describe("MAZE_L1 special tile counts", () => {
  function countSpecials(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of MAZE_L1.grid) {
      for (const cell of row) {
        counts[cell.special] = (counts[cell.special] ?? 0) + 1;
      }
    }
    return counts;
  }

  it("darkness count matches expected", () => {
    expect(countSpecials().darkness ?? 0).toBe(EXPECTED_DARKNESS_COUNT);
  });

  it("spinner count matches expected", () => {
    expect(countSpecials().spinner ?? 0).toBe(EXPECTED_SPINNER_COUNT);
  });

  it("teleport count matches expected", () => {
    expect(countSpecials().teleport ?? 0).toBe(EXPECTED_TELEPORT_COUNT);
  });

  it("stairsDown count matches expected", () => {
    expect(countSpecials().stairsDown ?? 0).toBe(EXPECTED_STAIRS_DOWN_COUNT);
  });
});
```

- [ ] **Step 7.4: DEBUG テストを削除して全テスト pass を確認**

Step 7.1 で追加した `it.only("DEBUG: print special counts", ...)` を **削除** する (`it.only` のままだと他のテストが skip される)。

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

期待: 全テスト pass。特殊マスカウントが期待値と異なる場合は誤読の疑いなので、Task 3〜6 のいずれかに戻って画像を再確認。

---

## Task 8: BFS 到達可能性テストを追加

**目的:** 開始位置から下り階段 D まで通路と扉で連結していることを保証する (Spec Section 6-5)。誤読で迷路が分断された場合に検知。

**注:** BFS は「孤立を検出するが、余計な抜け道は検出できない」という非対称性がある (Spec Recommendation 4)。Plan の Risks 欄に記載済。

**Files:**
- Modify: `tests/engine/data/maze/level1.test.ts` (BFS テスト追加)

- [ ] **Step 8.1: BFS ヘルパーをテストファイル内に書く**

```typescript
import type { Direction } from "@/engine/state/types";

const DIRS: readonly Direction[] = ["n", "e", "s", "w"];
const DXY: Record<Direction, [number, number]> = {
  n: [0, -1],
  e: [1, 0],
  s: [0, 1],
  w: [-1, 0],
};

function isPassable(edge: ReturnType<typeof getEdge>): boolean {
  return edge === "open" || edge === "door" || edge === "secretDoor";
}

function bfsReachable(level: typeof MAZE_L1, sx: number, sy: number): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[sx, sy]];
  visited.add(`${sx},${sy}`);
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    for (const dir of DIRS) {
      if (!isPassable(getEdge(level, x, y, dir))) continue;
      const [dx, dy] = DXY[dir];
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= MAZE_SIZE || ny < 0 || ny >= MAZE_SIZE) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push([nx, ny]);
    }
  }
  return visited;
}
```

- [ ] **Step 8.2: BFS テストを追加**

```typescript
describe("MAZE_L1 reachability", () => {
  it("startPosition can reach at least one stairsDown", () => {
    const { x, y } = MAZE_L1.startPosition;
    const reachable = bfsReachable(MAZE_L1, x, y);
    let found = false;
    for (let yy = 0; yy < MAZE_SIZE; yy++) {
      for (let xx = 0; xx < MAZE_SIZE; xx++) {
        if (
          MAZE_L1.grid[yy]?.[xx]?.special === "stairsDown" &&
          reachable.has(`${xx},${yy}`)
        ) {
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 8.3: テスト実行**

```powershell
pnpm vitest run tests/engine/data/maze/level1.test.ts
```

期待: 全テスト pass。fail なら Task 3〜6 のいずれかで誤読 (壁を 1 枚多く書いた等) → 画像と該当領域を再確認。

---

## Task 9: 全体検証と書き起こし本体コミット

- [ ] **Step 9.1: 全体検証**

```powershell
pnpm typecheck; pnpm lint; pnpm test; pnpm build
```

期待:
- typecheck: 0 エラー
- lint: 0 エラー (M5 完了時点の警告 7 件から増えない)
- test: 既存 181 + 新規約 12 件 = 約 193 テスト pass
- build: gzip 200 KB 以内 (現状 64.81 KB から +1 KB 以内を見込む)

- [ ] **Step 9.2: 書き起こし本体をコミット**

```powershell
git add src/engine/data/maze/level1.ts tests/engine/data/maze/level1.test.ts
git commit -m @'
feat(maze): L1 20x20 complete map data from wizardryarchives.com

- Replace 4x4 placeholder with full 1F layout from wizardryarchives.com
- Start position (0, 19) facing north (= image (0, 0) Up Stair)
- Down stair, darkness band, spinners/teleports preserved (effects deferred)
- Tests: structure, boundaries, special counts, BFS reachability

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 10: 内部リファレンスドキュメントを更新

**Files:**
- Modify: `docs/reference/wiz1/data-tables/maze-l1.md`
- Modify: `docs/chapters/1/open-questions.md`

- [ ] **Step 10.1: maze-l1.md に座標表を実値で書き込む**

`maze-l1.md` の以下を更新:
- 信頼度: `🟡 二次ソース予定` → `🟡 二次ソース (wizardryarchives.com から書き起こし完了)`
- Source 一次: `TBD` → `保留 (Pascal MAZEDATA 抽出は将来課題)`
- Source 二次: `tk421` → `wizardryarchives.com (https://wizardryarchives.com/maps/w1map1.gif)`
- 開始位置: 画像 (0, 0) 北向き = TS `{x: 0, y: 19, dir: "n"}` (確定)
- 上り階段・下り階段・暗闇マスの座標を実値で表記 (画像座標 + TS 座標を併記)
- 「Q-005、Q-006、Q-012 解消」を明記

- [ ] **Step 10.2: open-questions.md の Q-005 / Q-006 / Q-012 を解消マーク**

各エントリの末尾に解消日 (2026-05-06) と解消方法を追記。Q-011 (メッセージ文言) は wizardryarchives 版に該当無しのため保留継続として再注記。

- [ ] **Step 10.3: 内部ドキュメントをコミット**

```powershell
git add docs/reference/wiz1/data-tables/maze-l1.md docs/chapters/1/open-questions.md
git commit -m @'
docs: update L1 maze reference + resolve Q-005/Q-006/Q-012

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 11: CHANGELOG / README とリリースコミット

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 11.1: CHANGELOG.md に L1 完全データ取り込みエントリを追記**

`## [Unreleased]` の直下に新エントリ:

```markdown
### Chapter 1 / L1 完全データ - 2026-05-06

#### Added

- 20×20 完全な L1 マップデータ (wizardryarchives.com から書き起こし)
- 開始位置 (0, 19) 北向き = Castle 帰還用上り階段と一致
- 下り階段、暗闇マス、回転床、テレポート系の座標確定 (Chapter 1 では効果なし)
- BFS 到達可能性テスト (開始位置 → 下り階段の連結性保証)

#### Changed

- M4 で導入した 4×4 テストマップを廃棄

#### Notes

- 信頼度 🟡 (二次ソース)。Pascal MAZEDATA からの一次抽出による 🟢 昇格は将来課題
- One Way Door は通常 door に簡略化 (Chapter 1 で効果同等)
- Pit / Elevator / Warp / Shoot / Key Item は型に含めず、効果実装は Chapter 2+

#### Tests

- 約 193 tests passing across 30 files (M5 から +12 件前後)
- Bundle: 約 65 KB gzip (依然 200 KB 目標内)
```

- [ ] **Step 11.2: README.md のマイルストーン進捗を更新**

```markdown
- ✅ **Chapter 1 / M5**: IndexedDB セーブ/ロード (Temple)、Restart Out Party、Export/Import、ストレージ Health Check
- ✅ **L1 完全マップデータ**: wizardryarchives.com から 20×20 を書き起こし (M4 で延期した分の解消)
- ⏳ **Chapter 1 / M6+**: i18n 仕上げ、設定画面、統合テスト
```

- [ ] **Step 11.3: リリースコミット**

```powershell
git add CHANGELOG.md README.md
git commit -m @'
docs: L1 maze release notes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 12: push と CI 確認

- [ ] **Step 12.1: push**

```powershell
git push
```

- [ ] **Step 12.2: CI を確認**

```powershell
gh run list --repo katsuo-ship-it/wizardry_proving_grounds --limit 1
gh run watch <run-id> --exit-status
```

期待: success (typecheck + lint + test + build すべて pass)。

- [ ] **Step 12.3: 手動確認 (推奨、必須ではない)**

```powershell
pnpm dev
```

ブラウザで `http://localhost:5173` を開き、Title → New Game → Training で適当にキャラ作成 → Tavern でパーティ編成 → Edge of Town → Maze に進入し、20×20 のフロアを歩いて「歩ける範囲が拡張されている」「下り階段が描画される」を目視確認する。Castle に脱出 (上り階段) も動作することを確認。

---

## Risks and Mitigations (Spec Section 11 + Plan 追加)

| リスク | 緩和策 |
|---|---|
| 画像の誤読 (Edge の食い違い) | 4 象限に分けて段階的に検証 (Task 3-6 で部分テスト) |
| BFS 到達可能性は「孤立」を検出するが「余計な抜け道」は検出できない | スコープ外として受容。手動プレイテスト (Task 12-3) で抜け道があれば気づく可能性 |
| 凡例マッピングの解釈ミス (P を teleport にしたが原典では別挙動) | Chapter 1 では効果なし方針なので機能差は出ない。Chapter 2 で型拡張時に再検討 |
| 特殊マスカウントの期待値が書き起こし時に不明 | Task 7 を独立 step とし、書き起こし完了後に DEBUG テストでカウントを集計してから定数に反映 |
| One Way Door を door に簡略化したことによる原典との挙動差 | Chapter 1 では効果なし。Chapter 2 で `oneWayDoor` を `CellEdge` に追加して再書き起こし |
| 書き起こしに想定以上の時間 | 4 象限ごとにコミット可能 (各 Phase の TS 編集後すぐ partial テスト → 緑なら次 Phase へ)。中断する場合は WIP commit せずローカル保持 |

---

## Success Criteria

- `pnpm typecheck` 0 エラー
- `pnpm lint` 0 エラー (警告は M5 と同じ 7 件以内)
- `pnpm test` 全 pass (新規テスト含む)
- `pnpm build` gzip 200 KB 以内
- BFS で開始位置から下り階段に到達可能 (テストで保証)
- GitHub Actions CI green
- Vercel デプロイ後、Maze で 20×20 フロアを歩ける (手動確認)
- Q-005、Q-006、Q-012 が open-questions.md で解消マーク
