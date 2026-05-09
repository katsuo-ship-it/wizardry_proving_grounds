import { MAZE_L1 } from "@/engine/data/maze/level1";
import type { MazePosition } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { CameraAnimator, targetFromPosition } from "@/render/maze/camera";
import { mountView } from "@/render/maze/view";
import { gameStore, useGameStore } from "@/store/gameStore";
import { useEffect, useRef } from "react";
import "./Maze.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

const FORWARD_MS = 150;
const TURN_MS = 200;

export function MazeView() {
  const pos = useGameStore((s) => (s.state.phase === "maze" ? s.state.pos : null));
  if (!pos) return null;
  return <MazeViewInner pos={pos} />;
}

function MazeViewInner({ pos }: { pos: MazePosition }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ReturnType<typeof mountView> | null>(null);
  const animatorRef = useRef<CameraAnimator | null>(null);
  const lastPosRef = useRef<MazePosition | null>(null);

  // Three.js View 初期化 — pos が必ず非 null なので unconditional
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect; pos captured for initial camera position only
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = mountView(canvas, MAZE_L1);
    const initial = targetFromPosition(pos);
    view.setTarget(initial);
    view.render();
    viewRef.current = view;
    animatorRef.current = new CameraAnimator(initial);
    lastPosRef.current = pos;
    return () => {
      view.dispose();
      animatorRef.current?.cancel();
      viewRef.current = null;
      animatorRef.current = null;
    };
    // pos は初期 mount 時にのみ参照、以降は次の useEffect が処理
  }, []);

  // pos 変化に応じて補間アニメーション
  useEffect(() => {
    if (!viewRef.current || !animatorRef.current) return;
    const last = lastPosRef.current;
    // Skip when pos has not actually changed (covers initial mount and no-op dispatches)
    if (
      last &&
      last.level === pos.level &&
      last.x === pos.x &&
      last.y === pos.y &&
      last.dir === pos.dir
    ) {
      return;
    }
    if (!last) {
      lastPosRef.current = pos;
      return;
    }
    const target = targetFromPosition(pos);
    const isTurn = last.x === pos.x && last.y === pos.y && last.dir !== pos.dir;
    const duration = isTurn ? TURN_MS : FORWARD_MS;
    animatorRef.current.animateTo(target, duration, (frame) => {
      viewRef.current?.setTarget(frame);
      viewRef.current?.render();
    });
    lastPosRef.current = pos;
  }, [pos]);

  // キー入力 (旧コードからそのまま継承)
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      if (e.repeat) return;
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
