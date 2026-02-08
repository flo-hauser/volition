<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="vol-header">
      <q-toolbar>
        <q-toolbar-title>
          <div class="row items-center no-wrap q-gutter-sm">
            <q-img :src="headerIconSrc" width="30px" height="30px" fit="contain" />
            <div class="text-weight-bold">{{ t('app.name') }}</div>
          </div>
        </q-toolbar-title>

        <q-btn
          flat
          dense
          no-caps
          color="white"
          icon="add"
          :label="t('app.addTask')"
          :to="'/tasks?new=1'"
        />
        <q-btn
          flat
          dense
          round
          color="white"
          icon="settings"
          :to="'/settings'"
          :aria-label="t('nav.settings')"
        />
      </q-toolbar>
      <q-banner v-if="initError" dense class="bg-negative text-white">
        {{ t('app.initError') }}
      </q-banner>
    </q-header>

    <q-page-container>
      <q-slide-transition>
        <div v-if="tasksStore.isReady">
          <router-view />
        </div>
      </q-slide-transition>

      <div
        v-if="!tasksStore.isReady"
        class="column items-center justify-center q-pa-xl"
        style="min-height: 60vh"
      >
        <q-spinner color="primary" size="2em" />
        <div class="text-body2 text-grey-2 q-mt-md">{{ t('app.loading') }}</div>
      </div>
    </q-page-container>

    <q-footer bordered class="vol-footer">
      <q-tabs dense indicator-color="warning" active-color="warning" align="justify">
        <q-route-tab to="/" icon="today" :label="t('nav.today')" exact />
        <q-route-tab to="/week" icon="calendar_view_week" :label="t('nav.week')" />
        <q-route-tab to="/tasks" icon="checklist" :label="t('nav.tasks')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import { useTasksStore } from 'src/stores/tasks.store';

const $q = useQuasar();
const tasksStore = useTasksStore();
const initError = ref(false);

const { t } = useI18n({ useScope: 'global' });

const headerIconSrc = computed(() =>
  $q.dark.isActive ? '/icons/icon-light.svg' : '/icons/icon-dark.svg',
);

onMounted(async () => {
  try {
    await tasksStore.init();
  } catch {
    initError.value = true;
    tasksStore.isReady = true;
  }
});
</script>

<style scoped>
.vol-header {
  background: var(--vol-header);
  color: var(--vol-header-text);
}

.vol-footer {
  background: var(--vol-footer);
  color: var(--vol-header-text);
}
</style>
