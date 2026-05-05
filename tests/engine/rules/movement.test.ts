import { MAZE_L1 } from "@/engine/data/maze/level1";
import {
  advance,
  canMoveForward,
  canPassEdge,
  reverse,
  turnLeft,
  turnRight,
} from "@/engine/rules/movement";
import type { MazePosition } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

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
