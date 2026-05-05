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

  it("goToMaze with empty party stays in edgeOfTown", () => {
    // EMPTY_PARTY (members all null) で Maze に行こうとしても拒否
    const next = reduce(initial, { type: "goToMaze" });
    expect(next).toEqual(initial);
  });

  it("goToMaze with at least one member transitions to maze with start position", () => {
    const withMember: GameState = {
      ...initial,
      party: { ...EMPTY_PARTY, members: [42, null, null, null, null, null] },
    };
    const next = reduce(withMember, { type: "goToMaze" });
    expect(next.phase).toBe("maze");
    if (next.phase !== "maze") throw new Error("");
    expect(next.pos).toEqual({ level: 1, x: 1, y: 1, dir: "n" });
    expect(next.party.status).toBe("inMaze");
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
