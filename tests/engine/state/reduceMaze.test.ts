import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

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
    // (2,1) の west は (1,1) と open でつながっているので後退可能
    expect(next.pos).toEqual({ level: 1, x: 1, y: 1, dir: "e" });
  });

  it("openCamp transitions to camp phase preserving pos", () => {
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

  it("descendStairs is no-op in M4 (Chapter 4 で実装)", () => {
    const next = reduce(startMaze, { type: "descendStairs" });
    expect(next).toEqual(startMaze);
  });
});
