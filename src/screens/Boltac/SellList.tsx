import { useEffect, useState } from "react";
import { calcSellPrice, removeItem } from "@/engine/rules/inventory";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SellList({ sellerId }: { sellerId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(sellerId).then(setC);
  }, [sellerId]);
  if (!c) return null;

  return (
    <div className="menu-screen">
      <Frame title={t("boltac.sell.title", { name: c.name, gold: c.status.gold })}>
        {c.inventory.length === 0 && <p>{t("boltac.sell.noItems")}</p>}
        <Menu
          items={[
            ...c.inventory.map((it, i) => ({
              hotkey: String(i + 1),
              label: `${t(`item.${it.itemId}`)}  ${calcSellPrice(it.itemId)} GP`,
              disabled: it.equipped,
              onSelect: async () => {
                const price = calcSellPrice(it.itemId);
                const updated: Character = {
                  ...c,
                  status: { ...c.status, gold: c.status.gold + price },
                  inventory: removeItem(c.inventory, i),
                };
                await db.updateCharacter(updated);
                dispatch({ type: "sellItem", itemIndex: i });
              },
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
