# 迷宮 3D 描画再設計 (Three.js + Shaded Walls) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の per-cell rect wireframe (連続壁の境界で線が途切れるバグあり) を、Three.js を使った shaded wall の 3D シーンに全面置換する。カメラは前進/回転で滑らか補間。

**Architecture:** L1 全マップを起動時に静的 mesh 化し (5 draw call: 壁/床/天井/扉/階段)、`MeshLambertMaterial` + `Fog` でダンジョン感を出す。reducer/state には触らない。視点 8 × 4 方向 = 32 screenshot を Playwright で回帰テスト。

**Tech Stack:** Three.js (~r161)、@playwright/test、既存スタック (Vite/React/TypeScript strict/Vitest/Biome/pnpm)

**Spec:** `docs/superpowers/specs/2026-05-09-maze-3d-render-redesign-design.md`

---

## ファイル構成

### 新規作成

| File | Responsibility |
|---|---|
| `src/render/maze/types.ts` | `CameraTarget`, `SceneCtx`, `Yaw` 型定義 (純型のみ) |
| `src/render/maze/camera.ts` | `targetFromPosition` / `shortestAngleDelta` / `easeInOutQuad` / `interpolateTarget` / `CameraAnimator` |
| `src/render/maze/geom.ts` | `MazeLevel` → `BufferGeometry` (壁/床/天井/扉/階段ごとに純関数) |
| `src/render/maze/materials.ts` | 5 種類の `MeshLambertMaterial` をモジュールスコープで生成・export |
| `src/render/maze/overlay.ts` | 階段矢印テクスチャを `<canvas>` から `CanvasTexture` 化 |
| `src/render/maze/scene.ts` | `buildScene(level)` で 5 mesh + ライト + Fog を組み立て `Scene` を返す |
| `src/render/maze/view.ts` | Renderer ライフサイクル (`mount` / `dispose`)、RAF 制御 |
| `tests/render/maze/camera.test.ts` | camera.ts 純関数の vitest |
| `tests/render/maze/geom.test.ts` | geom.ts 純関数の vitest |
| `tests/render/maze/scene.test.ts` | `buildScene` の構造 (mesh count、material 共有) integration test |
| `tests/visual/maze.spec.ts` | Playwright screenshot regression (32 snapshot) |
| `playwright.config.ts` | Playwright 設定 (Linux baseline 固定) |

### 既存ファイル削除 (Phase 8)

- `src/render/maze/render.ts`
- `src/render/maze/segments.ts`
- `src/render/maze/viewport.ts`
- `src/render/maze/wireframeTable.ts`
- `tests/render/maze/segments.test.ts`
- `tests/render/maze/viewport.test.ts`

### 既存ファイル変更

| File | 変更内容 |
|---|---|
| `src/screens/Maze/MazeView.tsx` | `renderMazeView` 呼び出しを `view.ts` の `mount()` に差し替え。`useEffect` で `pos` 変化時に `animateTo` を呼ぶ |
| `package.json` | `three` / `@types/three` / `@playwright/test` 追加。`test:visual` スクリプト追加 |
| `.github/workflows/ci.yml` | Playwright step 追加 (キャッシュ含む) |
| `docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md` | Section 5 全面書き換え |
| `docs/chapters/1/open-questions.md` | Q-014 を「解決済」へ移動 |

---

## Phase 0: 依存パッケージ追加

### Task 0.1: Three.js + types を追加

**Files:**
- Modify: `package.json`、`pnpm-lock.yaml`

- [ ] **Step 1: 依存追加**

```bash
pnpm add three
pnpm add -D @types/three
```

- [ ] **Step 2: バージョン確認**

`package.json` の `dependencies.three` がインストールされ、メジャーバージョン r160 以降であることを確認する。

- [ ] **Step 3: ビルドが通ることを確認**

```bash
pnpm typecheck && pnpm build
```

Expected: 全グリーン (新規 import はまだない)

- [ ] **Step 4: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add three + @types/three for maze 3D renderer"
```

### Task 0.2: Playwright を devDependencies に追加

**Files:**
- Modify: `package.json`、`pnpm-lock.yaml`

- [ ] **Step 1: 依存追加**

```bash
pnpm add -D @playwright/test
```

- [ ] **Step 2: Chromium バイナリのインストール**

```bash
pnpm exec playwright install chromium
```

(ローカルでの初回確認用。CI では別途 `--with-deps` を Phase 9 で設定)

- [ ] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add @playwright/test for visual regression"
```

---

## Phase 1: 型・スキャフォールド (動作変化なし)

### Task 1.1: 共通型を `types.ts` に追加

**Files:**
- Create: `src/render/maze/types.ts` (既存ファイルがあるが Phase 8 で削除予定。今は新内容で**上書き**)

待って — 既存 `types.ts` は `LineSegment` / `SegmentSet` / `WireframeTable` を export しており、現行の `wireframeTable.ts` / `segments.ts` / `render.ts` が依存している。Phase 8 で削除するまで壊さないため、**新型は別名で追加**する。

- [ ] **Step 1: 既存 types.ts に新型を追記**

`src/render/maze/types.ts` の末尾に以下を追加する:

```typescript
// === Three.js 移行用の新型 (Phase 8 で旧型を全削除) ===

export type Yaw = number; // ラジアン、0 = 北、+π/2 = 東

export interface CameraTarget {
  pos: { x: number; y: number }; // ワールド座標 (= grid + 0.5)
  yaw: Yaw;
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

Expected: 全グリーン

- [ ] **Step 3: コミット**

```bash
git add src/render/maze/types.ts
git commit -m "feat(render): add CameraTarget / Yaw types for 3D renderer"
```

---

## Phase 2: `camera.ts` 純関数 (TDD)

ここから TDD。各関数 = 「失敗テスト → 最小実装 → グリーン → コミット」のサイクル。

### Task 2.1: `targetFromPosition(MazePosition) → CameraTarget`

**Files:**
- Create: `src/render/maze/camera.ts`
- Create: `tests/render/maze/camera.test.ts`

仕様 (spec §5):
- pos.x, pos.y はグリッド座標 → world は `(x + 0.5, y + 0.5)`
- yaw: n=0、e=π/2、s=π、w=−π/2 (= 3π/2)

- [ ] **Step 1: 失敗テストを書く**

`tests/render/maze/camera.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { targetFromPosition } from "@/render/maze/camera";

describe("targetFromPosition", () => {
  it("maps grid (0, 19) north to world (0.5, 19.5) yaw 0", () => {
    const t = targetFromPosition({ level: 1, x: 0, y: 19, dir: "n" });
    expect(t.pos).toEqual({ x: 0.5, y: 19.5 });
    expect(t.yaw).toBe(0);
  });

  it("maps east to yaw +π/2", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "e" }).yaw).toBeCloseTo(Math.PI / 2);
  });

  it("maps south to yaw π", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "s" }).yaw).toBeCloseTo(Math.PI);
  });

  it("maps west to yaw -π/2", () => {
    expect(targetFromPosition({ level: 1, x: 5, y: 5, dir: "w" }).yaw).toBeCloseTo(-Math.PI / 2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test tests/render/maze/camera.test.ts
```

Expected: FAIL ("Cannot find module '@/render/maze/camera'")

- [ ] **Step 3: 最小実装**

`src/render/maze/camera.ts`:

```typescript
import type { MazePosition } from "@/engine/state/types";
import type { CameraTarget } from "./types";

export function targetFromPosition(pos: MazePosition): CameraTarget {
  const yawByDir = { n: 0, e: Math.PI / 2, s: Math.PI, w: -Math.PI / 2 } as const;
  return {
    pos: { x: pos.x + 0.5, y: pos.y + 0.5 },
    yaw: yawByDir[pos.dir],
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
pnpm test tests/render/maze/camera.test.ts
```

Expected: 4 tests pass

### Task 2.2: `shortestAngleDelta(from, to) → number`

仕様: 2 つのラジアン角度の最短回転差を返す (絶対値が π を超えないように)。例: from=0, to=3π/2 → -π/2 (時計回り 90°、反時計回り 270° の代わり)

- [ ] **Step 1: 失敗テストを追記**

```typescript
import { shortestAngleDelta } from "@/render/maze/camera";

describe("shortestAngleDelta", () => {
  it("returns 0 for same angles", () => {
    expect(shortestAngleDelta(0, 0)).toBeCloseTo(0);
  });

  it("returns +π/2 for 0 → π/2", () => {
    expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });

  it("returns -π/2 for 0 → 3π/2 (shortest = clockwise)", () => {
    expect(shortestAngleDelta(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
  });

  it("returns +π for 0 → π (either direction is equivalent)", () => {
    expect(Math.abs(shortestAngleDelta(0, Math.PI))).toBeCloseTo(Math.PI);
  });

  it("handles wraparound: from -π/2 to π is shortest = -π/2 (clockwise)", () => {
    expect(Math.abs(shortestAngleDelta(-Math.PI / 2, Math.PI))).toBeCloseTo(Math.PI / 2);
  });
});
```

- [ ] **Step 2: テスト失敗確認**

```bash
pnpm test tests/render/maze/camera.test.ts
```

Expected: 5 new tests fail

- [ ] **Step 3: 最小実装**

`camera.ts` に追加:

```typescript
export function shortestAngleDelta(from: number, to: number): number {
  const TAU = Math.PI * 2;
  let d = ((to - from) % TAU + TAU) % TAU; // 0..2π に正規化
  if (d > Math.PI) d -= TAU; // 半周より大きいなら逆方向 (負値)
  return d;
}
```

- [ ] **Step 4: テスト通過確認**

### Task 2.3: `easeInOutQuad(t) → number`

仕様: t ∈ [0,1] で始端/終端で滑らか、中央線形。`t<0.5 ? 2t² : 1-2(1-t)²`

- [ ] **Step 1: 失敗テスト追記**

```typescript
import { easeInOutQuad } from "@/render/maze/camera";

describe("easeInOutQuad", () => {
  it("starts at 0", () => {
    expect(easeInOutQuad(0)).toBe(0);
  });
  it("ends at 1", () => {
    expect(easeInOutQuad(1)).toBe(1);
  });
  it("midpoint is 0.5", () => {
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5);
  });
  it("monotonically increasing", () => {
    for (let i = 0; i < 10; i++) {
      expect(easeInOutQuad((i + 1) / 10)).toBeGreaterThan(easeInOutQuad(i / 10));
    }
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}
```

- [ ] **Step 4: 通過確認**

### Task 2.4: `interpolateTarget(from, to, t) → CameraTarget`

仕様: pos は線形補間、yaw は shortestAngleDelta + ease を適用した補間。

- [ ] **Step 1: 失敗テスト追記**

```typescript
import { interpolateTarget } from "@/render/maze/camera";

describe("interpolateTarget", () => {
  const from: CameraTarget = { pos: { x: 0, y: 0 }, yaw: 0 };
  const to: CameraTarget = { pos: { x: 1, y: 1 }, yaw: Math.PI / 2 };

  it("returns from at t=0", () => {
    const r = interpolateTarget(from, to, 0);
    expect(r.pos).toEqual({ x: 0, y: 0 });
    expect(r.yaw).toBeCloseTo(0);
  });

  it("returns to at t=1", () => {
    const r = interpolateTarget(from, to, 1);
    expect(r.pos.x).toBeCloseTo(1);
    expect(r.pos.y).toBeCloseTo(1);
    expect(r.yaw).toBeCloseTo(Math.PI / 2);
  });

  it("at t=0.5 pos is roughly midway, yaw uses ease", () => {
    const r = interpolateTarget(from, to, 0.5);
    expect(r.pos.x).toBeCloseTo(0.5);
    expect(r.pos.y).toBeCloseTo(0.5);
    expect(r.yaw).toBeCloseTo(Math.PI / 4); // ease(0.5)=0.5
  });

  it("uses shortest angle: 0 → 3π/2 goes clockwise", () => {
    const r = interpolateTarget(
      { pos: { x: 0, y: 0 }, yaw: 0 },
      { pos: { x: 0, y: 0 }, yaw: (3 * Math.PI) / 2 },
      0.5,
    );
    // shortest delta = -π/2; midway = 0 + (-π/2) * 0.5 = -π/4
    expect(r.yaw).toBeCloseTo(-Math.PI / 4);
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
import type { CameraTarget } from "./types";

export function interpolateTarget(from: CameraTarget, to: CameraTarget, t: number): CameraTarget {
  const e = easeInOutQuad(t);
  const dy = shortestAngleDelta(from.yaw, to.yaw);
  return {
    pos: {
      x: from.pos.x + (to.pos.x - from.pos.x) * e,
      y: from.pos.y + (to.pos.y - from.pos.y) * e,
    },
    yaw: from.yaw + dy * e,
  };
}
```

- [ ] **Step 4: 通過確認 + 全テスト緑**

```bash
pnpm test
```

- [ ] **Step 5: コミット**

```bash
git add src/render/maze/camera.ts tests/render/maze/camera.test.ts
git commit -m "feat(render): add camera pure helpers (target/angle/ease/interpolate) with tests"
```

---

## Phase 3: `geom.ts` 純関数 (TDD)

すべて `BufferGeometry` を返す。アサーションは頂点数 / インデックス数 / `boundingBox.center` が想定セルにマップしているかで行う。

### Task 3.1: 小さなテスト用 `MazeLevel` fixture を作る

**Files:**
- Create: `tests/render/maze/fixtures.ts`

- [ ] **Step 1: 4×4 mini fixture**

```typescript
import type { MazeLevel } from "@/engine/data/maze/types";

/** 4x4 fixture: 全外周が壁、(1,1)-(2,1) 間に扉、(2,2) は階段 up */
export function makeMiniLevel(): MazeLevel {
  const grid = Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => ({
      edges: {
        n: y === 0 ? "wall" : ("open" as const),
        w: x === 0 ? "wall" : ("open" as const),
      },
      special: x === 2 && y === 2 ? ("stairsUp" as const) : ("none" as const),
    })),
  );
  // (1,1) と (2,1) の間 = (2,1) の west エッジを door に
  grid[1][2] = { ...grid[1][2], edges: { n: "open", w: "door" } };
  return {
    grid,
    southBoundary: ["wall", "wall", "wall", "wall"],
    eastBoundary: ["wall", "wall", "wall", "wall"],
    startPosition: { x: 0, y: 0, dir: "n" },
  };
}
```

(注: TypeScript strict のため `as const` を活用、cell 型は既存 `Cell` と一致するように)

- [ ] **Step 2: typecheck 通過確認**

```bash
pnpm typecheck
```

### Task 3.2: `buildWallGeometry(level)` (TDD)

仕様 (spec §8):
- セル走査で north/west エッジ + 外周 south/east を検査
- `wall` / `secretDoor` → wall plane を emit
- `door` → wall plane (枠) emit (扉本体は `buildDoorGeometry` で別途)
- 1 plane = 4 vertex / 6 index (`PlaneGeometry(1, 1).index` と同じ)

- [ ] **Step 1: 失敗テスト**

`tests/render/maze/geom.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildWallGeometry } from "@/render/maze/geom";
import { makeMiniLevel } from "./fixtures";

describe("buildWallGeometry", () => {
  it("emits 4 outer walls + door wall = 5 planes for the mini level", () => {
    // 4x4 ミニ: 北壁 4 + 南壁 4 + 西壁 4 + 東壁 4 = 16 外周エッジ。
    // door も wall plane を emit するので合計 17 planes。
    // ※ ただし内部 north/west は全部 open なので 0 plane。
    // → 期待: 17 planes
    const geo = buildWallGeometry(makeMiniLevel());
    const positionAttr = geo.getAttribute("position");
    expect(positionAttr.count).toBe(17 * 4); // 4 vertex per plane
    expect(geo.index?.count).toBe(17 * 6);   // 6 index per plane
  });
});
```

- [ ] **Step 2: 失敗確認**

```bash
pnpm test tests/render/maze/geom.test.ts
```

Expected: FAIL

- [ ] **Step 3: 実装**

`src/render/maze/geom.ts`:

```typescript
import { BufferGeometry, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { getEdge } from "@/engine/data/maze/lookup";
import { MAZE_SIZE, type MazeLevel } from "@/engine/data/maze/types";

const WALL_HEIGHT = 1;

function makeNorthWall(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, WALL_HEIGHT);
  g.translate(x + 0.5, WALL_HEIGHT / 2, y); // 北壁 = y 平面
  return g;
}

function makeWestWall(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, WALL_HEIGHT);
  g.rotateY(Math.PI / 2); // x 平面に回転
  g.translate(x, WALL_HEIGHT / 2, y + 0.5);
  return g;
}

export function buildWallGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      // 北エッジ
      const n = getEdge(level, x, y, "n");
      if (n !== "open") planes.push(makeNorthWall(x, y));
      // 西エッジ
      const w = getEdge(level, x, y, "w");
      if (w !== "open") planes.push(makeWestWall(x, y));
      // 外周南
      if (y === MAZE_SIZE - 1) {
        const s = getEdge(level, x, y, "s");
        if (s !== "open") planes.push(makeNorthWall(x, y + 1)); // 南境界 = 次行の北
      }
      // 外周東
      if (x === MAZE_SIZE - 1) {
        const e = getEdge(level, x, y, "e");
        if (e !== "open") planes.push(makeWestWall(x + 1, y));
      }
    }
  }
  const merged = mergeGeometries(planes, false);
  for (const p of planes) p.dispose();
  return merged;
}
```

注: `MAZE_SIZE = 20` なので mini fixture の 4×4 とサイズが合わない。**fixture を 20×20 に拡張するか、`buildWallGeometry` に size を渡せるようにする**。

最も妥当な対応: `MAZE_SIZE` 定数を `level.grid.length` から取得するように変える。

- [ ] **Step 3.5: `MAZE_SIZE` 依存を取り除く**

`buildWallGeometry` 内の `MAZE_SIZE` を `level.grid.length` に置き換える。`for (let y = 0; y < level.grid.length; y++)` のように。**併せて `MAZE_SIZE` の import 行を削除** (biome の no-unused-imports 対策)。

- [ ] **Step 4: テスト通過確認**

```bash
pnpm test tests/render/maze/geom.test.ts
```

### Task 3.3: `buildFloorGeometry(level)` (TDD)

仕様: walkable セル (= 全セル、4×4 fixture では 16 セル) ごとに 1 plane (上向き)

- [ ] **Step 1: 失敗テスト**

```typescript
import { buildFloorGeometry } from "@/render/maze/geom";

describe("buildFloorGeometry", () => {
  it("emits 1 plane per walkable cell", () => {
    const geo = buildFloorGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(16 * 4);
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
function makeFloor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2); // 水平に
  g.translate(x + 0.5, 0, y + 0.5);
  return g;
}

export function buildFloorGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    for (let x = 0; x < level.grid[y].length; x++) {
      planes.push(makeFloor(x, y));
    }
  }
  const merged = mergeGeometries(planes, false);
  for (const p of planes) p.dispose();
  return merged;
}
```

- [ ] **Step 4: 通過確認**

### Task 3.4: `buildCeilingGeometry(level)` (TDD)

仕様: walkable セルごとに 1 plane (下向き、y=1)

- [ ] **Step 1: 失敗テスト** (floor と同様、count 検証)
- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
function makeCeiling(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, 1);
  g.rotateX(Math.PI / 2);
  g.translate(x + 0.5, WALL_HEIGHT, y + 0.5);
  return g;
}

export function buildCeilingGeometry(level: MazeLevel): BufferGeometry {
  // makeFloor と同型ロジック、関数だけ差し替え
  // ...
}
```

- [ ] **Step 4: 通過確認**

### Task 3.5: `buildDoorGeometry(level)` (TDD)

仕様: edge type === `door` のセルのみ、wall plane に重ねた 0.6 × 0.7 plane を内側にオフセット (Z-fighting 回避のため壁から 0.01 内側)。mini fixture では 1 個。

- [ ] **Step 1: 失敗テスト**

```typescript
import { buildDoorGeometry } from "@/render/maze/geom";

describe("buildDoorGeometry", () => {
  it("emits 1 plane for the mini level (1 door at (2,1).w)", () => {
    const geo = buildDoorGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(1 * 4);
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
function makeNorthDoor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(0.6, 0.7);
  g.translate(x + 0.5, 0.35, y + 0.01); // 壁の少し南側 (= 通行可能側)
  return g;
}

function makeWestDoor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(0.6, 0.7);
  g.rotateY(Math.PI / 2);
  g.translate(x + 0.01, 0.35, y + 0.5);
  return g;
}

export function buildDoorGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    for (let x = 0; x < level.grid[y].length; x++) {
      if (getEdge(level, x, y, "n") === "door") planes.push(makeNorthDoor(x, y));
      if (getEdge(level, x, y, "w") === "door") planes.push(makeWestDoor(x, y));
      if (y === level.grid.length - 1 && getEdge(level, x, y, "s") === "door") {
        planes.push(makeNorthDoor(x, y + 1));
      }
      if (x === level.grid[y].length - 1 && getEdge(level, x, y, "e") === "door") {
        planes.push(makeWestDoor(x + 1, y));
      }
    }
  }
  if (planes.length === 0) return new BufferGeometry(); // empty
  const merged = mergeGeometries(planes, false);
  for (const p of planes) p.dispose();
  return merged;
}
```

- [ ] **Step 4: 通過確認**

### Task 3.6: `buildStairsGeometry(level)` (TDD)

仕様: stairsUp/stairsDown セルのみ、床上 y=0.01 に 0.6×0.6 plane

- [ ] **Step 1: 失敗テスト**

```typescript
import { buildStairsGeometry } from "@/render/maze/geom";

describe("buildStairsGeometry", () => {
  it("emits 1 plane for the mini level (1 stairsUp at (2,2))", () => {
    const geo = buildStairsGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(1 * 4);
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

```typescript
export function buildStairsGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    for (let x = 0; x < level.grid[y].length; x++) {
      const cell = level.grid[y][x];
      if (cell.special === "stairsUp" || cell.special === "stairsDown") {
        const g = new PlaneGeometry(0.6, 0.6);
        g.rotateX(-Math.PI / 2);
        g.translate(x + 0.5, 0.01, y + 0.5);
        planes.push(g);
      }
    }
  }
  if (planes.length === 0) return new BufferGeometry();
  const merged = mergeGeometries(planes, false);
  for (const p of planes) p.dispose();
  return merged;
}
```

注: 階段マーカーは UV 座標が必要 (CanvasTexture を貼るため)。`PlaneGeometry` のデフォルト UV (0,0)-(1,1) で OK。

- [ ] **Step 4: 通過確認**

### Task 3.7: 全 geom テスト + lint + typecheck + コミット

- [ ] **Step 1: 全テスト走らせる**

```bash
pnpm test && pnpm lint && pnpm typecheck
```

- [ ] **Step 2: コミット**

```bash
git add src/render/maze/geom.ts tests/render/maze/geom.test.ts tests/render/maze/fixtures.ts
git commit -m "feat(render): add geom builders (wall/floor/ceiling/door/stairs) with tests"
```

---

## Phase 4: マテリアルとオーバーレイ

### Task 4.1: `materials.ts` (5 マテリアル)

**Files:**
- Create: `src/render/maze/materials.ts`

仕様 (spec §6):
| 種別 | color | DoubleSide |
|---|---|---|
| 壁 | `0x808080` | yes |
| 床 | `0x303030` | no |
| 天井 | `0x202020` | no |
| 扉 | `0x603020` | yes |
| 階段マーカー | `0xa0a060` | no (上向き) |

- [ ] **Step 1: 実装**

`src/render/maze/materials.ts`:

```typescript
import { DoubleSide, MeshLambertMaterial } from "three";
import type { CanvasTexture } from "three";

export const wallMaterial = new MeshLambertMaterial({ color: 0x808080, side: DoubleSide });
export const floorMaterial = new MeshLambertMaterial({ color: 0x303030 });
export const ceilingMaterial = new MeshLambertMaterial({ color: 0x202020 });
export const doorMaterial = new MeshLambertMaterial({ color: 0x603020, side: DoubleSide });

/** 階段マテリアルは map (CanvasTexture) を後から差し込む */
export function createStairsMaterial(map: CanvasTexture): MeshLambertMaterial {
  return new MeshLambertMaterial({ color: 0xa0a060, map, transparent: true });
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: コミット**

```bash
git add src/render/maze/materials.ts
git commit -m "feat(render): add 5 lambert materials (wall/floor/ceiling/door/stairs)"
```

### Task 4.2: `overlay.ts` (階段矢印 CanvasTexture 生成)

**Files:**
- Create: `src/render/maze/overlay.ts`

仕様: 64×64 Canvas に矢印を描画 → `CanvasTexture`。stairsUp は上三角、stairsDown は下三角。

- [ ] **Step 1: 実装**

```typescript
import { CanvasTexture } from "three";

function drawArrow(ctx: CanvasRenderingContext2D, up: boolean): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  if (up) {
    ctx.moveTo(32, 12);
    ctx.lineTo(52, 52);
    ctx.lineTo(12, 52);
  } else {
    ctx.moveTo(32, 52);
    ctx.lineTo(52, 12);
    ctx.lineTo(12, 12);
  }
  ctx.closePath();
  ctx.fill();
}

export function makeStairsTexture(direction: "up" | "down"): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");
  drawArrow(ctx, direction === "up");
  return new CanvasTexture(canvas);
}
```

- [ ] **Step 2: typecheck**
- [ ] **Step 3: コミット**

```bash
git add src/render/maze/overlay.ts
git commit -m "feat(render): add CanvasTexture generator for stairs arrows"
```

注: テストは Phase 5 の `scene.test.ts` でカバー (`makeStairsTexture` は document 依存なので jsdom で実行)。

---

## Phase 5: シーン構築 + integration test

### Task 5.1: `scene.ts` 実装

**Files:**
- Create: `src/render/maze/scene.ts`

仕様 (spec §6, §8): ライト + Fog + 5 mesh を載せた Scene を返す純関数。

- [ ] **Step 1: 実装**

```typescript
import {
  AmbientLight,
  DirectionalLight,
  Fog,
  Mesh,
  Scene,
} from "three";
import type { MazeLevel } from "@/engine/data/maze/types";
import {
  buildCeilingGeometry,
  buildDoorGeometry,
  buildFloorGeometry,
  buildStairsGeometry,
  buildWallGeometry,
} from "./geom";
import {
  ceilingMaterial,
  createStairsMaterial,
  doorMaterial,
  floorMaterial,
  wallMaterial,
} from "./materials";
import { makeStairsTexture } from "./overlay";

export function buildScene(level: MazeLevel): Scene {
  const scene = new Scene();
  scene.fog = new Fog(0x000000, 1.5, 4.0);

  scene.add(new AmbientLight(0x404060, 0.4));
  const dir = new DirectionalLight(0xa0a0c0, 0.6);
  dir.position.set(0.5, 2, 0.5);
  scene.add(dir);

  const wallMesh = new Mesh(buildWallGeometry(level), wallMaterial);
  wallMesh.name = "walls";
  scene.add(wallMesh);

  const floorMesh = new Mesh(buildFloorGeometry(level), floorMaterial);
  floorMesh.name = "floor";
  scene.add(floorMesh);

  const ceilMesh = new Mesh(buildCeilingGeometry(level), ceilingMaterial);
  ceilMesh.name = "ceiling";
  scene.add(ceilMesh);

  const doorGeo = buildDoorGeometry(level);
  if (doorGeo.getAttribute("position")) {
    const doorMesh = new Mesh(doorGeo, doorMaterial);
    doorMesh.name = "doors";
    scene.add(doorMesh);
  }

  const stairsGeo = buildStairsGeometry(level);
  if (stairsGeo.getAttribute("position")) {
    // 上り/下りの mix は同 texture では区別できないので、stairsUp / stairsDown ごとに
    // mesh を分ける案も可。MVP では up texture を使用 (将来 polish 時に分割検討)。
    const stairsMesh = new Mesh(stairsGeo, createStairsMaterial(makeStairsTexture("up")));
    stairsMesh.name = "stairs";
    scene.add(stairsMesh);
  }

  return scene;
}
```

注: 階段の up/down 区別は MVP では up テクスチャ統一。実装後の手動プレイテストで「区別が必要」となれば Phase 別に分ける。

- [ ] **Step 2: typecheck**

### Task 5.2: integration test

**Files:**
- Create: `tests/render/maze/scene.test.ts`

- [ ] **Step 1: テスト**

```typescript
import { describe, expect, it } from "vitest";
import { Mesh } from "three";
import { buildScene } from "@/render/maze/scene";
import { wallMaterial } from "@/render/maze/materials";
import { makeMiniLevel } from "./fixtures";

describe("buildScene", () => {
  it("includes 5 named meshes (walls, floor, ceiling, doors, stairs)", () => {
    const scene = buildScene(makeMiniLevel());
    const names = scene.children.filter((c) => c instanceof Mesh).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["walls", "floor", "ceiling", "doors", "stairs"]));
  });

  it("walls mesh shares the module-level wallMaterial instance", () => {
    const scene = buildScene(makeMiniLevel());
    const walls = scene.getObjectByName("walls") as Mesh;
    expect(walls.material).toBe(wallMaterial);
  });

  it("has Fog with 1.5..4.0 black", () => {
    const scene = buildScene(makeMiniLevel());
    expect(scene.fog).toBeDefined();
    // @ts-expect-error narrow
    expect(scene.fog.near).toBe(1.5);
    // @ts-expect-error narrow
    expect(scene.fog.far).toBe(4.0);
  });
});
```

- [ ] **Step 2: テスト実行**

`vitest.config.ts` の test environment が `jsdom` であることを確認。`makeStairsTexture` が `document.createElement('canvas')` を呼ぶため。

```bash
pnpm test tests/render/maze/scene.test.ts
```

Expected: 3 tests pass

- [ ] **Step 3: コミット**

```bash
git add src/render/maze/scene.ts tests/render/maze/scene.test.ts
git commit -m "feat(render): assemble scene with lights/fog + 5 merged meshes"
```

---

## Phase 6: Renderer ライフサイクル (`view.ts`)

### Task 6.1: `view.ts` 実装

**Files:**
- Create: `src/render/maze/view.ts`

仕様 (spec §4, §7):
- `mount(canvas, level) → ViewHandle` で Renderer + Scene + Camera を初期化
- `setTarget(target)` で camera 位置/向きを即時設定
- `dispose()` で全 GPU リソース解放

- [ ] **Step 1: 実装**

```typescript
import {
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { MazeLevel } from "@/engine/data/maze/types";
import { buildScene } from "./scene";
import type { CameraTarget } from "./types";

export interface ViewHandle {
  setTarget(target: CameraTarget): void;
  render(): void;
  dispose(): void;
}

export function mountView(canvas: HTMLCanvasElement, level: MazeLevel): ViewHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x000000);

  const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.05, 10);
  const scene = buildScene(level);

  function setTarget(target: CameraTarget): void {
    camera.position.set(target.pos.x, 0.5, target.pos.y);
    const lookAtX = target.pos.x + Math.sin(target.yaw);
    const lookAtZ = target.pos.y - Math.cos(target.yaw); // yaw=0 (北) → -z
    camera.lookAt(new Vector3(lookAtX, 0.5, lookAtZ));
  }

  function render(): void {
    renderer.render(scene, camera);
  }

  function dispose(): void {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        const m = obj.material;
        if (Array.isArray(m)) for (const mm of m) mm.dispose();
        else m.dispose();
      }
    });
    renderer.dispose();
  }

  return { setTarget, render, dispose };
}
```

注: `lookAt` の式は spec §5 の「北向き = -z 方向」に従う。yaw=0 → `sin(0)=0, cos(0)=1` → lookAt(x, 0.5, z-1)。

- [ ] **Step 2: typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: コミット**

```bash
git add src/render/maze/view.ts
git commit -m "feat(render): add view lifecycle (mount/setTarget/render/dispose)"
```

---

## Phase 7: CameraAnimator (補間 + RAF)

### Task 7.1: `CameraAnimator` クラスを `camera.ts` に追加

**Files:**
- Modify: `src/render/maze/camera.ts`
- Modify: `tests/render/maze/camera.test.ts`

仕様 (spec §7):
- `animateTo(target, durationMs, onFrame)` を呼ぶと内部に target / start time を保持
- 毎 RAF で `interpolateTarget(from, to, t)` を計算して `onFrame(current)` を呼ぶ
- 進行中に再度 `animateTo` が来たら現在 frame の補間値を新しい from にリスタート
- `t >= 1` で終了、onFrame は最後に target ぴったりで 1 度呼ばれる
- `cancel()` で停止

テストは `vi.useFakeTimers` + 仮想 RAF で時間を進める。

- [ ] **Step 1: テスト**

```typescript
import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";
import { CameraAnimator } from "@/render/maze/camera";

describe("CameraAnimator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onFrame with the start target at t=0", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 });
    const frames: number[] = [];
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, (c) => frames.push(c.pos.x));
    vi.advanceTimersByTime(0);
    expect(frames[0]).toBeCloseTo(0);
  });

  it("ends exactly at the target after duration", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 });
    const last: { x: number }[] = [];
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, (c) => last.push(c.pos));
    vi.advanceTimersByTime(150);
    expect(last[last.length - 1].x).toBeCloseTo(1);
  });

  it("interrupting animateTo restarts from current interpolated frame", () => {
    const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 });
    a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, () => {});
    vi.advanceTimersByTime(50); // 半分まで進める (ease(0.5)=0.5 → x=0.5)
    const frames: { x: number }[] = [];
    a.animateTo({ pos: { x: 0, y: 1 }, yaw: 0 }, 100, (c) => frames.push(c.pos));
    vi.advanceTimersByTime(0);
    // 新 from = 中断時の interpolated x ≒ 0.5
    expect(frames[0].x).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: 失敗確認**
- [ ] **Step 3: 実装**

`camera.ts` に追加 (RAF はテストしやすいように abstract):

```typescript
type Raf = (cb: (now: number) => void) => number;
type CancelRaf = (id: number) => void;

export class CameraAnimator {
  private current: CameraTarget;
  private from: CameraTarget;
  private to: CameraTarget;
  private startMs = 0;
  private duration = 0;
  private rafId = 0;
  private onFrame: ((c: CameraTarget) => void) | null = null;
  private raf: Raf;
  private cancelRaf: CancelRaf;
  private now: () => number;

  constructor(
    initial: CameraTarget,
    raf: Raf = requestAnimationFrame,
    cancelRaf: CancelRaf = cancelAnimationFrame,
    now: () => number = () => performance.now(),
  ) {
    this.current = initial;
    this.from = initial;
    this.to = initial;
    this.raf = raf;
    this.cancelRaf = cancelRaf;
    this.now = now;
  }

  animateTo(target: CameraTarget, durationMs: number, onFrame: (c: CameraTarget) => void): void {
    if (this.rafId) {
      this.cancelRaf(this.rafId);
      this.rafId = 0;
    }
    this.from = this.current; // 現在の補間結果から再スタート
    this.to = target;
    this.duration = durationMs;
    this.startMs = this.now();
    this.onFrame = onFrame;
    this.tick();
  }

  cancel(): void {
    if (this.rafId) {
      this.cancelRaf(this.rafId);
      this.rafId = 0;
    }
    this.onFrame = null;
  }

  private tick = (): void => {
    const elapsed = this.now() - this.startMs;
    const t = this.duration === 0 ? 1 : Math.min(elapsed / this.duration, 1);
    this.current = interpolateTarget(this.from, this.to, t);
    this.onFrame?.(this.current);
    if (t < 1) {
      this.rafId = this.raf(this.tick);
    } else {
      this.rafId = 0;
      this.onFrame = null;
    }
  };
}
```

注: テストでは `requestAnimationFrame` / `performance.now` を fake timer + injected functions に差し替える。jsdom の RAF は `setTimeout(cb, 16)` 相当なので `vi.advanceTimersByTime` で進む。

実際にはテストの `expect(frames[0].x).toBeCloseTo(0.5)` は RAF 1 回目を待つ必要があるため、`vi.advanceTimersByTime(0)` ではなく `vi.advanceTimersByTime(20)` 程度が必要かもしれない。**実装後にテストの timer 進め方を実機で検証して微調整する**。

- [ ] **Step 4: テストが通ることを確認**

```bash
pnpm test tests/render/maze/camera.test.ts
```

Expected: 全 pass

- [ ] **Step 5: コミット**

```bash
git add src/render/maze/camera.ts tests/render/maze/camera.test.ts
git commit -m "feat(render): add CameraAnimator (interruptible RAF interpolation)"
```

---

## Phase 8: MazeView 統合 + 旧ファイル削除 + spec 更新

### Task 8.1: `MazeView.tsx` を Three.js View に切り替え

**Files:**
- Modify: `src/screens/Maze/MazeView.tsx`

**設計上の注意 (reviewer 指摘修正)**:
- `MazeView` は phase が `maze` でない時は親側で render されないようにする (= ある程度親 routing が `phase === 'maze'` ガードしている前提)。本コンポーネントでは `pos` が null なら `null` を返して即座に何も出さず、Three.js 関連 hook は実行しない順序で書く
- `useEffect([])` の罠を回避するため、mount は **canvas が ref 参照可能になった最初の render で起動** する設計にする (`pos` が初期値で必ず非 null となる前提を保証)

- [ ] **Step 1: 書き換え**

```typescript
import { MAZE_L1 } from "@/engine/data/maze/level1";
import type { MazePosition } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { CameraAnimator, targetFromPosition } from "@/render/maze/camera";
import { mountView } from "@/render/maze/view";
import { gameStore, useGameStore } from "@/store/gameStore";
import { useEffect, useRef } from "react";
import "./Maze.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const FORWARD_MS = 150;
const TURN_MS = 200;

export function MazeView() {
  const pos = useGameStore((s) => (s.state.phase === "maze" ? s.state.pos : null));
  if (!pos) return null;
  return <MazeViewInner pos={pos} />;
}

function MazeViewInner({ pos }: { pos: MazePosition }) {
  // pos が必ず非 null である前提で hook を並べる。pos の参照は親側の useGameStore が
  // 司り、本コンポーネントはマウントされた時点で確実に有効値を持つ。
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ReturnType<typeof mountView> | null>(null);
  const animatorRef = useRef<CameraAnimator | null>(null);
  const lastPosRef = useRef<typeof pos | null>(null);

  // Three.js View 初期化 — pos が必ず非 null なので unconditional に動く
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = mountView(canvas, MAZE_L1);
    const initial = targetFromPosition(pos);
    view.setTarget(initial);
    view.render();
    viewRef.current = view;
    animatorRef.current = new CameraAnimator(initial);
    lastPosRef.current = pos;
    return () => {
      view.dispose();
      animatorRef.current?.cancel();
      viewRef.current = null;
      animatorRef.current = null;
    };
    // pos は初期 mount 時にしか使わない (以降は次の useEffect が処理)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pos 変化に応じて補間アニメーション
  useEffect(() => {
    if (!viewRef.current || !animatorRef.current) return;
    const last = lastPosRef.current;
    if (!last) {
      lastPosRef.current = pos;
      return;
    }
    const target = targetFromPosition(pos);
    const isTurn = last.x === pos.x && last.y === pos.y && last.dir !== pos.dir;
    const duration = isTurn ? TURN_MS : FORWARD_MS;
    animatorRef.current.animateTo(target, duration, (frame) => {
      viewRef.current?.setTarget(frame);
      viewRef.current?.render();
    });
    lastPosRef.current = pos;
  }, [pos]);

  // キー入力 (旧コードと同じ)
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      if (e.repeat) return;
      switch (e.key) {
        case "ArrowUp": case "w": case "W":
          e.preventDefault(); dispatch({ type: "moveForward" }); break;
        case "ArrowDown": case "s": case "S":
          e.preventDefault(); dispatch({ type: "moveBackward" }); break;
        case "ArrowLeft": case "a": case "A":
          e.preventDefault(); dispatch({ type: "turnLeft" }); break;
        case "ArrowRight": case "d": case "D":
          e.preventDefault(); dispatch({ type: "turnRight" }); break;
        case "c": case "C":
          e.preventDefault(); dispatch({ type: "openCamp" }); break;
        case "Enter":
          e.preventDefault(); dispatch({ type: "ascendStairs" }); break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="maze-screen">
      <canvas ref={canvasRef} width={280} height={192} className="maze-canvas" />
      <div className="maze-status">
        <span>L{pos.level}</span>
        <span>({pos.x}, {pos.y})</span>
        <span>{pos.dir.toUpperCase()}</span>
        <span className="maze-hint">{t("maze.hint")}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: dev で動作確認**

```bash
pnpm dev
```

ブラウザで Title → New Game → 迷宮入り口へ進み、矢印キーで歩行 / 回転して滑らか補間と shaded walls を目視確認。

- [ ] **Step 3: typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

### Task 8.2: 旧ファイル削除

**Files (delete):**
- `src/render/maze/render.ts`
- `src/render/maze/segments.ts`
- `src/render/maze/viewport.ts`
- `src/render/maze/wireframeTable.ts`
- `tests/render/maze/segments.test.ts`
- `tests/render/maze/viewport.test.ts`

**Files (modify):**
- `src/render/maze/types.ts` から `LineSegment` / `SegmentSet` / `WireframeTable` を削除 (新型 `CameraTarget` / `Yaw` のみ残す)

- [ ] **Step 1: 削除**

```bash
git rm src/render/maze/render.ts src/render/maze/segments.ts src/render/maze/viewport.ts src/render/maze/wireframeTable.ts
git rm tests/render/maze/segments.test.ts tests/render/maze/viewport.test.ts
```

- [ ] **Step 2: types.ts から旧型削除**

`src/render/maze/types.ts` を編集し、`LineSegment` / `SegmentSet` / `WireframeTable` の export と関連 import を削除。

- [ ] **Step 3: 全テスト + lint + typecheck + build**

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
```

Expected: 全グリーン (旧型を参照する import が残っていればここで失敗 = 修正対象)

### Task 8.3: spec Section 5 を新方式に書き換え

**Files:**
- Modify: `docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md`

- [ ] **Step 1: 編集**

Section 5 (`### 迷宮 3D ワイヤーフレーム描画アルゴリズム`) の内容を以下の要旨に置き換え:

```markdown
### 迷宮 3D 描画 (Three.js + Shaded Walls)

L1 マップを Three.js シーンに静的 mesh として展開し、`MeshLambertMaterial` +
`Fog` で shaded walls 描画する。具体仕様は別ドキュメント
`docs/superpowers/specs/2026-05-09-maze-3d-render-redesign-design.md` を参照。

主要要素:
- Renderer: WebGLRenderer (280×192 Canvas)
- Camera: PerspectiveCamera(fov=75, aspect=280/192, near=0.05, far=10)
- Lighting: AmbientLight(0.4) + DirectionalLight(0.6)
- Fog: 黒 1.5..4.0
- Mesh: 壁 / 床 / 天井 / 扉 / 階段 マーカー (5 draw call)
- Camera 補間: easeInOutQuad、前進 150ms / 回転 200ms

`WIREFRAME_TABLE` 方式 (per-cell rect、Pascal 抽出フォールバック等) は
2026-05-09 に廃止。
```

- [ ] **Step 2: コミット**

Phase 8 全体を 1 commit にまとめる:

```bash
git add -A
git commit -m "feat(render): integrate Three.js view, remove legacy wireframe code

- MazeView.tsx now mounts Three.js view + CameraAnimator
- Delete render/segments/viewport/wireframeTable + their tests
- Strip legacy types from types.ts
- Rewrite root spec Section 5 to point to new design doc"
```

---

## Phase 9: Playwright スクリーンショット回帰

### Task 9.1: Playwright config + テストディレクトリ scaffold

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/visual/maze.spec.ts` (空)

- [ ] **Step 1: config**

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__snapshots__",
  // baseline は Linux でのみ生成・更新する (CONTRIBUTING に明記)
  expect: {
    toHaveScreenshot: { threshold: 0.005 },
  },
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 800, height: 600 },
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium-linux",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 2: package.json に script 追加**

```json
"test:visual": "playwright test",
"test:visual:update": "playwright test --update-snapshots"
```

- [ ] **Step 3: typecheck (config 自体)**

```bash
pnpm typecheck
```

### Task 9.2: テスト用 hook (debug API) を gameStore に追加

スクリーンショット撮影では「Title から New Game → キー入力で迷宮入り」ではなく、Playwright から直接「迷宮 phase に入って指定座標/方向にする」したい。**title から maze まで一気に強制 jump する** debug API + Animation 即時完了 API を追加する。

**Files:**
- Modify: `src/store/gameStore.ts` (debug-only)

- [ ] **Step 1: debug API 実装**

```typescript
import type { MazePosition } from "@/engine/state/types";
import { EMPTY_PARTY } from "@/engine/state/types";

/**
 * テスト専用: state を強制的に maze phase + 指定 pos に書き換える。
 * party は EMPTY_PARTY (キャラ 0 人) の placeholder。Camp 操作はテストしない。
 * 本番 (vite build) では import.meta.env.DEV === false なので no-op。
 */
export function devEnterMazeAt(pos: MazePosition): void {
  if (!import.meta.env.DEV) return;
  gameStore.setState((s) => ({
    ...s,
    state: { phase: "maze", pos, party: EMPTY_PARTY },
  }));
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  // @ts-expect-error グローバル拡張、テスト専用
  window.__wpgDev = { devEnterMazeAt };
}
```

注: Playwright から `window.__wpgDev.devEnterMazeAt(...)` で 1 回叩くだけで title からでも maze に入る。

- [ ] **Step 2: typecheck**

### Task 9.3: 8 視点 × 4 方向の screenshot テスト

**Files:**
- Modify: `tests/visual/maze.spec.ts`
- Modify: `src/render/maze/camera.ts` (TEST 用に animator のフラグを export)

**設計上の注意 (reviewer 指摘修正)**: `waitForTimeout(250)` は補間が連鎖したり負荷で遅延した場合に flaky。代わりに `CameraAnimator` に `isAnimating` getter を生やし、Playwright から `window.__wpgDev.isMazeAnimating()` をポーリングで読めるようにする。

- [ ] **Step 1: CameraAnimator に isAnimating getter 追加**

`src/render/maze/camera.ts`:

```typescript
export class CameraAnimator {
  // ... 既存 ...
  get isAnimating(): boolean {
    return this.rafId !== 0;
  }
}
```

unit test 追記 (`tests/render/maze/camera.test.ts`):

```typescript
it("isAnimating is false initially, true while running, false after end", () => {
  const a = new CameraAnimator({ pos: { x: 0, y: 0 }, yaw: 0 });
  expect(a.isAnimating).toBe(false);
  a.animateTo({ pos: { x: 1, y: 0 }, yaw: 0 }, 100, () => {});
  expect(a.isAnimating).toBe(true);
  vi.advanceTimersByTime(150);
  expect(a.isAnimating).toBe(false);
});
```

- [ ] **Step 2: gameStore.ts の devEnterMazeAt 隣に isAnimating 取得 API**

このために `MazeView` から animator ref を window に export する必要がある。`MazeViewInner` の最初の useEffect 内で登録 → cleanup で削除:

```typescript
// useEffect の中、view.render() 直後あたりに:
if (import.meta.env.DEV && typeof window !== "undefined") {
  // @ts-expect-error
  window.__wpgDev = {
    // @ts-expect-error 既存と merge
    ...(window.__wpgDev ?? {}),
    isMazeAnimating: () => animatorRef.current?.isAnimating ?? false,
  };
}

// 同じ useEffect の return cleanup の中:
return () => {
  view.dispose();
  animatorRef.current?.cancel();
  viewRef.current = null;
  animatorRef.current = null;
  if (import.meta.env.DEV && typeof window !== "undefined") {
    // @ts-expect-error
    delete window.__wpgDev?.isMazeAnimating;
  }
};
```

- [ ] **Step 3: Playwright テスト本体**

`tests/visual/maze.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";

const VIEWPOINTS = [
  { name: "start", x: 0, y: 19 },
  { name: "corridor-door",  x: 5, y: 10 },   // ※ 実装着手時に L1 から扉のある通路を選定
  { name: "t-junction",     x: 8, y: 8 },    // 同上
  { name: "open-area",      x: 10, y: 10 },
  { name: "stairs-up",      x: 0, y: 19 },   // start = stairsUp なので 1 と重複可
  { name: "dead-end",       x: 19, y: 0 },
  { name: "door-wall-mix",  x: 6, y: 5 },    // 旧バグ再現位置 (実装着手時に選定)
  { name: "darkness",       x: 12, y: 12 },  // 暗闇マス (実装着手時に L1 から選定)
];
const DIRS = ["n", "e", "s", "w"] as const;

for (const v of VIEWPOINTS) {
  for (const dir of DIRS) {
    test(`maze view ${v.name} ${dir}`, async ({ page }) => {
      await page.goto("/");
      // Title から強制で maze に jump (party は EMPTY_PARTY)
      await page.evaluate(({ x, y, dir }) => {
        // @ts-expect-error
        window.__wpgDev.devEnterMazeAt({ level: 1, x, y, dir });
      }, { x: v.x, y: v.y, dir });
      // 初期 mount + setTarget が完了するまで isMazeAnimating が登録されるのを待つ
      await page.waitForFunction(() => {
        // @ts-expect-error
        return typeof window.__wpgDev?.isMazeAnimating === "function";
      });
      // 補間完了を待つ (timeout 5s)
      await page.waitForFunction(() => {
        // @ts-expect-error
        return window.__wpgDev.isMazeAnimating() === false;
      }, undefined, { timeout: 5000 });
      const canvas = page.locator(".maze-canvas");
      await expect(canvas).toHaveScreenshot(`${v.name}-${dir}.png`);
    });
  }
}
```

注: 初回マウント時 `mountView` 直後に `view.setTarget(initial)` + `view.render()` で即座に静止画が出るため、初期 frame は補間を経由せず描画される。`isMazeAnimating()` が常に `false` で安定 → 即 screenshot 可能。

- [ ] **Step 4: ローカルで baseline 取得**

```bash
pnpm test:visual:update
```

Expected: 32 screenshot 生成、`tests/visual/__snapshots__/` 配下にコミット用 PNG 群。

- [ ] **Step 5: 再実行で全 pass 確認**

```bash
pnpm test:visual
```

### Task 9.4: CI に Playwright step 追加

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: 編集**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

      # Playwright (visual regression)
      - name: Get Playwright version
        id: pw-version
        run: echo "version=$(pnpm list --depth=0 @playwright/test | grep '@playwright/test' | awk '{print $2}')" >> $GITHUB_OUTPUT
      - uses: actions/cache@v4
        id: pw-cache
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ steps.pw-version.outputs.version }}
      - name: Install Playwright browsers
        if: steps.pw-cache.outputs.cache-hit != 'true'
        run: pnpm exec playwright install --with-deps chromium
      - name: Install Playwright system deps (cached path)
        if: steps.pw-cache.outputs.cache-hit == 'true'
        run: pnpm exec playwright install-deps chromium
      - run: pnpm test:visual

      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

- [ ] **Step 2: PR を作って CI 実行確認**

(ローカルで push、CI が通ることを確認)

- [ ] **Step 3: コミット**

```bash
git add playwright.config.ts tests/visual/ src/store/gameStore.ts package.json pnpm-lock.yaml .github/workflows/ci.yml
git commit -m "test: add Playwright screenshot regression for maze (32 baselines)"
```

---

## Phase 10: 仕上げ

### Task 10.1: 手動プレイテスト

- [ ] **Step 1: dev で L1 を一周**

```bash
pnpm dev
```

確認項目:
- [ ] 開始位置 (0, 19) 北向きで前方/左/右の壁が見える
- [ ] 前進 / 後退 / 左右回転が滑らか補間で動く
- [ ] 連打時に入力キューで先読み 1 操作分が継続する
- [ ] 階段マスで床に矢印マーカーが見える
- [ ] 扉のあるセルで凹み枠が見える
- [ ] 旧バグ位置 (隣接の扉と壁が混在する箇所) で線途切れがない (= 壁が連続して見える)
- [ ] L1 一周して全エリアの描画に違和感なし
- [ ] Camp に入って戻ってきても描画が保たれる

問題があれば再修正 (`materials.ts` の色値や `scene.ts` の Fog 範囲を中心に)。

### Task 10.2: open-questions.md の Q-014 を解決済へ

**Files:**
- Modify: `docs/chapters/1/open-questions.md`

- [ ] **Step 1: 編集**

Q-014 の項目を `## 解決済` セクションに移動し、解決方法を記載:

```markdown
### ✅ Q-014 (解決日: 2026-05-XX)
- 解決方法: per-cell rect 方式を全廃し、Three.js + shaded walls による
  3D 描画に移行 (spec `2026-05-09-maze-3d-render-redesign-design.md`、
  plan `2026-05-09-maze-3d-render-redesign.md`)
- 反映: `src/render/maze/` を全置換、`wip/maze-render-polish-attempt`
  ブランチは参考用に残置
```

### Task 10.3: リリースノート

**Files:**
- Create: `docs/chapters/1/release-notes/2026-05-XX-maze-3d-render-redesign.md` (既存リリースノート命名規則に合わせる)

- [ ] **Step 1: 既存リリースノートの場所確認**

```bash
find docs -name "*release*" -o -name "*RELEASE*" 2>/dev/null
```

(命名・ディレクトリ規則を踏襲)

- [ ] **Step 2: 内容**

- 何を変えたか (per-cell rect → Three.js shaded walls)
- なぜ (Q-014 解消)
- ユーザーから見た影響 (描画見た目大幅変更、滑らか補間)
- バンドルサイズ (実測値)
- テスト状況 (vitest N tests / playwright 32 snapshots)

### Task 10.4: 最終コミット

```bash
git add -A
git commit -m "docs: M4-redesign release notes + close Q-014"
```

### Task 10.5: ビルド + テスト最終確認

```bash
pnpm test && pnpm test:visual && pnpm lint && pnpm typecheck && pnpm build
```

全グリーンで実装完了。

---

## 完了チェックリスト

- [ ] `src/render/maze/` 配下が `{types, camera, geom, materials, overlay, scene, view}.ts` のみ
- [ ] vitest テスト数が +30〜40 件追加されている
- [ ] Playwright 32 baseline screenshot がリポジトリに含まれている
- [ ] `pnpm build` 後の bundle がおよそ 220KB gzip 以内 (実測して spec OQ-1 を解消)
- [ ] CI (Linux) で Playwright が pass
- [ ] L1 を手動で一周した上で旧バグ (線途切れ) が解消されていることを目視確認
- [ ] open-questions.md Q-014 が「解決済」に移動
- [ ] spec Section 5 が新方式を指している
- [ ] memory `project_wizardry_proving_grounds.md` の「次タスク」記述を実装完了に更新する (実装後に手動)
