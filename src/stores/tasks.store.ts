import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { getIsoWeekId, getLocalDayISO } from 'src/composables/useDay';
import { countTaskCheckinsForWeek } from 'src/composables/useProgress';
import { indexedDbAdapter } from 'src/services/storage/indexedDbAdapter';
import { createEmptyStorageState, type StorageAdapter } from 'src/services/storage/storageAdapter';
import { SCHEMA_VERSION } from 'src/types/storage';
import type { Checkin, Task } from 'src/types/task';

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

  let storageAdapter: StorageAdapter = indexedDbAdapter;

  const activeTasks = computed(() =>
    Object.values(tasks.value).filter((task) => !task.archivedAt),
  );

  function isDone(taskId: string, dayISO = getLocalDayISO()): boolean {
    return Boolean(checkinsByDay.value[dayISO]?.[taskId]);
  }

  function weekProgress(taskId: string, weekId = getIsoWeekId(getLocalDayISO())): number {
    return countTaskCheckinsForWeek(taskId, weekId, checkinsByDay.value);
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

  async function persist(): Promise<void> {
    try {
      await storageAdapter.saveState(createStateSnapshot());
    } catch (error) {
      console.error('Failed to persist state', error);
    }
  }

  async function init(adapter?: StorageAdapter): Promise<void> {
    if (adapter) {
      storageAdapter = adapter;
    }

    const loadedState = await storageAdapter.loadState();
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
      id: crypto.randomUUID(),
      title,
      targetPerWeek: normalizeTargetPerWeek(input.targetPerWeek),
      createdAt: new Date().toISOString(),
    };

    tasks.value = {
      ...tasks.value,
      [task.id]: task,
    };

    await persist();
    return task;
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

    tasks.value = {
      ...tasks.value,
      [taskId]: updatedTask,
    };

    await persist();
    return updatedTask;
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

    checkinsByDay.value = nextCheckinsByDay;
    await persist();
  }

  async function toggleForDay(taskId: string, dayISO: string): Promise<void> {
    if (!tasks.value[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const existing = checkinsByDay.value[dayISO]?.[taskId];

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

    await persist();
  }

  async function toggleToday(taskId: string): Promise<void> {
    await toggleForDay(taskId, getLocalDayISO());
  }

  return {
    tasks,
    checkinsByDay,
    isReady,
    activeTasks,
    isDone,
    weekProgress,
    init,
    createTask,
    updateTask,
    deleteTask,
    toggleForDay,
    toggleToday,
  };
});
