// Reference: docs/reference/wiz1/data-tables/races.md (🟡 二次ソース)

export const RACES = {
  human: { id: "human", base: { str: 8, iq: 8, pie: 5, vit: 8, agi: 8, luk: 9 } },
  elf: { id: "elf", base: { str: 7, iq: 10, pie: 10, vit: 6, agi: 9, luk: 6 } },
  dwarf: { id: "dwarf", base: { str: 10, iq: 7, pie: 10, vit: 10, agi: 5, luk: 6 } },
  gnome: { id: "gnome", base: { str: 7, iq: 7, pie: 10, vit: 8, agi: 10, luk: 7 } },
  hobbit: { id: "hobbit", base: { str: 5, iq: 7, pie: 7, vit: 6, agi: 10, luk: 15 } },
} as const;

export type RaceId = keyof typeof RACES;
export const RACE_IDS = Object.keys(RACES) as RaceId[];
