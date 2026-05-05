import { ITEMS, type ItemId, SELL_RATIO } from "@/engine/data/items";
import type { InventoryItem } from "@/engine/state/types";

export function addItem(inv: InventoryItem[], itemId: ItemId): InventoryItem[] {
  return [...inv, { itemId, identified: true, cursed: false, equipped: false }];
}

export function removeItem(inv: InventoryItem[], index: number): InventoryItem[] {
  return inv.filter((_, i) => i !== index);
}

export function calcSellPrice(itemId: ItemId): number {
  return Math.floor(ITEMS[itemId].cost * SELL_RATIO);
}
