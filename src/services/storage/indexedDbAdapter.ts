import type { StorageState } from 'src/types/storage';

import { createEmptyStorageState, type StorageAdapter } from './storageAdapter';

const DB_NAME = 'volition';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const STATE_KEY = 'appState';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function readState(database: IDBDatabase): Promise<StorageState | null> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => {
      const value = request.result;
      resolve((value as StorageState | undefined) ?? null);
    };

    request.onerror = () => reject(request.error ?? new Error('Failed to read app state'));
  });
}

function writeState(database: IDBDatabase, state: StorageState): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Failed to persist app state'));

    store.put(state, STATE_KEY);
  });
}

export const indexedDbAdapter: StorageAdapter = {
  async loadState() {
    if (typeof indexedDB === 'undefined') {
      return null;
    }

    const database = await openDb();

    try {
      const state = await readState(database);
      return state ?? createEmptyStorageState();
    } finally {
      database.close();
    }
  },

  async saveState(state) {
    if (typeof indexedDB === 'undefined') {
      return;
    }

    const database = await openDb();

    try {
      await writeState(database, state);
    } finally {
      database.close();
    }
  },
};
