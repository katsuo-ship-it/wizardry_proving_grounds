import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BuyerPick({ mode }: { mode: "buy" | "sell" }) {
  const t = useT();
  const party = useGameStore((s) => (s.state.phase === "boltac" ? s.state.party : null));
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    db.listCharacters(1).then(setChars);
  }, []);

  if (!party) return null;
  const inParty = chars.filter((c) => party.members.includes(c.id));

  return (
    <div className="menu-screen">
      <Frame
        title={mode === "buy" ? t("boltac.pickBuyer.title.buy") : t("boltac.pickBuyer.title.sell")}
      >
        <Menu
          items={[
            ...inParty.map((c, i) => ({
              hotkey: String(i + 1),
              label: `${c.name}  ${c.status.gold} GP`,
              onSelect: () => dispatch({ type: "pickBuyer", characterId: c.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveBoltac" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
