import { ITEMS, ITEM_IDS } from "@/engine/data/items";
import { addItem } from "@/engine/rules/inventory";
import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BuyList({ buyerId }: { buyerId: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(buyerId).then(setC);
  }, [buyerId]);
  if (!c) return null;

  const items = ITEM_IDS.filter((id) =>
    (ITEMS[id].allowedClasses as ReadonlyArray<string>).includes(c.class),
  );

  return (
    <div className="menu-screen">
      <Frame title={t("boltac.buy.title", { name: c.name, gold: c.status.gold })}>
        <Menu
          items={[
            ...items.map((id, i) => {
              const def = ITEMS[id];
              const affordable = c.status.gold >= def.cost;
              return {
                hotkey: String(i + 1),
                label: `${t(`item.${id}`)}  ${def.cost} GP`,
                disabled: !affordable,
                onSelect: async () => {
                  if (!affordable) return;
                  const updated: Character = {
                    ...c,
                    status: { ...c.status, gold: c.status.gold - def.cost },
                    inventory: addItem(c.inventory, id),
                  };
                  await db.updateCharacter(updated);
                  dispatch({ type: "buyItem", itemId: id });
                },
              };
            }),
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
