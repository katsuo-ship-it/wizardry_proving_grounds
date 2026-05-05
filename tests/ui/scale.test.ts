import { computeScale } from "@/ui/scale";
import { describe, expect, it } from "vitest";

describe("computeScale", () => {
  it.each([
    [1920, 1080, 5],
    [1280, 720, 3],
    [800, 600, 2],
    [560, 384, 2],
    [280, 192, 1],
    [200, 100, 1],
  ])("computeScale(%i, %i) === %i", (w, h, expected) => {
    expect(computeScale(w, h)).toBe(expected);
  });
});
