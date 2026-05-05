import { useGameStore } from "@/store/gameStore";
import { CharacterInspect } from "./CharacterInspect";
import { CharacterList } from "./CharacterList";
import { CreateAlignment } from "./CreateAlignment";
import { CreateAttributes } from "./CreateAttributes";
import { CreateClass } from "./CreateClass";
import { CreateConfirm } from "./CreateConfirm";
import { CreateName } from "./CreateName";
import { CreateRace } from "./CreateRace";
import { DeleteConfirm } from "./DeleteConfirm";
import "./Training.css";

export function Training() {
  const sub = useGameStore((s) => (s.state.phase === "training" ? s.state.sub : null));
  if (!sub) return null;

  switch (sub.kind) {
    case "menu":
      return <CharacterList />;
    case "inspecting":
      return <CharacterInspect characterId={sub.characterId} />;
    case "deleteConfirm":
      return <DeleteConfirm characterId={sub.characterId} />;
    case "creating":
      switch (sub.step) {
        case "name":
          return <CreateName draft={sub.draft} />;
        case "race":
          return <CreateRace draft={sub.draft} />;
        case "alignment":
          return <CreateAlignment />;
        case "rollAttributes":
        case "allocateBonus":
          return <CreateAttributes draft={sub.draft} step={sub.step} />;
        case "pickClass":
          return <CreateClass draft={sub.draft} />;
        case "confirm":
          return <CreateConfirm draft={sub.draft} />;
      }
  }
}
