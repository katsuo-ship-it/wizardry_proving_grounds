import { useGameStore } from "@/store/gameStore";
import { InnMenu } from "./InnMenu";
import { PickGuest } from "./PickGuest";
import { RestStables } from "./RestStables";

export function Inn() {
  const sub = useGameStore((s) => (s.state.phase === "inn" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <InnMenu />;
    case "pickGuest":
      return <PickGuest />;
    case "rest":
      return <RestStables guest={sub.guest} />;
  }
}
