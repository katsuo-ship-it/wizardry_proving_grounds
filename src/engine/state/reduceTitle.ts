import type { GameEvent, GameState } from "./types";
import { EMPTY_PARTY } from "./types";

export function reduceTitle(state: GameState & { phase: "title" }, event: GameEvent): GameState {
  const { sub } = state;

  switch (event.type) {
    case "startGame":
      if (sub.kind === "main") {
        return { phase: "edgeOfTown", sub: { kind: "menu" }, party: EMPTY_PARTY };
      }
      return state;

    case "openContinue":
      return { phase: "title", sub: { kind: "continueMenu", slots: [] } };

    case "openSettings":
      return { phase: "title", sub: { kind: "settings" } };

    case "closeSettings":
      if (sub.kind === "settings") {
        return { phase: "title", sub: { kind: "main" } };
      }
      return state;

    case "closeContinueMenu":
      if (sub.kind === "continueMenu") {
        return { phase: "title", sub: { kind: "main" } };
      }
      // loadError 表示時にも main へ戻れるように
      if (sub.kind === "loadError") {
        return { phase: "title", sub: { kind: "main" } };
      }
      return state;

    case "continueGame":
      if (sub.kind === "continueMenu") {
        return { phase: "title", sub: { kind: "loading", slotId: event.slotId } };
      }
      return state;

    case "loadSucceeded":
      if (sub.kind === "loading") {
        // ロード完了: 復元された state で完全置換
        return event.state;
      }
      return state;

    case "loadFailed":
      if (sub.kind === "loading") {
        return { phase: "title", sub: { kind: "loadError", reason: event.reason } };
      }
      return state;

    default:
      return state;
  }
}
