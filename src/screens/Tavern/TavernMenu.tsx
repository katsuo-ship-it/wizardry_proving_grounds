import { useEffect, useState } from "react";
import type { Character, SlotIndex } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function TavernMenu() {
  const t = useT();
  useGameStore((s) => s.lang); // 言語切替で再描画
  const phase = useGameStore((s) => s.state.phase);
  const party = useGameStore((s) => (s.state.phase === "tavern" ? s.state.party : null));
  const [chars, setChars] = useState<Map<number, Character>>(new Map());

  useEffect(() => {
    if (phase === "tavern") {
      db.listCharacters(1).then((list) => {
        setChars(new Map(list.map((c) => [c.id, c])));
      });
    }
  }, [phase]);

  if (!party) return null;

  const items: Parameters<typeof Menu>[0]["items"] = [
    {
      hotkey: "A",
      label: t("tavern.menu.addMember"),
      onSelect: () => dispatch({ type: "openAddMember" }),
    },
  ];

  party.members.forEach((memberId, slot) => {
    if (memberId === null) return;
    const c = chars.get(memberId);
    if (!c) return;
    items.push({
      hotkey: String(slot + 1),
      label: `${slot + 1}: ${c.name} L${c.status.level} ${t(`race.${c.race}`)} ${t(`class.${c.class}`)}`,
      onSelect: () => dispatch({ type: "removeFromParty", slot: slot as SlotIndex }),
    });
  });

  items.push({
    hotkey: "B",
    label: t("common.back"),
    onSelect: () => dispatch({ type: "leaveTavern" }),
  });

  return (
    <div className="menu-screen">
      <Frame title={t("tavern.title")}>
        <Menu items={items} />
      </Frame>
    </div>
  );
}
