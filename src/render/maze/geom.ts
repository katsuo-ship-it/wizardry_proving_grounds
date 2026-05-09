import { getEdge } from "@/engine/data/maze/lookup";
import type { MazeLevel } from "@/engine/data/maze/types";
import { BufferGeometry, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const WALL_HEIGHT = 1;

// --- Merge helper ---

function mergeOrEmpty(planes: PlaneGeometry[]): BufferGeometry {
  if (planes.length === 0) return new BufferGeometry();
  const merged = mergeGeometries(planes, false);
  for (const p of planes) p.dispose();
  return merged;
}

// --- Wall helpers ---

function makeNorthWall(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, WALL_HEIGHT);
  g.translate(x + 0.5, WALL_HEIGHT / 2, y);
  return g;
}

function makeWestWall(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, WALL_HEIGHT);
  g.rotateY(Math.PI / 2);
  g.translate(x, WALL_HEIGHT / 2, y + 0.5);
  return g;
}

/**
 * Builds a merged BufferGeometry for all wall planes.
 * Emits one PlaneGeometry(1, 1) per wall/door/secretDoor edge.
 * Doors are also included as walls; use buildDoorGeometry for the door overlay.
 */
export function buildWallGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  const ySize = level.grid.length;
  for (let y = 0; y < ySize; y++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
    const row = level.grid[y]!;
    const xSize = row.length;
    for (let x = 0; x < xSize; x++) {
      const n = getEdge(level, x, y, "n");
      if (n !== "open") planes.push(makeNorthWall(x, y));
      const w = getEdge(level, x, y, "w");
      if (w !== "open") planes.push(makeWestWall(x, y));
      if (y === ySize - 1) {
        const s = getEdge(level, x, y, "s");
        if (s !== "open") planes.push(makeNorthWall(x, y + 1));
      }
      if (x === xSize - 1) {
        const e = getEdge(level, x, y, "e");
        if (e !== "open") planes.push(makeWestWall(x + 1, y));
      }
    }
  }
  return mergeOrEmpty(planes);
}

// --- Floor helpers ---

function makeFloor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2); // horizontal, normal pointing +y
  g.translate(x + 0.5, 0, y + 0.5);
  return g;
}

/**
 * Builds a merged BufferGeometry for all floor planes.
 * Emits one PlaneGeometry(1, 1) per cell, at y = 0, facing up.
 */
export function buildFloorGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
    const row = level.grid[y]!;
    for (let x = 0; x < row.length; x++) {
      planes.push(makeFloor(x, y));
    }
  }
  return mergeOrEmpty(planes);
}

// --- Ceiling helpers ---

function makeCeiling(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(1, 1);
  g.rotateX(Math.PI / 2); // horizontal, normal pointing -y (down)
  g.translate(x + 0.5, WALL_HEIGHT, y + 0.5);
  return g;
}

/**
 * Builds a merged BufferGeometry for all ceiling planes.
 * Emits one PlaneGeometry(1, 1) per cell, at y = WALL_HEIGHT, facing down.
 */
export function buildCeilingGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
    const row = level.grid[y]!;
    for (let x = 0; x < row.length; x++) {
      planes.push(makeCeiling(x, y));
    }
  }
  return mergeOrEmpty(planes);
}

// --- Door helpers ---

function makeNorthDoor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(0.6, 0.7);
  g.translate(x + 0.5, 0.35, y + 0.01);
  return g;
}

function makeWestDoor(x: number, y: number): PlaneGeometry {
  const g = new PlaneGeometry(0.6, 0.7);
  g.rotateY(Math.PI / 2);
  g.translate(x + 0.01, 0.35, y + 0.5);
  return g;
}

/**
 * Builds a merged BufferGeometry for door overlay planes.
 * Emits one PlaneGeometry(0.6, 0.7) per door edge, slightly offset to avoid Z-fighting.
 */
export function buildDoorGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  const ySize = level.grid.length;
  for (let y = 0; y < ySize; y++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
    const row = level.grid[y]!;
    const xSize = row.length;
    for (let x = 0; x < xSize; x++) {
      if (getEdge(level, x, y, "n") === "door") planes.push(makeNorthDoor(x, y));
      if (getEdge(level, x, y, "w") === "door") planes.push(makeWestDoor(x, y));
      if (y === ySize - 1 && getEdge(level, x, y, "s") === "door") {
        planes.push(makeNorthDoor(x, y + 1));
      }
      if (x === xSize - 1 && getEdge(level, x, y, "e") === "door") {
        planes.push(makeWestDoor(x + 1, y));
      }
    }
  }
  return mergeOrEmpty(planes);
}

// --- Stairs helpers ---

/**
 * Builds a merged BufferGeometry for staircase marker planes.
 * Emits one PlaneGeometry(0.6, 0.6) per stairsUp/stairsDown cell,
 * on the floor at y = 0.01 to avoid Z-fighting, facing up.
 */
export function buildStairsGeometry(level: MazeLevel): BufferGeometry {
  const planes: PlaneGeometry[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
    const row = level.grid[y]!;
    for (let x = 0; x < row.length; x++) {
      // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee defined
      const cell = row[x]!;
      if (cell.special === "stairsUp" || cell.special === "stairsDown") {
        const g = new PlaneGeometry(0.6, 0.6);
        g.rotateX(-Math.PI / 2);
        g.translate(x + 0.5, 0.01, y + 0.5);
        planes.push(g);
      }
    }
  }
  return mergeOrEmpty(planes);
}
