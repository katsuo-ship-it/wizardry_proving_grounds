// Reference: docs/reference/wiz1/data-tables/classes.md (🟡 二次ソース)
import type { Alignment } from "./alignments";

interface ClassDef {
  id: string;
  minStats: Partial<{
    str: number;
    iq: number;
    pie: number;
    vit: number;
    agi: number;
    luk: number;
  }>;
  alignments: ReadonlyArray<Alignment>;
}

export const CLASSES = {
  fighter: { id: "fighter", minStats: { str: 11 }, alignments: ["good", "neutral", "evil"] },
  mage: { id: "mage", minStats: { iq: 11 }, alignments: ["good", "neutral", "evil"] },
  priest: { id: "priest", minStats: { pie: 11 }, alignments: ["good", "evil"] },
  thief: { id: "thief", minStats: { agi: 11 }, alignments: ["neutral", "evil"] },
  bishop: { id: "bishop", minStats: { iq: 12, pie: 12 }, alignments: ["good", "evil"] },
  samurai: {
    id: "samurai",
    minStats: { str: 15, iq: 11, pie: 10, vit: 14, agi: 10 },
    alignments: ["good", "neutral"],
  },
  lord: {
    id: "lord",
    minStats: { str: 15, iq: 12, pie: 12, vit: 15, agi: 14, luk: 15 },
    alignments: ["good"],
  },
  ninja: {
    id: "ninja",
    minStats: { str: 17, iq: 17, pie: 17, vit: 17, agi: 17, luk: 17 },
    alignments: ["evil"],
  },
} as const satisfies Record<string, ClassDef>;

export type ClassId = keyof typeof CLASSES;
export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
