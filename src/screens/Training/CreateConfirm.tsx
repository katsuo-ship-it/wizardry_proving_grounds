import { makeCharacterFromDraft } from "@/engine/rules/character";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const SLOT_ID = 1;

export function CreateConfirm({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.confirm.title")}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            {t("common.label.name")}: {draft.name}
          </li>
          <li>
            {t("common.label.race")}: {t(`race.${draft.race}`)}
          </li>
          <li>
            {t("common.label.alignment")}: {t(`alignment.${draft.alignment}`)}
          </li>
          <li>
            {t("common.label.class")}:{" "}
            {draft.selectedClass ? t(`class.${draft.selectedClass}`) : ""}
          </li>
        </ul>
        <Menu
          items={[
            {
              hotkey: "Y",
              label: t("common.yes"),
              onSelect: async () => {
                try {
                  const c = makeCharacterFromDraft(draft, SLOT_ID, Date.now());
                  await db.addCharacter(c);
                  dispatch({ type: "confirmCharacter" });
                } catch (err) {
                  console.error("addCharacter failed", err);
                  dispatch({ type: "cancelCreate" });
                }
              },
            },
            {
              hotkey: "N",
              label: t("common.no"),
              onSelect: () => dispatch({ type: "cancelCreate" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
