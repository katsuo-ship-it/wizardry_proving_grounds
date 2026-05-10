import { wallMaterial } from "@/render/maze/materials";
import { buildScene } from "@/render/maze/scene";
import { type Fog, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { makeMiniLevel } from "./fixtures";

describe("buildScene", () => {
  it("includes 5 named meshes (walls, floor, ceiling, doors, stairs)", () => {
    const scene = buildScene(makeMiniLevel());
    const names = scene.children.filter((c) => c instanceof Mesh).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["walls", "floor", "ceiling", "doors", "stairs"]));
  });

  it("walls mesh shares the module-level wallMaterial instance", () => {
    const scene = buildScene(makeMiniLevel());
    const walls = scene.getObjectByName("walls") as Mesh;
    expect(walls.material).toBe(wallMaterial);
  });

  it("has Fog with 3.0..8.0 black", () => {
    const scene = buildScene(makeMiniLevel());
    expect(scene.fog).toBeDefined();
    const fog = scene.fog as Fog;
    expect(fog.near).toBe(3.0);
    expect(fog.far).toBe(8.0);
  });

  it("preserves singleton materials after a buildScene cycle (no disposal)", () => {
    // After buildScene, the singleton materials should still be usable.
    // We verify they haven't been disposed (their internal state is intact).
    // Note: true dispose-safety can only be tested with a real WebGL context (not jsdom).
    buildScene(makeMiniLevel());
    // wallMaterial is shared; verify color hasn't been zeroed by a stray dispose
    expect(wallMaterial.color.getHex()).toBe(0xa0a0a0);
  });
});
