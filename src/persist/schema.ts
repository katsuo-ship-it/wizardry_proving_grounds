import type { Character } from "@/engine/state/types";
import type { DBSchema } from "idb";

export const DB_NAME = "wizardry-proving-grounds";
export const DB_VERSION = 1;

export interface WizardryDB extends DBSchema {
  saveSlot: {
    key: number;
    value: {
      id: number;
      name: string;
      createdAt: number;
      updatedAt: number;
      gameState: string;
    };
    indexes: { "by-updatedAt": number };
  };
  character: {
    key: number;
    value: Character;
    indexes: { "by-slotId": number };
  };
  settings: {
    key: string;
    value: string;
  };
  meta: {
    key: string;
    value: string | number;
  };
}
