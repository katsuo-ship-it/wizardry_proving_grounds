import { MAZE_L1 } from "@/engine/data/maze/level1";
import { getEdge } from "@/engine/data/maze/lookup";
import { MAZE_SIZE } from "@/engine/data/maze/types";
import { describe, expect, it } from "vitest";

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

  it("(1,1) → south is open (connects to (1,2))", () => {
    expect(getEdge(MAZE_L1, 1, 1, "s")).toBe("open");
  });

  it("(2,1) → south is door (connects to (2,2))", () => {
    expect(getEdge(MAZE_L1, 2, 1, "s")).toBe("door");
  });

  it("(1,3) is the up-stair", () => {
    expect(MAZE_L1.grid[3]?.[1]?.special).toBe("stairsUp");
  });

  it("(0,0) is solid (north and west are walls)", () => {
    expect(getEdge(MAZE_L1, 0, 0, "n")).toBe("wall");
    expect(getEdge(MAZE_L1, 0, 0, "w")).toBe("wall");
  });
});
