import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CharacterList() {
  const t = useT();
  // 言語切替で再描画させるため購読 (値は使わない)
  useGameStore((s) => s.lang);
  const phase = useGameStore((s) => s.state.phase);
  const [roster, setRoster] = useState<Character[]>([]);

  useEffect(() => {
    if (phase === "training") {
      db.listCharacters(1).then(setRoster);
    }
  }, [phase]);

  const items = [
    {
      hotkey: "C",
      label: t("training.menu.create"),
      onSelect: () => dispatch({ type: "startCreate" }),
    },
    ...roster.map((c, idx) => ({
      hotkey: String(idx + 1),
      label: `${c.name}  L${c.status.level} ${t(`race.${c.race}` as never)} ${t(`class.${c.class}` as never)}`,
      onSelect: () => dispatch({ type: "inspectCharacter", characterId: c.id }),
    })),
    {
      hotkey: "B",
      label: t("common.back"),
      onSelect: () => dispatch({ type: "goBack" }),
    },
  ];

  return (
    <div className="menu-screen">
      <Frame title={t("training.title")}>
        {roster.length === 0 && <p>{t("training.empty")}</p>}
        <Menu items={items} />
      </Frame>
    </div>
  );
}
