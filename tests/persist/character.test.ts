import type { Character } from "@/engine/state/types";
import { db, resetDbInstance } from "@/persist/db";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

const sample = (slotId = 1): Omit<Character, "id"> => ({
  slotId,
  name: "Conan",
  race: "human",
  class: "fighter",
  alignment: "good",
  attributes: { str: 14, iq: 8, pie: 8, vit: 12, agi: 10, luk: 9 },
  status: {
    hp: 10,
    hpMax: 10,
    mp: { mage: 0, priest: 0 },
    mpMax: { mage: 0, priest: 0 },
    level: 1,
    exp: 0,
    gold: 100,
    ac: 10,
    age: 18,
    restCount: 0,
  },
  inventory: [],
  statusFlag: "ok",
  createdAt: Date.now(),
});

describe("db character API", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("adds and retrieves a character", async () => {
    const id = await db.addCharacter(sample());
    const c = await db.getCharacter(id);
    expect(c?.name).toBe("Conan");
    expect(c?.id).toBe(id);
  });

  it("lists characters by slotId", async () => {
    await db.addCharacter(sample(1));
    await db.addCharacter(sample(1));
    await db.addCharacter(sample(2));
    const list1 = await db.listCharacters(1);
    const list2 = await db.listCharacters(2);
    expect(list1).toHaveLength(2);
    expect(list2).toHaveLength(1);
  });

  it("updates an existing character", async () => {
    const id = await db.addCharacter(sample());
    const before = await db.getCharacter(id);
    if (!before) throw new Error("missing");
    await db.updateCharacter({ ...before, name: "Aragorn" });
    const after = await db.getCharacter(id);
    expect(after?.name).toBe("Aragorn");
  });

  it("deletes a character", async () => {
    const id = await db.addCharacter(sample());
    await db.deleteCharacter(id);
    expect(await db.getCharacter(id)).toBeUndefined();
  });
});
