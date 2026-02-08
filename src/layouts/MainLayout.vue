<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header bordered class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">{{ pageTitle }}</q-toolbar-title>

        <q-btn-toggle
          v-model="currentLocale"
          dense
          unelevated
          toggle-color="secondary"
          color="white"
          text-color="secondary"
          class="q-mr-sm"
          :options="localeOptions"
        />

        <q-btn
          flat
          dense
          no-caps
          color="white"
          icon="add"
          :label="t('app.addTask')"
          :to="'/tasks?new=1'"
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

      <div v-if="!tasksStore.isReady" class="column items-center justify-center q-pa-xl" style="min-height: 60vh">
        <q-spinner color="primary" size="2em" />
        <div class="text-body2 text-grey-8 q-mt-md">{{ t('app.loading') }}</div>
      </div>
    </q-page-container>

    <q-footer bordered class="bg-secondary text-white">
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
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useTasksStore } from 'src/stores/tasks.store';
import type { MessageLanguages } from 'src/boot/i18n';

const route = useRoute();
const tasksStore = useTasksStore();
const initError = ref(false);

const { t, locale } = useI18n({ useScope: 'global' });

const localeOptions = computed(() => [
  { value: 'en-US', label: t('locale.enUS') },
  { value: 'de-DE', label: t('locale.deDE') },
]);

const currentLocale = computed<MessageLanguages>({
  get: () => locale.value as MessageLanguages,
  set: (value) => {
    locale.value = value;
  },
});

const pageTitle = computed(() => {
  const titleKey = route.meta.titleKey;
  if (typeof titleKey === 'string') {
    return t(titleKey);
  }

  return t('app.name');
});

onMounted(async () => {
  try {
    await tasksStore.init();
  } catch {
    initError.value = true;
    tasksStore.isReady = true;
  }
});
</script>
