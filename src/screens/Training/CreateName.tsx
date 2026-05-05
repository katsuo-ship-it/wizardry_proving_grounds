import type { CharacterDraft } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function CreateName({ draft }: { draft: CharacterDraft }) {
  const t = useT();
  const [name, setName] = useState(draft.name);

  const submit = (): void => {
    const trimmed = name.trim();
    if (trimmed) dispatch({ type: "inputName", name: trimmed });
  };

  return (
    <div className="menu-screen">
      <Frame title={t("training.create.name.title")}>
        <p>{t("training.create.name.prompt")}</p>
        <input
          type="text"
          className="training-input"
          maxLength={8}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            // 矢印キーが Menu に拾われないよう stopPropagation
            e.stopPropagation();
          }}
          // biome-ignore lint/a11y/noAutofocus: this is the only input on the screen
          autoFocus
        />
        <Menu
          items={[
            {
              hotkey: "O",
              label: t("common.ok"),
              onSelect: submit,
              disabled: !name.trim(),
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
