import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useTasksStore } from 'src/stores/tasks.store';
import { createResilientStorageAdapter } from 'src/services/storage/resilientStorageAdapter';
import { createEmptyStorageState, type StorageAdapter } from 'src/services/storage/storageAdapter';
import type { StorageState } from 'src/types/storage';

describe('useTasksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  function createMockAdapter(initialState?: StorageState): StorageAdapter {
    return {
      debugLabel: 'MockStorage',
      loadState: vi.fn().mockResolvedValue(initialState ?? createEmptyStorageState()),
      saveState: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('initializes from adapter state and marks store ready', async () => {
    const state = createEmptyStorageState();
    state.tasks.task1 = {
      id: 'task1',
      title: 'Sports',
      targetPerWeek: 3,
      createdAt: '2026-02-07T10:00:00.000Z',
    };

    const adapter = createMockAdapter(state);
    const store = useTasksStore();

    await store.init(adapter);

    expect(store.isReady).toBe(true);
    expect(store.tasks.task1?.title).toBe('Sports');
    expect(store.activeStorageBackend).toBe('MockStorage');
    expect(adapter.loadState).toHaveBeenCalledTimes(1);
  });

  it('creates a task and persists state', async () => {
    const adapter = createMockAdapter();
    const store = useTasksStore();
    await store.init(adapter);

    const task = await store.createTask({ title: 'Walk 1000 steps', targetPerWeek: 5 });

    expect(task.title).toBe('Walk 1000 steps');
    expect(store.tasks[task.id]).toBeDefined();
    expect(adapter.saveState).toHaveBeenCalledTimes(1);
    expect(store.activeTasks).toHaveLength(1);
  });

  it('toggles checkin for a day and persists on each toggle', async () => {
    const adapter = createMockAdapter();
    const store = useTasksStore();
    await store.init(adapter);

    const task = await store.createTask({ title: 'Smoke-free day', targetPerWeek: 7 });
    const day = '2026-02-07';

    await store.toggleForDay(task.id, day);
    expect(store.isDone(task.id, day)).toBe(true);

    await store.toggleForDay(task.id, day);
    expect(store.isDone(task.id, day)).toBe(false);

    expect(adapter.saveState).toHaveBeenCalledTimes(3);
  });

  it('calculates week progress for a task', async () => {
    const adapter = createMockAdapter();
    const store = useTasksStore();
    await store.init(adapter);

    const task = await store.createTask({ title: 'Sports', targetPerWeek: 3 });

    await store.toggleForDay(task.id, '2026-02-02');
    await store.toggleForDay(task.id, '2026-02-03');
    await store.toggleForDay(task.id, '2026-02-04');
    await store.toggleForDay(task.id, '2026-02-05');

    expect(store.weekProgress(task.id, '2026-W06')).toBe(4);
  });

  it('throws on invalid task creation and missing task toggle', async () => {
    const adapter = createMockAdapter();
    const store = useTasksStore();
    await store.init(adapter);

    await expect(store.createTask({ title: ' ', targetPerWeek: 3 })).rejects.toThrow(
      'title is required',
    );
    await expect(store.createTask({ title: 'Test', targetPerWeek: 8 })).rejects.toThrow(
      'targetPerWeek must be an integer between 1 and 7',
    );
    await expect(store.toggleForDay('missing', '2026-02-07')).rejects.toThrow(
      'Task not found: missing',
    );
  });

  it('updates and deletes tasks including related check-ins', async () => {
    const adapter = createMockAdapter();
    const store = useTasksStore();
    await store.init(adapter);

    const task = await store.createTask({ title: 'Old title', targetPerWeek: 2 });
    await store.toggleForDay(task.id, '2026-02-07');

    const updated = await store.updateTask(task.id, {
      title: 'New title',
      targetPerWeek: 5,
    });

    expect(updated.title).toBe('New title');
    expect(updated.targetPerWeek).toBe(5);
    expect(store.tasks[task.id]?.title).toBe('New title');

    await store.deleteTask(task.id);

    expect(store.tasks[task.id]).toBeUndefined();
    expect(store.checkinsByDay['2026-02-07']).toBeUndefined();
  });

  it('rolls back create when persistence save fails', async () => {
    const adapter: StorageAdapter = {
      loadState: vi.fn().mockResolvedValue(createEmptyStorageState()),
      saveState: vi.fn().mockRejectedValue(new Error('save failed')),
    };

    const store = useTasksStore();
    await store.init(adapter);

    await expect(
      store.createTask({ title: 'Should rollback', targetPerWeek: 3 }),
    ).rejects.toThrow('save failed');

    expect(Object.keys(store.tasks)).toHaveLength(0);
    expect(adapter.saveState).toHaveBeenCalledTimes(1);
  });

  it('rolls back toggle when persistence save fails', async () => {
    const adapter: StorageAdapter = {
      loadState: vi.fn().mockResolvedValue(createEmptyStorageState()),
      saveState: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('save failed')),
    };

    const store = useTasksStore();
    await store.init(adapter);

    const task = await store.createTask({ title: 'Sports', targetPerWeek: 3 });

    await expect(store.toggleForDay(task.id, '2026-02-07')).rejects.toThrow('save failed');
    expect(store.isDone(task.id, '2026-02-07')).toBe(false);
  });

  it('supports CRUD when primary adapter fails and fallback is available', async () => {
    const primary: StorageAdapter = {
      debugLabel: 'IndexedDB',
      loadState: vi.fn().mockRejectedValue(new Error('indexedDB blocked')),
      saveState: vi.fn().mockRejectedValue(new Error('indexedDB blocked')),
    };
    const fallback: StorageAdapter = {
      debugLabel: 'LocalStorage',
      loadState: vi.fn().mockResolvedValue(createEmptyStorageState()),
      saveState: vi.fn().mockResolvedValue(undefined),
    };

    const resilientAdapter = createResilientStorageAdapter(primary, fallback);
    const store = useTasksStore();

    await store.init(resilientAdapter);
    const task = await store.createTask({ title: 'Mobile fallback', targetPerWeek: 3 });
    await store.toggleForDay(task.id, '2026-02-07');

    expect(store.tasks[task.id]).toBeDefined();
    expect(store.isDone(task.id, '2026-02-07')).toBe(true);
    expect(store.activeStorageBackend).toBe('LocalStorage');
    expect(primary.loadState).toHaveBeenCalledTimes(1);
    expect(primary.saveState).not.toHaveBeenCalled();
    expect(fallback.saveState).toHaveBeenCalledTimes(2);
  });
});
