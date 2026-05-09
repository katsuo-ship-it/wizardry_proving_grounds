import { DoubleSide, MeshLambertMaterial } from "three";
import type { CanvasTexture } from "three";

export const wallMaterial = new MeshLambertMaterial({ color: 0x808080, side: DoubleSide });
export const floorMaterial = new MeshLambertMaterial({ color: 0x303030 });
export const ceilingMaterial = new MeshLambertMaterial({ color: 0x202020 });
export const doorMaterial = new MeshLambertMaterial({ color: 0x603020, side: DoubleSide });

/** 階段マテリアルは map (CanvasTexture) を後から差し込む */
export function createStairsMaterial(map: CanvasTexture): MeshLambertMaterial {
  return new MeshLambertMaterial({ color: 0xa0a060, map, transparent: true });
}
