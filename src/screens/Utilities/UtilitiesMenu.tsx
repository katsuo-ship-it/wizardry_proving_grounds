import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function UtilitiesMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("utilities.title")}>
        <Menu
          items={[
            {
              hotkey: "R",
              label: t("utilities.menu.restart"),
              onSelect: () => dispatch({ type: "openRestartList" }),
            },
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
