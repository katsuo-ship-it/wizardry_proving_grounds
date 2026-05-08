// Reference: docs/reference/wiz1/data-tables/maze-l1.md
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
  // y=0
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (2, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (3, 0)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (4, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (5, 0)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (6, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (9, 0)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (10, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (11, 0)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (12, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (13, 0)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (14, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 0)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (16, 0)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (18, 0)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (19, 0)
  ],
  // y=1
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 1)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 1)
    { edges: { n: "door", w: "secretDoor" }, special: "none" }, // (2, 1)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 1)
    { edges: { n: "door", w: "open" }, special: "none" }, // (4, 1)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 1)
    { edges: { n: "open", w: "door" }, special: "none" }, // (6, 1)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 1)
    { edges: { n: "open", w: "open" }, special: "none" }, // (8, 1)
    { edges: { n: "wall", w: "wall" }, special: "darkness" }, // (9, 1)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 1)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 1)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 1)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (13, 1)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (14, 1)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 1)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 1)
    { edges: { n: "open", w: "open" }, special: "none" }, // (17, 1)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (18, 1)
    { edges: { n: "secretDoor", w: "open" }, special: "none" }, // (19, 1)
  ],
  // y=2
  [
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (0, 2)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (1, 2)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (2, 2)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 2)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (4, 2)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 2)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (6, 2)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 2)
    { edges: { n: "open", w: "open" }, special: "none" }, // (8, 2)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 2)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 2)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 2)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (12, 2)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (13, 2)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (14, 2)
    { edges: { n: "secretDoor", w: "open" }, special: "none" }, // (15, 2)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (16, 2)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 2)
    { edges: { n: "open", w: "door" }, special: "none" }, // (18, 2)
    { edges: { n: "open", w: "open" }, special: "none" }, // (19, 2)
  ],
  // y=3
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 3)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 3)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (4, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 3)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (7, 3)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (8, 3)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 3)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (10, 3)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 3)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 3)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 3)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (14, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 3)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (16, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 3)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (18, 3)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (19, 3)
  ],
  // y=4
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 4)
    { edges: { n: "open", w: "open" }, special: "none" }, // (1, 4)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 4)
    { edges: { n: "door", w: "door" }, special: "none" }, // (3, 4)
    { edges: { n: "open", w: "door" }, special: "none" }, // (4, 4)
    { edges: { n: "open", w: "open" }, special: "none" }, // (5, 4)
    { edges: { n: "open", w: "open" }, special: "none" }, // (6, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (7, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 4)
    { edges: { n: "wall", w: "wall" }, special: "darkness" }, // (9, 4)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 4)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 4)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (15, 4)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (16, 4)
    { edges: { n: "door", w: "open" }, special: "none" }, // (17, 4)
    { edges: { n: "open", w: "door" }, special: "none" }, // (18, 4)
    { edges: { n: "open", w: "open" }, special: "none" }, // (19, 4)
  ],
  // y=5
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 5)
    { edges: { n: "open", w: "open" }, special: "none" }, // (1, 5)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 5)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (3, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (4, 5)
    { edges: { n: "open", w: "open" }, special: "none" }, // (5, 5)
    { edges: { n: "open", w: "open" }, special: "none" }, // (6, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (7, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 5)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 5)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 5)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 5)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (16, 5)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 5)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (18, 5)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (19, 5)
  ],
  // y=6
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 6)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (1, 6)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 6)
    { edges: { n: "open", w: "open" }, special: "none" }, // (3, 6)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (4, 6)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (5, 6)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (6, 6)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 6)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 6)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 6)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 6)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (16, 6)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 6)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (18, 6)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (19, 6)
  ],
  // y=7
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 7)
    { edges: { n: "door", w: "open" }, special: "none" }, // (1, 7)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 7)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 7)
    { edges: { n: "open", w: "door" }, special: "none" }, // (5, 7)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (6, 7)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (9, 7)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (10, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 7)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (16, 7)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (17, 7)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (18, 7)
    { edges: { n: "open", w: "open" }, special: "none" }, // (19, 7)
  ],
  // y=8
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 8)
    { edges: { n: "open", w: "open" }, special: "none" }, // (1, 8)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 8)
    { edges: { n: "open", w: "open" }, special: "none" }, // (4, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (5, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (6, 8)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 8)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (8, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (9, 8)
    { edges: { n: "open", w: "open" }, special: "none" }, // (10, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 8)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (17, 8)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (18, 8)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (19, 8)
  ],
  // y=9
  [
    { edges: { n: "wall", w: "wall" }, special: "stairsDown" }, // (0, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 9)
    { edges: { n: "door", w: "open" }, special: "none" }, // (5, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 9)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 9)
    { edges: { n: "open", w: "open" }, special: "none" }, // (9, 9)
    { edges: { n: "open", w: "open" }, special: "none" }, // (10, 9)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 9)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (12, 9)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (13, 9)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (14, 9)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 9)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (16, 9)
    { edges: { n: "open", w: "secretDoor" }, special: "none" }, // (17, 9)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (18, 9)
    { edges: { n: "secretDoor", w: "open" }, special: "none" }, // (19, 9)
  ],
  // y=10
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 10)
    { edges: { n: "wall", w: "open" }, special: "teleport" }, // (5, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 10)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (9, 10)
    { edges: { n: "open", w: "open" }, special: "none" }, // (10, 10)
    { edges: { n: "door", w: "open" }, special: "none" }, // (11, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (12, 10)
    { edges: { n: "door", w: "open" }, special: "none" }, // (13, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (14, 10)
    { edges: { n: "door", w: "open" }, special: "none" }, // (15, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (16, 10)
    { edges: { n: "door", w: "open" }, special: "none" }, // (17, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (18, 10)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (19, 10)
  ],
  // y=11
  [
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (0, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 11)
    { edges: { n: "open", w: "door" }, special: "none" }, // (9, 11)
    { edges: { n: "wall", w: "wall" }, special: "teleport" }, // (10, 11)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (11, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (12, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (13, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (14, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (16, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 11)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (18, 11)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (19, 11)
  ],
  // y=12
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 12)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (1, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 12)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 12)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (4, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 12)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (6, 12)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (7, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 12)
    { edges: { n: "wall", w: "wall" }, special: "darkness" }, // (9, 12)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 12)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 12)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (12, 12)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (13, 12)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (14, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 12)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 12)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (17, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (18, 12)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (19, 12)
  ],
  // y=13
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 13)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (4, 13)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (5, 13)
    { edges: { n: "door", w: "open" }, special: "none" }, // (6, 13)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 13)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 13)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 13)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 13)
    { edges: { n: "door", w: "wall" }, special: "none" }, // (13, 13)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (14, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (15, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (17, 13)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (18, 13)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 13)
  ],
  // y=14
  [
    { edges: { n: "open", w: "wall" }, special: "teleport" }, // (0, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 14)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (4, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (5, 14)
    { edges: { n: "open", w: "open" }, special: "none" }, // (6, 14)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (8, 14)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 14)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 14)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 14)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (13, 14)
    { edges: { n: "door", w: "door" }, special: "none" }, // (14, 14)
    { edges: { n: "door", w: "open" }, special: "none" }, // (15, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (17, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (18, 14)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 14)
  ],
  // y=15
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 15)
    { edges: { n: "open", w: "open" }, special: "none" }, // (2, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (3, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (4, 15)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (5, 15)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 15)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 15)
    { edges: { n: "open", w: "open" }, special: "none" }, // (8, 15)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 15)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 15)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 15)
    { edges: { n: "wall", w: "wall" }, special: "teleport" }, // (13, 15)
    { edges: { n: "open", w: "door" }, special: "none" }, // (14, 15)
    { edges: { n: "open", w: "open" }, special: "teleport" }, // (15, 15)
    { edges: { n: "open", w: "secretDoor" }, special: "none" }, // (16, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (17, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (18, 15)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 15)
  ],
  // y=16
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 16)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (2, 16)
    { edges: { n: "door", w: "open" }, special: "none" }, // (3, 16)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (5, 16)
    { edges: { n: "open", w: "open" }, special: "none" }, // (6, 16)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 16)
    { edges: { n: "open", w: "open" }, special: "none" }, // (8, 16)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 16)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 16)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 16)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (13, 16)
    { edges: { n: "open", w: "door" }, special: "none" }, // (14, 16)
    { edges: { n: "open", w: "open" }, special: "none" }, // (15, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (16, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (17, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (18, 16)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 16)
  ],
  // y=17
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (2, 17)
    { edges: { n: "open", w: "open" }, special: "none" }, // (3, 17)
    { edges: { n: "open", w: "open" }, special: "none" }, // (4, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (5, 17)
    { edges: { n: "wall", w: "wall" }, special: "none" }, // (6, 17)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (7, 17)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 17)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 17)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 17)
    { edges: { n: "secretDoor", w: "wall" }, special: "none" }, // (12, 17)
    { edges: { n: "wall", w: "secretDoor" }, special: "none" }, // (13, 17)
    { edges: { n: "door", w: "secretDoor" }, special: "none" }, // (14, 17)
    { edges: { n: "door", w: "secretDoor" }, special: "none" }, // (15, 17)
    { edges: { n: "wall", w: "door" }, special: "none" }, // (16, 17)
    { edges: { n: "open", w: "open" }, special: "none" }, // (17, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (18, 17)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 17)
  ],
  // y=18
  [
    { edges: { n: "open", w: "wall" }, special: "none" }, // (0, 18)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (1, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 18)
    { edges: { n: "open", w: "open" }, special: "none" }, // (5, 18)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (6, 18)
    { edges: { n: "open", w: "open" }, special: "none" }, // (7, 18)
    { edges: { n: "open", w: "open" }, special: "none" }, // (8, 18)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 18)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 18)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (11, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (12, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (13, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (14, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (15, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (16, 18)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (17, 18)
    { edges: { n: "open", w: "open" }, special: "none" }, // (18, 18)
    { edges: { n: "open", w: "wall" }, special: "none" }, // (19, 18)
  ],
  // y=19
  [
    { edges: { n: "open", w: "wall" }, special: "stairsUp" }, // (0, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (1, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (2, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (3, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (4, 19)
    { edges: { n: "secretDoor", w: "open" }, special: "none" }, // (5, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (6, 19)
    { edges: { n: "door", w: "open" }, special: "none" }, // (7, 19)
    { edges: { n: "wall", w: "open" }, special: "none" }, // (8, 19)
    { edges: { n: "open", w: "wall" }, special: "darkness" }, // (9, 19)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (10, 19)
    { edges: { n: "wall", w: "door" }, special: "darkness" }, // (11, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (12, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (13, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (14, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (15, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (16, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (17, 19)
    { edges: { n: "wall", w: "open" }, special: "darkness" }, // (18, 19)
    { edges: { n: "open", w: "open" }, special: "darkness" }, // (19, 19)
  ],
];

const southBoundary: CellEdge[] = [
  "wall", // x=0
  "wall", // x=1
  "wall", // x=2
  "wall", // x=3
  "wall", // x=4
  "wall", // x=5
  "wall", // x=6
  "wall", // x=7
  "wall", // x=8
  "wall", // x=9
  "wall", // x=10
  "wall", // x=11
  "wall", // x=12
  "wall", // x=13
  "wall", // x=14
  "wall", // x=15
  "wall", // x=16
  "wall", // x=17
  "wall", // x=18
  "wall", // x=19
];

const eastBoundary: CellEdge[] = [
  "wall", // y=0
  "wall", // y=1
  "wall", // y=2
  "wall", // y=3
  "wall", // y=4
  "wall", // y=5
  "wall", // y=6
  "wall", // y=7
  "wall", // y=8
  "wall", // y=9
  "wall", // y=10
  "wall", // y=11
  "wall", // y=12
  "wall", // y=13
  "wall", // y=14
  "wall", // y=15
  "wall", // y=16
  "wall", // y=17
  "wall", // y=18
  "wall", // y=19
];

export const MAZE_L1: MazeLevel = {
  grid,
  southBoundary,
  eastBoundary,
  startPosition: { x: 0, y: 19, dir: "n" },
};

// MAZE_SIZE constant referenced (suppresses unused-import warning if any)
void MAZE_SIZE;
