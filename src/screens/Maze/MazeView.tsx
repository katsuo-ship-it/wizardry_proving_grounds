import { MAZE_L1 } from "@/engine/data/maze/level1";
import { useT } from "@/i18n/useT";
import { renderMazeView } from "@/render/maze/render";
import { gameStore, useGameStore } from "@/store/gameStore";
import { useEffect, useRef } from "react";
import "./Maze.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function MazeView() {
  const t = useT();
  const pos = useGameStore((s) => (s.state.phase === "maze" ? s.state.pos : null));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas 描画 (state 変化時のみ)
  useEffect(() => {
    if (!pos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderMazeView(ctx, MAZE_L1, pos);
  }, [pos]);

  // キー入力
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      if (e.repeat) return; // 連打抑制
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          dispatch({ type: "moveForward" });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          dispatch({ type: "moveBackward" });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          dispatch({ type: "turnLeft" });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          dispatch({ type: "turnRight" });
          break;
        case "c":
        case "C":
          e.preventDefault();
          dispatch({ type: "openCamp" });
          break;
        case "Enter":
          e.preventDefault();
          dispatch({ type: "ascendStairs" });
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!pos) return null;

  return (
    <div className="maze-screen">
      <canvas ref={canvasRef} width={280} height={192} className="maze-canvas" />
      <div className="maze-status">
        <span>L{pos.level}</span>
        <span>
          ({pos.x}, {pos.y})
        </span>
        <span>{pos.dir.toUpperCase()}</span>
        <span className="maze-hint">{t("maze.hint")}</span>
      </div>
    </div>
  );
}
