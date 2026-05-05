import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function PickGuest() {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "inn" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;
  const inParty = chars.filter((c) => party.members.includes(c.id));

  if (inParty.length === 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("inn.pickGuest.title")}>
          <p>{t("inn.pickGuest.partyEmpty")}</p>
          <Menu
            items={[
              {
                hotkey: "B",
                label: t("common.back"),
                onSelect: () => dispatch({ type: "leaveInn" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("inn.pickGuest.title")}>
        <Menu
          items={[
            ...inParty.map((c, i) => ({
              hotkey: String(i + 1),
              label: `${c.name}  HP ${c.status.hp}/${c.status.hpMax}`,
              onSelect: () => dispatch({ type: "pickGuest", characterId: c.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveInn" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
