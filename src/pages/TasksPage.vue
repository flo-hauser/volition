<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <div class="page-eyebrow">
        {{ t('pages.tasks.eyebrow', { active: tasks.length, archived: 0 }) }}
      </div>
      <h1 class="page-title" v-html="t('pages.tasks.title')" />
      <p class="page-sub">{{ t('pages.tasks.subtitle') }}</p>
    </header>

    <div v-if="tasks.length > 0" ref="taskListEl" class="tasks-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="tasks-row"
        :data-id="task.id"
      >
        <button class="drag-handle" type="button" aria-label="Reorder" @click.stop>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
          </svg>
        </button>

        <button type="button" class="tasks-row__body" @click="goToDetail(task.id)">
          <div class="freq" aria-hidden="true">
            {{ task.targetPerWeek }}
            <span class="x">{{ t('pages.tasks.freqSuffix') }}</span>
          </div>
          <div class="body">
            <div class="title">{{ task.title }}</div>
            <div class="hint">
              {{ task.targetPerWeek === 7 ? t('pages.tasks.hintEveryDay') : t('pages.tasks.hintDaysOfSeven', { count: task.targetPerWeek }) }}
              <template v-if="store.getStreak(task.id) > 1">
                · {{ store.getStreak(task.id) }}w streak
              </template>
            </div>
          </div>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
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
      mode="create"
      :submitting="taskDialogBusy"
      @submit="submitCreate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import Sortable from 'sortablejs';
import type { SortableEvent } from 'sortablejs';

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
const taskListEl = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

const isTaskDialogOpen = ref(false);
const taskDialogBusy = ref(false);

onMounted(() => {
  if (!taskListEl.value) return;

  sortableInstance = Sortable.create(taskListEl.value, {
    handle: '.drag-handle',
    animation: 0,
    ghostClass: 'tasks-row--ghost',
    onEnd(evt: SortableEvent) {
      if (evt.oldIndex === evt.newIndex) return;

      const newOrder = Array.from(taskListEl.value!.querySelectorAll('[data-id]'))
        .map((el) => (el as HTMLElement).dataset['id']!)
        .filter(Boolean);

      void store.reorderTasks(newOrder);
    },
  });
});

onUnmounted(() => {
  sortableInstance?.destroy();
  sortableInstance = null;
});

function goToDetail(taskId: string): void {
  void router.push(`/tasks/${taskId}`);
}

function clearNewQueryFlag(): void {
  if (route.query['new'] === '1') {
    void router.replace({ path: '/tasks', query: { ...route.query, new: undefined } });
  }
}

function openCreateDialog(): void {
  isTaskDialogOpen.value = true;
}

async function submitCreate(payload: { title: string; targetPerWeek: TargetPerWeek }): Promise<void> {
  taskDialogBusy.value = true;
  try {
    await store.createTask(payload);
    $q.notify({ type: 'positive', position: 'top', message: t('pages.newTask.createdSuccess') });
    isTaskDialogOpen.value = false;
    clearNewQueryFlag();
  } catch (error) {
    appendDebugLog('tasks.createTask', error);
    $q.notify({ type: 'negative', position: 'top', message: t('pages.newTask.createFailed') });
  } finally {
    taskDialogBusy.value = false;
  }
}

watch(
  () => route.query['new'],
  (flag) => { if (flag === '1') openCreateDialog(); },
  { immediate: true },
);

watch(isTaskDialogOpen, (isOpen) => {
  if (!isOpen) clearNewQueryFlag();
});
</script>
