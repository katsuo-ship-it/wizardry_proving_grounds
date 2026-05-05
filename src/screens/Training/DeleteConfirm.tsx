import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function DeleteConfirm({ characterId }: { characterId: number }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.delete.title")}>
        <p>{t("training.delete.body")}</p>
        <Menu
          items={[
            {
              hotkey: "Y",
              label: t("common.yes"),
              onSelect: async () => {
                await db.deleteCharacter(characterId);
                dispatch({ type: "confirmDelete" });
              },
            },
            {
              hotkey: "N",
              label: t("common.no"),
              onSelect: () => dispatch({ type: "cancelDelete" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
