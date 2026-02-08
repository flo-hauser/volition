<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered class="vol-surface-card">
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.tasks.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.tasks.hint') }}</div>
        </q-card-section>

        <q-separator />

        <q-list v-if="tasks.length > 0" separator>
          <q-item v-for="task in tasks" :key="task.id">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ task.title }}</q-item-label>
              <q-item-label caption>
                {{
                  task.targetPerWeek === 7
                    ? t('common.daily')
                    : t('common.targetLabel', { count: task.targetPerWeek })
                }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="secondary"
                  :aria-label="t('pages.tasks.editTask')"
                  :disable="pendingTaskIds.has(task.id)"
                  @click="openEditDialog(task.id)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  :aria-label="t('pages.tasks.deleteTask')"
                  :disable="pendingTaskIds.has(task.id)"
                  @click="openDeleteDialog(task.id)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-grey-8">
          {{ t('common.noTasksYet') }}
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn color="primary" no-caps icon="add" :label="t('common.addTask')" @click="openCreateDialog" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>

  <task-form-dialog
    v-model="isTaskDialogOpen"
    :mode="taskDialogMode"
    :submitting="taskDialogBusy"
    :initial-title="taskDialogInitialTitle"
    :initial-target-per-week="taskDialogInitialTargetPerWeek"
    @submit="submitTaskForm"
  />

  <q-dialog v-model="isDeleteDialogOpen" persistent>
    <q-card class="vol-surface-card" style="min-width: 320px; width: 100%; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ t('pages.tasks.deleteTask') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('pages.tasks.deleteConfirm') }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps :label="t('common.cancel')" :disable="deleteDialogBusy" @click="closeDeleteDialog" />
        <q-btn
          color="negative"
          no-caps
          :label="t('common.delete')"
          :loading="deleteDialogBusy"
          @click="submitDelete"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

import TaskFormDialog from 'src/components/TaskFormDialog.vue';
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
      query: {
        ...route.query,
        new: undefined,
      },
    });
  }
}

function closeTaskDialog(): void {
  if (taskDialogBusy.value) {
    return;
  }

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

function openEditDialog(taskId: string): void {
  const task = store.tasks[taskId];

  if (!task) {
    return;
  }

  taskDialogMode.value = 'edit';
  selectedTaskId.value = taskId;
  isTaskDialogOpen.value = true;
}

function openDeleteDialog(taskId: string): void {
  selectedTaskId.value = taskId;
  isDeleteDialogOpen.value = true;
}

function closeDeleteDialog(): void {
  if (deleteDialogBusy.value) {
    return;
  }

  isDeleteDialogOpen.value = false;
  selectedTaskId.value = null;
}

async function submitTaskForm(payload: { title: string; targetPerWeek: TargetPerWeek }): Promise<void> {
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
        position: 'top-right',
        message: t('pages.newTask.createdSuccess'),
      });
    } else {
      if (!taskId) {
        return;
      }

      await store.updateTask(taskId, payload);
      $q.notify({
        type: 'positive',
        position: 'top-right',
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
      position: 'top-right',
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
  if (!taskId) {
    return;
  }

  deleteDialogBusy.value = true;
  pendingTaskIds.value.add(taskId);

  try {
    await store.deleteTask(taskId);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('pages.toast.taskDeleted'),
    });
    isDeleteDialogOpen.value = false;
    selectedTaskId.value = null;
  } catch (error) {
    appendDebugLog('tasks.deleteTask', error);
    $q.notify({
      type: 'negative',
      position: 'top-right',
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
