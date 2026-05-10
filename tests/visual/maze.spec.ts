/**
 * Playwright visual regression tests — 8 viewpoints × 4 directions = 32 screenshots.
 *
 * BASELINE POLICY: Baselines must be generated on Linux (ubuntu-latest).
 * Windows baselines differ due to font rendering / sub-pixel anti-aliasing.
 * To regenerate on CI: push a commit and let `pnpm test:visual:update` run,
 * OR run `pnpm test:visual:update` inside a Linux container / WSL.
 *
 * Viewpoint coordinates chosen from MAZE_L1 (src/engine/data/maze/level1.ts):
 *
 *   start       (0, 19) — startPosition; stairsUp; open corridor ahead (n=open)
 *   corridor-door (7, 19) — n=door: door directly ahead in corridor; tests door rendering
 *   t-junction  (2, 13) — n=open, w=open, s=open, e=wall: 3-way junction; good depth test
 *   open-area   (7, 1)  — all 4 edges open: widest view, tests far-clip and fog
 *   stairs-down (0, 9)  — special=stairsDown: visually distinct from stairsUp
 *   dead-end    (0, 0)  — n=wall, w=wall, s=wall, e=open: only east is open; claustrophobic
 *   door-wall-mix (6,1) — n=open, w=door, e=open, s=open: door on side wall; tests the
 *                          old bug where wall-boundary rendering broke at door cells
 *   darkness    (9, 1)  — special=darkness: renderer should output a pitch-black scene
 */

import { expect, test } from "@playwright/test";

const VIEWPOINTS = [
  {
    name: "start",
    x: 0,
    y: 19,
    // startPosition; stairsUp special; open corridor to the north
  },
  {
    name: "corridor-door",
    x: 7,
    y: 19,
    // n=door: door directly ahead; tests door geometry and material rendering
  },
  {
    name: "t-junction",
    x: 2,
    y: 13,
    // n=open, w=open, s=open, e=wall: 3-way T-junction; exercises depth/fog on long vistas
  },
  {
    name: "open-area",
    x: 7,
    y: 1,
    // all 4 edges open: tests maximum view distance, fog fade, and ceiling/floor on wide scene
  },
  {
    name: "stairs-down",
    x: 0,
    y: 9,
    // special=stairsDown: distinct overlay geometry; confirms staircase arrow renders
  },
  {
    name: "dead-end",
    x: 0,
    y: 0,
    // n=wall, w=wall, s=wall, e=open: only east exit; tests closed-corridor feel
  },
  {
    name: "door-wall-mix",
    x: 6,
    y: 1,
    // n=open, w=door, e=open, s=open: door on west side wall;
    // exercises the previous wireframe-render bug where edges at door cells were dropped
  },
  {
    name: "darkness",
    x: 9,
    y: 1,
    // special=darkness: renderer outputs pitch-black scene; confirms darkness path
  },
] as const;

const DIRS = ["n", "e", "s", "w"] as const;

for (const v of VIEWPOINTS) {
  for (const dir of DIRS) {
    test(`maze view ${v.name} ${dir}`, async ({ page }) => {
      await page.goto("/");

      // Force enter maze phase at the test viewpoint via the DEV-only debug API
      // registered in src/store/gameStore.ts when import.meta.env.DEV is true.
      await page.evaluate(
        ({ x, y, d }) => {
          // @ts-expect-error window.__wpgDev typing
          window.__wpgDev.devEnterMazeAt({ level: 1, x, y, dir: d });
        },
        { x: v.x, y: v.y, d: dir },
      );

      // Wait for MazeViewInner to mount and register isMazeAnimating on __wpgDev.
      // This happens inside the [] useEffect in MazeView.tsx after view.render().
      await page.waitForFunction(() => {
        // @ts-expect-error
        return typeof window.__wpgDev?.isMazeAnimating === "function";
      });

      // Wait for any initial camera animation to complete (isAnimating → false).
      await page.waitForFunction(
        () => {
          // @ts-expect-error
          return window.__wpgDev.isMazeAnimating() === false;
        },
        undefined,
        { timeout: 5000 },
      );

      // Two-frame RAF wait: rafId starts at 0 so isMazeAnimating is false before the
      // first RAF tick fires. On slow CI runners this could capture a partial frame
      // where texture uploads / shader compiles haven't flushed yet.
      // First RAF lets the browser process pending GL work; second lets it composite.
      await page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );

      const canvas = page.locator(".maze-canvas");
      await expect(canvas).toHaveScreenshot(`${v.name}-${dir}.png`);
    });
  }
}
