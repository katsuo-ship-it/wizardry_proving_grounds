import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

describe("placeholder phases goBack routing", () => {
  it.each([
    // training と tavern は M3 で実画面化されたため除外
    ["utilities", "edgeOfTown"],
    ["maze", "edgeOfTown"],
    ["boltac", "castle"],
    ["temple", "castle"],
    ["inn", "castle"],
  ] as const)("%s + goBack → %s", (from, to) => {
    const state: GameState = { phase: from, sub: { kind: "menu" }, party: EMPTY_PARTY };
    expect(reduce(state, { type: "goBack" })).toEqual({
      phase: to,
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
