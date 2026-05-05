import { reduce } from "@/engine/state/reduce";
import type { GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const initial: GameState = { phase: "title", sub: { kind: "main" } };

describe("title phase reducer", () => {
  it("openContinue from main → continueMenu (with empty slots placeholder)", () => {
    const next = reduce(initial, { type: "openContinue" });
    expect(next).toEqual({ phase: "title", sub: { kind: "continueMenu", slots: [] } });
  });

  it("openSettings from main → settings", () => {
    const next = reduce(initial, { type: "openSettings" });
    expect(next).toEqual({ phase: "title", sub: { kind: "settings" } });
  });

  it("closeSettings from settings → main", () => {
    const fromSettings: GameState = { phase: "title", sub: { kind: "settings" } };
    const next = reduce(fromSettings, { type: "closeSettings" });
    expect(next).toEqual({ phase: "title", sub: { kind: "main" } });
  });

  it("loadFailed from loading → loadError", () => {
    const fromLoading: GameState = { phase: "title", sub: { kind: "loading", slotId: 1 } };
    const next = reduce(fromLoading, { type: "loadFailed", reason: "corrupted" });
    expect(next).toEqual({ phase: "title", sub: { kind: "loadError", reason: "corrupted" } });
  });

  it("startGame from main → edgeOfTown with empty party", () => {
    const next = reduce(initial, { type: "startGame" });
    expect(next).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: {
        members: [null, null, null, null, null, null],
        gold: 0,
        status: "inTown",
      },
    });
  });
});
