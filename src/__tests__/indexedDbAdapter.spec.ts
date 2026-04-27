import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { indexedDbAdapter } from 'src/services/storage/indexedDbAdapter';
import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error(`Failed to delete indexedDB database: ${name}`));
    request.onblocked = () => resolve();
  });
}

afterEach(async () => {
  await deleteDatabase('volition');
});

describe('indexedDbAdapter', () => {
  it('returns empty state when database has no saved value', async () => {
    const state = await indexedDbAdapter.loadState();

    expect(state).toEqual({
      meta: { schemaVersion: SCHEMA_VERSION },
      tasks: {},
      checkinsByDay: {},
      taskOrder: [],
    });
  });

  it('persists and loads state', async () => {
    const sampleState: StorageState = {
      meta: { schemaVersion: SCHEMA_VERSION },
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Sports',
          targetPerWeek: 3,
          createdAt: '2026-02-08T10:00:00.000Z',
        },
      },
      checkinsByDay: {
        '2026-02-08': {
          'task-1': {
            taskId: 'task-1',
            day: '2026-02-08',
            checkedAt: '2026-02-08T10:10:00.000Z',
          },
        },
      },
      taskOrder: ['task-1'],
    };

    await indexedDbAdapter.saveState(sampleState);
    const loaded = await indexedDbAdapter.loadState();

    expect(loaded).toEqual(sampleState);
  });

  it('returns null / no-op when indexedDB is unavailable', async () => {
    const originalIndexedDb = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      configurable: true,
    });

    await expect(indexedDbAdapter.loadState()).resolves.toBeNull();
    await expect(
      indexedDbAdapter.saveState({
        meta: { schemaVersion: SCHEMA_VERSION },
        tasks: {},
        checkinsByDay: {},
        taskOrder: [],
      }),
    ).resolves.toBeUndefined();

    Object.defineProperty(globalThis, 'indexedDB', {
      value: originalIndexedDb,
      configurable: true,
    });
  });
});
