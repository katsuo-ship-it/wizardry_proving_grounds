import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "inn",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("inn reducer", () => {
  it("openInnGuest → pickGuest", () => {
    expect(reduce(init, { type: "openInnGuest" })).toEqual({
      ...init,
      sub: { kind: "pickGuest" },
    });
  });

  it("pickGuest → rest sub-state", () => {
    const at: GameState = { ...init, sub: { kind: "pickGuest" } };
    expect(reduce(at, { type: "pickGuest", characterId: 7 })).toEqual({
      ...init,
      sub: { kind: "rest", guest: 7 },
    });
  });

  it("restStables (Stables: time only, no HP recovery) → menu", () => {
    const at: GameState = { ...init, sub: { kind: "rest", guest: 7 } };
    expect(reduce(at, { type: "restStables" })).toEqual({
      ...init,
      sub: { kind: "menu" },
    });
  });

  it("leaveInn → castle", () => {
    expect(reduce(init, { type: "leaveInn" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
