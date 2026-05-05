import { Boltac } from "@/screens/Boltac";
import { Castle } from "@/screens/Castle";
import { EdgeOfTown } from "@/screens/EdgeOfTown";
import { Inn } from "@/screens/Inn";
import { Maze } from "@/screens/Maze";
import { Tavern } from "@/screens/Tavern";
import { Temple } from "@/screens/Temple";
import { Title } from "@/screens/Title";
import { Training } from "@/screens/Training";
import { Utilities } from "@/screens/Utilities";
import { useGameStore } from "@/store/gameStore";

export function App() {
  const phase = useGameStore((s) => s.state.phase);
  switch (phase) {
    case "title":
      return <Title />;
    case "edgeOfTown":
      return <EdgeOfTown />;
    case "castle":
      return <Castle />;
    case "training":
      return <Training />;
    case "utilities":
      return <Utilities />;
    case "tavern":
      return <Tavern />;
    case "boltac":
      return <Boltac />;
    case "temple":
      return <Temple />;
    case "inn":
      return <Inn />;
    case "maze":
      return <Maze />;
    default:
      return <div>Unknown phase: {phase}</div>;
  }
}
