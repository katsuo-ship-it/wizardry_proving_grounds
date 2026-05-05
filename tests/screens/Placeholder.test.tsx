import { App } from "@/App";
import { EMPTY_PARTY, type GameState } from "@/engine/state/types";
import { gameStore } from "@/store/gameStore";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("placeholder screens render via App", () => {
  beforeEach(() => {
    cleanup();
    gameStore.setState({
      state: { phase: "title", sub: { kind: "main" } },
      lang: "en",
      isAnimating: false,
      isBusy: false,
      inputQueue: [],
    });
  });

  it.each([
    // training/tavern/boltac/inn は M3 で実画面化済 (除外)
    ["temple", "Temple of Cant", "Save feature"],
    ["utilities", "Utilities", "Restart Out Party"],
    ["maze", "The Maze", "Dungeon exploration"],
  ] as const)("renders %s with title and placeholder body", (phase, title, bodyContains) => {
    gameStore.setState({
      state: { phase, sub: { kind: "menu" }, party: EMPTY_PARTY } as GameState,
    });
    render(<App />);
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(bodyContains))).toBeInTheDocument();
  });

  it("Back button on Temple (placeholder) transitions to Castle", () => {
    gameStore.setState({
      state: { phase: "temple", sub: { kind: "menu" }, party: EMPTY_PARTY },
    });
    render(<App />);
    fireEvent.click(screen.getByText(/Back/));
    expect(gameStore.getState().state.phase).toBe("castle");
  });

  it("Back button on Maze transitions to Edge of Town", () => {
    gameStore.setState({
      state: { phase: "maze", sub: { kind: "menu" }, party: EMPTY_PARTY },
    });
    render(<App />);
    fireEvent.click(screen.getByText(/Back/));
    expect(gameStore.getState().state.phase).toBe("edgeOfTown");
  });
});
