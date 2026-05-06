import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const init: GameState = {
  phase: "temple",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("temple reducer", () => {
  it("openSavePicker → savePicker sub", () => {
    const next = reduce(init, { type: "openSavePicker" });
    if (next.phase !== "temple") throw new Error();
    expect(next.sub.kind).toBe("savePicker");
  });

  it("goBack from menu → castle", () => {
    expect(reduce(init, { type: "goBack" })).toEqual({
      phase: "castle",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("savePicker + pickSlot 'new' → saveNameInput with slotId undefined", () => {
    const at: GameState = { ...init, sub: { kind: "savePicker" } };
    const next = reduce(at, { type: "pickSlot", slotId: "new" });
    if (next.phase !== "temple" || next.sub.kind !== "saveNameInput") throw new Error();
    expect(next.sub.slotId).toBeUndefined();
  });

  it("savePicker + pickSlot existing → saveNameInput with slotId", () => {
    const at: GameState = { ...init, sub: { kind: "savePicker" } };
    const next = reduce(at, { type: "pickSlot", slotId: 5 });
    if (next.phase !== "temple" || next.sub.kind !== "saveNameInput") throw new Error();
    expect(next.sub.slotId).toBe(5);
  });

  it("saveNameInput + inputSaveName → saving", () => {
    const at: GameState = { ...init, sub: { kind: "saveNameInput", slotId: undefined } };
    const next = reduce(at, { type: "inputSaveName", name: "MySave" });
    if (next.phase !== "temple" || next.sub.kind !== "saving") throw new Error();
    expect(next.sub.name).toBe("MySave");
  });

  it("saving + saveSucceeded → saveDone", () => {
    const at: GameState = {
      ...init,
      sub: { kind: "saving", slotId: undefined, name: "x" },
    };
    const next = reduce(at, { type: "saveSucceeded", slotId: 7 });
    if (next.phase !== "temple" || next.sub.kind !== "saveDone") throw new Error();
    expect(next.sub.slotId).toBe(7);
  });

  it("saving + saveFailed → saveError", () => {
    const at: GameState = {
      ...init,
      sub: { kind: "saving", slotId: undefined, name: "x" },
    };
    const next = reduce(at, { type: "saveFailed", reason: "quota" });
    if (next.phase !== "temple" || next.sub.kind !== "saveError") throw new Error();
    expect(next.sub.reason).toBe("quota");
  });

  it("saveDone + dismissSaveResult → menu", () => {
    const at: GameState = { ...init, sub: { kind: "saveDone", slotId: 1 } };
    const next = reduce(at, { type: "dismissSaveResult" });
    if (next.phase !== "temple") throw new Error();
    expect(next.sub.kind).toBe("menu");
  });

  it("cancelSave from picker → menu", () => {
    const inPicker: GameState = { ...init, sub: { kind: "savePicker" } };
    const next = reduce(inPicker, { type: "cancelSave" });
    if (next.phase !== "temple") throw new Error();
    expect(next.sub.kind).toBe("menu");
  });
});
