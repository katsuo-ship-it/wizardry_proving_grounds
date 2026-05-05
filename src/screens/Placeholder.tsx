import type { MessageKey } from "@/i18n/messages";
import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import "./Placeholder.css";

interface PlaceholderProps {
  titleKey: MessageKey;
  bodyKey: MessageKey;
  backLabelKey: MessageKey;
}

export function Placeholder({ titleKey, bodyKey, backLabelKey }: PlaceholderProps) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t(titleKey)}>
        <p className="placeholder-body">{t(bodyKey)}</p>
        <Menu
          items={[
            {
              hotkey: "B",
              label: t(backLabelKey),
              onSelect: () => gameStore.getState().dispatch({ type: "goBack" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
