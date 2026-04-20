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
      :of-label="t('pages.week.stripOf', { total: totalTarget })"
      :subtitle="t('pages.week.stripSubtitle')"
    />

    <div class="section-head">
      <h2 class="section-title">{{ t('pages.week.perTask') }}</h2>
    </div>

    <div v-if="tasks.length > 0">
      <article
        v-for="task in tasks"
        :key="task.id"
        class="week-card"
        :class="{ achieved: isAchieved(task) }"
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
        <VizDots :pattern="getPattern(task.id)" :today-idx="todayIdx" />
      </article>
    </div>

    <div v-else class="section-head">
      <p class="page-sub">{{ t('common.noTasksYet') }}</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import VizDots from 'src/components/VizDots.vue';
import WeekStrip from 'src/components/WeekStrip.vue';
import {
  getIsoWeekId,
  getLocalDayISO,
  getWeekDays,
  getWeekdayIndex,
  toLocalDate,
} from 'src/composables/useDay';
import { getWeekPattern } from 'src/composables/useProgress';
import { useTasksStore } from 'src/stores/tasks.store';
import type { Task } from 'src/types/task';

const { t, locale } = useI18n();
const store = useTasksStore();

const todayISO = getLocalDayISO();
const weekId = getIsoWeekId(todayISO);
const todayIdx = getWeekdayIndex(weekId, todayISO);

const tasks = computed(() => store.activeTasks);

const totalDone = computed(() =>
  tasks.value.reduce((sum, task) => sum + store.weekProgress(task.id, weekId), 0),
);
const totalTarget = computed(() =>
  tasks.value.reduce((sum, task) => sum + task.targetPerWeek, 0),
);

const eyebrow = computed(() => {
  const days = getWeekDays(weekId);
  const first = days[0];
  const last = days[6];
  if (!first || !last) return '';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = toLocalDate(first).toLocaleDateString(locale.value, fmt);
  const end = toLocalDate(last).toLocaleDateString(locale.value, fmt);
  const weekNumber = weekId.split('-W')[1] ?? '';
  return t('pages.week.eyebrow', { week: weekNumber, start, end });
});

function isAchieved(task: Task): boolean {
  return store.weekProgress(task.id, weekId) >= task.targetPerWeek;
}

function getPattern(taskId: string): number[] {
  return getWeekPattern(taskId, weekId, store.checkinsByDay);
}
</script>
