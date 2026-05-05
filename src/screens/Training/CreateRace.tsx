import { RACE_IDS } from "@/engine/data/races";
import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const HOTKEYS: Record<string, string> = {
  human: "H",
  elf: "E",
  dwarf: "D",
  gnome: "G",
  hobbit: "O",
};

export function CreateRace({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t("training.create.race.title")}>
        <p>{t("training.create.race.prompt", { name: draft.name })}</p>
        <Menu
          items={[
            ...RACE_IDS.map((id) => ({
              hotkey: HOTKEYS[id] ?? id[0]!.toUpperCase(),
              label: t(`race.${id}` as never),
              onSelect: () => dispatch({ type: "pickRace", race: id }),
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
