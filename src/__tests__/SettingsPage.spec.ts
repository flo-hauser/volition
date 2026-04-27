import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockLocale,
  setStoredLocale,
  setStoredThemeMode,
  readDebugLogs,
  getRuntimeDiagnostics,
  darkSet,
  Dark,
  mockNotify,
  mockBack,
  mockPush,
  mockStore,
} = vi.hoisted(() => ({
  mockLocale: { value: 'en-US' as 'en-US' | 'de-DE' },
  setStoredLocale: vi.fn(),
  setStoredThemeMode: vi.fn(),
  readDebugLogs: vi.fn().mockReturnValue([]),
  getRuntimeDiagnostics: vi.fn().mockReturnValue({
    isSecureContext: false,
    hasCrypto: true,
    hasRandomUUID: true,
    hasIndexedDB: true,
    hasLocalStorage: true,
    userAgent: 'test-agent',
  }),
  darkSet: vi.fn(),
  Dark: {
    mode: 'auto' as boolean | 'auto',
    set: vi.fn(),
  },
  mockNotify: vi.fn(),
  mockBack: vi.fn(),
  mockPush: vi.fn(),
  mockStore: {
    activeStorageBackend: 'IndexedDB',
    activeTasks: [],
    checkinsByDay: {},
    exportState: vi.fn().mockReturnValue('{}'),
  },
}));

Dark.set = darkSet;

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: mockLocale,
  }),
}));

vi.mock('quasar', () => ({
  Dark,
  useQuasar: () => ({ notify: mockNotify }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

vi.mock('src/composables/useAppPreferences', () => ({
  setStoredLocale,
  setStoredThemeMode,
}));

vi.mock('src/services/debug/runtimeDiagnostics', () => ({
  readDebugLogs,
  getRuntimeDiagnostics,
  appendDebugLog: vi.fn(),
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import SettingsPage from 'src/pages/SettingsPage.vue';

function mountPage() {
  return mount(SettingsPage, {
    global: {
      stubs: {
        'q-page': { template: '<div><slot /></div>' },
        'q-icon': { template: '<span />' },
      },
    },
  });
}

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockLocale.value = 'en-US';
    Dark.mode = 'auto';
    darkSet.mockReset();
    setStoredLocale.mockReset();
    setStoredThemeMode.mockReset();
    readDebugLogs.mockReset();
    getRuntimeDiagnostics.mockReset();
    mockBack.mockReset();
    mockPush.mockReset();
    mockNotify.mockReset();
    mockStore.activeStorageBackend = 'IndexedDB';
    mockStore.activeTasks = [];
    mockStore.checkinsByDay = {};
    mockStore.exportState.mockReset();
    mockStore.exportState.mockReturnValue('{}');
    readDebugLogs.mockReturnValue([]);
    getRuntimeDiagnostics.mockReturnValue({
      isSecureContext: false,
      hasCrypto: true,
      hasRandomUUID: true,
      hasIndexedDB: true,
      hasLocalStorage: true,
      userAgent: 'test-agent',
    });
  });

  it('renders stable markup', () => {
    const wrapper = mountPage();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('updates and persists locale', () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { currentLocale: 'en-US' | 'de-DE' }).currentLocale = 'de-DE';

    expect(mockLocale.value).toBe('de-DE');
    expect(setStoredLocale).toHaveBeenCalledWith('de-DE');
  });

  it('reads current locale through computed getter', () => {
    mockLocale.value = 'de-DE';
    const wrapper = mountPage();
    expect((wrapper.vm as unknown as { currentLocale: 'en-US' | 'de-DE' }).currentLocale).toBe('de-DE');
  });

  it('persists changes when a segmented locale button is clicked', async () => {
    const wrapper = mountPage();
    const localeButtons = wrapper.findAll('.seg')[0]?.findAll('.seg-btn') ?? [];
    const germanButton = localeButtons.find((b) => b.text().includes('localeGerman'));
    await germanButton?.trigger('click');

    expect(setStoredLocale).toHaveBeenCalledWith('de-DE');
  });

  it('loads diagnostics logs on mount', async () => {
    readDebugLogs.mockReturnValue([
      {
        id: 'log-1',
        at: '2026-02-08T10:00:00.000Z',
        scope: 'tasks.createTask',
        message: 'boom',
        diagnostics: {
          isSecureContext: false,
          hasCrypto: true,
          hasRandomUUID: false,
          hasIndexedDB: true,
          hasLocalStorage: true,
          userAgent: 'test-agent',
        },
      },
    ]);

    const wrapper = mountPage();
    await nextTick();
    (wrapper.vm as unknown as { showDebug: boolean }).showDebug = true;
    await nextTick();
    expect(wrapper.html()).toContain('Recent logs (up to 20)');
    expect(readDebugLogs).toHaveBeenCalled();
  });

  it('renders the active storage backend in diagnostics', async () => {
    mockStore.activeStorageBackend = 'LocalStorage';

    const wrapper = mountPage();
    (wrapper.vm as unknown as { showDebug: boolean }).showDebug = true;
    await nextTick();

    expect(wrapper.html()).toContain('Storage Backend: LocalStorage');
  });

  it('returns theme mode from Quasar Dark plugin state', () => {
    Dark.mode = true;
    const darkWrapper = mountPage();
    expect((darkWrapper.vm as unknown as { themeMode: string }).themeMode).toBe('dark');

    Dark.mode = false;
    const lightWrapper = mountPage();
    expect((lightWrapper.vm as unknown as { themeMode: string }).themeMode).toBe('light');

    Dark.mode = 'auto';
    const systemWrapper = mountPage();
    expect((systemWrapper.vm as unknown as { themeMode: string }).themeMode).toBe('system');
  });

  it('persists theme and applies light mode', () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { themeMode: 'light' | 'dark' | 'system' }).themeMode = 'light';

    expect(setStoredThemeMode).toHaveBeenCalledWith('light');
    expect(darkSet).toHaveBeenCalledWith(false);
  });

  it('persists theme and applies dark mode', () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { themeMode: 'light' | 'dark' | 'system' }).themeMode = 'dark';

    expect(setStoredThemeMode).toHaveBeenCalledWith('dark');
    expect(darkSet).toHaveBeenCalledWith(true);
  });

  it('persists theme and applies system mode', () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { themeMode: 'light' | 'dark' | 'system' }).themeMode = 'system';

    expect(setStoredThemeMode).toHaveBeenCalledWith('system');
    expect(darkSet).toHaveBeenCalledWith('auto');
  });
});
