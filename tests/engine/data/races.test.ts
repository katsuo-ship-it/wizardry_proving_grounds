import { RACES, RACE_IDS } from "@/engine/data/races";
import { describe, expect, it } from "vitest";

describe("RACES", () => {
  it("has 5 races", () => {
    expect(RACE_IDS).toHaveLength(5);
  });

  it.each(RACE_IDS)("%s base attributes are valid 1..18", (id) => {
    const base = RACES[id].base;
    for (const v of Object.values(base)) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(18);
    }
  });
});
