import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "boltac",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("boltac reducer", () => {
  it("openBuy → pickBuyer with mode=buy", () => {
    expect(reduce(init, { type: "openBuy" })).toEqual({
      ...init,
      sub: { kind: "pickBuyer", mode: "buy" },
    });
  });

  it("openSell → pickBuyer with mode=sell", () => {
    expect(reduce(init, { type: "openSell" })).toEqual({
      ...init,
      sub: { kind: "pickBuyer", mode: "sell" },
    });
  });

  it("pickBuyer (buy mode) → buyList", () => {
    const at: GameState = { ...init, sub: { kind: "pickBuyer", mode: "buy" } };
    expect(reduce(at, { type: "pickBuyer", characterId: 5 })).toEqual({
      ...init,
      sub: { kind: "buyList", buyer: 5 },
    });
  });

  it("pickBuyer (sell mode) → sellList", () => {
    const at: GameState = { ...init, sub: { kind: "pickBuyer", mode: "sell" } };
    expect(reduce(at, { type: "pickBuyer", characterId: 5 })).toEqual({
      ...init,
      sub: { kind: "sellList", seller: 5 },
    });
  });

  it("leaveBoltac → castle", () => {
    expect(reduce(init, { type: "leaveBoltac" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });
});
