<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <div class="page-eyebrow">{{ eyebrow }}</div>
      <h1 class="page-title" v-html="t('pages.today.title')" />
    </header>

    <TodayHero
      :done="doneToday"
      :total="totalTasks"
      :quote="quote"
      :eyebrow="t('pages.today.heroEyebrow')"
      :of-label="t('pages.today.heroOf', { total: totalTasks })"
    />

    <div v-if="tasks.length > 0" class="section-head">
      <h2 class="section-title">{{ t('pages.today.allTasks') }}</h2>
      <button type="button" class="section-link" @click="openCreate">
        {{ t('common.addNew') }}
      </button>
    </div>

    <div v-if="tasks.length > 0" class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-row"
        :class="{ done: isChecked(task.id), swiping: swipingTaskId === task.id }"
        v-touch-swipe.right.mouse="getSwipeHandler(task.id)"
        @click="goToDetail(task.id)"
      >
        <div class="task-body">
          <h3 class="task-title">{{ task.title }}</h3>
          <div class="task-meta">
            <span>
              {{
                t('pages.today.progressLabel', {
                  progress: store.weekProgress(task.id, currentWeekId),
                  target: task.targetPerWeek,
                })
              }}
            </span>
            <template v-if="store.getStreak(task.id) > 1">
              <span class="dot" aria-hidden="true" />
              <span class="streak">🔥 {{ store.getStreak(task.id) }}w</span>
            </template>
            <span class="dot" aria-hidden="true" />
            <WeekMini :pattern="getPattern(task.id)" :today-idx="todayIdx" />
          </div>
        </div>
        <CheckButton
          :model-value="isChecked(task.id)"
          :disabled="pendingTaskIds.has(task.id)"
          :aria-check="t('pages.today.doneToday')"
          :aria-uncheck="t('pages.today.doneToday')"
          @update:model-value="() => toggleTask(task.id)"
        />
      </div>
    </div>

    <div v-else class="section-head">
      <p class="page-sub">{{ t('pages.today.openTasks') }}</p>
    </div>

    <button type="button" class="add-cta" @click="openCreate">
      + {{ t('common.newIntention') }}
    </button>

    <TaskSheet
      v-model="isTaskSheetOpen"
      mode="create"
      :submitting="taskSheetBusy"
      @submit="submitCreate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

import CheckButton from 'src/components/CheckButton.vue';
import TaskSheet from 'src/components/TaskSheet.vue';
import TodayHero from 'src/components/TodayHero.vue';
import WeekMini from 'src/components/WeekMini.vue';
import { getIsoWeekId, getLocalDayISO, getWeekdayIndex, toLocalDate } from 'src/composables/useDay';
import { getWeekPattern } from 'src/composables/useProgress';
import { useQuote } from 'src/composables/useQuote';
import { appendDebugLog } from 'src/services/debug/runtimeDiagnostics';
import { useTasksStore } from 'src/stores/tasks.store';

type TargetPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type SwipeDetails = {
  direction?: 'left' | 'right' | 'up' | 'down';
};

const { t, locale } = useI18n();
const $q = useQuasar();
const store = useTasksStore();
const router = useRouter();
const { pickQuote } = useQuote();

const todayISO = getLocalDayISO();
const currentWeekId = getIsoWeekId(todayISO);
const todayIdx = getWeekdayIndex(currentWeekId, todayISO);

const pendingTaskIds = ref(new Set<string>());
const isTaskSheetOpen = ref(false);
const taskSheetBusy = ref(false);
const swipingTaskId = ref<string | null>(null);

const tasks = computed(() => store.activeTasks);

const totalTasks = computed(() => tasks.value.length);
const doneToday = computed(() =>
  tasks.value.reduce((count, task) => (store.isDone(task.id, todayISO) ? count + 1 : count), 0),
);

const eyebrow = computed(() => {
  const date = toLocalDate(todayISO);
  const longDate = date.toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const weekNumber = currentWeekId.split('-W')[1] ?? '';
  return t('pages.today.eyebrow', { date: longDate, week: weekNumber });
});

const quote = computed(() => pickQuote(doneToday.value, totalTasks.value));

function isChecked(taskId: string): boolean {
  return store.isDone(taskId, todayISO);
}

function getPattern(taskId: string): number[] {
  return getWeekPattern(taskId, currentWeekId, store.checkinsByDay);
}

async function toggleTask(taskId: string): Promise<void> {
  const wasChecked = isChecked(taskId);
  pendingTaskIds.value.add(taskId);
  pendingTaskIds.value = new Set(pendingTaskIds.value);
  try {
    await store.toggleToday(taskId);
    if (!wasChecked) {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    }
  } catch (error) {
    appendDebugLog('tasks.toggleToday', error);
    $q.notify({
      type: 'negative',
      position: 'top',
      message: t('pages.toast.taskToggleFailed'),
    });
  } finally {
    pendingTaskIds.value.delete(taskId);
    pendingTaskIds.value = new Set(pendingTaskIds.value);
  }
}

function onSwipeRight(taskId: string, details: SwipeDetails): void {
  if (pendingTaskIds.value.has(taskId) || details.direction !== 'right') return;

  swipingTaskId.value = taskId;
  void toggleTask(taskId).finally(() => {
    if (swipingTaskId.value === taskId) {
      swipingTaskId.value = null;
    }
  });
}

function getSwipeHandler(taskId: string): (details: SwipeDetails) => void {
  return (details) => {
    onSwipeRight(taskId, details);
  };
}

function goToDetail(taskId: string): void {
  void router.push(`/tasks/${taskId}`);
}

function openCreate(): void {
  isTaskSheetOpen.value = true;
}

async function submitCreate(payload: {
  title: string;
  targetPerWeek: TargetPerWeek;
}): Promise<void> {
  taskSheetBusy.value = true;
  try {
    await store.createTask(payload);
    $q.notify({
      type: 'positive',
      position: 'top',
      message: t('pages.newTask.createdSuccess'),
    });
    isTaskSheetOpen.value = false;
  } catch (error) {
    appendDebugLog('tasks.createTask', error);
    $q.notify({
      type: 'negative',
      position: 'top',
      message: t('pages.newTask.createFailed'),
    });
  } finally {
    taskSheetBusy.value = false;
  }
}
</script>
