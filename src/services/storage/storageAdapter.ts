import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';

export interface StorageAdapter {
  debugLabel?: string;
  getDebugLabel?: () => string;
  loadState: () => Promise<StorageState | null>;
  saveState: (state: StorageState) => Promise<void>;
}

export function getStorageDebugLabel(adapter: StorageAdapter): string {
  return adapter.getDebugLabel?.() ?? adapter.debugLabel ?? 'Custom adapter';
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
