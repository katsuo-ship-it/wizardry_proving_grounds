import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function TempleMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("temple.title")}>
        <p>{t("temple.greeting")}</p>
        <Menu
          items={[
            {
              hotkey: "P",
              label: t("temple.menu.pray"),
              onSelect: () => dispatch({ type: "openSavePicker" }),
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
