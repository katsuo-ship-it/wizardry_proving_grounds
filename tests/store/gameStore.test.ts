import { createGameStore } from "@/store/gameStore";
import { beforeEach, describe, expect, it } from "vitest";

describe("gameStore", () => {
  let store: ReturnType<typeof createGameStore>;

  beforeEach(() => {
    store = createGameStore();
  });

  it("initial state is title.main", () => {
    expect(store.getState().state).toEqual({ phase: "title", sub: { kind: "main" } });
  });

  it("initial lang is en", () => {
    expect(store.getState().lang).toBe("en");
  });

  it("dispatch openSettings transitions to settings", () => {
    store.getState().dispatch({ type: "openSettings" });
    expect(store.getState().state.sub).toEqual({ kind: "settings" });
  });

  it("dispatch changeLanguage updates lang directly (bypasses reducer)", () => {
    store.getState().dispatch({ type: "changeLanguage", lang: "ja" });
    expect(store.getState().lang).toBe("ja");
    expect(store.getState().state).toEqual({ phase: "title", sub: { kind: "main" } });
  });

  it("dispatch when isAnimating queues input", () => {
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: "openSettings" });
    expect(store.getState().state.sub).toEqual({ kind: "main" });
    expect(store.getState().inputQueue).toHaveLength(1);
  });

  it("queue is bounded at MAX_QUEUED_INPUTS = 1", () => {
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: "openSettings" });
    store.getState().dispatch({ type: "openContinue" });
    store.getState().dispatch({ type: "openSettings" });
    expect(store.getState().inputQueue).toHaveLength(1);
  });
});
