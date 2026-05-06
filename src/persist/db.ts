import type { Character, GameState, SaveSlotInfo } from "@/engine/state/types";
import { type IDBPDatabase, openDB } from "idb";
import { DB_NAME, DB_VERSION, type WizardryDB } from "./schema";
import { deserializeState, serializeState } from "./serialize";

let _db: IDBPDatabase<WizardryDB> | null = null;

export async function openWizardryDB(): Promise<IDBPDatabase<WizardryDB>> {
  if (_db) return _db;
  _db = await openDB<WizardryDB>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        const slots = d.createObjectStore("saveSlot", { keyPath: "id", autoIncrement: true });
        slots.createIndex("by-updatedAt", "updatedAt");
        const chars = d.createObjectStore("character", { keyPath: "id", autoIncrement: true });
        chars.createIndex("by-slotId", "slotId");
        d.createObjectStore("settings");
        d.createObjectStore("meta");
      }
    },
  });
  return _db;
}

/** Blob を文字列に変換する (FileReader で jsdom + native 両対応) */
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/** テスト用: in-memory IDB を再初期化するためのリセット */
export function resetDbInstance(): void {
  if (_db) {
    _db.close();
  }
  _db = null;
}

export const db = {
  async init(): Promise<void> {
    await openWizardryDB();
  },

  async getSetting(key: string): Promise<string | null> {
    const idb = await openWizardryDB();
    const v = await idb.get("settings", key);
    return v ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const idb = await openWizardryDB();
    await idb.put("settings", value, key);
  },

  // Character CRUD (M3)
  async listCharacters(slotId: number): Promise<Character[]> {
    const idb = await openWizardryDB();
    return idb.getAllFromIndex("character", "by-slotId", slotId);
  },

  async addCharacter(c: Omit<Character, "id">): Promise<number> {
    const idb = await openWizardryDB();
    return (await idb.add("character", c as Character)) as number;
  },

  async updateCharacter(c: Character): Promise<void> {
    const idb = await openWizardryDB();
    await idb.put("character", c);
  },

  async getCharacter(id: number): Promise<Character | undefined> {
    const idb = await openWizardryDB();
    return idb.get("character", id);
  },

  async deleteCharacter(id: number): Promise<void> {
    const idb = await openWizardryDB();
    await idb.delete("character", id);
  },

  // SaveSlot (M5)
  async listSlots(): Promise<SaveSlotInfo[]> {
    const idb = await openWizardryDB();
    const all = await idb.getAll("saveSlot");
    return all
      .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async deleteSlot(id: number): Promise<void> {
    const idb = await openWizardryDB();
    const tx = idb.transaction(["saveSlot", "character"], "readwrite");
    const charsToDelete = await tx.objectStore("character").index("by-slotId").getAllKeys(id);
    for (const ck of charsToDelete) {
      await tx.objectStore("character").delete(ck);
    }
    await tx.objectStore("saveSlot").delete(id);
    await tx.done;
  },

  /**
   * セーブを単一トランザクションで原子的に書き込む。
   * 設計書 Section 6 「トランザクション制御」準拠。
   */
  async saveStateAtomic(args: {
    slotId: number | undefined;
    name: string;
    state: GameState;
    changedCharacters: Character[];
  }): Promise<number> {
    const idb = await openWizardryDB();
    const tx = idb.transaction(["saveSlot", "character"], "readwrite");
    const now = Date.now();

    for (const c of args.changedCharacters) {
      await tx.objectStore("character").put(c);
    }

    let id: number;
    if (args.slotId === undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: idb autoIncrement add accepts value without id
      id = (await tx.objectStore("saveSlot").add({
        name: args.name,
        createdAt: now,
        updatedAt: now,
        gameState: serializeState(args.state),
        // biome-ignore lint/suspicious/noExplicitAny: see above
      } as any)) as number;
    } else {
      id = args.slotId;
      const existing = await tx.objectStore("saveSlot").get(id);
      if (!existing) throw new Error(`saveSlot ${id} not found`);
      await tx.objectStore("saveSlot").put({
        ...existing,
        name: args.name,
        updatedAt: now,
        gameState: serializeState(args.state),
      });
    }

    await tx.done;
    return id;
  },

  async loadStateAtomic(slotId: number): Promise<{ state: GameState; characters: Character[] }> {
    const idb = await openWizardryDB();
    const tx = idb.transaction(["saveSlot", "character"], "readonly");
    const slot = await tx.objectStore("saveSlot").get(slotId);
    const chars = await tx.objectStore("character").index("by-slotId").getAll(slotId);
    await tx.done;
    if (!slot) throw new Error(`saveSlot ${slotId} not found`);
    return {
      state: deserializeState(slot.gameState),
      characters: chars,
    };
  },

  /** 全データを JSON Blob としてエクスポート (バックアップ用) */
  async exportAll(): Promise<Blob> {
    const idb = await openWizardryDB();
    const tx = idb.transaction(["saveSlot", "character", "settings", "meta"], "readonly");
    const data = {
      version: 1,
      exportedAt: Date.now(),
      saveSlot: await tx.objectStore("saveSlot").getAll(),
      character: await tx.objectStore("character").getAll(),
      settings: await tx.objectStore("settings").getAll(),
      meta: await tx.objectStore("meta").getAll(),
    };
    await tx.done;
    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  },

  /** JSON Blob から replace モードでインポート (M5 では merge 未実装) */
  async importAll(json: Blob, mode: "replace" | "merge"): Promise<void> {
    if (mode !== "replace") {
      throw new Error("importAll merge mode not implemented (M5)");
    }
    // FileReader 経由で text 化 (jsdom + native 両対応)
    const text = await blobToText(json);
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("importAll: invalid JSON structure");
    }
    const obj = parsed as Record<string, unknown>;
    const idb = await openWizardryDB();
    const tx = idb.transaction(["saveSlot", "character", "settings", "meta"], "readwrite");
    await tx.objectStore("saveSlot").clear();
    await tx.objectStore("character").clear();
    await tx.objectStore("settings").clear();
    await tx.objectStore("meta").clear();
    // biome-ignore lint/suspicious/noExplicitAny: dynamic JSON shapes
    for (const s of (obj.saveSlot as any[]) ?? []) await tx.objectStore("saveSlot").put(s);
    // biome-ignore lint/suspicious/noExplicitAny: dynamic JSON shapes
    for (const c of (obj.character as any[]) ?? []) await tx.objectStore("character").put(c);
    // biome-ignore lint/suspicious/noExplicitAny: dynamic JSON shapes
    for (const s of (obj.settings as any[]) ?? []) await tx.objectStore("settings").put(s);
    // biome-ignore lint/suspicious/noExplicitAny: dynamic JSON shapes
    for (const m of (obj.meta as any[]) ?? []) await tx.objectStore("meta").put(m);
    await tx.done;
  },
};
