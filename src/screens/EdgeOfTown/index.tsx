import { useT } from "@/i18n/useT";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function EdgeOfTown() {
  const sub = useGameStore((s) => (s.state.phase === "edgeOfTown" ? s.state.sub : null));
  if (!sub) return null;

  if (sub.kind === "confirmLeave") {
    return <ConfirmLeave />;
  }

  return <EdgeOfTownMenu />;
}

function EdgeOfTownMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("edgeOfTown.title")}>
        <Menu
          items={[
            {
              hotkey: "T",
              label: t("edgeOfTown.menu.training"),
              onSelect: () => dispatch({ type: "goToTraining" }),
            },
            {
              hotkey: "M",
              label: t("edgeOfTown.menu.maze"),
              onSelect: () => dispatch({ type: "goToMaze" }),
            },
            {
              hotkey: "C",
              label: t("edgeOfTown.menu.castle"),
              onSelect: () => dispatch({ type: "goToCastle" }),
            },
            {
              hotkey: "U",
              label: t("edgeOfTown.menu.utilities"),
              onSelect: () => dispatch({ type: "goToUtilities" }),
            },
            {
              hotkey: "L",
              label: t("edgeOfTown.menu.leaveGame"),
              onSelect: () => dispatch({ type: "leaveGame" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}

function ConfirmLeave() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("edgeOfTown.confirmLeave.title")}>
        <p>{t("edgeOfTown.confirmLeave.body")}</p>
        <Menu
          items={[
            {
              hotkey: "Y",
              label: t("common.yes"),
              onSelect: () => dispatch({ type: "confirmLeaveGame" }),
            },
            {
              hotkey: "N",
              label: t("common.no"),
              onSelect: () => dispatch({ type: "cancelLeaveGame" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
