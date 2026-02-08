<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
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
          <q-btn
            color="primary"
            no-caps
            icon="add"
            :label="t('common.addTask')"
            :to="'/tasks/new'"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>

  <q-dialog v-model="isEditDialogOpen" persistent>
    <q-card style="min-width: 320px; width: 100%; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ t('pages.tasks.editTask') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="editTitle"
          outlined
          maxlength="100"
          :label="t('pages.newTask.taskTitle')"
          :error="Boolean(editTitleError)"
          :error-message="editTitleError"
          class="q-mb-md"
        />

        <q-select
          v-model="editTargetPerWeek"
          outlined
          emit-value
          map-options
          :label="t('pages.newTask.targetPerWeek')"
          :options="targetOptions"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          no-caps
          :label="t('common.cancel')"
          :disable="dialogBusy"
          @click="closeDialogs"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('common.save')"
          :loading="dialogBusy"
          @click="submitEdit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="isDeleteDialogOpen" persistent>
    <q-card style="min-width: 320px; width: 100%; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ t('pages.tasks.deleteTask') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('pages.tasks.deleteConfirm') }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          no-caps
          :label="t('common.cancel')"
          :disable="dialogBusy"
          @click="closeDialogs"
        />
        <q-btn
          color="negative"
          no-caps
          :label="t('common.delete')"
          :loading="dialogBusy"
          @click="submitDelete"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import { useTasksStore } from 'src/stores/tasks.store';

const { t } = useI18n();
const $q = useQuasar();
const store = useTasksStore();

const tasks = computed(() => store.activeTasks);
const pendingTaskIds = ref(new Set<string>());

const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const dialogBusy = ref(false);
const selectedTaskId = ref<string | null>(null);

const editTitle = ref('');
const editTargetPerWeek = ref<1 | 2 | 3 | 4 | 5 | 6 | 7>(3);
const editAttempted = ref(false);

const targetOptions = computed(() =>
  ([1, 2, 3, 4, 5, 6, 7] as const).map((value) => ({
    label:
      value === 7
        ? t('pages.newTask.targetOptionDaily')
        : t('pages.newTask.targetOption', { count: value }),
    value,
  })),
);

const editTitleError = computed(() => {
  if (!editAttempted.value) {
    return '';
  }

  const trimmed = editTitle.value.trim();

  if (trimmed.length === 0) {
    return t('pages.newTask.titleRequired');
  }

  if (trimmed.length > 100) {
    return t('pages.newTask.titleTooLong');
  }

  return '';
});

function openEditDialog(taskId: string): void {
  const task = store.tasks[taskId];

  if (!task) {
    return;
  }

  selectedTaskId.value = taskId;
  editTitle.value = task.title;
  editTargetPerWeek.value = task.targetPerWeek;
  editAttempted.value = false;
  isEditDialogOpen.value = true;
}

function openDeleteDialog(taskId: string): void {
  selectedTaskId.value = taskId;
  isDeleteDialogOpen.value = true;
}

function closeDialogs(): void {
  if (dialogBusy.value) {
    return;
  }

  isEditDialogOpen.value = false;
  isDeleteDialogOpen.value = false;
  selectedTaskId.value = null;
}

function forceCloseDialogs(): void {
  isEditDialogOpen.value = false;
  isDeleteDialogOpen.value = false;
  selectedTaskId.value = null;
}

async function submitEdit(): Promise<void> {
  editAttempted.value = true;

  if (editTitleError.value) {
    return;
  }

  const taskId = selectedTaskId.value;
  if (!taskId) {
    return;
  }

  dialogBusy.value = true;
  pendingTaskIds.value.add(taskId);

  try {
    await store.updateTask(taskId, {
      title: editTitle.value,
      targetPerWeek: editTargetPerWeek.value,
    });
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('pages.toast.taskUpdated'),
    });
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('pages.toast.taskUpdateFailed'),
    });
  } finally {
    dialogBusy.value = false;
    pendingTaskIds.value.delete(taskId);
    pendingTaskIds.value = new Set(pendingTaskIds.value);
    forceCloseDialogs();
  }
}

async function submitDelete(): Promise<void> {
  const taskId = selectedTaskId.value;
  if (!taskId) {
    return;
  }

  dialogBusy.value = true;
  pendingTaskIds.value.add(taskId);

  try {
    await store.deleteTask(taskId);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('pages.toast.taskDeleted'),
    });
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('pages.toast.taskDeleteFailed'),
    });
  } finally {
    dialogBusy.value = false;
    pendingTaskIds.value.delete(taskId);
    pendingTaskIds.value = new Set(pendingTaskIds.value);
    forceCloseDialogs();
  }
}
</script>
