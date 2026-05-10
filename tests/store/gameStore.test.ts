import { db, resetDbInstance } from "@/persist/db";
import { createGameStore } from "@/store/gameStore";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

describe("gameStore", () => {
  let store: ReturnType<typeof createGameStore>;

  beforeEach(async () => {
    // changeLanguage が fire-and-forget で db.setSetting を呼ぶようになったため、
    // テスト間で IDB を毎回 reset しないと in-flight 操作が次テストの deleteDatabase を
    // ブロックする。save.test.ts と同じパターン。
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
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
    expect(store.getState().state).toEqual({ phase: "title", sub: { kind: "settings" } });
  });

  it("dispatch changeLanguage updates lang directly (bypasses reducer)", () => {
    store.getState().dispatch({ type: "changeLanguage", lang: "ja" });
    expect(store.getState().lang).toBe("ja");
    expect(store.getState().state).toEqual({ phase: "title", sub: { kind: "main" } });
  });

  it("dispatch when isAnimating queues input", () => {
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: "openSettings" });
    expect(store.getState().state).toEqual({ phase: "title", sub: { kind: "main" } });
    expect(store.getState().inputQueue).toHaveLength(1);
  });

  it("queue is bounded at MAX_QUEUED_INPUTS = 1", () => {
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: "openSettings" });
    store.getState().dispatch({ type: "openContinue" });
    store.getState().dispatch({ type: "openSettings" });
    expect(store.getState().inputQueue).toHaveLength(1);
  });

  it("changeLanguage persists the lang to IndexedDB", async () => {
    expect(store.getState().lang).toBe("en");

    store.getState().dispatch({ type: "changeLanguage", lang: "ja" });

    // Zustand store は同期更新
    expect(store.getState().lang).toBe("ja");

    // setSetting は fire-and-forget なので microtask flush 待ち
    await new Promise((r) => setTimeout(r, 10));
    expect(await db.getSetting("lang")).toBe("ja");
  });
});
