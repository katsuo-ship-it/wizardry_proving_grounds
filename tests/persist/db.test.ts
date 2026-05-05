import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { db, resetDbInstance } from "@/persist/db";

describe("db settings API", () => {
  beforeEach(async () => {
    resetDbInstance();
    indexedDB.deleteDatabase("wizardry-proving-grounds");
    await db.init();
  });

  it("setSetting then getSetting returns the value", async () => {
    await db.setSetting("lang", "ja");
    const v = await db.getSetting("lang");
    expect(v).toBe("ja");
  });

  it("getSetting returns null for unset keys", async () => {
    const v = await db.getSetting("nonexistent");
    expect(v).toBeNull();
  });
});
