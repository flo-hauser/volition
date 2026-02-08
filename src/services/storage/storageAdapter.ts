import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';

export interface StorageAdapter {
  loadState: () => Promise<StorageState | null>;
  saveState: (state: StorageState) => Promise<void>;
}

export function createEmptyStorageState(): StorageState {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
    },
    tasks: {},
    checkinsByDay: {},
  };
}
