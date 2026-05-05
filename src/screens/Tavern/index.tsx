import { useGameStore } from "@/store/gameStore";
import { AddMember } from "./AddMember";
import { TavernMenu } from "./TavernMenu";

export function Tavern() {
  const sub = useGameStore((s) => (s.state.phase === "tavern" ? s.state.sub : null));
  if (!sub) return null;
  if (sub.kind === "addMember") return <AddMember />;
  return <TavernMenu />;
}
