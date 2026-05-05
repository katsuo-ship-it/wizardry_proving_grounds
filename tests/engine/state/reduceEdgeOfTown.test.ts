import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const initial: GameState = {
  phase: "edgeOfTown",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("edgeOfTown phase reducer", () => {
  it("goToTraining → training phase", () => {
    expect(reduce(initial, { type: "goToTraining" })).toEqual({
      phase: "training",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("goToMaze → maze phase", () => {
    expect(reduce(initial, { type: "goToMaze" })).toEqual({
      phase: "maze",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("goToCastle → castle phase", () => {
    expect(reduce(initial, { type: "goToCastle" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("goToUtilities → utilities phase", () => {
    expect(reduce(initial, { type: "goToUtilities" })).toEqual({
      phase: "utilities",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("leaveGame from menu → confirmLeave sub-state", () => {
    expect(reduce(initial, { type: "leaveGame" })).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "confirmLeave" },
      party: EMPTY_PARTY,
    });
  });

  it("confirmLeaveGame from confirmLeave → title", () => {
    const fromConfirm: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "confirmLeave" },
      party: EMPTY_PARTY,
    };
    expect(reduce(fromConfirm, { type: "confirmLeaveGame" })).toEqual({
      phase: "title",
      sub: { kind: "main" },
    });
  });

  it("cancelLeaveGame from confirmLeave → menu", () => {
    const fromConfirm: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "confirmLeave" },
      party: EMPTY_PARTY,
    };
    expect(reduce(fromConfirm, { type: "cancelLeaveGame" })).toEqual(initial);
  });
});
