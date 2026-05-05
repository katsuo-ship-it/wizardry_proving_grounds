import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateAlignment() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.alignment.title")}>
        <Menu
          items={[
            {
              hotkey: "G",
              label: t("alignment.good"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "good" }),
            },
            {
              hotkey: "N",
              label: t("alignment.neutral"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "neutral" }),
            },
            {
              hotkey: "E",
              label: t("alignment.evil"),
              onSelect: () => dispatch({ type: "pickAlignment", alignment: "evil" }),
            },
            {
              hotkey: "X",
              label: t("common.cancel"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
