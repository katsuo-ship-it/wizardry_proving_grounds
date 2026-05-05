import type { Character, SlotIndex } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function AddMember() {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "tavern" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;

  const available = chars.filter((c) => !party.members.includes(c.id));
  const firstFreeSlot = party.members.findIndex((m) => m === null);

  if (firstFreeSlot < 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("tavern.addMember.title")}>
          <p>{t("tavern.partyFull")}</p>
          <Menu
            items={[
              {
                hotkey: "B",
                label: t("common.back"),
                onSelect: () => dispatch({ type: "closeAddMember" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("tavern.addMember.title")}>
          <p>{t("tavern.addMember.noneAvailable")}</p>
          <Menu
            items={[
              {
                hotkey: "B",
                label: t("common.back"),
                onSelect: () => dispatch({ type: "closeAddMember" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  const items = [
    ...available.map((c, i) => ({
      hotkey: String(i + 1),
      label: `${c.name} L${c.status.level} ${t(`race.${c.race}`)} ${t(`class.${c.class}`)}`,
      onSelect: () =>
        dispatch({
          type: "addToParty",
          characterId: c.id,
          slot: firstFreeSlot as SlotIndex,
        }),
    })),
    {
      hotkey: "B",
      label: t("common.back"),
      onSelect: () => dispatch({ type: "closeAddMember" }),
    },
  ];

  return (
    <div className="menu-screen">
      <Frame title={t("tavern.addMember.title")}>
        <Menu items={items} />
      </Frame>
    </div>
  );
}
