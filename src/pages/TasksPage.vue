<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <div class="page-eyebrow">
        {{ t('pages.tasks.eyebrow', { active: tasks.length, archived: 0 }) }}
      </div>
      <h1 class="page-title" v-html="t('pages.tasks.title')" />
      <p class="page-sub">{{ t('pages.tasks.subtitle') }}</p>
    </header>

    <div v-if="tasks.length > 0" class="tasks-list">
      <div v-for="task in tasks" :key="task.id" class="tasks-row">
        <button
          type="button"
          class="tasks-row-main"
          :aria-label="t('pages.tasks.editTask') + ': ' + task.title"
          @click="openEdit(task.id)"
        >
          <span class="freq" aria-hidden="true">
            {{ task.targetPerWeek }}
            <span class="x">{{ t('pages.tasks.freqSuffix') }}</span>
          </span>
          <span class="body">
            <span class="title">{{ task.title }}</span>
            <span class="hint">
              {{
                task.targetPerWeek === 7
                  ? t('pages.tasks.hintEveryDay')
                  : t('pages.tasks.hintDaysOfSeven', { count: task.targetPerWeek })
              }}
            </span>
          </span>
        </button>
        <button
          class="icon-btn"
          type="button"
          :aria-label="t('pages.tasks.deleteTask')"
          :disabled="pendingTaskIds.has(task.id)"
          @click="openDeleteDialog(task.id)"
        >
          <q-icon name="delete_outline" />
        </button>
      </div>
    </div>

    <div v-else class="section-head">
      <p class="page-sub">{{ t('common.noTasksYet') }}</p>
    </div>

    <button type="button" class="add-cta" @click="openCreateDialog">
      + {{ t('pages.tasks.newTask') }}
    </button>

    <TaskSheet
      v-model="isTaskDialogOpen"
      :mode="taskDialogMode"
      :submitting="taskDialogBusy"
      :initial-title="taskDialogInitialTitle"
      :initial-target-per-week="taskDialogInitialTargetPerWeek"
      @submit="submitTaskForm"
    />

    <q-dialog v-model="isDeleteDialogOpen" persistent>
      <div class="sheet-card" style="max-width: 420px">
        <div class="grab" aria-hidden="true" />
        <h2>{{ t('pages.tasks.deleteTask') }}</h2>
        <p class="sub">{{ t('pages.tasks.deleteConfirm') }}</p>
        <div class="sheet-actions">
          <button
            type="button"
            class="ghost-btn"
            :disabled="deleteDialogBusy"
            @click="closeDeleteDialog"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="primary-btn"
            :disabled="deleteDialogBusy"
            @click="submitDelete"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

import TaskSheet from 'src/components/TaskSheet.vue';
import { appendDebugLog } from 'src/services/debug/runtimeDiagnostics';
import { useTasksStore } from 'src/stores/tasks.store';

type TargetPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const store = useTasksStore();

const tasks = computed(() => store.activeTasks);
const pendingTaskIds = ref(new Set<string>());

const isTaskDialogOpen = ref(false);
const taskDialogMode = ref<'create' | 'edit'>('create');
const taskDialogBusy = ref(false);
const selectedTaskId = ref<string | null>(null);

const isDeleteDialogOpen = ref(false);
const deleteDialogBusy = ref(false);

const taskDialogInitialTitle = computed(() => {
  if (taskDialogMode.value === 'edit' && selectedTaskId.value) {
    return store.tasks[selectedTaskId.value]?.title ?? '';
  }
  return '';
});

const taskDialogInitialTargetPerWeek = computed<TargetPerWeek>(() => {
  if (taskDialogMode.value === 'edit' && selectedTaskId.value) {
    return store.tasks[selectedTaskId.value]?.targetPerWeek ?? 3;
  }
  return 3;
});

function clearNewQueryFlag(): void {
  if (route.query.new === '1') {
    void router.replace({
      path: '/tasks',
      query: { ...route.query, new: undefined },
    });
  }
}

function closeTaskDialog(): void {
  if (taskDialogBusy.value) return;
  isTaskDialogOpen.value = false;
  selectedTaskId.value = null;
  clearNewQueryFlag();
}

function forceCloseTaskDialog(): void {
  isTaskDialogOpen.value = false;
  selectedTaskId.value = null;
  clearNewQueryFlag();
}

function openCreateDialog(): void {
  taskDialogMode.value = 'create';
  selectedTaskId.value = null;
  isTaskDialogOpen.value = true;
}

function openEdit(taskId: string): void {
  const task = store.tasks[taskId];
  if (!task) return;
  taskDialogMode.value = 'edit';
  selectedTaskId.value = taskId;
  isTaskDialogOpen.value = true;
}

function openDeleteDialog(taskId: string): void {
  selectedTaskId.value = taskId;
  isDeleteDialogOpen.value = true;
}

function closeDeleteDialog(): void {
  if (deleteDialogBusy.value) return;
  isDeleteDialogOpen.value = false;
  selectedTaskId.value = null;
}

async function submitTaskForm(
  payload: { title: string; targetPerWeek: TargetPerWeek },
): Promise<void> {
  taskDialogBusy.value = true;
  const taskId = selectedTaskId.value;

  if (taskDialogMode.value === 'edit' && taskId) {
    pendingTaskIds.value.add(taskId);
  }

  try {
    if (taskDialogMode.value === 'create') {
      await store.createTask(payload);
      $q.notify({
        type: 'positive',
        position: 'top',
        message: t('pages.newTask.createdSuccess'),
      });
    } else {
      if (!taskId) return;
      await store.updateTask(taskId, payload);
      $q.notify({
        type: 'positive',
        position: 'top',
        message: t('pages.toast.taskUpdated'),
      });
    }
    forceCloseTaskDialog();
  } catch (error) {
    appendDebugLog(
      taskDialogMode.value === 'create' ? 'tasks.createTask' : 'tasks.updateTask',
      error,
    );
    $q.notify({
      type: 'negative',
      position: 'top',
      message:
        taskDialogMode.value === 'create'
          ? t('pages.newTask.createFailed')
          : t('pages.toast.taskUpdateFailed'),
    });
  } finally {
    taskDialogBusy.value = false;
    if (taskId) {
      pendingTaskIds.value.delete(taskId);
      pendingTaskIds.value = new Set(pendingTaskIds.value);
    }
  }
}

async function submitDelete(): Promise<void> {
  const taskId = selectedTaskId.value;
  if (!taskId) return;

  deleteDialogBusy.value = true;
  pendingTaskIds.value.add(taskId);

  try {
    await store.deleteTask(taskId);
    $q.notify({
      type: 'positive',
      position: 'top',
      message: t('pages.toast.taskDeleted'),
    });
    isDeleteDialogOpen.value = false;
    selectedTaskId.value = null;
  } catch (error) {
    appendDebugLog('tasks.deleteTask', error);
    $q.notify({
      type: 'negative',
      position: 'top',
      message: t('pages.toast.taskDeleteFailed'),
    });
  } finally {
    deleteDialogBusy.value = false;
    pendingTaskIds.value.delete(taskId);
    pendingTaskIds.value = new Set(pendingTaskIds.value);
  }
}

watch(
  () => route.query.new,
  (newFlag) => {
    if (newFlag === '1') {
      openCreateDialog();
    }
  },
  { immediate: true },
);

watch(isTaskDialogOpen, (isOpen) => {
  if (!isOpen) {
    closeTaskDialog();
  }
});
</script>
