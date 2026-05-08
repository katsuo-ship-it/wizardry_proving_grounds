import { MAZE_L1 } from "@/engine/data/maze/level1";
import { getEdge } from "@/engine/data/maze/lookup";
import { MAZE_SIZE } from "@/engine/data/maze/types";
import type { Direction } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

// 書き起こし完了時 (Sorcery インポータ実行後) の実測値
const EXPECTED_DARKNESS_COUNT = 38;
const EXPECTED_SPINNER_COUNT = 0;
const EXPECTED_TELEPORT_COUNT = 5;
const EXPECTED_STAIRS_DOWN_COUNT = 1;

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

function bfsReachable(sx: number, sy: number): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[sx, sy]];
  visited.add(`${sx},${sy}`);
  while (queue.length > 0) {
    const [x, y] = queue.shift() ?? [0, 0];
    for (const dir of DIRS) {
      if (!isPassable(getEdge(MAZE_L1, x, y, dir))) continue;
      const dxy = DXY[dir];
      const nx = x + dxy[0];
      const ny = y + dxy[1];
      if (nx < 0 || nx >= MAZE_SIZE || ny < 0 || ny >= MAZE_SIZE) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push([nx, ny]);
    }
  }
  return visited;
}

describe("MAZE_L1 reachability", () => {
  // 注: 1981 原典の L1 では Warp 1↔1' を経由しないと下り階段に到達できない
  // (探索デザインの一部)。BFS は teleport を辿らないので、ここでは
  // 「直接歩行で大半のセルに到達可能 (= マップが完全に分断されていない)」
  // を弱めの整合性チェックとして実施する。
  it("startPosition can reach at least 100 cells via direct walking (no teleport)", () => {
    const { x, y } = MAZE_L1.startPosition;
    const reachable = bfsReachable(x, y);
    expect(reachable.size).toBeGreaterThanOrEqual(100);
  });
});

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
