import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { getIsoWeekId, getLocalDayISO, getPreviousWeekId, getWeekDays } from 'src/composables/useDay';
import { countTaskCheckinsForWeek } from 'src/composables/useProgress';
import { indexedDbAdapter } from 'src/services/storage/indexedDbAdapter';
import { localStorageAdapter } from 'src/services/storage/localStorageAdapter';
import { createResilientStorageAdapter } from 'src/services/storage/resilientStorageAdapter';
import {
  createEmptyStorageState,
  getStorageDebugLabel,
  type StorageAdapter,
} from 'src/services/storage/storageAdapter';
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
  const isReady = ref(false);

  let storageAdapter: StorageAdapter = createResilientStorageAdapter(
    indexedDbAdapter,
    localStorageAdapter,
    {
      isPrimaryAvailable: () => typeof indexedDB !== 'undefined',
    },
  );
  const activeStorageBackend = ref(getStorageDebugLabel(storageAdapter));

  const activeTasks = computed(() => Object.values(tasks.value).filter((task) => !task.archivedAt));

  function syncActiveStorageBackend(): void {
    activeStorageBackend.value = getStorageDebugLabel(storageAdapter);
  }

  function isDone(taskId: string, dayISO = getLocalDayISO()): boolean {
    return Boolean(checkinsByDay.value[dayISO]?.[taskId]);
  }

  function weekProgress(taskId: string, weekId = getIsoWeekId(getLocalDayISO())): number {
    return countTaskCheckinsForWeek(taskId, weekId, checkinsByDay.value);
  }

  function getStreak(taskId: string): number {
    const task = tasks.value[taskId];
    if (!task) return 0;

    let streak = 0;
    let weekId = getIsoWeekId(getLocalDayISO());

    for (let i = 0; i < 52; i++) {
      const progress = countTaskCheckinsForWeek(taskId, weekId, checkinsByDay.value);
      if (progress >= task.targetPerWeek) {
        streak++;
      } else if (i > 0) {
        break;
      }
      weekId = getPreviousWeekId(weekId);
    }

    return streak;
  }

  function getHeatmapDays(
    taskId: string,
    weeksBack = 12,
  ): Array<{ dayISO: string; checked: boolean; isToday: boolean; isFuture: boolean }> {
    const todayISO = getLocalDayISO();
    let weekId = getIsoWeekId(todayISO);
    const weeks: string[] = [];

    for (let i = 0; i < weeksBack; i++) {
      weeks.unshift(weekId);
      weekId = getPreviousWeekId(weekId);
    }

    return weeks.flatMap((wId) =>
      getWeekDays(wId).map((day) => ({
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
    };
  }

  async function persistOrRollback<T>(operation: () => T): Promise<T> {
    const previousTasks = cloneState(tasks.value);
    const previousCheckinsByDay = cloneState(checkinsByDay.value);

    try {
      const result = operation();
      await storageAdapter.saveState(createStateSnapshot());
      syncActiveStorageBackend();
      return result;
    } catch (error) {
      tasks.value = previousTasks;
      checkinsByDay.value = previousCheckinsByDay;
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
    const state = loadedState ?? createEmptyStorageState();

    if (state.meta.schemaVersion !== SCHEMA_VERSION) {
      tasks.value = {};
      checkinsByDay.value = {};
      isReady.value = true;
      return;
    }

    tasks.value = state.tasks;
    checkinsByDay.value = state.checkinsByDay;
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

    await persistOrRollback(() => {
      checkinsByDay.value = nextCheckinsByDay;
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

  return {
    tasks,
    checkinsByDay,
    isReady,
    activeTasks,
    activeStorageBackend,
    isDone,
    weekProgress,
    getStreak,
    getHeatmapDays,
    init,
    createTask,
    updateTask,
    deleteTask,
    toggleForDay,
    toggleToday,
  };
});
