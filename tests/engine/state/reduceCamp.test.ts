import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const inCamp: GameState = {
  phase: "camp",
  sub: { kind: "menu" },
  pos: { level: 1, x: 1, y: 1, dir: "n" },
  party: { ...EMPTY_PARTY, status: "inMaze" },
};

describe("camp reducer", () => {
  it("leaveCamp returns to maze (same pos)", () => {
    const next = reduce(inCamp, { type: "leaveCamp" });
    expect(next).toEqual({
      phase: "maze",
      pos: inCamp.pos,
      party: inCamp.party,
    });
  });

  it("quitToTown returns to edgeOfTown with party out", () => {
    const next = reduce(inCamp, { type: "quitToTown" });
    expect(next.phase).toBe("edgeOfTown");
    if (next.phase !== "edgeOfTown") throw new Error("");
    expect(next.party.status).toBe("out");
    expect(next.party.outAtPosition).toEqual(inCamp.pos);
  });
});
