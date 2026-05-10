import type { MazeLevel } from "@/engine/data/maze/types";
import {
  AmbientLight,
  DirectionalLight,
  EdgesGeometry,
  Fog,
  LineSegments,
  Mesh,
  Scene,
} from "three";
import {
  buildCeilingGeometry,
  buildDoorGeometry,
  buildFloorGeometry,
  buildStairsGeometry,
  buildWallGeometry,
  isEmptyGeometry,
} from "./geom";
import {
  ceilingMaterial,
  createStairsMaterial,
  doorMaterial,
  edgeMaterial,
  floorMaterial,
  wallMaterial,
} from "./materials";
import { makeStairsTexture } from "./overlay";

export function buildScene(level: MazeLevel): Scene {
  const scene = new Scene();
  scene.fog = new Fog(0x000000, 3.0, 8.0);

  scene.add(new AmbientLight(0x404060, 0.7));
  const dir = new DirectionalLight(0xa0a0c0, 0.8);
  dir.position.set(0.5, 2, 0.5);
  scene.add(dir);

  const wallGeo = buildWallGeometry(level);
  const wallMesh = new Mesh(wallGeo, wallMaterial);
  wallMesh.name = "walls";
  scene.add(wallMesh);

  // 壁の白フレーム輪郭線 (視認性向上、Apple II 原典の wireframe 感も少し戻す)
  const wallEdges = new LineSegments(new EdgesGeometry(wallGeo), edgeMaterial);
  wallEdges.name = "wallEdges";
  scene.add(wallEdges);

  const floorMesh = new Mesh(buildFloorGeometry(level), floorMaterial);
  floorMesh.name = "floor";
  scene.add(floorMesh);

  const ceilMesh = new Mesh(buildCeilingGeometry(level), ceilingMaterial);
  ceilMesh.name = "ceiling";
  scene.add(ceilMesh);

  const doorGeo = buildDoorGeometry(level);
  if (!isEmptyGeometry(doorGeo)) {
    const doorMesh = new Mesh(doorGeo, doorMaterial);
    doorMesh.name = "doors";
    scene.add(doorMesh);
    // 扉も同じく輪郭線
    const doorEdges = new LineSegments(new EdgesGeometry(doorGeo), edgeMaterial);
    doorEdges.name = "doorEdges";
    scene.add(doorEdges);
  }

  const stairsGeo = buildStairsGeometry(level);
  if (!isEmptyGeometry(stairsGeo)) {
    // 上り/下り の区別は MVP では up texture 統一 (将来 polish 時に分割検討)
    const stairsMesh = new Mesh(stairsGeo, createStairsMaterial(makeStairsTexture("up")));
    stairsMesh.name = "stairs";
    scene.add(stairsMesh);
  }

  return scene;
}
