import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function InnMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("inn.title")}>
        <Menu
          items={[
            {
              hotkey: "S",
              label: t("inn.menu.stay"),
              onSelect: () => dispatch({ type: "openInnGuest" }),
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveInn" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
