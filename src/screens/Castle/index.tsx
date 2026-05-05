import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Castle() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("castle.title")}>
        <Menu
          items={[
            {
              hotkey: "G",
              label: t("castle.menu.tavern"),
              onSelect: () => dispatch({ type: "enterTavern" }),
            },
            {
              hotkey: "B",
              label: t("castle.menu.boltac"),
              onSelect: () => dispatch({ type: "enterBoltac" }),
            },
            {
              hotkey: "T",
              label: t("castle.menu.temple"),
              onSelect: () => dispatch({ type: "enterTemple" }),
            },
            {
              hotkey: "A",
              label: t("castle.menu.inn"),
              onSelect: () => dispatch({ type: "enterInn" }),
            },
            {
              hotkey: "E",
              label: t("castle.menu.edgeOfTown"),
              onSelect: () => dispatch({ type: "leaveCastle" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
