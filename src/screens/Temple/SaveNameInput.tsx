import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function SaveNameInput({ slotId: _slotId }: { slotId: number | undefined }) {
  const t = useT();
  const [name, setName] = useState("");

  const submit = (): void => {
    const trimmed = name.trim();
    if (trimmed) dispatch({ type: "inputSaveName", name: trimmed });
  };

  return (
    <div className="menu-screen">
      <Frame title={t("temple.saveNameInput.title")}>
        <p>{t("temple.saveNameInput.prompt")}</p>
        <input
          type="text"
          className="training-input"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            e.stopPropagation();
          }}
          // biome-ignore lint/a11y/noAutofocus: only input on screen
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
              onSelect: () => dispatch({ type: "cancelSave" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
