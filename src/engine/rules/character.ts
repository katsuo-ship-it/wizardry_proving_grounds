import type { Alignment } from "@/engine/data/alignments";
import { CLASSES, CLASS_IDS, type ClassId } from "@/engine/data/classes";
import { RACES, type RaceId } from "@/engine/data/races";
import type { RNG } from "@/engine/rng/mulberry32";
import type {
  AttributeKey,
  Attributes,
  Character,
  CharacterDraft,
} from "@/engine/state/types";

const ATTRIBUTE_MAX = 18;

/**
 * ボーナスポイントロール (1981 オリジナル準拠の暫定式)。
 * 5 + d6 の基本ロールに加え、1/10 で +10 ボーナスが連鎖する。
 * Reference: docs/reference/wiz1/algorithms/character-creation.md
 */
export function rollBonus(rng: RNG): number {
  let bonus = 5 + Math.floor(rng() * 6); // 5..10
  if (Math.floor(rng() * 10) === 0) {
    bonus += 10;
    if (Math.floor(rng() * 10) === 0) {
      bonus += 10;
    }
  }
  return bonus;
}

interface DraftSeed {
  name: string;
  race: RaceId;
  alignment: Alignment;
}

export function startDraft(seed: DraftSeed, rng: RNG): CharacterDraft {
  const base = { ...RACES[seed.race].base };
  return {
    name: seed.name,
    race: seed.race,
    alignment: seed.alignment,
    baseAttributes: base,
    attributes: { ...base },
    bonusPointsRemaining: rollBonus(rng),
    selectedClass: null,
  };
}

export function applyBonus(
  draft: CharacterDraft,
  attribute: AttributeKey,
  delta: -1 | 1,
): CharacterDraft {
  const current = draft.attributes[attribute];
  const baseLimit = draft.baseAttributes[attribute];

  if (delta === 1) {
    if (draft.bonusPointsRemaining <= 0) return draft;
    if (current >= ATTRIBUTE_MAX) return draft;
    return {
      ...draft,
      attributes: { ...draft.attributes, [attribute]: current + 1 },
      bonusPointsRemaining: draft.bonusPointsRemaining - 1,
    };
  }
  // delta === -1
  if (current <= baseLimit) return draft;
  return {
    ...draft,
    attributes: { ...draft.attributes, [attribute]: current - 1 },
    bonusPointsRemaining: draft.bonusPointsRemaining + 1,
  };
}

export function rerollBonus(draft: CharacterDraft, rng: RNG): CharacterDraft {
  return {
    ...draft,
    attributes: { ...draft.baseAttributes },
    bonusPointsRemaining: rollBonus(rng),
  };
}

export function eligibleClasses(attrs: Attributes, alignment: Alignment): ClassId[] {
  return CLASS_IDS.filter((cid) => {
    const k = CLASSES[cid];
    for (const [key, min] of Object.entries(k.minStats)) {
      if (typeof min !== "number") continue;
      if (attrs[key as AttributeKey] < min) return false;
    }
    if (!k.alignments.includes(alignment)) return false;
    return true;
  });
}

/**
 * draft を確定して Character を作る。HP は class と vit に基づく簡易計算
 * (Chapter 2 で本格的な式に置換予定)。age は M3 では 18 固定 (RNG 注入は Chapter 2)。
 */
export function makeCharacterFromDraft(
  draft: CharacterDraft,
  slotId: number,
  now: number,
): Omit<Character, "id"> {
  if (!draft.selectedClass) {
    throw new Error("makeCharacterFromDraft: selectedClass is null");
  }

  const hp = 8 + Math.floor(draft.attributes.vit / 2);

  return {
    slotId,
    name: draft.name,
    race: draft.race,
    class: draft.selectedClass,
    alignment: draft.alignment,
    attributes: draft.attributes,
    status: {
      hp,
      hpMax: hp,
      mp: { mage: 0, priest: 0 },
      mpMax: { mage: 0, priest: 0 },
      level: 1,
      exp: 0,
      gold: 100,
      ac: 10,
      age: 18,
      restCount: 0,
    },
    inventory: [],
    statusFlag: "ok",
    createdAt: now,
  };
}
