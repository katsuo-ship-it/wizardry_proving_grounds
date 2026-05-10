import { type Character, EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { db, openWizardryDB, resetDbInstance } from "@/persist/db";
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
    expect(slots.every((s) => s.partyStatus === "inTown")).toBe(true);
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

describe("listSlots party status extraction", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("includes partyStatus + outAtPosition extracted from gameState", async () => {
    // 3 つのスロットを作成: inTown / inMaze / out
    const stateInTown: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "inTown" },
    };
    const stateInMaze: GameState = {
      phase: "maze",
      pos: { level: 1, x: 0, y: 19, dir: "n" },
      party: { ...EMPTY_PARTY, status: "inMaze" },
    };
    const outPos = { level: 1, x: 5, y: 10, dir: "e" } as const;
    const stateOut: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, status: "out", outAtPosition: outPos },
    };

    await db.saveStateAtomic({
      slotId: undefined,
      name: "Town",
      state: stateInTown,
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Maze",
      state: stateInMaze,
      changedCharacters: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Out",
      state: stateOut,
      changedCharacters: [],
    });

    const slots = await db.listSlots();
    expect(slots).toHaveLength(3);

    const out = slots.find((s) => s.name === "Out");
    const maze = slots.find((s) => s.name === "Maze");
    const town = slots.find((s) => s.name === "Town");
    if (!out || !maze || !town) throw new Error("missing slot");

    expect(out.partyStatus).toBe("out");
    expect(out.outAtPosition).toEqual(outPos);

    expect(maze.partyStatus).toBe("inMaze");
    expect(maze.outAtPosition).toBeUndefined();

    expect(town.partyStatus).toBe("inTown");
    expect(town.outAtPosition).toBeUndefined();
  });

  it("falls back to inTown for slots with malformed gameState", async () => {
    // Create a valid slot first via the public API so the schema/version is correct
    await db.saveStateAtomic({
      slotId: undefined,
      name: "Valid",
      state: {
        phase: "edgeOfTown",
        sub: { kind: "menu" },
        party: { ...EMPTY_PARTY, status: "out", outAtPosition: { level: 1, x: 0, y: 0, dir: "n" } },
      },
      changedCharacters: [],
    });

    // Then directly corrupt one slot's gameState in IndexedDB to simulate
    // schema drift / hand-edited save / partial write recovery.
    const idb = await openWizardryDB();
    const tx = idb.transaction("saveSlot", "readwrite");
    const store = tx.objectStore("saveSlot");
    await store.add({
      name: "Corrupt",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameState: "{not valid json",
      // biome-ignore lint/suspicious/noExplicitAny: idb.add accepts value without id (autoIncrement key)
    } as any);
    await tx.done;

    const slots = await db.listSlots();
    expect(slots).toHaveLength(2);

    const valid = slots.find((s) => s.name === "Valid");
    const corrupt = slots.find((s) => s.name === "Corrupt");
    if (!valid || !corrupt) throw new Error("missing slot");

    // Valid slot deserializes fine
    expect(valid.partyStatus).toBe("out");
    expect(valid.outAtPosition).toEqual({ level: 1, x: 0, y: 0, dir: "n" });

    // Corrupt slot falls back to inTown, no outAtPosition
    expect(corrupt.partyStatus).toBe("inTown");
    expect(corrupt.outAtPosition).toBeUndefined();
  });
});
