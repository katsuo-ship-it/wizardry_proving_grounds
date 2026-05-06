import type { SaveSlotInfo } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function RestartList() {
  const t = useT();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    // M5 範囲: 全スロットをリスト表示。OUT 状態判定は将来
    db.listSlots().then(setSlots);
  }, []);

  return (
    <div className="menu-screen">
      <Frame title={t("utilities.restart.title")}>
        {slots.length === 0 && <p>{t("utilities.restart.empty")}</p>}
        <Menu
          items={[
            ...slots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "restartParty", slotId: slot.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "goBack" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
