// Reference: docs/reference/wiz1/data-tables/items.md (🟡 二次ソース、Chapter 1 範囲)
import type { ClassId } from "./classes";

export type ItemSlot = "weapon" | "armor" | "shield" | "helmet";

export interface ItemDef {
  id: string;
  slot: ItemSlot;
  cost: number;
  /** 武器のみ: ダメージダイス { dice: 1, sides: 8 } = 1d8 */
  damage?: { dice: number; sides: number };
  /** 防具・盾・兜のみ: AC ボーナス (負の値が良い) */
  acBonus?: number;
  allowedClasses: ReadonlyArray<ClassId>;
}

const F_S_L_N: ReadonlyArray<ClassId> = ["fighter", "samurai", "lord", "ninja"];
const F_S_L_T_N: ReadonlyArray<ClassId> = ["fighter", "samurai", "lord", "thief", "ninja"];
const ALL_FRONT: ReadonlyArray<ClassId> = ["fighter", "priest", "samurai", "lord"];
const ALL_CASTER: ReadonlyArray<ClassId> = ["mage", "priest", "bishop"];
const ALL_CLASSES: ReadonlyArray<ClassId> = [
  "fighter",
  "mage",
  "priest",
  "thief",
  "bishop",
  "samurai",
  "lord",
  "ninja",
];

export const ITEMS = {
  longSword: {
    id: "longSword",
    slot: "weapon",
    cost: 25,
    damage: { dice: 1, sides: 8 },
    allowedClasses: F_S_L_N,
  },
  shortSword: {
    id: "shortSword",
    slot: "weapon",
    cost: 15,
    damage: { dice: 1, sides: 6 },
    allowedClasses: F_S_L_T_N,
  },
  mace: {
    id: "mace",
    slot: "weapon",
    cost: 30,
    damage: { dice: 2, sides: 3 },
    allowedClasses: [...ALL_FRONT, "bishop", "ninja"],
  },
  staff: {
    id: "staff",
    slot: "weapon",
    cost: 5,
    damage: { dice: 1, sides: 4 },
    allowedClasses: [...ALL_CASTER, ...ALL_FRONT],
  },
  dagger: {
    id: "dagger",
    slot: "weapon",
    cost: 5,
    damage: { dice: 1, sides: 4 },
    allowedClasses: ALL_CLASSES,
  },
  leatherArmor: {
    id: "leatherArmor",
    slot: "armor",
    cost: 50,
    acBonus: -1,
    allowedClasses: [...F_S_L_N, "thief"],
  },
  chainMail: {
    id: "chainMail",
    slot: "armor",
    cost: 90,
    acBonus: -2,
    allowedClasses: ALL_FRONT,
  },
  breastPlate: {
    id: "breastPlate",
    slot: "armor",
    cost: 200,
    acBonus: -3,
    allowedClasses: ALL_FRONT,
  },
  plateMail: {
    id: "plateMail",
    slot: "armor",
    cost: 750,
    acBonus: -4,
    allowedClasses: ["fighter", "samurai", "lord"],
  },
  smallShield: {
    id: "smallShield",
    slot: "shield",
    cost: 20,
    acBonus: -1,
    allowedClasses: [...ALL_FRONT, "thief", "ninja"],
  },
  largeShield: {
    id: "largeShield",
    slot: "shield",
    cost: 40,
    acBonus: -2,
    allowedClasses: ALL_FRONT,
  },
  helm: {
    id: "helm",
    slot: "helmet",
    cost: 100,
    acBonus: -1,
    allowedClasses: [...ALL_FRONT, "ninja"],
  },
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Boltac の売却価格 = 購入価格の 50% (1981 オリジナル準拠の暫定値、Pascal 確認待ち) */
export const SELL_RATIO = 0.5;
