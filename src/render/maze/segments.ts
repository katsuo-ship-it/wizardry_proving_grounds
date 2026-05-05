import { getCell, getEdge } from "@/engine/data/maze/lookup";
import type { MazeLevel } from "@/engine/data/maze/types";
import { turnLeft, turnRight } from "@/engine/rules/movement";
import type { MazePosition } from "@/engine/state/types";
import type { LineSegment } from "./types";
import { type Depth, type RelPos, worldFromView } from "./viewport";
import { WIREFRAME_TABLE } from "./wireframeTable";

/**
 * 視点 pos から見て (depth, rel) の位置にあるセルを描くために必要な線分を返す。
 * セルが範囲外なら空配列。
 */
export function selectSegments(
  level: MazeLevel,
  pos: MazePosition,
  depth: Depth,
  rel: RelPos,
): LineSegment[] {
  const w = worldFromView(pos, depth, rel);
  const cell = getCell(level, w.x, w.y);
  if (!cell) return [];

  const set = WIREFRAME_TABLE[depth][rel];
  const out: LineSegment[] = [];

  const front = pos.dir;
  const left = turnLeft(pos.dir);
  const right = turnRight(pos.dir);

  const frontEdge = getEdge(level, w.x, w.y, front);
  const leftEdge = getEdge(level, w.x, w.y, left);
  const rightEdge = getEdge(level, w.x, w.y, right);

  if (frontEdge === "wall") out.push(...set.frontWall);
  if (frontEdge === "door") out.push(...set.frontWall, ...set.frontDoor);
  if (frontEdge === "secretDoor") out.push(...set.frontWall);

  if (leftEdge === "wall") out.push(...set.leftWall);
  if (leftEdge === "door") out.push(...set.leftWall, ...set.leftDoor);
  if (leftEdge === "secretDoor") out.push(...set.leftWall);

  if (rightEdge === "wall") out.push(...set.rightWall);
  if (rightEdge === "door") out.push(...set.rightWall, ...set.rightDoor);
  if (rightEdge === "secretDoor") out.push(...set.rightWall);

  if (cell.special === "stairsUp") out.push(...set.stairsUp);
  if (cell.special === "stairsDown") out.push(...set.stairsDown);

  return out;
}
