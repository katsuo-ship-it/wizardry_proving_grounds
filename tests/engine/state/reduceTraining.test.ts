import { RACES } from "@/engine/data/races";
import { reduce } from "@/engine/state/reduce";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { describe, expect, it } from "vitest";

const baseTraining: GameState = {
  phase: "training",
  sub: { kind: "menu" },
  party: EMPTY_PARTY,
};

describe("training phase reducer", () => {
  it("startCreate moves to creating.name with a fresh draft", () => {
    const next = reduce(baseTraining, { type: "startCreate" });
    expect(next.phase).toBe("training");
    if (next.phase !== "training") return;
    expect(next.sub.kind).toBe("creating");
    if (next.sub.kind !== "creating") return;
    expect(next.sub.step).toBe("name");
    expect(next.sub.draft.name).toBe("");
  });

  it("inputName moves from name → race step", () => {
    const s1 = reduce(baseTraining, { type: "startCreate" });
    const s2 = reduce(s1, { type: "inputName", name: "Conan" });
    if (s2.phase !== "training" || s2.sub.kind !== "creating") {
      throw new Error("unexpected state");
    }
    expect(s2.sub.draft.name).toBe("Conan");
    expect(s2.sub.step).toBe("race");
  });

  it("pickRace moves to alignment step and updates baseAttributes", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "elf" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("alignment");
    expect(s.sub.draft.race).toBe("elf");
    expect(s.sub.draft.baseAttributes).toEqual(RACES.elf.base);
  });

  it("attributesRolled from rollAttributes step → allocateBonus with payload", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "human" });
    s = reduce(s, { type: "pickAlignment", alignment: "good" });
    const attrs = { str: 10, iq: 10, pie: 10, vit: 10, agi: 10, luk: 10 };
    s = reduce(s, { type: "attributesRolled", attributes: attrs, bonus: 7 });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("allocateBonus");
    expect(s.sub.draft.attributes).toEqual(attrs);
    expect(s.sub.draft.bonusPointsRemaining).toBe(7);
  });

  it("proceedToClass requires bonus 0 to advance", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "human" });
    s = reduce(s, { type: "pickAlignment", alignment: "good" });
    const attrs = { str: 11, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 };
    s = reduce(s, { type: "attributesRolled", attributes: attrs, bonus: 5 });
    // bonus が残っていると進めない
    s = reduce(s, { type: "proceedToClass" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("allocateBonus");

    // bonus を 0 にしたら進める (5 回 +1)
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { type: "allocateBonus", attribute: "str", delta: 1 });
    }
    s = reduce(s, { type: "proceedToClass" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("pickClass");
  });

  it("pickClass with eligible class advances to confirm", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "human" });
    s = reduce(s, { type: "pickAlignment", alignment: "good" });
    const attrs = { str: 11, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 };
    s = reduce(s, { type: "attributesRolled", attributes: attrs, bonus: 0 });
    s = reduce(s, { type: "proceedToClass" });
    s = reduce(s, { type: "pickClass", klass: "fighter" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("confirm");
    expect(s.sub.draft.selectedClass).toBe("fighter");
  });

  it("pickClass with ineligible class is rejected", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "human" });
    s = reduce(s, { type: "pickAlignment", alignment: "good" });
    const attrs = { str: 8, iq: 8, pie: 8, vit: 8, agi: 8, luk: 8 };
    s = reduce(s, { type: "attributesRolled", attributes: attrs, bonus: 0 });
    s = reduce(s, { type: "proceedToClass" });
    s = reduce(s, { type: "pickClass", klass: "fighter" });
    if (s.phase !== "training" || s.sub.kind !== "creating") throw new Error("");
    expect(s.sub.step).toBe("pickClass"); // 進まない
  });

  it("cancelCreate returns to training menu", () => {
    const s1 = reduce(baseTraining, { type: "startCreate" });
    const s2 = reduce(s1, { type: "cancelCreate" });
    expect(s2).toEqual(baseTraining);
  });

  it("goBack from menu returns to edgeOfTown", () => {
    const next = reduce(baseTraining, { type: "goBack" });
    expect(next).toEqual({
      phase: "edgeOfTown",
      sub: { kind: "menu" },
      party: EMPTY_PARTY,
    });
  });

  it("confirmCharacter from confirm step returns to menu", () => {
    let s = reduce(baseTraining, { type: "startCreate" });
    s = reduce(s, { type: "inputName", name: "X" });
    s = reduce(s, { type: "pickRace", race: "human" });
    s = reduce(s, { type: "pickAlignment", alignment: "good" });
    const attrs = { str: 11, iq: 8, pie: 8, vit: 10, agi: 10, luk: 10 };
    s = reduce(s, { type: "attributesRolled", attributes: attrs, bonus: 0 });
    s = reduce(s, { type: "proceedToClass" });
    s = reduce(s, { type: "pickClass", klass: "fighter" });
    s = reduce(s, { type: "confirmCharacter" });
    if (s.phase !== "training") throw new Error("");
    expect(s.sub.kind).toBe("menu");
  });
});
