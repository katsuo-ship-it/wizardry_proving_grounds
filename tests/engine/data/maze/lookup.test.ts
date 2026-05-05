import { getCell, getEdge } from "@/engine/data/maze/lookup";
import type { MazeLevel } from "@/engine/data/maze/types";
import { describe, expect, it } from "vitest";

const tinyMaze: MazeLevel = {
  grid: [
    [
      { edges: { n: "wall", w: "wall" }, special: "none" },
      { edges: { n: "wall", w: "open" }, special: "none" },
    ],
    [
      { edges: { n: "open", w: "wall" }, special: "none" },
      { edges: { n: "wall", w: "open" }, special: "none" },
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

  it("getEdge south at y=1 (south end) uses southBoundary", () => {
    expect(getEdge(tinyMaze, 0, 1, "s")).toBe("wall");
  });

  it("getEdge east at x=1 (east end) uses eastBoundary", () => {
    expect(getEdge(tinyMaze, 1, 0, "e")).toBe("wall");
  });
});
