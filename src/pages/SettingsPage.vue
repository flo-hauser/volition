<template>
  <q-page class="page page-enter">
    <header class="page-head">
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
      <h2 class="section-title">{{ t('pages.settings.weekStart.label') }}</h2>
      <div class="seg">
        <button
          v-for="option in weekStartOptions"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ sel: weekStartDay === option.value }"
          :aria-pressed="weekStartDay === option.value"
          @click="setWeekStartDay(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="section-title">{{ t('legal.sectionTitle') }}</h2>
      <div class="legal-links">
        <button type="button" class="legal-link" @click="router.push('/imprint')">
          {{ t('legal.imprintLink') }}
        </button>
        <button type="button" class="legal-link" @click="router.push('/privacy')">
          {{ t('legal.privacyLink') }}
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="section-title">{{ t('pages.settings.backup.title') }}</h2>

      <div class="settings-row">
        <div class="settings-row__body">
          <span class="settings-row__label">{{ t('pages.settings.backup.exportLabel') }}</span>
          <span class="settings-row__hint">{{ t('pages.settings.backup.exportHint') }}</span>
        </div>
        <button type="button" class="ghost-btn" @click="handleExport">
          {{ t('pages.settings.backup.exportBtn') }}
        </button>
      </div>

      <div class="settings-row">
        <div class="settings-row__body">
          <span class="settings-row__label">{{ t('pages.settings.backup.importLabel') }}</span>
          <span class="settings-row__hint">{{ t('pages.settings.backup.importHint') }}</span>
        </div>
        <label class="ghost-btn">
          {{ t('pages.settings.backup.importBtn') }}
          <input type="file" accept=".json,application/json" hidden @change="handleImport" />
        </label>
      </div>
    </section>

    <q-dialog v-model="confirmDialogOpen">
      <div class="sheet-card" style="max-width: 420px">
        <div class="grab" aria-hidden="true" />
        <h2>{{ t('pages.settings.backup.importConfirmTitle') }}</h2>
        <p class="sub">{{ t('pages.settings.backup.importConfirm') }}</p>
        <div v-if="importError" class="error-message">
          {{ t(`pages.settings.backup.importError${importError}`) || importError }}
        </div>
        <div class="sheet-actions">
          <button
            type="button"
            class="ghost-btn"
            :disabled="importing"
            @click="confirmDialogOpen = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="primary-btn" :disabled="importing" @click="confirmImport">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </q-dialog>

    <section class="settings-section debug-toggle-section">
      <button type="button" class="debug-toggle-btn" @click="showDebug = !showDebug">
        Debug {{ showDebug ? '▴' : '▾' }}
      </button>
    </section>

    <template v-if="showDebug">
      <section class="settings-section">
        <h2 class="section-title">Diagnostics</h2>
        <div class="diag">
          <div>Secure Context: {{ String(runtimeDiagnostics.isSecureContext) }}</div>
          <div>crypto.randomUUID: {{ String(runtimeDiagnostics.hasRandomUUID) }}</div>
          <div>IndexedDB: {{ String(runtimeDiagnostics.hasIndexedDB) }}</div>
          <div>LocalStorage: {{ String(runtimeDiagnostics.hasLocalStorage) }}</div>
          <div>Storage Backend: {{ store.activeStorageBackend }}</div>
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
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Dark, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
  useAppPreferences,
  setStoredLocale,
  setStoredThemeMode,
  type AppLocale,
  type WeekStartDay,
  type ThemeMode,
} from 'src/composables/useAppPreferences';
import {
  getRuntimeDiagnostics,
  readDebugLogs,
  appendDebugLog,
  type DebugLogEntry,
} from 'src/services/debug/runtimeDiagnostics';
import { triggerDownload, parseImport } from 'src/services/dataTransfer';
import type { StorageState } from 'src/types/storage';
import { useTasksStore } from 'src/stores/tasks.store';

const { t, locale } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const router = useRouter();
const debugLogs = ref<DebugLogEntry[]>([]);
const showDebug = ref(false);
const runtimeDiagnostics = computed(() => getRuntimeDiagnostics());
const store = useTasksStore();
const { weekStartDay, setWeekStartDay } = useAppPreferences();

const confirmDialogOpen = ref(false);
const importing = ref(false);
const importError = ref<string | null>(null);
const pendingImport = ref<StorageState | null>(null);

const localeOptions = computed<{ value: AppLocale; label: string }[]>(() => [
  { value: 'en-US', label: t('pages.settings.localeEnglish') },
  { value: 'de-DE', label: t('pages.settings.localeGerman') },
]);

const themeOptions = computed<{ value: ThemeMode; label: string }[]>(() => [
  { value: 'system', label: t('pages.settings.themeSystem') },
  { value: 'light', label: t('pages.settings.themeLight') },
  { value: 'dark', label: t('pages.settings.themeDark') },
]);

const weekStartOptions = computed<{ value: WeekStartDay; label: string }[]>(() => [
  { value: 'monday', label: t('pages.settings.weekStart.monday') },
  { value: 'sunday', label: t('pages.settings.weekStart.sunday') },
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

function reloadDebugData(): void {
  debugLogs.value = readDebugLogs();
}

async function handleExport(): Promise<void> {
  const json = store.exportState();
  const date = new Date().toISOString().slice(0, 10);
  try {
    await triggerDownload(json, `volition-backup-${date}.json`);
    $q.notify({
      type: 'positive',
      position: 'top',
      message: t('pages.settings.backup.exportSuccess'),
    });
  } catch (error) {
    appendDebugLog('backup.export', error);
    $q.notify({
      type: 'negative',
      position: 'top',
      message: t('pages.settings.backup.exportFailed'),
    });
  }
}

async function handleImport(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const raw = await file.text();
  const result = parseImport(raw);

  if (!result.ok || !result.state) {
    importError.value = result.error ?? 'unknown';
    confirmDialogOpen.value = true;
    return;
  }

  pendingImport.value = result.state;
  confirmDialogOpen.value = true;

  (event.target as HTMLInputElement).value = '';
}

async function confirmImport(): Promise<void> {
  if (!pendingImport.value) return;
  importing.value = true;
  try {
    await store.importState(pendingImport.value);
    confirmDialogOpen.value = false;
    importError.value = null;
    pendingImport.value = null;
  } catch {
    importError.value = 'unknown';
  } finally {
    importing.value = false;
  }
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
.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.settings-row__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.settings-row__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.settings-row__hint {
  font-size: 12px;
  color: var(--text-3);
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
.debug-toggle-section {
  padding-top: 8px;
  padding-bottom: 8px;
}
.debug-toggle-btn {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  cursor: pointer;
  padding: 4px 0;
  letter-spacing: 0.05em;
}
.debug-toggle-btn:hover {
  color: var(--text-2);
}
.legal-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.legal-link {
  background: none;
  border: none;
  padding: 6px 0;
  font-size: 14px;
  color: var(--accent-deep);
  font-family: var(--font-body);
  cursor: pointer;
  text-align: left;
}
:global(body.body--dark) .legal-link {
  color: var(--accent);
}
.sheet-card {
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 24px;
  position: relative;
}
.sheet-card h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.sheet-card .sub {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-2);
}
.error-message {
  margin: 12px 0;
  padding: 12px;
  border-radius: var(--r-md);
  background: var(--surface);
  border: 1px solid var(--error, #dc2626);
  font-size: 13px;
  color: var(--error, #dc2626);
}
.sheet-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
.grab {
  width: 40px;
  height: 4px;
  background: var(--text-3);
  border-radius: 2px;
  margin: 0 auto 16px;
}
</style>
