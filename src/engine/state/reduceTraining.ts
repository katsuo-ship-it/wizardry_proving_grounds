import { RACES } from "@/engine/data/races";
import { applyBonus, eligibleClasses } from "@/engine/rules/character";
import type { CharacterDraft, CreatingStep, GameEvent, GameState } from "./types";

const FRESH_DRAFT: CharacterDraft = {
  name: "",
  race: "human",
  alignment: "good",
  baseAttributes: RACES.human.base,
  attributes: RACES.human.base,
  bonusPointsRemaining: 0,
  selectedClass: null,
};

export function reduceTraining(
  state: Extract<GameState, { phase: "training" }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === "menu") {
    switch (event.type) {
      case "startCreate":
        return {
          ...state,
          sub: { kind: "creating", step: "name", draft: FRESH_DRAFT },
        };
      case "inspectCharacter":
        return { ...state, sub: { kind: "inspecting", characterId: event.characterId } };
      case "deleteCharacter":
        return { ...state, sub: { kind: "deleteConfirm", characterId: event.characterId } };
      case "goBack":
        return { phase: "edgeOfTown", sub: { kind: "menu" }, party };
      default:
        return state;
    }
  }

  if (sub.kind === "creating") {
    return reduceCreating(state, sub, event);
  }

  if (sub.kind === "inspecting") {
    if (event.type === "closeInspect") return { ...state, sub: { kind: "menu" } };
    return state;
  }

  if (sub.kind === "deleteConfirm") {
    if (event.type === "confirmDelete" || event.type === "cancelDelete") {
      return { ...state, sub: { kind: "menu" } };
    }
    return state;
  }

  return state;
}

function reduceCreating(
  state: Extract<GameState, { phase: "training" }>,
  sub: { kind: "creating"; step: CreatingStep; draft: CharacterDraft },
  event: GameEvent,
): GameState {
  if (event.type === "cancelCreate") {
    return { ...state, sub: { kind: "menu" } };
  }

  switch (sub.step) {
    case "name":
      if (event.type === "inputName") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "race",
            draft: { ...sub.draft, name: event.name },
          },
        };
      }
      return state;

    case "race":
      if (event.type === "pickRace") {
        const base = RACES[event.race].base;
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "alignment",
            draft: {
              ...sub.draft,
              race: event.race,
              baseAttributes: base,
              attributes: base,
            },
          },
        };
      }
      return state;

    case "alignment":
      if (event.type === "pickAlignment") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "rollAttributes",
            draft: { ...sub.draft, alignment: event.alignment },
          },
        };
      }
      return state;

    case "rollAttributes":
      // 純関数を保つため、roll 結果は UI 側で計算して event payload で渡す
      if (event.type === "attributesRolled") {
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "allocateBonus",
            draft: {
              ...sub.draft,
              baseAttributes: event.attributes,
              attributes: event.attributes,
              bonusPointsRemaining: event.bonus,
            },
          },
        };
      }
      return state;

    case "allocateBonus":
      if (event.type === "allocateBonus") {
        const next = applyBonus(sub.draft, event.attribute, event.delta);
        return { ...state, sub: { kind: "creating", step: "allocateBonus", draft: next } };
      }
      if (event.type === "attributesRolled") {
        // 振り直し
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "allocateBonus",
            draft: {
              ...sub.draft,
              attributes: event.attributes,
              bonusPointsRemaining: event.bonus,
            },
          },
        };
      }
      if (event.type === "proceedToClass" && sub.draft.bonusPointsRemaining === 0) {
        return { ...state, sub: { kind: "creating", step: "pickClass", draft: sub.draft } };
      }
      return state;

    case "pickClass":
      if (event.type === "pickClass") {
        const eligible = eligibleClasses(sub.draft.attributes, sub.draft.alignment);
        if (!eligible.includes(event.klass)) return state;
        return {
          ...state,
          sub: {
            kind: "creating",
            step: "confirm",
            draft: { ...sub.draft, selectedClass: event.klass },
          },
        };
      }
      return state;

    case "confirm":
      if (event.type === "confirmCharacter") {
        // 副作用 (db.addCharacter) は CreateConfirm.tsx 側で直接実行
        return { ...state, sub: { kind: "menu" } };
      }
      return state;
  }
}
