import { useGameStore } from "@/store/gameStore";
import { RestartList } from "./RestartList";
import { UtilitiesMenu } from "./UtilitiesMenu";

export function Utilities() {
  const sub = useGameStore((s) => (s.state.phase === "utilities" ? s.state.sub : null));
  if (!sub) return null;
  if (sub.kind === "restartList") return <RestartList />;
  return <UtilitiesMenu />;
}
