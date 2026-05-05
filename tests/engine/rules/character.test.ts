import { RACES } from "@/engine/data/races";
import { mulberry32 } from "@/engine/rng/mulberry32";
import {
  applyBonus,
  eligibleClasses,
  makeCharacterFromDraft,
  rollBonus,
  startDraft,
} from "@/engine/rules/character";
import { describe, expect, it } from "vitest";

describe("rollBonus", () => {
  it("returns at least 5 with seeded RNG", () => {
    const rng = mulberry32(42);
    const v = rollBonus(rng);
    expect(v).toBeGreaterThanOrEqual(5);
    expect(v).toBeLessThanOrEqual(35);
  });

  it("is deterministic for a given seed", () => {
    const a = rollBonus(mulberry32(7));
    const b = rollBonus(mulberry32(7));
    expect(a).toBe(b);
  });
});

describe("startDraft", () => {
  it("initializes attributes from race base + bonus", () => {
    const rng = mulberry32(1);
    const draft = startDraft({ name: "Test", race: "human", alignment: "good" }, rng);
    expect(draft.baseAttributes).toEqual(RACES.human.base);
    expect(draft.attributes).toEqual(RACES.human.base);
    expect(draft.bonusPointsRemaining).toBeGreaterThanOrEqual(5);
  });
});

describe("applyBonus", () => {
  const baseDraft = {
    name: "Test",
    race: "human" as const,
    alignment: "good" as const,
    baseAttributes: { ...RACES.human.base },
    attributes: { ...RACES.human.base },
    bonusPointsRemaining: 10,
    selectedClass: null,
  };

  it("+1 increases attribute, decrements remaining", () => {
    const next = applyBonus(baseDraft, "str", 1);
    expect(next.attributes.str).toBe(baseDraft.attributes.str + 1);
    expect(next.bonusPointsRemaining).toBe(9);
  });

  it("-1 cannot go below race base", () => {
    const draft = { ...baseDraft, attributes: { ...baseDraft.baseAttributes } };
    const next = applyBonus(draft, "str", -1);
    expect(next.attributes.str).toBe(draft.baseAttributes.str);
    expect(next.bonusPointsRemaining).toBe(draft.bonusPointsRemaining);
  });

  it("+1 cannot exceed 18", () => {
    const draft = { ...baseDraft, attributes: { ...baseDraft.attributes, str: 18 } };
    const next = applyBonus(draft, "str", 1);
    expect(next.attributes.str).toBe(18);
    expect(next.bonusPointsRemaining).toBe(draft.bonusPointsRemaining);
  });

  it("+1 with no bonus remaining is rejected", () => {
    const draft = { ...baseDraft, bonusPointsRemaining: 0 };
    const next = applyBonus(draft, "str", 1);
    expect(next).toBe(draft);
  });
});

describe("eligibleClasses", () => {
  it("returns Fighter for STR 11+ with any alignment", () => {
    const list = eligibleClasses({ str: 11, iq: 8, pie: 8, vit: 8, agi: 8, luk: 8 }, "good");
    expect(list).toContain("fighter");
    expect(list).not.toContain("ninja");
  });

  it("returns Ninja only when all 17+ and evil", () => {
    const max = { str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 };
    expect(eligibleClasses(max, "evil")).toContain("ninja");
    expect(eligibleClasses(max, "good")).not.toContain("ninja");
  });

  it("excludes Priest for neutral alignment", () => {
    const stats = { str: 8, iq: 8, pie: 11, vit: 8, agi: 8, luk: 8 };
    expect(eligibleClasses(stats, "neutral")).not.toContain("priest");
    expect(eligibleClasses(stats, "good")).toContain("priest");
  });

  it("excludes Lord when alignment is not good", () => {
    const high = { str: 15, iq: 12, pie: 12, vit: 15, agi: 14, luk: 15 };
    expect(eligibleClasses(high, "good")).toContain("lord");
    expect(eligibleClasses(high, "neutral")).not.toContain("lord");
    expect(eligibleClasses(high, "evil")).not.toContain("lord");
  });
});

describe("makeCharacterFromDraft", () => {
  it("converts a confirmed draft into a full Character", () => {
    const draft = {
      name: "Aragorn",
      race: "human" as const,
      alignment: "good" as const,
      baseAttributes: RACES.human.base,
      attributes: { str: 15, iq: 8, pie: 8, vit: 12, agi: 10, luk: 9 },
      bonusPointsRemaining: 0,
      selectedClass: "fighter" as const,
    };
    const c = makeCharacterFromDraft(draft, 1, 1700000000000);
    expect(c.name).toBe("Aragorn");
    expect(c.race).toBe("human");
    expect(c.class).toBe("fighter");
    expect(c.alignment).toBe("good");
    expect(c.attributes).toEqual(draft.attributes);
    expect(c.slotId).toBe(1);
    expect(c.status.level).toBe(1);
    expect(c.status.hp).toBeGreaterThan(0);
    expect(c.status.hpMax).toBe(c.status.hp);
    expect(c.status.age).toBe(18);
    expect(c.statusFlag).toBe("ok");
    expect(c.inventory).toEqual([]);
    expect(c.createdAt).toBe(1700000000000);
  });

  it("throws when selectedClass is null", () => {
    const draft = {
      name: "X",
      race: "human" as const,
      alignment: "good" as const,
      baseAttributes: RACES.human.base,
      attributes: { ...RACES.human.base },
      bonusPointsRemaining: 0,
      selectedClass: null,
    };
    expect(() => makeCharacterFromDraft(draft, 1, 0)).toThrow();
  });
});
