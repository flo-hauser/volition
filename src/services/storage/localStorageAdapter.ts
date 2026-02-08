import type { StorageState } from 'src/types/storage';

import { createEmptyStorageState, type StorageAdapter } from './storageAdapter';

const STORAGE_KEY = 'volition.appState';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStorageStateLike(value: unknown): value is StorageState {
  if (!isRecord(value)) {
    return false;
  }

  const meta = value.meta;
  const tasks = value.tasks;
  const checkinsByDay = value.checkinsByDay;

  return isRecord(meta) && typeof meta.schemaVersion === 'number' && isRecord(tasks) && isRecord(checkinsByDay);
}

export const localStorageAdapter: StorageAdapter = {
  loadState() {
    if (typeof localStorage === 'undefined') {
      return Promise.resolve(null);
    }

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return Promise.resolve(createEmptyStorageState());
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isStorageStateLike(parsed)) {
        return Promise.resolve(parsed);
      }
    } catch {
      // Drop invalid persisted state and start clean.
      localStorage.removeItem(STORAGE_KEY);
      return Promise.resolve(createEmptyStorageState());
    }

    return Promise.resolve(createEmptyStorageState());
  },

  saveState(state) {
    if (typeof localStorage === 'undefined') {
      return Promise.resolve();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return Promise.resolve();
  },
};
