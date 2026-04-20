<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <button
        class="icon-btn"
        type="button"
        style="margin-bottom: 12px"
        :aria-label="t('common.back')"
        @click="goBack"
      >
        <q-icon name="arrow_back" />
      </button>
      <div class="page-eyebrow">{{ t('nav.settings') }}</div>
      <h1 class="page-title">{{ t('pages.settings.title') }}</h1>
      <p class="page-sub">{{ t('pages.settings.hint') }}</p>
    </header>

    <section class="settings-section">
      <h2 class="section-title">{{ t('pages.settings.languageTitle') }}</h2>
      <div class="seg">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ sel: currentLocale === option.value }"
          :aria-pressed="currentLocale === option.value"
          @click="currentLocale = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="section-title">{{ t('pages.settings.themeTitle') }}</h2>
      <div class="seg">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ sel: themeMode === option.value }"
          :aria-pressed="themeMode === option.value"
          @click="themeMode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <p class="settings-hint">{{ t('pages.settings.themeHint') }}</p>
    </section>

    <section class="settings-section">
      <h2 class="section-title">Diagnostics</h2>
      <div class="diag">
        <div>Secure Context: {{ String(runtimeDiagnostics.isSecureContext) }}</div>
        <div>crypto.randomUUID: {{ String(runtimeDiagnostics.hasRandomUUID) }}</div>
        <div>IndexedDB: {{ String(runtimeDiagnostics.hasIndexedDB) }}</div>
        <div>LocalStorage: {{ String(runtimeDiagnostics.hasLocalStorage) }}</div>
        <div class="ua">UA: {{ runtimeDiagnostics.userAgent }}</div>
      </div>
      <button type="button" class="ghost-btn" @click="reloadDebugData">Reload diagnostics</button>
      <div v-if="debugLogs.length > 0" class="diag-logs">
        <div class="diag-logs-head">Recent logs (up to 20)</div>
        <div v-for="entry in debugLogs" :key="entry.id" class="diag-log">
          {{ entry.at }} | {{ entry.scope }} | {{ entry.message }}
        </div>
      </div>
      <p v-else class="settings-hint">No captured runtime error yet.</p>
    </section>
    <section class="settings-section">
      <h2 class="section-title">Data</h2>
      <div class="diag">
        Tasks <br />
        {{ store.activeTasks }}
      </div>
      <div class="diag">
        Check Ins <br />
        {{ store.checkinsByDay }}
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Dark } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
  setStoredLocale,
  setStoredThemeMode,
  type AppLocale,
  type ThemeMode,
} from 'src/composables/useAppPreferences';
import {
  getRuntimeDiagnostics,
  readDebugLogs,
  type DebugLogEntry,
} from 'src/services/debug/runtimeDiagnostics';
import { useTasksStore } from 'src/stores/tasks.store';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const debugLogs = ref<DebugLogEntry[]>([]);
const runtimeDiagnostics = computed(() => getRuntimeDiagnostics());
const store = useTasksStore();

const localeOptions = computed<{ value: AppLocale; label: string }[]>(() => [
  { value: 'en-US', label: t('pages.settings.localeEnglish') },
  { value: 'de-DE', label: t('pages.settings.localeGerman') },
]);

const themeOptions = computed<{ value: ThemeMode; label: string }[]>(() => [
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
    if (Dark.mode === true) return 'dark';
    if (Dark.mode === false) return 'light';
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

function goBack(): void {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/');
  }
}

function reloadDebugData(): void {
  debugLogs.value = readDebugLogs();
}

onMounted(() => {
  reloadDebugData();
});
</script>

<style scoped>
.settings-section {
  padding: 16px 24px;
}
.settings-section .section-title {
  padding: 0;
  margin: 0 0 12px;
}
.settings-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
.seg {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--r-full);
  background: var(--surface);
  border: 1px solid var(--hairline);
}
.seg-btn {
  padding: 8px 16px;
  border-radius: var(--r-full);
  border: 0;
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms var(--ease);
}
.seg-btn:hover {
  color: var(--text);
}
.seg-btn.sel {
  background: var(--accent-deep);
  color: var(--cream);
}
:global(body.body--dark) .seg-btn.sel {
  background: var(--accent);
  color: var(--bg);
}
.diag {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 10px;
}
.diag .ua {
  word-break: break-all;
}
.diag-logs {
  margin-top: 14px;
  padding: 12px;
  border-radius: var(--r-md);
  background: var(--surface);
  border: 1px solid var(--hairline);
  max-height: 240px;
  overflow-y: auto;
}
.diag-logs-head {
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  color: var(--text-2);
  margin-bottom: 6px;
}
.diag-log {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.45;
}
</style>
