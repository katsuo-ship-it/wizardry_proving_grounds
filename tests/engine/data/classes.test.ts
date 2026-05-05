import { CLASSES, CLASS_IDS } from "@/engine/data/classes";
import { describe, expect, it } from "vitest";

describe("CLASSES", () => {
  it("has 8 classes", () => {
    expect(CLASS_IDS).toHaveLength(8);
  });

  it.each(CLASS_IDS)("%s has alignments and minStats", (id) => {
    const k = CLASSES[id];
    expect(k.alignments.length).toBeGreaterThan(0);
    expect(Object.keys(k.minStats).length).toBeGreaterThan(0);
  });

  it("ninja requires 17 in all stats and evil alignment", () => {
    const n = CLASSES.ninja;
    expect(n.minStats).toEqual({ str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 });
    expect(n.alignments).toEqual(["evil"]);
  });
});
