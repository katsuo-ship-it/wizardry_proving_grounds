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
    db.listSlots().then(setSlots);
  }, []);

  // OUT 状態のスロットのみ表示 (1981 原典の Restart Out Party 仕様準拠)
  const outSlots = slots.filter((s) => s.partyStatus === "out");

  // 空メッセージは 2 ケース:
  // - そもそもセーブが 1 件もない → "empty"
  // - セーブはあるが OUT のパーティが居ない → "noOutParty"
  const emptyMessage =
    slots.length === 0 ? t("utilities.restart.empty") : t("utilities.restart.noOutParty");

  return (
    <div className="menu-screen">
      <Frame title={t("utilities.restart.title")}>
        {outSlots.length === 0 && <p>{emptyMessage}</p>}
        <Menu
          items={[
            ...outSlots.map((slot, i) => ({
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
