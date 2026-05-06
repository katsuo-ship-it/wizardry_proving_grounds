import { openWizardryDB } from "./db";

const TEST_KEY = "__healthcheck__wizardry__";

/**
 * IndexedDB が動作するか簡易検証する。
 * settings store に 1 件 put → get → delete を試み、
 * 例外が出ないかつ値が一致すれば healthy。
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    if (typeof indexedDB === "undefined") return false;
    const idb = await openWizardryDB();
    await idb.put("settings", "ok", TEST_KEY);
    const v = await idb.get("settings", TEST_KEY);
    await idb.delete("settings", TEST_KEY);
    return v === "ok";
  } catch {
    return false;
  }
}
