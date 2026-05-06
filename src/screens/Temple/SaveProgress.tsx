import type { TempleSubState } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SaveProgress({
  sub,
}: {
  sub: Extract<TempleSubState, { kind: "saving" | "saveDone" | "saveError" }>;
}) {
  const t = useT();

  if (sub.kind === "saving") {
    return (
      <div className="menu-screen">
        <Frame title={t("temple.saving.title")}>
          <p>{t("temple.saving.body")}</p>
        </Frame>
      </div>
    );
  }

  if (sub.kind === "saveDone") {
    return (
      <div className="menu-screen">
        <Frame title={t("temple.saveDone.title")}>
          <p>{t("temple.saveDone.body")}</p>
          <Menu
            items={[
              {
                hotkey: "O",
                label: t("common.ok"),
                onSelect: () => dispatch({ type: "dismissSaveResult" }),
              },
            ]}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className="menu-screen">
      <Frame title={t("temple.saveError.title")}>
        <p>{sub.reason}</p>
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: () => dispatch({ type: "dismissSaveResult" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
