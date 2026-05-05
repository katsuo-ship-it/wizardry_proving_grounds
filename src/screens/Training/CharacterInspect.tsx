import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CharacterInspect({ characterId }: { characterId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(characterId).then(setC);
  }, [characterId]);

  if (!c) return <p>{t("common.loading")}</p>;
  const a = c.attributes;

  return (
    <div className="menu-screen">
      <Frame title={c.name}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            L{c.status.level} {t(`race.${c.race}`)} {t(`class.${c.class}`)}
          </li>
          <li>
            {t("common.label.alignment")}: {t(`alignment.${c.alignment}`)}
          </li>
          <li>
            HP: {c.status.hp}/{c.status.hpMax}
          </li>
          <li>
            {t("attribute.str")} {a.str} {t("attribute.iq")} {a.iq} {t("attribute.pie")} {a.pie}
          </li>
          <li>
            {t("attribute.vit")} {a.vit} {t("attribute.agi")} {a.agi} {t("attribute.luk")} {a.luk}
          </li>
          <li>
            AC {c.status.ac} Gold {c.status.gold} Age {c.status.age}
          </li>
        </ul>
        <Menu
          items={[
            {
              hotkey: "D",
              label: t("training.menu.delete"),
              onSelect: () => dispatch({ type: "deleteCharacter", characterId }),
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "closeInspect" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
