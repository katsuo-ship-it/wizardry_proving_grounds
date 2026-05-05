import { RACES } from "@/engine/data/races";
import { mulberry32 } from "@/engine/rng/mulberry32";
import { rollBonus } from "@/engine/rules/character";
import type { AttributeKey, CharacterDraft, CreatingStep } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const ATTR_KEYS: AttributeKey[] = ["str", "iq", "pie", "vit", "agi", "luk"];

function freshSeed(): number {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function rollFor(draft: CharacterDraft): {
  attributes: typeof draft.baseAttributes;
  bonus: number;
} {
  const rng = mulberry32(freshSeed());
  const base = RACES[draft.race].base;
  return { attributes: { ...base }, bonus: rollBonus(rng) };
}

export function CreateAttributes({
  draft,
  step,
}: {
  draft: CharacterDraft;
  step: CreatingStep;
}) {
  const t = useT();

  if (step === "rollAttributes") {
    return (
      <div className="menu-screen">
        <Frame title={t("training.create.roll.title")}>
          <p>{t("training.create.roll.prompt")}</p>
          <Menu
            items={[
              {
                hotkey: "R",
                label: t("training.create.roll.action"),
                onSelect: () => {
                  const { attributes, bonus } = rollFor(draft);
                  dispatch({ type: "attributesRolled", attributes, bonus });
                },
              },
              {
                hotkey: "X",
                label: t("common.cancel"),
                onSelect: () => dispatch({ type: "cancelCreate" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.allocate.title")}>
        <p>{t("training.create.allocate.remaining", { n: draft.bonusPointsRemaining })}</p>
        <ul className="attribute-list">
          {ATTR_KEYS.map((k) => (
            <li key={k} className="attribute-row">
              <span className="attribute-name">{t(`attribute.${k}`)}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "allocateBonus", attribute: k, delta: -1 })}
              >
                -
              </button>
              <span className="attribute-value">
                {String(draft.attributes[k]).padStart(2, " ")}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "allocateBonus", attribute: k, delta: 1 })}
              >
                +
              </button>
            </li>
          ))}
        </ul>
        <Menu
          items={[
            {
              hotkey: "R",
              label: t("training.create.allocate.reroll"),
              onSelect: () => {
                const { attributes, bonus } = rollFor(draft);
                dispatch({ type: "attributesRolled", attributes, bonus });
              },
            },
            {
              hotkey: "O",
              label: t("training.create.allocate.proceed"),
              onSelect: () => dispatch({ type: "proceedToClass" }),
              disabled: draft.bonusPointsRemaining > 0,
            },
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
