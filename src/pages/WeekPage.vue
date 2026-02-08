<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered class="vol-surface-card">
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.week.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.week.hint') }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">{{ t('pages.week.thisWeek', { weekId: weekId }) }}</div>
        </q-card-section>

        <q-separator />

        <q-list v-if="tasks.length > 0" separator>
          <q-item
            v-for="task in tasks"
            :key="task.id"
            class="week-progress-item"
            :class="{ 'goal-achieved': isGoalAchieved(task.id, task.targetPerWeek) }"
            :style="weekProgressStyle(task.id, task.targetPerWeek)"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ task.title }}</q-item-label>
              <q-item-label caption>
                {{ t('pages.week.progressLabel', { progress: store.weekProgress(task.id, weekId), target: task.targetPerWeek }) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side class="text-primary text-weight-medium">
              {{ store.weekProgress(task.id, weekId) }} / {{ task.targetPerWeek }}
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-grey-8">
          {{ t('common.noTasksYet') }}
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getIsoWeekId, getLocalDayISO } from 'src/composables/useDay';
import { useTasksStore } from 'src/stores/tasks.store';

const { t } = useI18n();
const store = useTasksStore();

const weekId = getIsoWeekId(getLocalDayISO());
const tasks = computed(() => store.activeTasks);

function progressForTask(taskId: string): number {
  return store.weekProgress(taskId, weekId);
}

function isGoalAchieved(taskId: string, targetPerWeek: number): boolean {
  return progressForTask(taskId) >= targetPerWeek;
}

function weekProgressStyle(taskId: string, targetPerWeek: number): Record<string, string> {
  const fill = Math.min((progressForTask(taskId) / targetPerWeek) * 100, 100);

  return {
    '--progress-fill': `${fill.toFixed(2)}%`,
  };
}
</script>

<style scoped>
.week-progress-item {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.week-progress-item::before {
  content: '';
  position: absolute;
  inset: 0;
  width: var(--progress-fill);
  background: linear-gradient(90deg, var(--vol-progress-fill-start), var(--vol-progress-fill-end));
  opacity: 0.2;
  z-index: -1;
  transition: width 240ms ease;
}

.goal-achieved {
  animation: goal-reached 700ms ease-out 2;
}

@keyframes goal-reached {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }

  40% {
    transform: scale(1.01);
    box-shadow: 0 0 0.5rem color-mix(in srgb, var(--vol-progress-fill-end) 65%, transparent);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
}
</style>
