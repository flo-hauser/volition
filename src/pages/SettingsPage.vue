<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered class="vol-surface-card">
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.settings.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.settings.hint') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ t('pages.settings.languageTitle') }}</div>
          <q-btn-toggle
            v-model="currentLocale"
            unelevated
            no-caps
            class="q-mb-lg"
            color="secondary"
            text-color="white"
            toggle-color="primary"
            :options="localeOptions"
          />

          <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ t('pages.settings.themeTitle') }}</div>
          <q-btn-toggle
            v-model="themeMode"
            unelevated
            no-caps
            color="secondary"
            text-color="white"
            toggle-color="primary"
            :options="themeOptions"
          />

          <div class="text-caption text-grey-7 q-mt-sm">{{ t('pages.settings.themeHint') }}</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Dark } from 'quasar';
import { useI18n } from 'vue-i18n';

import { setStoredLocale, setStoredThemeMode, type AppLocale, type ThemeMode } from 'src/composables/useAppPreferences';

const { t, locale } = useI18n({ useScope: 'global' });

const localeOptions = computed(() => [
  { value: 'en-US', label: t('pages.settings.localeEnglish') },
  { value: 'de-DE', label: t('pages.settings.localeGerman') },
]);

const themeOptions = computed(() => [
  { value: 'system', label: t('pages.settings.themeSystem') },
  { value: 'light', label: t('pages.settings.themeLight') },
  { value: 'dark', label: t('pages.settings.themeDark') },
]);

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value;
    setStoredLocale(value);
  },
});

const themeMode = computed<ThemeMode>({
  get: () => {
    if (Dark.mode === true) {
      return 'dark';
    }

    if (Dark.mode === false) {
      return 'light';
    }

    return 'system';
  },
  set: (value) => {
    setStoredThemeMode(value);

    if (value === 'light') {
      Dark.set(false);
      return;
    }

    if (value === 'dark') {
      Dark.set(true);
      return;
    }

    Dark.set('auto');
  },
});
</script>
