# Wizardry Proving Grounds - Chapter 1 / M4 Maze Rendering & Walking Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 迷宮 1F の Apple II 風 3D ワイヤーフレーム描画と歩行 (前進/後退/左右回転) を実装し、1F 上り階段から Edge of Town へ脱出可能にする。Maze 画面と Camp (最低限) を完成させる。

**Architecture:** 視点と相対セル座標から線分を引く事前計算テーブル方式 (Apple II 原典と同じアプローチ)。深さ 4 セル × 左中右 3 列の合計 12 セル分のセグメントテーブルを `src/render/maze/wireframeTable.ts` に固定値として定義。視点情報 → 可視セル列挙 → セグメント描画の 3 段階で純粋関数化し、Canvas 描画は最終ステップだけ。Reducer は移動可否判定（壁/扉判定）と位置更新のみ純関数で処理。

**Tech Stack:** 既存スタック (Vite + React 18 + TypeScript strict + Zustand + Vitest + Biome)。HTML5 Canvas 2D を使用 (Canvas API は WebGL 不要で 280×192 の単純な線描画には十分)。

**Reference:**
- [設計書 Section 5 「迷宮 3D ワイヤーフレーム描画アルゴリズム」](../specs/2026-05-04-wizardry-proving-grounds-design.md)
- [docs/reference/wiz1/data-tables/maze-l1.md](../../reference/wiz1/data-tables/maze-l1.md)
- [tk421 Wizardry I Maps](https://www.tk421.net/wizardry/wiz1maps.shtml) — フォールバック用 L1 地図

---

## File Structure

### Phase A: 迷宮データ型と最小テストマップ
- Create: `src/engine/data/maze/types.ts` — Cell, CellEdge, SpecialTile 型
- Create: `src/engine/data/maze/level1.ts` — 20×20 セル定数 (M4 では最小テストマップ + tk421 完全データ)
- Create: `src/engine/data/maze/lookup.ts` — セル境界判定 (端のセルへのアクセスを安全に処理)
- Test: `tests/engine/data/maze/lookup.test.ts`

### Phase B: 視点と座標計算 (純関数)
- Create: `src/engine/rules/movement.ts` — canMoveForward, advance, turn
- Create: `src/render/maze/viewport.ts` — pos → 可視 12 セル
- Test: `tests/engine/rules/movement.test.ts`
- Test: `tests/render/maze/viewport.test.ts`

### Phase C: ワイヤーフレームテーブル + セグメント選択
- Create: `src/render/maze/types.ts` — LineSegment, SegmentSet 型
- Create: `src/render/maze/wireframeTable.ts` — depth×rel ごとの線分定数 (12 エントリ)
- Create: `src/render/maze/segments.ts` — セルから描く線分の選択 (壁/扉/階段)
- Test: `tests/render/maze/segments.test.ts`

### Phase D: Canvas 描画
- Create: `src/render/canvas/draw.ts` — drawLine, drawRect, clear ラッパ
- Create: `src/render/maze/render.ts` — renderMazeView (viewport + segments → Canvas)
- Test: `tests/render/canvas/draw.test.ts` (jsdom + canvas mock のテスト)

### Phase E: Maze reducer + Camp
- Create: `src/engine/state/reduceMaze.ts` — moveForward/Backward/turnLeft/Right/openCamp/ascendStairs
- Create: `src/engine/state/reduceCamp.ts` — leaveCamp/quitToTown
- Modify: `src/engine/state/types.ts` — CampSubState 追加 (kind: 'menu')
- Modify: `src/engine/state/reduce.ts` — maze/camp 専用 reducer 経由
- Test: `tests/engine/state/reduceMaze.test.ts`
- Test: `tests/engine/state/reduceCamp.test.ts`

### Phase F: Maze 画面 (Canvas) + Camp 画面 + 入力ハンドリング
- Modify: `src/screens/Maze/index.tsx` — placeholder から実画面へ
- Create: `src/screens/Maze/MazeView.tsx` — Canvas + キー入力
- Create: `src/screens/Maze/MazeStatus.tsx` — 階・位置・方向表示 (デバッグ用)
- Modify: `src/screens/Camp/index.tsx` — placeholder → Camp メニュー (Leave / Quit to Town)
- Modify: `src/engine/state/reduce.ts` — camp 追加

### Phase G: Edge of Town からの進入と帰還動線
- Modify: `src/engine/state/reduceEdgeOfTown.ts` — goToMaze で party の members チェック (空なら拒否)
- Modify: `src/engine/state/reduceMaze.ts` — ascendStairs で 1F 上り階段なら Edge of Town へ
- Test: 上記 reducer テストに追加

### Phase H: 統合 + L1 データ拡充 + デプロイ
- Modify: `src/engine/data/maze/level1.ts` — tk421 を見て 400 セルに拡充 (時間がかかる手作業)
- Modify: `src/i18n/messages.ts` — Maze/Camp の文字列追加
- Modify: `CHANGELOG.md`, `README.md`
- 動作確認 → push → CI → Vercel

---

## Phase A: 迷宮データ型 (P50: 0.5 日)

### Task A1: types.ts に Cell / CellEdge / SpecialTile を追加

**Files:**
- Create: `src/engine/data/maze/types.ts`

- [ ] **Step A1.1: 型定義**

```typescript
// src/engine/data/maze/types.ts
import type { Direction } from "@/engine/state/types";

export type CellEdge = "open" | "wall" | "door" | "secretDoor";
export type SpecialTile =
  | "none"
  | "stairsUp"
  | "stairsDown"
  | "darkness"
  | "spinner"
  | "teleport"
  | "message";

export interface Cell {
  /** 北・西の Edge のみ真理。南・東は隣接セルから導出 (設計書 Section 7) */
  edges: { n: CellEdge; w: CellEdge };
  special: SpecialTile;
  /** メッセージマスのときに i18n キー (例: "maze.l1.msg1") */
  messageId?: string;
}

/** 迷宮レベルデータ (20×20 + 境界) */
export interface MazeLevel {
  /** 20×20 = 400 セル。grid[y][x]。y=0 が北端、x=0 が西端 */
  grid: Cell[][];
  /** y=19 行の南エッジ 20 個 (端のセルから南方向への壁有無) */
  southBoundary: CellEdge[];
  /** x=19 列の東エッジ 20 個 */
  eastBoundary: CellEdge[];
  /** 開始位置 (新規 New Game でこの位置・方向で進入) */
  startPosition: { x: number; y: number; dir: Direction };
}

export const MAZE_SIZE = 20;
```

- [ ] **Step A1.2: typecheck**

```bash
pnpm typecheck
```

期待: エラーなし

- [ ] **Step A1.3: コミット**

```bash
git add src/engine/data/maze/types.ts
git commit -m "feat(types): maze Cell/CellEdge/SpecialTile/MazeLevel definitions"
```

### Task A2: lookup.ts (セル境界の安全アクセス)

**Files:**
- Create: `src/engine/data/maze/lookup.ts`
- Test: `tests/engine/data/maze/lookup.test.ts`

- [ ] **Step A2.1: テスト先行**

```typescript
// tests/engine/data/maze/lookup.test.ts
import { describe, expect, it } from "vitest";
import type { MazeLevel } from "@/engine/data/maze/types";
import { getEdge, getCell } from "@/engine/data/maze/lookup";

const tinyMaze: MazeLevel = {
  grid: [
    // y=0 (北端)
    [
      { edges: { n: "wall", w: "wall" }, special: "none" },     // (0,0)
      { edges: { n: "wall", w: "open" }, special: "none" },     // (1,0)
    ],
    // y=1 (南端)
    [
      { edges: { n: "open", w: "wall" }, special: "none" },     // (0,1)
      { edges: { n: "wall", w: "open" }, special: "none" },     // (1,1)
    ],
  ],
  southBoundary: ["wall", "wall"],
  eastBoundary: ["wall", "wall"],
  startPosition: { x: 0, y: 0, dir: "n" },
};

describe("maze lookup", () => {
  it("getCell returns the cell at (x,y)", () => {
    const c = getCell(tinyMaze, 0, 0);
    expect(c?.edges).toEqual({ n: "wall", w: "wall" });
  });

  it("getCell returns undefined out of bounds", () => {
    expect(getCell(tinyMaze, -1, 0)).toBeUndefined();
    expect(getCell(tinyMaze, 0, -1)).toBeUndefined();
    expect(getCell(tinyMaze, 2, 0)).toBeUndefined();
    expect(getCell(tinyMaze, 0, 2)).toBeUndefined();
  });

  it("getEdge north of (0,0) is the cell's own n edge", () => {
    expect(getEdge(tinyMaze, 0, 0, "n")).toBe("wall");
  });

  it("getEdge west of (0,0) is the cell's own w edge", () => {
    expect(getEdge(tinyMaze, 0, 0, "w")).toBe("wall");
  });

  it("getEdge south of (0,0) is the n edge of (0,1)", () => {
    expect(getEdge(tinyMaze, 0, 0, "s")).toBe("open");
  });

  it("getEdge east of (0,0) is the w edge of (1,0)", () => {
    expect(getEdge(tinyMaze, 0, 0, "e")).toBe("open");
  });

  it("getEdge south at y=19 uses southBoundary", () => {
    // y=1 (南端) の south
    expect(getEdge(tinyMaze, 0, 1, "s")).toBe("wall");
  });

  it("getEdge east at x=19 uses eastBoundary", () => {
    expect(getEdge(tinyMaze, 1, 0, "e")).toBe("wall");
  });
});
```

- [ ] **Step A2.2: 実装**

```typescript
// src/engine/data/maze/lookup.ts
import type { Direction } from "@/engine/state/types";
import type { Cell, CellEdge, MazeLevel } from "./types";

export function getCell(level: MazeLevel, x: number, y: number): Cell | undefined {
  return level.grid[y]?.[x];
}

/**
 * 指定セルの指定方向の Edge を返す。境界を越える場合は south/eastBoundary を参照。
 * 北・西は自セル、南は隣接セル (y+1) の北、東は隣接セル (x+1) の西。
 */
export function getEdge(level: MazeLevel, x: number, y: number, dir: Direction): CellEdge {
  const cell = getCell(level, x, y);
  if (!cell) return "wall"; // 範囲外は壁扱い

  switch (dir) {
    case "n":
      return cell.edges.n;
    case "w":
      return cell.edges.w;
    case "s": {
      // y+1 のセルの北 edge を見る。y=19 は southBoundary
      const south = getCell(level, x, y + 1);
      if (south) return south.edges.n;
      return level.southBoundary[x] ?? "wall";
    }
    case "e": {
      // x+1 のセルの西 edge を見る。x=19 は eastBoundary
      const east = getCell(level, x + 1, y);
      if (east) return east.edges.w;
      return level.eastBoundary[y] ?? "wall";
    }
  }
}
```

- [ ] **Step A2.3: テスト**

```bash
pnpm test maze/lookup
```

期待: 8/8 PASS

- [ ] **Step A2.4: コミット**

```bash
git add src/engine/data/maze/lookup.ts tests/engine/data/maze/lookup.test.ts
git commit -m "feat(maze): edge-aware cell lookup with boundary tables"
```

### Task A3: 最小テストマップで level1.ts を仮実装

**Files:**
- Create: `src/engine/data/maze/level1.ts`

> **設計判断**: M4 の rendering と movement を **小さな手書きマップ** で開発・テストし、Phase H で tk421 ベースの完全 L1 データに差し替える。最小テストマップは 4×4 の閉じた部屋 + 1 本の通路 + 上り階段。

- [ ] **Step A3.1: 最小テストマップの定義**

```typescript
// src/engine/data/maze/level1.ts
// Reference: docs/reference/wiz1/data-tables/maze-l1.md
//
// M4 開発用の最小テストマップ。Phase H で tk421 を見て 20×20 に差し替える。
// 構造:
//   y=0 [W][W][W][W]
//   y=1 [W][.][.][W]      ← 左上 (1,1) が開始位置 (北向き)
//   y=2 [W][.][D][W]      ← (2,2) は (2,1) と扉でつながる
//   y=3 [W][U][W][W]      ← (1,3) に上り階段
// 全周は壁、内側に 4 セルだけ通れる。
//
// データ表現上は 20×20 を維持し、4×4 領域以外は全て閉じた壁マスにする。

import type { MazeLevel } from "./types";

const SOLID_CELL = { edges: { n: "wall" as const, w: "wall" as const }, special: "none" as const };

function makeRow(): typeof SOLID_CELL[] {
  return Array.from({ length: 20 }, () => ({ ...SOLID_CELL }));
}

const grid = Array.from({ length: 20 }, () => makeRow());

// 内側の 4×4 を上書き (x=0..3, y=0..3 の左上ブロック)
// (0,0) (1,0) (2,0) (3,0) は北端の壁
// (0,1) (0,2) (0,3) は西端の壁
// (1,1) (2,1) (1,2) (1,3) が床
// (2,2) は (2,1) と扉でつながる別の床
// (1,3) は階段上り

// (1,0): 北は壁 (北端)、西は壁 (0,0 との境)
grid[0]![1] = { edges: { n: "wall", w: "wall" }, special: "none" };
// (1,1): 北は壁 (この行と上の行を区切る)、西は壁 (0,1 との境)
grid[1]![1] = { edges: { n: "wall", w: "wall" }, special: "none" };
// (2,1): 北は壁、西は open (1,1 と通じる)
grid[1]![2] = { edges: { n: "wall", w: "open" }, special: "none" };
// (1,2): 北は open (1,1 と通じる)、西は壁
grid[2]![1] = { edges: { n: "open", w: "wall" }, special: "none" };
// (2,2): 北は door (2,1 と扉でつながる)、西は wall (1,2 と区切る = 別の部屋)
grid[2]![2] = { edges: { n: "door", w: "wall" }, special: "none" };
// (1,3): 北は open (1,2 と通じる)、西は壁、上り階段
grid[3]![1] = { edges: { n: "open", w: "wall" }, special: "stairsUp" };

// 残りのセル (4×4 領域外) は SOLID_CELL のまま (全周壁)

export const MAZE_L1: MazeLevel = {
  grid,
  southBoundary: Array.from({ length: 20 }, () => "wall" as const),
  eastBoundary: Array.from({ length: 20 }, () => "wall" as const),
  startPosition: { x: 1, y: 1, dir: "n" },
};
```

- [ ] **Step A3.2: 簡単な smoke テスト**

```typescript
// tests/engine/data/maze/level1.test.ts
import { describe, expect, it } from "vitest";
import { MAZE_L1, MAZE_SIZE } from "@/engine/data/maze/level1";
// MAZE_SIZE は types.ts から
```

(以下は MAZE_SIZE が types.ts でエクスポートされているので import 修正)

```typescript
// tests/engine/data/maze/level1.test.ts
import { describe, expect, it } from "vitest";
import { MAZE_L1 } from "@/engine/data/maze/level1";
import { MAZE_SIZE } from "@/engine/data/maze/types";
import { getEdge } from "@/engine/data/maze/lookup";

describe("MAZE_L1 (M4 minimal test map)", () => {
  it("has 20×20 grid", () => {
    expect(MAZE_L1.grid).toHaveLength(MAZE_SIZE);
    for (const row of MAZE_L1.grid) {
      expect(row).toHaveLength(MAZE_SIZE);
    }
  });

  it("startPosition is (1, 1) facing north", () => {
    expect(MAZE_L1.startPosition).toEqual({ x: 1, y: 1, dir: "n" });
  });

  it("(1,1) → east is open (connects to (2,1))", () => {
    expect(getEdge(MAZE_L1, 1, 1, "e")).toBe("open");
  });

  it("(2,1) → south is door (connects to (2,2))", () => {
    expect(getEdge(MAZE_L1, 2, 1, "s")).toBe("door");
  });

  it("(1,3) is the up-stair", () => {
    expect(MAZE_L1.grid[3]?.[1]?.special).toBe("stairsUp");
  });

  it("(0,0) is solid (all walls)", () => {
    // 北・西は wall。南・東も自セル境界の wall (range の外)
    expect(getEdge(MAZE_L1, 0, 0, "n")).toBe("wall");
    expect(getEdge(MAZE_L1, 0, 0, "w")).toBe("wall");
  });
});
```

- [ ] **Step A3.3: テスト + コミット**

```bash
pnpm test maze
git add src/engine/data/maze/level1.ts tests/engine/data/maze/level1.test.ts
git commit -m "feat(maze): minimal 4x4 test map for M4 development (full L1 in Phase H)"
```

---

## Phase B: 視点と座標計算 (P50: 0.7 日)

### Task B1: rules/movement.ts (純関数)

**Files:**
- Create: `src/engine/rules/movement.ts`
- Test: `tests/engine/rules/movement.test.ts`

- [ ] **Step B1.1: テスト**

```typescript
// tests/engine/rules/movement.test.ts
import { describe, expect, it } from "vitest";
import { MAZE_L1 } from "@/engine/data/maze/level1";
import {
  advance,
  canPassEdge,
  canMoveForward,
  turnLeft,
  turnRight,
  reverse,
} from "@/engine/rules/movement";
import type { MazePosition } from "@/engine/state/types";

describe("turnLeft / turnRight / reverse", () => {
  it.each([
    ["n", "w", "e", "s"],
    ["e", "n", "s", "w"],
    ["s", "e", "w", "n"],
    ["w", "s", "n", "e"],
  ] as const)("from %s: turnLeft %s, turnRight %s, reverse %s", (from, l, r, rev) => {
    expect(turnLeft(from)).toBe(l);
    expect(turnRight(from)).toBe(r);
    expect(reverse(from)).toBe(rev);
  });
});

describe("canPassEdge", () => {
  it("open is passable", () => expect(canPassEdge("open")).toBe(true));
  it("door is passable", () => expect(canPassEdge("door")).toBe(true));
  it("secretDoor is passable", () => expect(canPassEdge("secretDoor")).toBe(true));
  it("wall is NOT passable", () => expect(canPassEdge("wall")).toBe(false));
});

describe("canMoveForward (from MAZE_L1)", () => {
  it("(1,1) facing north → blocked (north edge is wall)", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "n" };
    expect(canMoveForward(MAZE_L1, pos)).toBe(false);
  });

  it("(1,1) facing east → passable (east edge is open to (2,1))", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "e" };
    expect(canMoveForward(MAZE_L1, pos)).toBe(true);
  });

  it("(1,1) facing south → passable (south edge is open to (1,2))", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "s" };
    expect(canMoveForward(MAZE_L1, pos)).toBe(true);
  });

  it("(2,1) facing south → passable (door to (2,2))", () => {
    const pos: MazePosition = { level: 1, x: 2, y: 1, dir: "s" };
    expect(canMoveForward(MAZE_L1, pos)).toBe(true);
  });
});

describe("advance", () => {
  it("facing north decreases y", () => {
    const before: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    expect(advance(before)).toEqual({ ...before, y: 4 });
  });
  it("facing east increases x", () => {
    const before: MazePosition = { level: 1, x: 5, y: 5, dir: "e" };
    expect(advance(before)).toEqual({ ...before, x: 6 });
  });
  it("facing south increases y", () => {
    const before: MazePosition = { level: 1, x: 5, y: 5, dir: "s" };
    expect(advance(before)).toEqual({ ...before, y: 6 });
  });
  it("facing west decreases x", () => {
    const before: MazePosition = { level: 1, x: 5, y: 5, dir: "w" };
    expect(advance(before)).toEqual({ ...before, x: 4 });
  });
});
```

- [ ] **Step B1.2: 実装**

```typescript
// src/engine/rules/movement.ts
import { getEdge } from "@/engine/data/maze/lookup";
import type { MazeLevel } from "@/engine/data/maze/types";
import type { CellEdge } from "@/engine/data/maze/types";
import type { Direction, MazePosition } from "@/engine/state/types";

export function turnLeft(dir: Direction): Direction {
  switch (dir) {
    case "n": return "w";
    case "w": return "s";
    case "s": return "e";
    case "e": return "n";
  }
}

export function turnRight(dir: Direction): Direction {
  switch (dir) {
    case "n": return "e";
    case "e": return "s";
    case "s": return "w";
    case "w": return "n";
  }
}

export function reverse(dir: Direction): Direction {
  switch (dir) {
    case "n": return "s";
    case "s": return "n";
    case "e": return "w";
    case "w": return "e";
  }
}

export function canPassEdge(edge: CellEdge): boolean {
  return edge !== "wall";
}

export function canMoveForward(level: MazeLevel, pos: MazePosition): boolean {
  const edge = getEdge(level, pos.x, pos.y, pos.dir);
  return canPassEdge(edge);
}

/** 1 マス前進した位置を返す (壁判定はしない、呼び出し側で canMoveForward を確認すること) */
export function advance(pos: MazePosition): MazePosition {
  switch (pos.dir) {
    case "n": return { ...pos, y: pos.y - 1 };
    case "e": return { ...pos, x: pos.x + 1 };
    case "s": return { ...pos, y: pos.y + 1 };
    case "w": return { ...pos, x: pos.x - 1 };
  }
}
```

- [ ] **Step B1.3: テスト + コミット**

```bash
pnpm test movement
git add src/engine/rules/movement.ts tests/engine/rules/movement.test.ts
git commit -m "feat(rules): movement helpers (turn/canPassEdge/canMoveForward/advance)"
```

### Task B2: viewport.ts (可視 12 セル列挙)

**Files:**
- Create: `src/render/maze/viewport.ts`
- Test: `tests/render/maze/viewport.test.ts`

- [ ] **Step B2.1: 設計補足**

視点 `(x, y, dir)` から見える 12 セルは、視線方向に深さ 0..3、左右に rel = -1, 0, +1 のグリッド。
`forwardOf(pos, depth, rel)` で各セルの世界座標を計算する。

```
方向 N の場合:
  forward = (0, -depth)
  rel = -1: (-1, 0) (左)
  rel = +1: (+1, 0) (右)
→ ワールド座標 = (pos.x + rel*1 + 0*depth, pos.y + 0*rel + (-1)*depth)
```

一般化: 各方向の forward / right ベクトルを定義:

| dir | forward (dx, dy) | right (dx, dy) |
|---|---|---|
| n | (0, -1) | (1, 0) |
| e | (1, 0)  | (0, 1) |
| s | (0, 1)  | (-1, 0) |
| w | (-1, 0) | (0, -1) |

世界座標 = pos + forward × depth + right × rel

- [ ] **Step B2.2: テスト**

```typescript
// tests/render/maze/viewport.test.ts
import { describe, expect, it } from "vitest";
import { computeViewport, worldFromView } from "@/render/maze/viewport";
import type { MazePosition } from "@/engine/state/types";

describe("worldFromView", () => {
  it("facing north: depth advances toward -y, rel=+1 toward +x", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    expect(worldFromView(pos, 0, 0)).toEqual({ x: 5, y: 5 });
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 5, y: 4 });
    expect(worldFromView(pos, 2, 0)).toEqual({ x: 5, y: 3 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 6, y: 5 });
    expect(worldFromView(pos, 0, -1)).toEqual({ x: 4, y: 5 });
    expect(worldFromView(pos, 1, 1)).toEqual({ x: 6, y: 4 });
  });

  it("facing east: depth advances toward +x, rel=+1 toward +y", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "e" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 6, y: 5 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 5, y: 6 });
  });

  it("facing south: depth toward +y, rel=+1 toward -x", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "s" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 5, y: 6 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 4, y: 5 });
  });

  it("facing west: depth toward -x, rel=+1 toward -y", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "w" };
    expect(worldFromView(pos, 1, 0)).toEqual({ x: 4, y: 5 });
    expect(worldFromView(pos, 0, 1)).toEqual({ x: 5, y: 4 });
  });
});

describe("computeViewport", () => {
  it("returns 12 cells (4 depths × 3 rel positions)", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    const cells = computeViewport(pos);
    expect(cells).toHaveLength(12);
  });

  it("each entry has world coords + depth + rel", () => {
    const pos: MazePosition = { level: 1, x: 5, y: 5, dir: "n" };
    const cells = computeViewport(pos);
    for (const c of cells) {
      expect(c).toHaveProperty("x");
      expect(c).toHaveProperty("y");
      expect(c).toHaveProperty("depth");
      expect(c).toHaveProperty("rel");
      expect([0, 1, 2, 3]).toContain(c.depth);
      expect([-1, 0, 1]).toContain(c.rel);
    }
  });
});
```

- [ ] **Step B2.3: 実装**

```typescript
// src/render/maze/viewport.ts
import type { Direction, MazePosition } from "@/engine/state/types";

export type Depth = 0 | 1 | 2 | 3;
export type RelPos = -1 | 0 | 1;

export interface ViewportCell {
  /** ワールド X 座標 (範囲外の可能性あり、呼び出し側で getCell で確認) */
  x: number;
  /** ワールド Y 座標 */
  y: number;
  depth: Depth;
  rel: RelPos;
}

const FORWARD: Record<Direction, { dx: number; dy: number }> = {
  n: { dx: 0, dy: -1 },
  e: { dx: 1, dy: 0 },
  s: { dx: 0, dy: 1 },
  w: { dx: -1, dy: 0 },
};

const RIGHT: Record<Direction, { dx: number; dy: number }> = {
  n: { dx: 1, dy: 0 },
  e: { dx: 0, dy: 1 },
  s: { dx: -1, dy: 0 },
  w: { dx: 0, dy: -1 },
};

export function worldFromView(
  pos: MazePosition,
  depth: number,
  rel: number,
): { x: number; y: number } {
  const f = FORWARD[pos.dir];
  const r = RIGHT[pos.dir];
  return {
    x: pos.x + f.dx * depth + r.dx * rel,
    y: pos.y + f.dy * depth + r.dy * rel,
  };
}

const DEPTHS: Depth[] = [0, 1, 2, 3];
const RELS: RelPos[] = [-1, 0, 1];

export function computeViewport(pos: MazePosition): ViewportCell[] {
  const out: ViewportCell[] = [];
  for (const depth of DEPTHS) {
    for (const rel of RELS) {
      const w = worldFromView(pos, depth, rel);
      out.push({ x: w.x, y: w.y, depth, rel });
    }
  }
  return out;
}
```

- [ ] **Step B2.4: テスト + コミット**

```bash
pnpm test viewport
git add src/render/maze/viewport.ts tests/render/maze/viewport.test.ts
git commit -m "feat(render): viewport calculation (12 visible cells from pos+dir)"
```

---

## Phase C: ワイヤーフレームテーブル + セグメント選択 (P50: 1 日)

> **重要**: 座標値は **暫定**。Apple II 原典の正確な座標は Pascal 抽出か実機スクショから取るべきだが、M4 では遠近見えする「それっぽい」座標を手で作る。Plan の `WIREFRAME_TABLE` の数字は参考値で、見た目を見ながらチューニングする。

### Task C1: render/maze/types.ts (LineSegment, SegmentSet)

**Files:**
- Create: `src/render/maze/types.ts`

- [ ] **Step C1.1: 型定義**

```typescript
// src/render/maze/types.ts
import type { Depth, RelPos } from "./viewport";

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SegmentSet {
  /** 前面の壁 (このセルの正面方向のエッジが壁の場合に描画) */
  frontWall: LineSegment[];
  /** 左面の壁 (左エッジが壁の場合) */
  leftWall: LineSegment[];
  /** 右面の壁 (右エッジが壁の場合) */
  rightWall: LineSegment[];
  /** 扉 (壁の代わりに描画。frontWall/leftWall/rightWall と同じ位置に枠付きで) */
  frontDoor: LineSegment[];
  leftDoor: LineSegment[];
  rightDoor: LineSegment[];
  /** 階段マーカー (床の中央に triangle や鋸歯) */
  stairsUp: LineSegment[];
  stairsDown: LineSegment[];
}

export type WireframeTable = Record<Depth, Record<RelPos, SegmentSet>>;
```

- [ ] **Step C1.2: コミット**

```bash
git add src/render/maze/types.ts
git commit -m "feat(render): LineSegment, SegmentSet, WireframeTable types"
```

### Task C2: wireframeTable.ts (12 エントリの線分定数)

**Files:**
- Create: `src/render/maze/wireframeTable.ts`

> **設計補足**: 280×192 画面の中央 (140, 96) を消失点と仮定し、深さごとに「内側矩形」が小さくなる遠近図を作る。深さ 0 は画面いっぱい、深さ 3 は中央近くの小さい矩形。

- [ ] **Step C2.1: 暫定座標で実装**

```typescript
// src/render/maze/wireframeTable.ts
//
// Apple II HGR 280×192 viewport に対する 3D 視点の固定座標テーブル。
//
// 座標系: Canvas 座標 (左上原点、X 右、Y 下)
// 中央消失点: (140, 96)
//
// 各深さの「視野矩形」(画面に投影される平面の矩形):
//   depth 0: フル画面 (0, 0) - (280, 192)
//   depth 1: (50, 30) - (230, 162)  ← 内側 80%
//   depth 2: (90, 55) - (190, 137)  ← 内側 50%
//   depth 3: (115, 75) - (165, 117) ← 内側 20%
//
// この矩形を基に front/left/right/door/stairs の線分を計算。
//
// ※ 現状は「それっぽく見える」暫定値。Apple II 実機との比較で要調整 (open question Q-014)。

import type { WireframeTable } from "./types";

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

const RECTS: readonly Rect[] = [
  { l: 0, t: 0, r: 280, b: 192 }, // depth 0
  { l: 50, t: 30, r: 230, b: 162 }, // depth 1
  { l: 90, t: 55, r: 190, b: 137 }, // depth 2
  { l: 115, t: 75, r: 165, b: 117 }, // depth 3
];

/** 深さ d の rect を取得 (rel=0 用) */
function rectAtDepth(d: 0 | 1 | 2 | 3): Rect {
  return RECTS[d]!;
}

/** rel オフセット 1 単位あたりの X シフト (左右視差) */
function relOffsetX(d: 0 | 1 | 2 | 3): number {
  // 深さ d で 1 セル横にずれた場合、画面上の X シフト
  // 暫定: 深さに応じて遠ざかると視差が小さく
  const shifts = [200, 120, 70, 40];
  return shifts[d]!;
}

/** rel と depth から「中心に対するシフト後の rect」 */
function shiftedRect(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1): Rect {
  const r = rectAtDepth(d);
  const shift = rel * relOffsetX(d);
  return { l: r.l + shift, t: r.t, r: r.r + shift, b: r.b };
}

function frontWall(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  const r = shiftedRect(d, rel);
  // 矩形の 4 辺
  return [
    { x1: r.l, y1: r.t, x2: r.r, y2: r.t },
    { x1: r.r, y1: r.t, x2: r.r, y2: r.b },
    { x1: r.r, y1: r.b, x2: r.l, y2: r.b },
    { x1: r.l, y1: r.b, x2: r.l, y2: r.t },
  ];
}

function leftWall(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  // 左側の壁: 1 段奥の rect の左辺と現在の rect の左辺を結ぶ台形
  if (d === 3) return []; // 深さ 3 は左壁なし
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as 0 | 1 | 2 | 3, rel);
  return [
    // 上の line (near 左上 → far 左上)
    { x1: near.l, y1: near.t, x2: far.l, y2: far.t },
    // 下の line (near 左下 → far 左下)
    { x1: near.l, y1: near.b, x2: far.l, y2: far.b },
  ];
}

function rightWall(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  if (d === 3) return [];
  const near = shiftedRect(d, rel);
  const far = shiftedRect((d + 1) as 0 | 1 | 2 | 3, rel);
  return [
    { x1: near.r, y1: near.t, x2: far.r, y2: far.t },
    { x1: near.r, y1: near.b, x2: far.r, y2: far.b },
  ];
}

function frontDoor(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  // 扉: front rect の中央に小さい矩形
  const r = shiftedRect(d, rel);
  const cx = (r.l + r.r) / 2;
  const w = (r.r - r.l) * 0.3;
  const h = (r.b - r.t) * 0.6;
  const dl = cx - w / 2;
  const dr = cx + w / 2;
  const dt = r.b - h;
  const db = r.b;
  return [
    { x1: dl, y1: dt, x2: dr, y2: dt },
    { x1: dr, y1: dt, x2: dr, y2: db },
    { x1: dl, y1: dt, x2: dl, y2: db },
  ];
}

function stairsUpMarker(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  // 階段上り: 床に「↑」のような形 (3 本線)
  if (d > 1) return []; // 遠いと見えない
  const r = shiftedRect(d, rel);
  const cx = (r.l + r.r) / 2;
  const cy = (r.t + r.b * 3) / 4; // 床寄り
  const s = (r.r - r.l) / 8;
  return [
    { x1: cx, y1: cy - s, x2: cx + s, y2: cy + s },
    { x1: cx, y1: cy - s, x2: cx - s, y2: cy + s },
    { x1: cx, y1: cy, x2: cx, y2: cy + s },
  ];
}

function buildSegmentSet(d: 0 | 1 | 2 | 3, rel: -1 | 0 | 1) {
  return {
    frontWall: frontWall(d, rel),
    leftWall: leftWall(d, rel),
    rightWall: rightWall(d, rel),
    frontDoor: frontDoor(d, rel),
    leftDoor: [], // M4 では簡略化 (左右の扉は描かない)
    rightDoor: [],
    stairsUp: stairsUpMarker(d, rel),
    stairsDown: stairsUpMarker(d, rel), // 上りと同じ形 (区別は M5 以降)
  };
}

export const WIREFRAME_TABLE: WireframeTable = {
  0: { "-1": buildSegmentSet(0, -1), 0: buildSegmentSet(0, 0), 1: buildSegmentSet(0, 1) },
  1: { "-1": buildSegmentSet(1, -1), 0: buildSegmentSet(1, 0), 1: buildSegmentSet(1, 1) },
  2: { "-1": buildSegmentSet(2, -1), 0: buildSegmentSet(2, 0), 1: buildSegmentSet(2, 1) },
  3: { "-1": buildSegmentSet(3, -1), 0: buildSegmentSet(3, 0), 1: buildSegmentSet(3, 1) },
};
```

- [ ] **Step C2.2: コミット**

```bash
git add src/render/maze/wireframeTable.ts
git commit -m "feat(render): wireframe coordinate table (provisional, 12 entries)"
```

### Task C3: segments.ts (セルから描く線分の選択)

**Files:**
- Create: `src/render/maze/segments.ts`
- Test: `tests/render/maze/segments.test.ts`

- [ ] **Step C3.1: テスト**

```typescript
// tests/render/maze/segments.test.ts
import { describe, expect, it } from "vitest";
import { MAZE_L1 } from "@/engine/data/maze/level1";
import { selectSegments } from "@/render/maze/segments";
import type { MazePosition } from "@/engine/state/types";

describe("selectSegments", () => {
  it("returns segments for stairs when current cell has stairsUp special", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 3, dir: "n" }; // 階段上のセル
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    // stairs marker は描かれているはず (空配列ではない)
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns segments for front wall when forward edge is wall", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "n" }; // 北は壁
    const segs = selectSegments(MAZE_L1, pos, 0, 0);
    // 自セルの front wall + side walls 等
    expect(segs.length).toBeGreaterThan(0);
  });

  it("returns empty array for out-of-bounds cell", () => {
    const pos: MazePosition = { level: 1, x: 1, y: 1, dir: "n" };
    // 視野外の遠いセル
    const segs = selectSegments(MAZE_L1, pos, 3, 1);
    // (1+1, 1-3) = (2, -2) は範囲外 → empty
    expect(segs).toEqual([]);
  });
});
```

- [ ] **Step C3.2: 実装**

```typescript
// src/render/maze/segments.ts
import { getCell, getEdge } from "@/engine/data/maze/lookup";
import type { MazeLevel } from "@/engine/data/maze/types";
import { turnLeft, turnRight } from "@/engine/rules/movement";
import type { MazePosition } from "@/engine/state/types";
import type { LineSegment } from "./types";
import { worldFromView, type Depth, type RelPos } from "./viewport";
import { WIREFRAME_TABLE } from "./wireframeTable";

/**
 * 視点 pos から見て (depth, rel) の位置にあるセルを描くために必要な線分を返す。
 * セルが範囲外なら空配列。
 */
export function selectSegments(
  level: MazeLevel,
  pos: MazePosition,
  depth: Depth,
  rel: RelPos,
): LineSegment[] {
  const w = worldFromView(pos, depth, rel);
  const cell = getCell(level, w.x, w.y);
  if (!cell) return [];

  const set = WIREFRAME_TABLE[depth][rel];
  const out: LineSegment[] = [];

  // 視点方向に対応する front/left/right edge を取得
  const front = pos.dir;
  const left = turnLeft(pos.dir);
  const right = turnRight(pos.dir);

  const frontEdge = getEdge(level, w.x, w.y, front);
  const leftEdge = getEdge(level, w.x, w.y, left);
  const rightEdge = getEdge(level, w.x, w.y, right);

  if (frontEdge === "wall") out.push(...set.frontWall);
  if (frontEdge === "door") out.push(...set.frontWall, ...set.frontDoor);
  if (frontEdge === "secretDoor") out.push(...set.frontWall); // 秘密扉は壁に見える

  if (leftEdge === "wall") out.push(...set.leftWall);
  if (leftEdge === "door") out.push(...set.leftWall, ...set.leftDoor);
  if (leftEdge === "secretDoor") out.push(...set.leftWall);

  if (rightEdge === "wall") out.push(...set.rightWall);
  if (rightEdge === "door") out.push(...set.rightWall, ...set.rightDoor);
  if (rightEdge === "secretDoor") out.push(...set.rightWall);

  if (cell.special === "stairsUp") out.push(...set.stairsUp);
  if (cell.special === "stairsDown") out.push(...set.stairsDown);

  return out;
}
```

- [ ] **Step C3.3: テスト + コミット**

```bash
pnpm test segments
git add src/render/maze/segments.ts tests/render/maze/segments.test.ts
git commit -m "feat(render): selectSegments per cell with wall/door/stairs handling"
```

---

## Phase D: Canvas 描画 (P50: 0.5 日)

### Task D1: render/canvas/draw.ts (低レベルラッパ)

**Files:**
- Create: `src/render/canvas/draw.ts`

- [ ] **Step D1.1: 実装**

```typescript
// src/render/canvas/draw.ts
import type { LineSegment } from "@/render/maze/types";

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number, color = "#000"): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function drawLines(
  ctx: CanvasRenderingContext2D,
  segments: ReadonlyArray<LineSegment>,
  color = "#fff",
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const s of segments) {
    ctx.moveTo(s.x1 + 0.5, s.y1 + 0.5); // ピクセル整列のため 0.5 オフセット
    ctx.lineTo(s.x2 + 0.5, s.y2 + 0.5);
  }
  ctx.stroke();
}
```

- [ ] **Step D1.2: コミット**

```bash
git add src/render/canvas/draw.ts
git commit -m "feat(render): low-level Canvas drawing helpers (clear, drawLines)"
```

### Task D2: render/maze/render.ts (メイン描画)

**Files:**
- Create: `src/render/maze/render.ts`

- [ ] **Step D2.1: 実装**

```typescript
// src/render/maze/render.ts
import type { MazeLevel } from "@/engine/data/maze/types";
import type { MazePosition } from "@/engine/state/types";
import { clear, drawLines } from "@/render/canvas/draw";
import { selectSegments } from "./segments";
import type { Depth, RelPos } from "./viewport";

const DEPTHS_FAR_TO_NEAR: Depth[] = [3, 2, 1, 0];
const RELS: RelPos[] = [-1, 0, 1];

/**
 * 280×192 の Canvas に視点からの 3D ワイヤーフレーム迷宮を描画する。
 * 奥のセルから手前へ順に描き、隠面消去を成立させる。
 */
export function renderMazeView(
  ctx: CanvasRenderingContext2D,
  level: MazeLevel,
  pos: MazePosition,
): void {
  clear(ctx, 280, 192, "#000");
  for (const d of DEPTHS_FAR_TO_NEAR) {
    for (const r of RELS) {
      const segs = selectSegments(level, pos, d, r);
      if (segs.length > 0) drawLines(ctx, segs, "#fff");
    }
  }
}
```

- [ ] **Step D2.2: コミット**

```bash
git add src/render/maze/render.ts
git commit -m "feat(render): renderMazeView (depth-first occlusion + segment composition)"
```

---

## Phase E: Maze reducer + Camp (P50: 0.7 日)

### Task E1: types.ts に CampSubState 追加 + GameState 拡張

**Files:**
- Modify: `src/engine/state/types.ts`

- [ ] **Step E1.1: types.ts**

```typescript
// types.ts に追加
export type CampSubState = { kind: "menu" };

// GameState union の maze entry を変更し、camp を追加
// 既存:
//   | { phase: "maze"; sub: SimpleSubState; party: PartyState }
// 変更後:
//   | { phase: "maze"; pos: MazePosition; party: PartyState }
//   | { phase: "camp"; sub: CampSubState; pos: MazePosition; party: PartyState }
```

GameEvent はすでに M2 で `moveForward / turnLeft / turnRight / moveBackward / openCamp / descendStairs / ascendStairs / leaveCamp / quitToTown` を定義済み (types.ts 確認)。

- [ ] **Step E1.2: typecheck**

```bash
pnpm typecheck
```

placeholder reducer 等で `maze` を期待してたところがエラーになるかも。**この段階では OK** (Task E2 で解消)。

### Task E2: reduceMaze.ts のテストと実装

**Files:**
- Create: `tests/engine/state/reduceMaze.test.ts`
- Create: `src/engine/state/reduceMaze.ts`
- Modify: `src/engine/state/reduce.ts`
- Modify: `src/engine/state/reducePlaceholder.ts` — maze を除外

- [ ] **Step E2.1: テスト**

```typescript
// tests/engine/state/reduceMaze.test.ts
import { describe, expect, it } from "vitest";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";

const startMaze: GameState = {
  phase: "maze",
  pos: { level: 1, x: 1, y: 1, dir: "n" }, // 北は壁
  party: { ...EMPTY_PARTY, status: "inMaze" },
};

describe("maze reducer", () => {
  it("turnLeft from facing-north → facing-west", () => {
    const next = reduce(startMaze, { type: "turnLeft" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos.dir).toBe("w");
  });

  it("turnRight from facing-north → facing-east", () => {
    const next = reduce(startMaze, { type: "turnRight" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos.dir).toBe("e");
  });

  it("moveForward into a wall is blocked (pos unchanged)", () => {
    const next = reduce(startMaze, { type: "moveForward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual(startMaze.pos);
  });

  it("moveForward through open edge advances", () => {
    const facingEast: GameState = {
      ...startMaze,
      pos: { ...startMaze.pos, dir: "e" }, // (1,1) east is open
    };
    const next = reduce(facingEast, { type: "moveForward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual({ level: 1, x: 2, y: 1, dir: "e" });
  });

  it("moveBackward goes opposite without turning", () => {
    const facingEast: GameState = {
      ...startMaze,
      pos: { level: 1, x: 2, y: 1, dir: "e" },
    };
    const next = reduce(facingEast, { type: "moveBackward" });
    if (next.phase !== "maze") throw new Error("");
    // 後退は西方向、(2,1) west は open (1,1 とつながる)
    expect(next.pos).toEqual({ level: 1, x: 1, y: 1, dir: "e" });
  });

  it("openCamp transitions to camp phase", () => {
    const next = reduce(startMaze, { type: "openCamp" });
    expect(next.phase).toBe("camp");
    if (next.phase !== "camp") throw new Error("");
    expect(next.pos).toEqual(startMaze.pos);
  });

  it("ascendStairs on stairsUp cell → edgeOfTown", () => {
    const onStairs: GameState = {
      ...startMaze,
      pos: { level: 1, x: 1, y: 3, dir: "n" }, // (1,3) は stairsUp
    };
    const next = reduce(onStairs, { type: "ascendStairs" });
    expect(next).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "inTown" },
    });
  });

  it("ascendStairs on non-stairs cell does nothing", () => {
    const next = reduce(startMaze, { type: "ascendStairs" });
    expect(next).toEqual(startMaze);
  });
});
```

- [ ] **Step E2.2: 実装**

```typescript
// src/engine/state/reduceMaze.ts
import { MAZE_L1 } from "@/engine/data/maze/level1";
import { getCell } from "@/engine/data/maze/lookup";
import { advance, canMoveForward, reverse, turnLeft, turnRight } from "@/engine/rules/movement";
import type { GameEvent, GameState } from "./types";

export function reduceMaze(
  state: Extract<GameState, { phase: "maze" }>,
  event: GameEvent,
): GameState {
  const { pos, party } = state;
  const level = MAZE_L1; // M4 では L1 のみ

  switch (event.type) {
    case "turnLeft":
      return { ...state, pos: { ...pos, dir: turnLeft(pos.dir) } };
    case "turnRight":
      return { ...state, pos: { ...pos, dir: turnRight(pos.dir) } };
    case "moveForward": {
      if (!canMoveForward(level, pos)) return state;
      return { ...state, pos: advance(pos) };
    }
    case "moveBackward": {
      // 後退は方向転換せず、reverse 方向への canMoveForward を判定
      const back = { ...pos, dir: reverse(pos.dir) };
      if (!canMoveForward(level, back)) return state;
      const advanced = advance(back);
      return { ...state, pos: { ...advanced, dir: pos.dir } };
    }
    case "openCamp":
      return {
        phase: "camp",
        sub: { kind: "menu" },
        pos,
        party,
      };
    case "ascendStairs": {
      const cell = getCell(level, pos.x, pos.y);
      if (cell?.special === "stairsUp") {
        return {
          phase: "edgeOfTown",
          sub: { kind: "menu" },
          party: { ...party, status: "inTown" },
        };
      }
      return state;
    }
    case "descendStairs": {
      // M4 では B2F なし。階段下りは何もしない (Chapter 4 で実装)
      return state;
    }
    default:
      return state;
  }
}
```

- [ ] **Step E2.3: reduce.ts に maze を分離 + reducePlaceholder から除外**

```typescript
// reduce.ts
import { reduceMaze } from "./reduceMaze";
case "maze":
  return reduceMaze(state, event);

// reducePlaceholder.ts: PlaceholderPhase から "maze" を除く
type PlaceholderPhase = "utilities" | "temple";
```

- [ ] **Step E2.4: reducePlaceholder テストから maze を除外**

```typescript
// tests/engine/state/reducePlaceholder.test.ts
// "maze" のエントリを削除 (training/tavern/boltac/inn と並んで)
```

- [ ] **Step E2.5: テスト + コミット**

```bash
pnpm test reduceMaze
git add src/engine src/engine/state/reduceMaze.ts tests/engine/state/reduceMaze.test.ts
git commit -m "feat(engine): maze reducer with movement, camp, stairs"
```

### Task E3: reduceCamp.ts

**Files:**
- Create: `src/engine/state/reduceCamp.ts`
- Create: `tests/engine/state/reduceCamp.test.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step E3.1: テスト**

```typescript
// tests/engine/state/reduceCamp.test.ts
import { describe, expect, it } from "vitest";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";

const inCamp: GameState = {
  phase: "camp",
  sub: { kind: "menu" },
  pos: { level: 1, x: 1, y: 1, dir: "n" },
  party: { ...EMPTY_PARTY, status: "inMaze" },
};

describe("camp reducer", () => {
  it("leaveCamp returns to maze (same pos)", () => {
    const next = reduce(inCamp, { type: "leaveCamp" });
    expect(next).toEqual({
      phase: "maze",
      pos: inCamp.pos,
      party: inCamp.party,
    });
  });

  it("quitToTown returns to edgeOfTown with party out", () => {
    const next = reduce(inCamp, { type: "quitToTown" });
    expect(next.phase).toBe("edgeOfTown");
    if (next.phase !== "edgeOfTown") throw new Error("");
    expect(next.party.status).toBe("out");
    expect(next.party.outAtPosition).toEqual(inCamp.pos);
  });
});
```

- [ ] **Step E3.2: 実装**

```typescript
// src/engine/state/reduceCamp.ts
import type { GameEvent, GameState } from "./types";

export function reduceCamp(
  state: Extract<GameState, { phase: "camp" }>,
  event: GameEvent,
): GameState {
  const { pos, party } = state;
  switch (event.type) {
    case "leaveCamp":
      return { phase: "maze", pos, party };
    case "quitToTown":
      return {
        phase: "edgeOfTown",
        sub: { kind: "menu" },
        party: { ...party, status: "out", outAtPosition: pos },
      };
    default:
      return state;
  }
}
```

- [ ] **Step E3.3: reduce.ts に camp 追加**

```typescript
import { reduceCamp } from "./reduceCamp";
case "camp":
  return reduceCamp(state, event);
```

- [ ] **Step E3.4: テスト + コミット**

```bash
pnpm test reduceCamp
git add src/engine
git commit -m "feat(engine): camp reducer (leaveCamp / quitToTown)"
```

---

## Phase F: Maze 画面 + Camp 画面 + 入力 (P50: 0.8 日)

### Task F1: Maze スクリーン (Canvas 描画)

**Files:**
- Modify: `src/screens/Maze/index.tsx`
- Create: `src/screens/Maze/MazeView.tsx`

- [ ] **Step F1.1: index.tsx をルータ化**

```typescript
// src/screens/Maze/index.tsx
import { MazeView } from "./MazeView";

export function Maze() {
  return <MazeView />;
}
```

- [ ] **Step F1.2: MazeView.tsx (Canvas + キー入力)**

```typescript
// src/screens/Maze/MazeView.tsx
import { useEffect, useRef } from "react";
import { MAZE_L1 } from "@/engine/data/maze/level1";
import { renderMazeView } from "@/render/maze/render";
import { gameStore, useGameStore } from "@/store/gameStore";
import { useT } from "@/i18n/useT";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function MazeView() {
  const t = useT();
  const pos = useGameStore((s) => (s.state.phase === "maze" ? s.state.pos : null));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas 描画
  useEffect(() => {
    if (!pos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderMazeView(ctx, MAZE_L1, pos);
  }, [pos]);

  // キー入力
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      // 連打抑制は store の入力キューに任せる (移動は repeat=false のみ)
      if (e.repeat) return;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          dispatch({ type: "moveForward" });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          dispatch({ type: "moveBackward" });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          dispatch({ type: "turnLeft" });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          dispatch({ type: "turnRight" });
          break;
        case "c":
        case "C":
          e.preventDefault();
          dispatch({ type: "openCamp" });
          break;
        case "Enter":
          e.preventDefault();
          dispatch({ type: "ascendStairs" });
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!pos) return null;

  return (
    <div className="maze-screen">
      <canvas
        ref={canvasRef}
        width={280}
        height={192}
        className="maze-canvas"
      />
      <div className="maze-status">
        <span>L{pos.level}</span>
        <span>
          ({pos.x}, {pos.y})
        </span>
        <span>{pos.dir.toUpperCase()}</span>
        <span className="maze-hint">{t("maze.hint")}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step F1.3: Maze.css**

```css
/* src/screens/Maze/Maze.css */
.maze-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
}

.maze-canvas {
  width: var(--viewport-width);
  height: calc(160 * var(--vp));
  /* または実際の Canvas サイズで CSS 拡大: */
  image-rendering: pixelated;
}

.maze-status {
  display: flex;
  gap: calc(2 * var(--vp));
  font-size: var(--font-size-glyph);
  color: var(--color-fg);
  padding: calc(1 * var(--vp));
}

.maze-hint {
  color: var(--color-accent);
  margin-left: auto;
}
```

import の修正:
```typescript
// MazeView.tsx の先頭に追加
import "./Maze.css";
```

- [ ] **Step F1.4: i18n: maze.hint を追加**

```typescript
// messages.ts (en/ja)
"maze.hint": "↑↓ move  ←→ turn  C camp  Enter stairs",
"maze.hint": "↑↓ いどう  ←→ かいてん  C キャンプ  Enter かいだん",
```

- [ ] **Step F1.5: コミット**

```bash
git add src/screens/Maze src/i18n/messages.ts
git commit -m "feat(screens): Maze view with Canvas wireframe + keyboard input"
```

### Task F2: Camp 画面

**Files:**
- Modify: `src/screens/Camp/index.tsx`

- [ ] **Step F2.1: 既存 placeholder Camp を実画面に**

```typescript
// src/screens/Camp/index.tsx
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Camp() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("camp.title")}>
        <Menu
          items={[
            {
              hotkey: "L",
              label: t("camp.menu.leave"),
              onSelect: () => dispatch({ type: "leaveCamp" }),
            },
            {
              hotkey: "Q",
              label: t("camp.menu.quit"),
              onSelect: () => dispatch({ type: "quitToTown" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step F2.2: i18n 追加**

```typescript
// en
"camp.title": "Camp",
"camp.menu.leave": "Leave Camp (back to maze)",
"camp.menu.quit": "Quit to Town (party becomes OUT)",
// ja
"camp.title": "キャンプ",
"camp.menu.leave": "もどる (めいきゅうへ)",
"camp.menu.quit": "まちへもどる (パーティは OUT に)",
```

- [ ] **Step F2.3: App.tsx に camp phase を追加**

```typescript
import { Camp } from "@/screens/Camp";
case "camp":
  return <Camp />;
```

- [ ] **Step F2.4: コミット**

```bash
git add src/screens/Camp src/App.tsx src/i18n/messages.ts
git commit -m "feat(screens): Camp menu (leave / quit to town)"
```

---

## Phase G: 進入条件チェック (P50: 0.2 日)

### Task G1: Edge of Town goToMaze で party 空チェック

**Files:**
- Modify: `src/engine/state/reduceEdgeOfTown.ts`
- Modify: `tests/engine/state/reduceEdgeOfTown.test.ts`

- [ ] **Step G1.1: テスト追加**

```typescript
it("goToMaze with empty party stays in edgeOfTown", () => {
  // EMPTY_PARTY (members all null) で Maze に行こうとしても拒否
  const next = reduce(initial, { type: "goToMaze" });
  // ... 空パーティだと state 不変
});

it("goToMaze with at least one member transitions to maze with start position", () => {
  const withMember: GameState = {
    ...initial,
    party: { ...EMPTY_PARTY, members: [42, null, null, null, null, null] },
  };
  const next = reduce(withMember, { type: "goToMaze" });
  expect(next.phase).toBe("maze");
  if (next.phase !== "maze") throw new Error();
  // MAZE_L1.startPosition から
  expect(next.pos).toEqual({ level: 1, x: 1, y: 1, dir: "n" });
});
```

- [ ] **Step G1.2: reducer 修正**

```typescript
// reduceEdgeOfTown.ts
case "goToMaze": {
  const hasMembers = party.members.some((id) => id !== null);
  if (!hasMembers) return state; // 空パーティでは Maze に入れない
  return {
    phase: "maze",
    pos: { ...MAZE_L1.startPosition, level: 1 },
    party: { ...party, status: "inMaze" },
  };
}
```

import 追加:
```typescript
import { MAZE_L1 } from "@/engine/data/maze/level1";
```

- [ ] **Step G1.3: テスト + コミット**

```bash
pnpm test reduceEdgeOfTown
git add src/engine tests/engine
git commit -m "feat(engine): block Maze entry when party is empty + use start pos"
```

---

## Phase H: L1 完全データ + 統合 + デプロイ (P50: 1.5-2 日)

> **重要**: L1 の 400 セルを tk421 を見て手で書き起こすのが最も時間がかかる作業。スプレッドシートや CSV を使って効率化することを推奨。

### Task H1: L1 完全データの取り込み (手作業)

**Files:**
- Modify: `src/engine/data/maze/level1.ts`

- [ ] **Step H1.1: tk421 マップを参照 → CSV または直接 TS で 400 セル定義**

[tk421 Wizardry I Maps](https://www.tk421.net/wizardry/wiz1maps.shtml) を見て、各セルの `n` / `w` edge と special を書き起こす。

形式の選択:
- (a) 直接 TS リテラルで 400 セル (冗長だが visible)
- (b) CSV → スクリプトで TS 変換 (手間 vs visible)

(a) を採用し、ファイルが大きくなるが視認性を取る。

> 暫定対応: 完全データの取り込みは大きな手作業のため、Phase H1 を **後続セッションのタスク** とし、当面は最小テストマップで動作するまでを完成させる。本 Plan の M4 完了基準は Task H2 まで (デプロイ可能な状態)。

- [ ] **Step H1.2: 整合性チェック**

実装後に `scripts/validate-maze.ts` で隣接セルの edge 整合性を確認。M4 範囲では省略可。

- [ ] **Step H1.3: コミット (任意)**

L1 完全版が完成したら:
```bash
git add src/engine/data/maze/level1.ts
git commit -m "feat(maze): full L1 data from tk421 (400 cells)"
```

### Task H2: 統合テスト + デプロイ

- [ ] **Step H2.1: フルチェック**

```bash
pnpm biome check --write src tests
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] **Step H2.2: 開発サーバで E2E**

```bash
pnpm dev
```

- [ ] Title → New Game → Edge of Town → Training Grounds でキャラ作成
- [ ] Castle → Tavern でメンバーを 1 人加える
- [ ] Edge of Town → Maze
- [ ] 矢印キーで移動・回転
- [ ] 壁にぶつかる動作
- [ ] 扉を通る動作
- [ ] 階段マーカーが見えるセルへ移動 → Enter で Edge of Town へ脱出
- [ ] Maze 内で C → Camp → L で迷宮へ戻る
- [ ] Camp で Q → Edge of Town へ (party は OUT 状態)

### Task H3: CHANGELOG + README + デプロイ

- [ ] **Step H3.1: CHANGELOG.md** に M4 エントリ
- [ ] **Step H3.2: README.md** の進捗表を更新 (M4 ✅)
- [ ] **Step H3.3: コミット + push**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: M4 release notes"
git push origin main
```

- [ ] **Step H3.4: GitHub Actions CI 成功 + Vercel 自動デプロイ確認**

---

## 完了基準 (Definition of Done for M4)

- [ ] 4×4 最小テストマップで歩行・回転・壁ブロック・扉通過・階段脱出が動作
- [ ] Camp menu が動作 (Leave / Quit to Town)
- [ ] Edge of Town → Maze 進入時に party 空ならブロック
- [ ] Canvas 描画が "Apple II 風" の 3D ワイヤーフレーム (暫定座標で)
- [ ] 全テスト PASS、CI が main で成功
- [ ] Vercel 本番に反映、URL で歩行確認可能
- [ ] CHANGELOG/README 更新済み
- [ ] (Task H1 任意) L1 完全データへ拡充

完了したら次の Plan: `2026-XX-XX-chapter1-m5-temple-save.md` (IndexedDB セーブ・寺院セーブ・JSON 入出力・Restart Out Party)。
