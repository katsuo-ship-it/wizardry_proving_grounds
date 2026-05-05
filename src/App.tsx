import { Title } from "@/screens/Title";
import { useGameStore } from "@/store/gameStore";

export function App() {
  const phase = useGameStore((s) => s.state.phase);
  switch (phase) {
    case "title":
      return <Title />;
    default:
      return <div>Unknown phase: {phase}</div>;
  }
}
