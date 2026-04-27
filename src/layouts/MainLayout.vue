<template>
  <q-layout :class="{ 'native-shell': isNative }" view="hHh lpR fFf">
    <q-header v-if="showNativeStatusBar" class="native-statusbar" bordered>
      <div class="native-statusbar__safe" aria-hidden="true" />
    </q-header>

    <q-header v-if="showHeader" class="vol-header">
      <div class="app-header">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">V</div>
          <div class="brand-name">{{ t('app.name') }}</div>
        </div>
      </div>

      <div v-if="initError" class="app-banner error" role="alert">
        {{ t('app.initError') }}
      </div>
      <output v-if="isOffline" class="app-banner warn">
        {{ t('app.offlineBanner') }}
      </output>
      <output v-if="updateAvailable" class="app-banner">
        <span>{{ t('app.updateAvailable') }}</span>
        <span class="spacer" />
        <button class="ghost-btn" type="button" @click="applyUpdate">
          {{ t('app.updateAction') }}
        </button>
      </output>
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
        <div class="text-body2 q-mt-md" style="color: var(--text-2)">
          {{ t('app.loading') }}
        </div>
      </div>

      <div v-if="!isNative" class="legal-footer">
        <router-link to="/imprint" class="legal-footer-link">{{
          t('legal.imprintLink')
        }}</router-link>
        <span class="legal-footer-sep">·</span>
        <router-link to="/privacy" class="legal-footer-link">{{
          t('legal.privacyLink')
        }}</router-link>
      </div>
    </q-page-container>

    <q-footer class="vol-footer">
      <nav class="tabbar" :style="{ '--tab-count': String(tabs.length) }" aria-label="Primary">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          v-slot="{ isActive, href, navigate }"
          :to="tab.to"
          custom
        >
          <a
            :href="href"
            :class="['tab', { active: tab.exact ? route.path === tab.to : isActive }]"
            :aria-current="
              tab.exact
                ? route.path === tab.to
                  ? 'page'
                  : undefined
                : isActive
                  ? 'page'
                  : undefined
            "
            @click="navigate"
          >
            <q-icon :name="tab.icon" />
            <span>{{ t(tab.labelKey) }}</span>
          </a>
        </router-link>
      </nav>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Platform } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { useTasksStore } from 'src/stores/tasks.store';

const isNative = Platform.is.capacitor;

const tasksStore = useTasksStore();
const route = useRoute();
const hideHeader = computed(() => Boolean(route.meta?.['hideHeader']));
const showHeader = computed(() => !isNative && !hideHeader.value);
const showNativeStatusBar = computed(() => isNative);
const initError = ref(false);
const isOffline = ref(typeof navigator === 'undefined' ? false : !navigator.onLine);
const updateAvailable = ref(false);
const waitingRegistration = ref<ServiceWorkerRegistration | null>(null);

const { t } = useI18n({ useScope: 'global' });

const tabs = computed(
  () =>
    [
      { to: '/', icon: 'today', labelKey: 'nav.today', exact: true },
      { to: '/week', icon: 'calendar_view_week', labelKey: 'nav.week', exact: false },
      { to: '/tasks', icon: 'checklist', labelKey: 'nav.tasks', exact: false },
      { to: '/settings', icon: 'settings', labelKey: 'nav.settings', exact: false },
    ] as const,
);

function handleOfflineStatus(isOnline: boolean): void {
  isOffline.value = !isOnline;
}

function handleUpdateAvailable(event: Event): void {
  const detail = (event as CustomEvent<ServiceWorkerRegistration | undefined>).detail;
  waitingRegistration.value = detail ?? null;
  updateAvailable.value = true;
}

function applyUpdate(): void {
  waitingRegistration.value?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  window.location.reload();
}

function handleOnline(): void {
  handleOfflineStatus(true);
}

function handleOffline(): void {
  handleOfflineStatus(false);
}

onMounted(async () => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('volition-pwa-updated', handleUpdateAvailable);

  try {
    await tasksStore.init();
  } catch {
    initError.value = true;
    tasksStore.isReady = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('volition-pwa-updated', handleUpdateAvailable);
});
</script>

<style scoped>
.vol-header {
  background: color-mix(in oklab, var(--bg-elev) 92%, transparent);
  color: var(--text);
  box-shadow: none;
  border-bottom: 1px solid var(--hairline);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.native-statusbar {
  background: var(--accent-deep);
  color: transparent;
  box-shadow: none;
  border-bottom: 0;
}

.native-statusbar__safe {
  height: env(safe-area-inset-top);
  min-height: env(safe-area-inset-top);
}

:global(body.body--dark) .native-statusbar {
  background: var(--surface);
}

.vol-footer {
  background: transparent;
  color: var(--text);
  box-shadow: none;
}
.legal-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 24px 0 32px;
}
.legal-footer-link {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  text-decoration: none;
  letter-spacing: 0.04em;
}
.legal-footer-link:hover {
  color: var(--text-2);
}
.legal-footer-sep {
  font-size: 11px;
  color: var(--text-3);
}
</style>
