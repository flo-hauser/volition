<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.week.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.week.hint') }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">{{ t('pages.week.thisWeek', { weekId: weekId }) }}</div>
        </q-card-section>

        <q-separator />

        <q-list v-if="tasks.length > 0" separator>
          <q-item v-for="task in tasks" :key="task.id">
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
</script>
