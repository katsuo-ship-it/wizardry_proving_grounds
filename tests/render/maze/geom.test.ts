import {
  buildCeilingGeometry,
  buildDoorGeometry,
  buildFloorGeometry,
  buildStairsGeometry,
  buildWallGeometry,
} from "@/render/maze/geom";
import { describe, expect, it } from "vitest";
import { makeMiniLevel } from "./fixtures";

describe("buildWallGeometry", () => {
  it("emits 4 outer walls per side + 1 door wall = 17 planes for the 4x4 mini level", () => {
    // 4x4 mini: 北 4 + 南 4 + 西 4 + 東 4 = 16 outer + 1 internal door = 17 planes.
    // 1 plane = 4 vertices, 6 indices.
    const geo = buildWallGeometry(makeMiniLevel());
    const positionAttr = geo.getAttribute("position");
    expect(positionAttr.count).toBe(17 * 4);
    expect(geo.index?.count).toBe(17 * 6);
  });
});

describe("buildFloorGeometry", () => {
  it("emits 1 plane per cell (16 for 4x4 mini)", () => {
    const geo = buildFloorGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(16 * 4);
  });
});

describe("buildCeilingGeometry", () => {
  it("emits 1 plane per cell (16 for 4x4 mini)", () => {
    const geo = buildCeilingGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(16 * 4);
  });
});

describe("buildDoorGeometry", () => {
  it("emits 1 plane for the mini level (1 door at (2,1).w)", () => {
    const geo = buildDoorGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(1 * 4);
  });
});

describe("buildStairsGeometry", () => {
  it("emits 1 plane for the mini level (1 stairsUp at (2,2))", () => {
    const geo = buildStairsGeometry(makeMiniLevel());
    expect(geo.getAttribute("position").count).toBe(1 * 4);
  });
});
