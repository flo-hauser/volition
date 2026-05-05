<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <div class="page-eyebrow">{{ eyebrow }}</div>
      <h1 class="page-title" v-html="t('pages.week.title')" />
    </header>

    <WeekStrip
      :done="totalDone"
      :target="totalTarget"
      :eyebrow="t('pages.week.stripEyebrow')"
      :subtitle="t('pages.week.stripSubtitle')"
      :day-pattern="dayPattern"
      :today-idx="todayIdx"
      :day-labels="dayLabels"
    />

    <div class="section-head">
      <h2 class="section-title">{{ t('pages.week.perTask') }}</h2>
    </div>

    <div v-if="tasks.length > 0">
      <button
        v-for="task in tasks"
        :key="task.id"
        type="button"
        class="week-card"
        :class="{ achieved: isAchieved(task) }"
        @click="goToDetail(task.id)"
      >
        <div class="week-card-head">
          <div>
            <h3 class="week-card-title">{{ task.title }}</h3>
            <div class="week-card-meta">
              {{ t('pages.week.targetPerWeek', { count: task.targetPerWeek }) }}
            </div>
            <div v-if="isAchieved(task)" class="achieved-badge">
              {{ t('pages.week.goalReached') }}
            </div>
          </div>
          <div class="week-card-progress">
            {{ store.weekProgress(task.id, weekId) }}
            <span class="of">/ {{ task.targetPerWeek }}</span>
          </div>
        </div>
        <VizDots
          :pattern="getPattern(task.id)"
          :today-idx="todayIdx"
          :day-labels="dayLabels"
          :on-cell-click="(dayIdx) => toggleForDayInWeek(task.id, dayIdx)"
        />
      </button>
    </div>

    <div v-else class="section-head">
      <p class="page-sub">{{ t('common.noTasksYet') }}</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

import VizDots from 'src/components/VizDots.vue';
import WeekStrip from 'src/components/WeekStrip.vue';
import { useAppPreferences } from 'src/composables/useAppPreferences';
import {
  getLocalDayISO,
  getWeekId,
  getWeekDays,
  getWeekdayIndex,
  toLocalDate,
} from 'src/composables/useDay';
import { getWeekPattern } from 'src/composables/useProgress';
import { appendDebugLog } from 'src/services/debug/runtimeDiagnostics';
import { useTasksStore } from 'src/stores/tasks.store';
import type { Task } from 'src/types/task';

const { t, locale } = useI18n();
const $q = useQuasar();
const store = useTasksStore();
const router = useRouter();
const { weekStartDay } = useAppPreferences();
const pendingTaskIds = ref(new Set<string>());

const todayISO = getLocalDayISO();
const weekId = computed(() => getWeekId(todayISO, weekStartDay.value));
const todayIdx = computed(() => getWeekdayIndex(weekId.value, todayISO, weekStartDay.value));

const tasks = computed(() => store.activeTasks);

const totalDone = computed(() =>
  tasks.value.reduce((sum, task) => sum + store.weekProgress(task.id, weekId.value), 0),
);
const totalTarget = computed(() => tasks.value.reduce((sum, task) => sum + task.targetPerWeek, 0));

const eyebrow = computed(() => {
  const days = getWeekDays(weekId.value, weekStartDay.value);
  const first = days[0];
  const last = days[6];
  if (!first || !last) return '';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = toLocalDate(first).toLocaleDateString(locale.value, fmt);
  const end = toLocalDate(last).toLocaleDateString(locale.value, fmt);
  const weekNumber = weekId.value.split('-W')[1] ?? '';
  return t('pages.week.eyebrow', { week: weekNumber, start, end });
});

const dayPattern = computed<number[]>(() => {
  const days = getWeekDays(weekId.value, weekStartDay.value);
  return days.map((day) => {
    const dayCheckins = store.checkinsByDay[day];
    return dayCheckins ? Object.keys(dayCheckins).length : 0;
  });
});

const dayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'narrow' });
  return getWeekDays(weekId.value, weekStartDay.value).map((day) =>
    formatter.format(toLocalDate(day)),
  );
});

function isAchieved(task: Task): boolean {
  return store.weekProgress(task.id, weekId.value) >= task.targetPerWeek;
}

function getPattern(taskId: string): number[] {
  return getWeekPattern(taskId, weekId.value, store.checkinsByDay, weekStartDay.value);
}

function goToDetail(taskId: string): void {
  void router.push(`/tasks/${taskId}`);
}

async function toggleForDayInWeek(taskId: string, dayIdx: number): Promise<void> {
  const weekDays = getWeekDays(weekId.value, weekStartDay.value);
  const dayISO = weekDays[dayIdx];

  if (!dayISO) return;

  pendingTaskIds.value.add(taskId);
  pendingTaskIds.value = new Set(pendingTaskIds.value);

  try {
    await store.toggleForDay(taskId, dayISO);
  } catch (error) {
    appendDebugLog('week.toggleForDay', error);
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
</script>
