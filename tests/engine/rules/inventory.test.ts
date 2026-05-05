import { ITEMS } from "@/engine/data/items";
import { addItem, calcSellPrice, removeItem } from "@/engine/rules/inventory";
import { describe, expect, it } from "vitest";

describe("inventory rules", () => {
  it("addItem appends a fresh entry", () => {
    const next = addItem([], "longSword");
    expect(next).toHaveLength(1);
    expect(next[0]).toEqual({
      itemId: "longSword",
      identified: true,
      cursed: false,
      equipped: false,
    });
  });

  it("removeItem removes by index", () => {
    const inv = addItem(addItem([], "longSword"), "dagger");
    const next = removeItem(inv, 0);
    expect(next).toHaveLength(1);
    expect(next[0]?.itemId).toBe("dagger");
  });

  it("calcSellPrice returns half of cost (rounded down)", () => {
    expect(calcSellPrice("longSword")).toBe(Math.floor(ITEMS.longSword.cost * 0.5));
    expect(calcSellPrice("plateMail")).toBe(Math.floor(ITEMS.plateMail.cost * 0.5));
  });
});
