import { useGameStore } from "@/store/gameStore";
import { SaveNameInput } from "./SaveNameInput";
import { SavePicker } from "./SavePicker";
import { SaveProgress } from "./SaveProgress";
import { TempleMenu } from "./TempleMenu";

export function Temple() {
  const sub = useGameStore((s) => (s.state.phase === "temple" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <TempleMenu />;
    case "savePicker":
      return <SavePicker />;
    case "saveNameInput":
      return <SaveNameInput slotId={sub.slotId} />;
    case "saving":
    case "saveDone":
    case "saveError":
      return <SaveProgress sub={sub} />;
  }
}
