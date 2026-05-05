import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "tavern",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("tavern reducer", () => {
  it("openAddMember moves to addMember sub", () => {
    const next = reduce(init, { type: "openAddMember" });
    expect(next).toEqual({
      ...init,
      sub: { kind: "addMember", rosterIds: [] },
    });
  });

  it("addToParty places character at given slot and returns to menu", () => {
    const inAdd: GameState = {
      ...init,
      sub: { kind: "addMember", rosterIds: [10, 11] },
    };
    const next = reduce(inAdd, { type: "addToParty", characterId: 10, slot: 0 });
    if (next.phase !== "tavern") throw new Error();
    expect(next.party.members[0]).toBe(10);
    expect(next.sub).toEqual({ kind: "menu" });
  });

  it("removeFromParty clears slot", () => {
    const filled: GameState = {
      ...init,
      party: { ...EMPTY_PARTY, members: [10, null, null, null, null, null] },
    };
    const next = reduce(filled, { type: "removeFromParty", slot: 0 });
    if (next.phase !== "tavern") throw new Error();
    expect(next.party.members[0]).toBeNull();
  });

  it("leaveTavern returns to castle", () => {
    expect(reduce(init, { type: "leaveTavern" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("goBack also returns to castle", () => {
    expect(reduce(init, { type: "goBack" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
