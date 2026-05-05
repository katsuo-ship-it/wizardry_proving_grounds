import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function BoltacMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("boltac.title")}>
        <Menu
          items={[
            {
              hotkey: "B",
              label: t("boltac.menu.buy"),
              onSelect: () => dispatch({ type: "openBuy" }),
            },
            {
              hotkey: "S",
              label: t("boltac.menu.sell"),
              onSelect: () => dispatch({ type: "openSell" }),
            },
            {
              hotkey: "X",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveBoltac" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
