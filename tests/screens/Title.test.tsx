import { Title } from "@/screens/Title";
import { gameStore } from "@/store/gameStore";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("<Title>", () => {
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

  it("renders New Game / Continue / Settings menu", () => {
    render(<Title />);
    expect(screen.getByText("New Game")).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows Settings screen when Settings button clicked", () => {
    render(<Title />);
    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByText(/Language/)).toBeInTheDocument();
  });

  it("switches language when changed", () => {
    render(<Title />);
    fireEvent.click(screen.getByText("Settings"));
    fireEvent.click(screen.getByText(/日本語/));
    fireEvent.click(screen.getByText(/タイトルに もどる/));
    expect(screen.getByText("はじめから")).toBeInTheDocument();
  });
});
