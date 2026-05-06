import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Camp() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("camp.title")}>
        <Menu
          items={[
            {
              hotkey: "L",
              label: t("camp.menu.leave"),
              onSelect: () => dispatch({ type: "leaveCamp" }),
            },
            {
              hotkey: "Q",
              label: t("camp.menu.quit"),
              onSelect: () => dispatch({ type: "quitToTown" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
