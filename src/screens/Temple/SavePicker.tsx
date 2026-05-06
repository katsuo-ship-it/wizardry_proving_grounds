import { useEffect, useState } from "react";
import type { SaveSlotInfo } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SavePicker() {
  const t = useT();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    db.listSlots().then(setSlots);
  }, []);

  return (
    <div className="menu-screen">
      <Frame title={t("temple.savePicker.title")}>
        <Menu
          items={[
            {
              hotkey: "N",
              label: t("temple.savePicker.newSlot"),
              onSelect: () => dispatch({ type: "pickSlot", slotId: "new" }),
            },
            ...slots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "pickSlot", slotId: slot.id }),
            })),
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelSave" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
