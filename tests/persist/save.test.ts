import { EMPTY_PARTY, type Character, type GameState } from "@/engine/state/types";
import { db, resetDbInstance } from "@/persist/db";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

const sampleChar = (slotId: number, name: string): Omit<Character, "id"> => ({
  slotId,
  name,
  race: "human",
  class: "fighter",
  alignment: "good",
  attributes: { str: 10, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 },
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

describe("save/load atomic", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("creates a new save slot and loads it back", async () => {
    const charId = await db.addCharacter(sampleChar(1, "Aragorn"));
    const c = await db.getCharacter(charId);
    if (!c) throw new Error("char missing");

    const state: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, members: [charId, null, null, null, null, null] },
    };
    const slotId = await db.saveStateAtomic({
      slotId: undefined,
      name: "Slot1",
      state,
      changedCharacters: [c],
    });

    const loaded = await db.loadStateAtomic(slotId);
    expect(loaded.state).toEqual(state);
    expect(loaded.characters).toHaveLength(1);
    expect(loaded.characters[0]?.name).toBe("Aragorn");
  });

  it("listSlots returns slots ordered by updatedAt desc", async () => {
    await db.saveStateAtomic({
      slotId: undefined,
      name: "First",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Second",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    const slots = await db.listSlots();
    expect(slots).toHaveLength(2);
    expect(slots[0]?.name).toBe("Second");
  });

  it("deleteSlot removes the slot and its characters", async () => {
    const charId = await db.addCharacter(sampleChar(0, "Test"));
    const ch = await db.getCharacter(charId);
    if (!ch) throw new Error();
    const slotId = await db.saveStateAtomic({
      slotId: undefined,
      name: "ToDelete",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    // character の slotId を実 slotId に更新
    await db.updateCharacter({ ...ch, slotId });

    await db.deleteSlot(slotId);
    expect(await db.listSlots()).toHaveLength(0);
    expect(await db.listCharacters(slotId)).toHaveLength(0);
  });

  it("exportAll → importAll round-trips data", async () => {
    await db.addCharacter(sampleChar(1, "A"));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Backup",
      state: { phase: "title", sub: { kind: "main" } },
      changedCharacters: [],
    });
    const blob = await db.exportAll();
    expect(blob.type).toBe("application/json");

    // 全消去後に import
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    resetDbInstance();
    await db.init();
    expect(await db.listSlots()).toHaveLength(0);

    await db.importAll(blob, "replace");
    expect(await db.listSlots()).toHaveLength(1);
    expect(await db.listCharacters(1)).toHaveLength(1);
  });
});
