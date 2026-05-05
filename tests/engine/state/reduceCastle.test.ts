import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const initial: GameState = {
  phase: "castle",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("castle phase reducer", () => {
  it.each([
    ["enterTavern", "tavern"],
    ["enterBoltac", "boltac"],
    ["enterTemple", "temple"],
    ["enterInn", "inn"],
  ] as const)("%s → %s phase", (eventType, expectedPhase) => {
    expect(reduce(initial, { type: eventType })).toEqual({
      phase: expectedPhase,
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("leaveCastle → edgeOfTown", () => {
    expect(reduce(initial, { type: "leaveCastle" })).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
