import { eligibleClasses } from "@/engine/rules/character";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateClass({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  const eligible = eligibleClasses(draft.attributes, draft.alignment);

  if (eligible.length === 0) {
    return (
      <div className="menu-screen">
        <Frame title={t("training.create.class.title")}>
          <p>{t("training.create.class.noneEligible")}</p>
          <Menu
            items={[
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

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.class.title")}>
        <Menu
          items={[
            ...eligible.map((cid, i) => ({
              hotkey: String(i + 1),
              label: t(`class.${cid}`),
              onSelect: () => dispatch({ type: "pickClass", klass: cid }),
            })),
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
