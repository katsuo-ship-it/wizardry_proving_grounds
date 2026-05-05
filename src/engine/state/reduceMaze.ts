import { MAZE_L1 } from "@/engine/data/maze/level1";
import { getCell } from "@/engine/data/maze/lookup";
import { advance, canMoveForward, reverse, turnLeft, turnRight } from "@/engine/rules/movement";
import type { GameEvent, GameState } from "./types";

export function reduceMaze(
  state: Extract<GameState, { phase: "maze" }>,
  event: GameEvent,
): GameState {
  const { pos, party } = state;
  const level = MAZE_L1; // M4 では L1 のみ

  switch (event.type) {
    case "turnLeft":
      return { ...state, pos: { ...pos, dir: turnLeft(pos.dir) } };
    case "turnRight":
      return { ...state, pos: { ...pos, dir: turnRight(pos.dir) } };
    case "moveForward": {
      if (!canMoveForward(level, pos)) return state;
      return { ...state, pos: advance(pos) };
    }
    case "moveBackward": {
      // 後退: 方向は変えず、reverse 方向への移動可否を判定して位置だけ更新
      const back = { ...pos, dir: reverse(pos.dir) };
      if (!canMoveForward(level, back)) return state;
      const advanced = advance(back);
      return { ...state, pos: { ...advanced, dir: pos.dir } };
    }
    case "openCamp":
      return {
        phase: "camp",
        sub: { kind: "menu" },
        pos,
        party,
      };
    case "ascendStairs": {
      const cell = getCell(level, pos.x, pos.y);
      if (cell?.special === "stairsUp") {
        return {
          phase: "edgeOfTown",
          sub: { kind: "menu" },
          party: { ...party, status: "inTown" },
        };
      }
      return state;
    }
    case "descendStairs":
      // M4 では B2F なし。Chapter 4 で実装。
      return state;
    default:
      return state;
  }
}
