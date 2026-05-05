import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type WizardryDB } from './schema';

let _db: IDBPDatabase<WizardryDB> | null = null;

export async function openWizardryDB(): Promise<IDBPDatabase<WizardryDB>> {
  if (_db) return _db;
  _db = await openDB<WizardryDB>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        const slots = d.createObjectStore('saveSlot', { keyPath: 'id', autoIncrement: true });
        slots.createIndex('by-updatedAt', 'updatedAt');
        const chars = d.createObjectStore('character', { keyPath: 'id', autoIncrement: true });
        chars.createIndex('by-slotId', 'slotId');
        d.createObjectStore('settings');
        d.createObjectStore('meta');
      }
    },
  });
  return _db;
}

/** テスト用: in-memory IDB を再初期化するためのリセット (fake-indexeddb 使用時) */
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
    const v = await idb.get('settings', key);
    return v ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const idb = await openWizardryDB();
    await idb.put('settings', value, key);
  },

  // listSlots / saveState / loadState / deleteSlot は M5 で実装
};
