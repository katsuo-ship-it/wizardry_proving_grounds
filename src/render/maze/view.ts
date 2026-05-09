import type { MazeLevel } from "@/engine/data/maze/types";
import { Mesh, PerspectiveCamera, type Texture, Vector3, WebGLRenderer } from "three";
import { buildScene } from "./scene";
import type { CameraTarget } from "./types";

export interface ViewHandle {
  setTarget(target: CameraTarget): void;
  render(): void;
  dispose(): void;
}

export function mountView(canvas: HTMLCanvasElement, level: MazeLevel): ViewHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x000000);

  const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.05, 10);
  const scene = buildScene(level);

  function setTarget(target: CameraTarget): void {
    camera.position.set(target.pos.x, 0.5, target.pos.y);
    const lookAtX = target.pos.x + Math.sin(target.yaw);
    const lookAtZ = target.pos.y - Math.cos(target.yaw); // yaw=0 (北) → -z
    camera.lookAt(new Vector3(lookAtX, 0.5, lookAtZ));
  }

  function render(): void {
    renderer.render(scene, camera);
  }

  function dispose(): void {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        // Geometry is per-mount (merged via mergeGeometries), always dispose.
        obj.geometry.dispose();

        // Material: wall/floor/ceiling/door are module-level singletons — do NOT dispose.
        // Only the stairs material is per-mount (created via createStairsMaterial).
        if (obj.name === "stairs") {
          const m = obj.material;
          if (Array.isArray(m)) {
            for (const mm of m) {
              // M-2: dispose the CanvasTexture (.map) explicitly; material.dispose() does not do it.
              const meshMap = (mm as { map: Texture | null }).map;
              if (meshMap) meshMap.dispose();
              mm.dispose();
            }
          } else {
            // M-2: dispose the CanvasTexture (.map) explicitly.
            const meshMap = (m as { map: Texture | null }).map;
            if (meshMap) meshMap.dispose();
            m.dispose();
          }
        }
      }
    });
    renderer.dispose();
  }

  return { setTarget, render, dispose };
}
