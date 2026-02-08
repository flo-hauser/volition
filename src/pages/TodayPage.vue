<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.today.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.today.hint') }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">{{ t('pages.today.weekId', { weekId: currentWeekId }) }}</div>
        </q-card-section>

        <q-separator />

        <q-list v-if="tasks.length > 0" separator>
          <q-item v-for="task in tasks" :key="task.id" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ task.title }}</q-item-label>
              <q-item-label caption>
                {{ t('pages.today.progressLabel', { progress: store.weekProgress(task.id, currentWeekId), target: task.targetPerWeek }) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-toggle
                :model-value="store.isDone(task.id, todayISO)"
                color="primary"
                :label="t('pages.today.doneToday')"
                :disable="pendingTaskIds.has(task.id)"
                @update:model-value="toggleTask(task.id)"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-grey-8">
          {{ t('common.noTasksYet') }} {{ t('pages.today.openTasks') }}
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn color="primary" no-caps icon="add" :label="t('common.addTask')" :to="'/tasks/new'" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { getIsoWeekId, getLocalDayISO } from 'src/composables/useDay';
import { useTasksStore } from 'src/stores/tasks.store';

const { t } = useI18n();
const store = useTasksStore();

const todayISO = getLocalDayISO();
const currentWeekId = getIsoWeekId(todayISO);
const pendingTaskIds = ref(new Set<string>());

const tasks = computed(() => store.activeTasks);

async function toggleTask(taskId: string): Promise<void> {
  pendingTaskIds.value.add(taskId);

  try {
    await store.toggleToday(taskId);
  } finally {
    pendingTaskIds.value.delete(taskId);
    pendingTaskIds.value = new Set(pendingTaskIds.value);
  }
}
</script>
