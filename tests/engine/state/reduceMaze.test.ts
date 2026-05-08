import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

// 開始位置 (0, 19) 北向き — MAZE_L1.startPosition と一致
const startMaze: GameState = {
  phase: "maze",
  pos: { level: 1, x: 0, y: 19, dir: "n" },
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

  it("moveForward into a boundary wall is blocked (pos unchanged)", () => {
    // (0, 19) facing west → 西端境界なので必ず壁
    const facingWest: GameState = {
      ...startMaze,
      pos: { ...startMaze.pos, dir: "w" },
    };
    const next = reduce(facingWest, { type: "moveForward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual(facingWest.pos);
  });

  it("moveForward into a south boundary is blocked (pos unchanged)", () => {
    // (0, 19) facing south → 南端境界なので必ず壁
    const facingSouth: GameState = {
      ...startMaze,
      pos: { ...startMaze.pos, dir: "s" },
    };
    const next = reduce(facingSouth, { type: "moveForward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual(facingSouth.pos);
  });

  it("openCamp transitions to camp phase preserving pos", () => {
    const next = reduce(startMaze, { type: "openCamp" });
    expect(next.phase).toBe("camp");
    if (next.phase !== "camp") throw new Error("");
    expect(next.pos).toEqual(startMaze.pos);
  });

  it("ascendStairs on stairsUp cell → edgeOfTown", () => {
    // 開始位置 (0, 19) は MAZE_L1 で stairsUp (Castle 帰還用)
    const next = reduce(startMaze, { type: "ascendStairs" });
    expect(next).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "inTown" },
    });
  });

  it("ascendStairs on non-stairs cell does nothing", () => {
    // 起点を (1, 18) にして stairsUp ではない場所からの ascendStairs を確認
    // (実データ書き起こし後、(1,18) が stairsUp でないことを前提)
    const offStairs: GameState = {
      ...startMaze,
      pos: { level: 1, x: 1, y: 18, dir: "n" },
    };
    const next = reduce(offStairs, { type: "ascendStairs" });
    expect(next).toEqual(offStairs);
  });

  it("descendStairs is no-op in M4 (Chapter 4 で実装)", () => {
    const next = reduce(startMaze, { type: "descendStairs" });
    expect(next).toEqual(startMaze);
  });

  it("moveForward through open edge advances (north of start is open)", () => {
    // (0, 19) facing north → (0, 18) (Sorcery 経由データで open エッジ)
    const next = reduce(startMaze, { type: "moveForward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual({ level: 1, x: 0, y: 18, dir: "n" });
  });

  it("moveBackward goes opposite without turning", () => {
    // (0, 18) facing north → moveBackward で (0, 19) へ後退、向きは north のまま
    const at_0_18: GameState = {
      ...startMaze,
      pos: { level: 1, x: 0, y: 18, dir: "n" },
    };
    const next = reduce(at_0_18, { type: "moveBackward" });
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual({ level: 1, x: 0, y: 19, dir: "n" });
  });
});
