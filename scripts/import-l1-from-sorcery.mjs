// L1 maze data importer
//
// Source: davemoore22/sorcery (GPL v2+) - dat/maps.json
//   https://github.com/davemoore22/sorcery
//
// The Sorcery project distributes Wizardry I maze data in Grid Cartographer
// (https://gridcartographer.com) export format. Original game data: Sir-Tech
// Software (1981) - cited under fair use for non-commercial reimplementation.
//
// This script is a one-shot. After generating src/engine/data/maze/level1.ts
// it can be removed (kept here for reproducibility / audit trail).
//
// Usage:
//   1. Download maps.json from sorcery repo (sdl/imgui branch)
//   2. node scripts/import-l1-from-sorcery.mjs <path-to-maps.json>
//   3. Output goes to src/engine/data/maze/level1.ts

import { readFileSync, writeFileSync } from "node:fs";

const MAPS_JSON_PATH = process.argv[2];
if (!MAPS_JSON_PATH) {
  console.error("Usage: node import-l1-from-sorcery.mjs <maps.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(MAPS_JSON_PATH, "utf8"));
const SIZE = 20;

// Floor index -1 = L1 in Sorcery (verified via "STAIRS TO -2 12 7" note at (0,10))
const floor = data.regions[0].floors.find((f) => f.index === -1);
if (!floor) {
  console.error("Floor index -1 not found");
  process.exit(1);
}

// GC edge value -> our CellEdge
// 一方向通路 (5/6/8/9) は本実装が一方向を区別しないため double-door として扱う
// (Spec 方針 X: ONE_WAY_DOOR は通常 door に簡略化)。
// 一方向壁 (7/10) は通行不可なので wall。
function gcEdgeToCell(v) {
  switch (v) {
    case 0:
      return "open";
    case 1:
      return "wall";
    case 2:
    case 3:
    case 12:
    case 33:
      return "door"; // UNLOCKED_DOOR / LOCKED_DOOR
    case 5:
    case 8:
      return "door"; // ONE_WAY_DOOR (left/up or right/down) -> simplified
    case 4:
    case 29:
      return "secretDoor"; // HIDDEN_DOOR / SECRET_DOOR
    case 6:
    case 9:
      return "secretDoor"; // ONE_WAY_HIDDEN_DOOR -> simplified
    case 7:
    case 10:
      return "wall"; // ONE_WAY_WALL -> simplified to wall
    case 13:
      return "wall"; // SECRET_WALL -> simplified to wall
    default:
      return "wall";
  }
}

// GC marker -> SpecialTile
function gcMarkerToSpecial(m, darkness) {
  switch (m) {
    case 1:
      return "stairsUp";
    case 2:
      return "stairsDown";
    case 11:
      return "spinner";
    case 4: // TELEPORT_FROM
    case 5: // TELEPORT_TO
    case 7: // PIT
    case 21: // ELEVATOR
    case 50: // CHUTE
      return "teleport";
    // LADDER_UP / LADDER_DOWN は本実装では SpecialTile に含めない
    // (1981 原典で stairsUp は startPosition のみ、ladder は別概念)
    case 26: // LADDER_UP
    case 27: // LADDER_DOWN
      return darkness ? "darkness" : "none";
    case 25: // MESSAGE - 本実装ではメッセージなし方針
    case 108: // NOTICE
    case 10: // PORTAL - Chapter 1 範囲外
    default:
      // No special marker -> darkness flag falls through
      return darkness ? "darkness" : "none";
  }
}

// Build a sparse map keyed by absolute coordinates.
// Sorcery uses bottom_left.x = -1 (left margin column), so absolute_x = -1 + start + i.
// The bounds are { x0: -1, y0: 0, width: 21, height: 21 }, meaning the playable
// grid is x=0..19, y=0..19, with x=-1 acting as a margin column whose east-wall
// data is actually the western boundary.
const BOTTOM_LEFT_X = floor.tiles.bounds.x0; // -1
const tilesByXY = {};
for (const row of floor.tiles.rows) {
  const y = row.y;
  const startX = row.start ?? 0;
  for (let i = 0; i < row.tdata.length; i++) {
    const tile = row.tdata[i];
    const x = BOTTOM_LEFT_X + startX + i;
    if (!tilesByXY[y]) tilesByXY[y] = {};
    tilesByXY[y][x] = {
      south: tile.b ?? 0,
      east: tile.r ?? 0,
      m: tile.m,
      darkness: tile.d === "1",
    };
  }
}

// Convert Sorcery (origin bottom-left, y=0 bottom) to our (origin top-left, y=0 top)
//   our (x, y) = Sorcery (x, 19 - y)
// In Sorcery: b = south wall of cell (x,y), connects (x,y) and (x,y-1)
// In our system: cell.edges.n is north wall of (x, y_ours) = boundary between (x, y_ours) and (x, y_ours - 1)
// Note: (x, y_ours) corresponds to Sorcery (x, 19 - y_ours).
// The "north" of our (x, y_ours) (which is upward in our coord system, i.e. y_ours decreases)
// In Sorcery, that's increasing y (going up). So our north edge of (x, y_ours) is
// the south edge of Sorcery (x, 19 - y_ours + 1) = (x, 20 - y_ours)
// In other words: ourGrid[y][x].edges.n = sorceryTile(x, 20 - y).south
//
// For x=0..19, y=0..19 (our coords):
//   our (x, y).edges.n = sorcery (x, 20 - y).b
//   our (x, y).edges.w = sorcery (x - 1, 19 - y).r  (west of us = east of cell to our west)
//
// Boundaries: our southBoundary[x] = sorcery (x, 0).b = south wall of bottom row
//             our eastBoundary[y] = sorcery (19, 19 - y).r = east wall of rightmost column

function getSorceryTile(x, y) {
  return tilesByXY[y]?.[x];
}

const grid = [];
for (let y = 0; y < SIZE; y++) {
  const row = [];
  for (let x = 0; x < SIZE; x++) {
    const sorceryY = 19 - y;
    const tile = getSorceryTile(x, sorceryY) ?? { south: 0, east: 0, darkness: false };

    // Our north edge of (x, y) = south wall of Sorcery cell at (x, 20 - y)
    //   y=0 (TS top, north boundary): force wall (Wizardry I uses toroidal wrap,
    //     but we don't support it - boundary is hard wall)
    //   y>=1: internal edge from Sorcery data
    let nEdge;
    if (y === 0) {
      nEdge = "wall"; // 北端境界
    } else {
      const northTile = getSorceryTile(x, 20 - y);
      nEdge = gcEdgeToCell(northTile?.south ?? 1);
    }

    // Our west edge of (x, y) = east wall of Sorcery cell at (x-1, 19-y)
    //   x=0 (TS left, west boundary): force wall
    //   x>=1: internal edge from Sorcery data
    let wEdge;
    if (x === 0) {
      wEdge = "wall"; // 西端境界
    } else {
      const westNeighbor = getSorceryTile(x - 1, sorceryY);
      wEdge = gcEdgeToCell(westNeighbor?.east ?? 1);
    }

    const special = gcMarkerToSpecial(tile.m, tile.darkness);

    row.push({
      n: nEdge,
      w: wEdge,
      special,
    });
  }
  grid.push(row);
}

// Force startPosition (our (0, 19) = sorcery (0, 0)) to be stairsUp
// (1981 原典: maze entrance from Castle is via Up Stair at (0, 0))
grid[19][0].special = "stairsUp";

// Boundaries: force all walls (no toroidal wrap support in our impl)
const southBoundary = Array.from({ length: SIZE }, () => "wall");
const eastBoundary = Array.from({ length: SIZE }, () => "wall");

// Generate TypeScript output
function tsCellEdges(c) {
  return `{ n: "${c.n}", w: "${c.w}" }`;
}
function tsCell(c) {
  if (c.special === "none") {
    return `{ edges: ${tsCellEdges(c)}, special: "none" }`;
  }
  return `{ edges: ${tsCellEdges(c)}, special: "${c.special}" }`;
}

let output = `// Reference: docs/reference/wiz1/data-tables/maze-l1.md
//
// L1 (Proving Grounds 1F) の 20×20 完全データ。
//
// Source (二次): davemoore22/sorcery (GPL v2+) dat/maps.json
//   https://github.com/davemoore22/sorcery
//   Sorcery プロジェクトは Grid Cartographer 形式で Wizardry I 全 10 階層の
//   マップを保持しており、本ファイルはそこから L1 (floor index = -1) を抽出
//   して本実装の Cell/MazeLevel 形式に変換したもの。
// Source (一次): Sir-Tech Software, Wizardry: Proving Grounds of the Mad
//   Overlord (1981 Apple II)。マップデータの著作権は元権利者に帰属。
// 抽出スクリプト: scripts/import-l1-from-sorcery.mjs
//
// 座標系:
//   - 画像/Sorcery: X 西→東 0..19、Y 南→北 0..19 (下が 0)
//   - TS (本実装): X 西→東 0..19、Y 北→南 0..19 (上が 0)
//   - 変換: 本実装 (x, y) ↔ Sorcery (x, 19 - y)
//
// 凡例マッピング (Grid Cartographer → 本実装):
//   - edge: 0=open, 1=wall, 2/3/5/12/33=door, 4/6/29=secretDoor, 7=wall (ONE_WAY)
//   - marker: 1=stairsUp, 2=stairsDown, 11=spinner, 4/5/7/21/50=teleport,
//             25/108=none (message/notice 効果なし)
//   - darkness: d="1" → special: darkness (markerが優先)
//
// 開始位置: (0, 19) 北向き。stairsUp は強制設定 (1981 原典では Castle 帰還用)。

import type { Cell, CellEdge, MazeLevel } from "./types";
import { MAZE_SIZE } from "./types";

const grid: Cell[][] = [
${grid
  .map(
    (row, y) =>
      `  // y=${y}\n  [\n${row
        .map((c, x) => `    ${tsCell(c)}, // (${x}, ${y})`)
        .join("\n")}\n  ],`,
  )
  .join("\n")}
];

const southBoundary: CellEdge[] = [
${southBoundary.map((e, x) => `  "${e}", // x=${x}`).join("\n")}
];

const eastBoundary: CellEdge[] = [
${eastBoundary.map((e, y) => `  "${e}", // y=${y}`).join("\n")}
];

export const MAZE_L1: MazeLevel = {
  grid,
  southBoundary,
  eastBoundary,
  startPosition: { x: 0, y: 19, dir: "n" },
};

// MAZE_SIZE constant referenced (suppresses unused-import warning if any)
void MAZE_SIZE;
`;

const outPath = "src/engine/data/maze/level1.ts";
writeFileSync(outPath, output);
console.log(`Wrote ${outPath}`);

// Stats
const counts = { stairsUp: 0, stairsDown: 0, darkness: 0, spinner: 0, teleport: 0, none: 0 };
for (const row of grid) {
  for (const c of row) {
    counts[c.special] = (counts[c.special] ?? 0) + 1;
  }
}
console.log("Special tile counts:", counts);
