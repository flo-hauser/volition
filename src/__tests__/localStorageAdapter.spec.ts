import { beforeEach, describe, expect, it } from 'vitest';

import { localStorageAdapter } from 'src/services/storage/localStorageAdapter';
import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';

const STORAGE_KEY = 'volition.appState';

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty state when storage has no value', async () => {
    const state = await localStorageAdapter.loadState();

    expect(state).toEqual({
      meta: { schemaVersion: SCHEMA_VERSION },
      tasks: {},
      checkinsByDay: {},
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
    };

    await localStorageAdapter.saveState(sampleState);
    const loaded = await localStorageAdapter.loadState();

    expect(loaded).toEqual(sampleState);
  });

  it('drops invalid json and returns empty state', async () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json');

    const loaded = await localStorageAdapter.loadState();

    expect(loaded).toEqual({
      meta: { schemaVersion: SCHEMA_VERSION },
      tasks: {},
      checkinsByDay: {},
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns empty state for wrong shape', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));

    const loaded = await localStorageAdapter.loadState();

    expect(loaded).toEqual({
      meta: { schemaVersion: SCHEMA_VERSION },
      tasks: {},
      checkinsByDay: {},
    });
  });

  it('returns null and no-ops if localStorage is unavailable', async () => {
    const original = globalThis.localStorage;

    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      configurable: true,
    });

    await expect(localStorageAdapter.loadState()).resolves.toBeNull();
    await expect(
      localStorageAdapter.saveState({
        meta: { schemaVersion: SCHEMA_VERSION },
        tasks: {},
        checkinsByDay: {},
      }),
    ).resolves.toBeUndefined();

    Object.defineProperty(globalThis, 'localStorage', {
      value: original,
      configurable: true,
    });
  });
});
