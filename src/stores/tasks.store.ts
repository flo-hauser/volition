import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { getLocalDayISO, getPreviousWeekId, getWeekDays, getWeekId } from 'src/composables/useDay';
import { getStoredWeekStartDay } from 'src/composables/useAppPreferences';
import { countTaskCheckinsForWeek } from 'src/composables/useProgress';
import { indexedDbAdapter } from 'src/services/storage/indexedDbAdapter';
import { localStorageAdapter } from 'src/services/storage/localStorageAdapter';
import { createResilientStorageAdapter } from 'src/services/storage/resilientStorageAdapter';
import {
  getStorageDebugLabel,
  type StorageAdapter,
} from 'src/services/storage/storageAdapter';
import { exportToJSON } from 'src/services/dataTransfer';
import type { StorageState } from 'src/types/storage';
import { SCHEMA_VERSION } from 'src/types/storage';
import type { Checkin, Task } from 'src/types/task';
import { createId } from 'src/utils/id';

interface CreateTaskInput {
  title: string;
  targetPerWeek: number;
}

interface UpdateTaskInput {
  title: string;
  targetPerWeek: number;
}

function normalizeTargetPerWeek(value: number): Task['targetPerWeek'] {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    throw new Error('targetPerWeek must be an integer between 1 and 7');
  }

  return value as Task['targetPerWeek'];
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Record<string, Task>>({});
  const checkinsByDay = ref<Record<string, Record<string, Checkin>>>({});
  const taskOrder = ref<string[]>([]);
  const isReady = ref(false);

  let storageAdapter: StorageAdapter = createResilientStorageAdapter(
    indexedDbAdapter,
    localStorageAdapter,
    {
      isPrimaryAvailable: () => typeof indexedDB !== 'undefined',
    },
  );
  const activeStorageBackend = ref(getStorageDebugLabel(storageAdapter));

  const activeTasks = computed(() => {
    const active = Object.values(tasks.value).filter((t) => !t.archivedAt);
    const orderMap = new Map(taskOrder.value.map((id, i) => [id, i]));
    return active.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity;
      const bi = orderMap.get(b.id) ?? Infinity;
      return ai - bi;
    });
  });

  const archivedTasks = computed(() =>
    Object.values(tasks.value)
      .filter((task) => !!task.archivedAt)
      .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? '')),
  );

  function syncActiveStorageBackend(): void {
    activeStorageBackend.value = getStorageDebugLabel(storageAdapter);
  }

  function isDone(taskId: string, dayISO = getLocalDayISO()): boolean {
    return Boolean(checkinsByDay.value[dayISO]?.[taskId]);
  }

  function weekProgress(taskId: string, weekId = getWeekId(getLocalDayISO(), getStoredWeekStartDay())): number {
    const weekStartDay = getStoredWeekStartDay();
    return countTaskCheckinsForWeek(taskId, weekId, checkinsByDay.value, weekStartDay);
  }

  function getStreak(taskId: string): number {
    const task = tasks.value[taskId];
    if (!task) return 0;

    const weekStartDay = getStoredWeekStartDay();
    let streak = 0;
    let weekId = getWeekId(getLocalDayISO(), weekStartDay);

    for (let i = 0; i < 52; i++) {
      const progress = countTaskCheckinsForWeek(taskId, weekId, checkinsByDay.value, weekStartDay);
      if (progress >= task.targetPerWeek) {
        streak++;
      } else if (i > 0) {
        break;
      }
      weekId = getPreviousWeekId(weekId, weekStartDay);
    }

    return streak;
  }

  function getHeatmapDays(
    taskId: string,
    weeksBack = 12,
  ): Array<{ dayISO: string; checked: boolean; isToday: boolean; isFuture: boolean }> {
    const todayISO = getLocalDayISO();
    const weekStartDay = getStoredWeekStartDay();
    let weekId = getWeekId(todayISO, weekStartDay);
    const weeks: string[] = [];

    for (let i = 0; i < weeksBack; i++) {
      weeks.unshift(weekId);
      weekId = getPreviousWeekId(weekId, weekStartDay);
    }

    return weeks.flatMap((wId) =>
      getWeekDays(wId, weekStartDay).map((day) => ({
        dayISO: day,
        isToday: day === todayISO,
        isFuture: day > todayISO,
        checked: day <= todayISO && Boolean(checkinsByDay.value[day]?.[taskId]),
      })),
    );
  }

  function createStateSnapshot() {
    return {
      meta: {
        schemaVersion: SCHEMA_VERSION,
      },
      tasks: cloneState(tasks.value),
      checkinsByDay: cloneState(checkinsByDay.value),
      taskOrder: [...taskOrder.value],
    };
  }

  async function persistOrRollback<T>(operation: () => T): Promise<T> {
    const previousTasks = cloneState(tasks.value);
    const previousCheckinsByDay = cloneState(checkinsByDay.value);
    const previousTaskOrder = [...taskOrder.value];

    try {
      const result = operation();
      await storageAdapter.saveState(createStateSnapshot());
      syncActiveStorageBackend();
      return result;
    } catch (error) {
      tasks.value = previousTasks;
      checkinsByDay.value = previousCheckinsByDay;
      taskOrder.value = previousTaskOrder;
      throw error;
    }
  }

  async function init(adapter?: StorageAdapter): Promise<void> {
    if (adapter) {
      storageAdapter = adapter;
    }

    syncActiveStorageBackend();

    const loadedState = await storageAdapter.loadState();
    syncActiveStorageBackend();

    const state = loadedState ?? { meta: { schemaVersion: -1 }, tasks: {}, checkinsByDay: {}, taskOrder: [] };

    if (state.meta.schemaVersion !== SCHEMA_VERSION) {
      tasks.value = {};
      checkinsByDay.value = {};
      taskOrder.value = [];
      isReady.value = true;
      return;
    }

    tasks.value = state.tasks;
    checkinsByDay.value = state.checkinsByDay;
    taskOrder.value = state.taskOrder;
    isReady.value = true;
  }

  async function createTask(input: CreateTaskInput): Promise<Task> {
    const title = input.title.trim();

    if (title.length === 0) {
      throw new Error('title is required');
    }

    const task: Task = {
      id: createId(),
      title,
      targetPerWeek: normalizeTargetPerWeek(input.targetPerWeek),
      createdAt: new Date().toISOString(),
    };

    return persistOrRollback(() => {
      tasks.value = {
        ...tasks.value,
        [task.id]: task,
      };
      taskOrder.value = [...taskOrder.value, task.id];

      return task;
    });
  }

  async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const existingTask = tasks.value[taskId];

    if (!existingTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const title = input.title.trim();
    if (title.length === 0) {
      throw new Error('title is required');
    }

    const updatedTask: Task = {
      ...existingTask,
      title,
      targetPerWeek: normalizeTargetPerWeek(input.targetPerWeek),
    };

    return persistOrRollback(() => {
      tasks.value = {
        ...tasks.value,
        [taskId]: updatedTask,
      };

      return updatedTask;
    });
  }

  async function deleteTask(taskId: string): Promise<void> {
    if (!tasks.value[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await persistOrRollback(() => {
      const nextTasks = { ...tasks.value };
      delete nextTasks[taskId];
      tasks.value = nextTasks;

      const nextCheckinsByDay: Record<string, Record<string, Checkin>> = {};
      for (const [day, dayCheckins] of Object.entries(checkinsByDay.value)) {
        const nextDayCheckins = { ...dayCheckins };
        delete nextDayCheckins[taskId];
        if (Object.keys(nextDayCheckins).length > 0) {
          nextCheckinsByDay[day] = nextDayCheckins;
        }
      }
      checkinsByDay.value = nextCheckinsByDay;

      taskOrder.value = taskOrder.value.filter((id) => id !== taskId);
    });
  }

  async function reorderTasks(orderedIds: string[]): Promise<void> {
    await persistOrRollback(() => {
      taskOrder.value = orderedIds;
    });
  }

  async function archiveTask(taskId: string): Promise<void> {
    const existingTask = tasks.value[taskId];

    if (!existingTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await persistOrRollback(() => {
      tasks.value = {
        ...tasks.value,
        [taskId]: {
          ...existingTask,
          archivedAt: new Date().toISOString(),
        },
      };
      taskOrder.value = taskOrder.value.filter((id) => id !== taskId);
    });
  }

  async function unarchiveTask(taskId: string): Promise<void> {
    const existingTask = tasks.value[taskId];

    if (!existingTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await persistOrRollback(() => {
      const nextTask = { ...existingTask };
      delete nextTask.archivedAt;
      tasks.value = {
        ...tasks.value,
        [taskId]: nextTask,
      };
      taskOrder.value = [...taskOrder.value.filter((id) => id !== taskId), taskId];
    });
  }

  async function toggleForDay(taskId: string, dayISO: string): Promise<void> {
    if (!tasks.value[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const existing = checkinsByDay.value[dayISO]?.[taskId];

    await persistOrRollback(() => {
      if (existing) {
        const dayEntry = { ...(checkinsByDay.value[dayISO] ?? {}) };
        delete dayEntry[taskId];

        const nextCheckinsByDay = { ...checkinsByDay.value };
        if (Object.keys(dayEntry).length === 0) {
          delete nextCheckinsByDay[dayISO];
        } else {
          nextCheckinsByDay[dayISO] = dayEntry;
        }

        checkinsByDay.value = nextCheckinsByDay;
      } else {
        const checkin: Checkin = {
          taskId,
          day: dayISO,
          checkedAt: new Date().toISOString(),
        };

        checkinsByDay.value = {
          ...checkinsByDay.value,
          [dayISO]: {
            ...(checkinsByDay.value[dayISO] ?? {}),
            [taskId]: checkin,
          },
        };
      }
    });
  }

  async function toggleToday(taskId: string): Promise<void> {
    await toggleForDay(taskId, getLocalDayISO());
  }

  function exportState(): string {
    return exportToJSON(createStateSnapshot());
  }

  async function importState(incoming: StorageState): Promise<void> {
    await persistOrRollback(() => {
      tasks.value = cloneState(incoming.tasks);
      checkinsByDay.value = cloneState(incoming.checkinsByDay);
      taskOrder.value = cloneState(incoming.taskOrder);
    });
  }

  return {
    tasks,
    checkinsByDay,
    taskOrder,
    isReady,
    activeTasks,
    archivedTasks,
    activeStorageBackend,
    isDone,
    weekProgress,
    getStreak,
    getHeatmapDays,
    init,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    archiveTask,
    unarchiveTask,
    toggleForDay,
    toggleToday,
    exportState,
    importState,
  };
});
