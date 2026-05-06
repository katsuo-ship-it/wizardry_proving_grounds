import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { deserializeState, serializeState } from "@/persist/serialize";
import { describe, expect, it } from "vitest";

describe("serialize", () => {
  it("title state round-trips", () => {
    const original: GameState = { phase: "title", sub: { kind: "main" } };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("edgeOfTown with party round-trips", () => {
    const original: GameState = {
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: { ...EMPTY_PARTY, members: [1, 2, null, null, null, null] },
    };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("maze state with pos round-trips", () => {
    const original: GameState = {
      phase: "maze",
      pos: { level: 1, x: 3, y: 5, dir: "e" },
      party: { ...EMPTY_PARTY, status: "inMaze", members: [1, null, null, null, null, null] },
    };
    const json = serializeState(original);
    expect(deserializeState(json)).toEqual(original);
  });

  it("rejects malformed JSON gracefully", () => {
    expect(() => deserializeState("not json")).toThrow();
    expect(() => deserializeState("{}")).toThrow();
  });
});
