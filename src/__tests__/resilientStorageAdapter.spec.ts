import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createResilientStorageAdapter } from 'src/services/storage/resilientStorageAdapter';
import type { StorageAdapter } from 'src/services/storage/storageAdapter';
import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';

const EMPTY_STATE: StorageState = {
  meta: { schemaVersion: SCHEMA_VERSION },
  tasks: {},
  checkinsByDay: {},
};

describe('resilientStorageAdapter', () => {
  let primary: StorageAdapter;
  let fallback: StorageAdapter;

  beforeEach(() => {
    primary = {
      debugLabel: 'IndexedDB',
      loadState: vi.fn().mockResolvedValue(EMPTY_STATE),
      saveState: vi.fn().mockResolvedValue(undefined),
    };

    fallback = {
      debugLabel: 'LocalStorage',
      loadState: vi.fn().mockResolvedValue(EMPTY_STATE),
      saveState: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('uses primary adapter when healthy', async () => {
    const adapter = createResilientStorageAdapter(primary, fallback);

    expect(adapter.getDebugLabel?.()).toBe('IndexedDB');
    await adapter.loadState();
    await adapter.saveState(EMPTY_STATE);

    expect(primary.loadState).toHaveBeenCalledTimes(1);
    expect(primary.saveState).toHaveBeenCalledTimes(1);
    expect(fallback.loadState).not.toHaveBeenCalled();
    expect(fallback.saveState).not.toHaveBeenCalled();
  });

  it('falls back when primary load throws and stays degraded', async () => {
    primary.loadState = vi.fn().mockRejectedValue(new Error('primary load failed'));

    const adapter = createResilientStorageAdapter(primary, fallback);

    await expect(adapter.loadState()).resolves.toEqual(EMPTY_STATE);
    expect(adapter.getDebugLabel?.()).toBe('LocalStorage');
    await adapter.saveState(EMPTY_STATE);

    expect(primary.loadState).toHaveBeenCalledTimes(1);
    expect(primary.saveState).not.toHaveBeenCalled();
    expect(fallback.loadState).toHaveBeenCalledTimes(1);
    expect(fallback.saveState).toHaveBeenCalledTimes(1);
  });

  it('falls back when primary save throws and stays degraded', async () => {
    primary.saveState = vi.fn().mockRejectedValue(new Error('primary save failed'));

    const adapter = createResilientStorageAdapter(primary, fallback);

    await adapter.saveState(EMPTY_STATE);
    expect(adapter.getDebugLabel?.()).toBe('LocalStorage');
    await adapter.saveState(EMPTY_STATE);

    expect(primary.saveState).toHaveBeenCalledTimes(1);
    expect(fallback.saveState).toHaveBeenCalledTimes(2);
  });

  it('uses fallback immediately when primary is unavailable', async () => {
    const adapter = createResilientStorageAdapter(primary, fallback, {
      isPrimaryAvailable: () => false,
    });

    expect(adapter.getDebugLabel?.()).toBe('IndexedDB');
    await adapter.loadState();
    expect(adapter.getDebugLabel?.()).toBe('LocalStorage');
    await adapter.saveState(EMPTY_STATE);

    expect(primary.loadState).not.toHaveBeenCalled();
    expect(primary.saveState).not.toHaveBeenCalled();
    expect(fallback.loadState).toHaveBeenCalledTimes(1);
    expect(fallback.saveState).toHaveBeenCalledTimes(1);
  });

  it('falls back when primary load returns null', async () => {
    primary.loadState = vi.fn().mockResolvedValue(null);

    const adapter = createResilientStorageAdapter(primary, fallback);

    await expect(adapter.loadState()).resolves.toEqual(EMPTY_STATE);
    expect(adapter.getDebugLabel?.()).toBe('LocalStorage');

    expect(primary.loadState).toHaveBeenCalledTimes(1);
    expect(fallback.loadState).toHaveBeenCalledTimes(1);
  });
});
