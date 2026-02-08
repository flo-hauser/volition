import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockLocale,
  setStoredLocale,
  setStoredThemeMode,
  readDebugLogs,
  getRuntimeDiagnostics,
  darkSet,
  Dark,
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
}));

vi.mock('src/composables/useAppPreferences', () => ({
  setStoredLocale,
  setStoredThemeMode,
}));

vi.mock('src/services/debug/runtimeDiagnostics', () => ({
  readDebugLogs,
  getRuntimeDiagnostics,
}));

import SettingsPage from 'src/pages/SettingsPage.vue';

const QBtnToggleStub = defineComponent({
  name: 'QBtnToggle',
  props: {
    modelValue: {
      type: String,
      required: false,
      default: '',
    },
    options: {
      type: Array as () => Array<{ value: string; label: string }>,
      required: false,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          class: 'q-btn-toggle-stub',
          'data-options': JSON.stringify(props.options),
          onClick: () => {
            const firstAlternative = props.options.find((option) => option.value !== props.modelValue);
            if (firstAlternative) {
              emit('update:modelValue', firstAlternative.value);
            }
          },
        },
        String(props.modelValue),
      );
  },
});

function mountPage() {
  return mount(SettingsPage, {
    global: {
      stubs: {
        'q-page': { template: '<div><slot /></div>' },
        'q-card': { template: '<section><slot /></section>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-separator': { template: '<hr />' },
        'q-btn-toggle': QBtnToggleStub,
        'q-btn': { template: '<button><slot /></button>' },
        'q-banner': { template: '<div><slot /></div>' },
      },
    },
  });
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockLocale.value = 'en-US';
    Dark.mode = 'auto';
    darkSet.mockReset();
    setStoredLocale.mockReset();
    setStoredThemeMode.mockReset();
    readDebugLogs.mockReset();
    getRuntimeDiagnostics.mockReset();
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

  it('updates locale and theme from toggle events', async () => {
    const wrapper = mountPage();
    const toggles = wrapper.findAll('button.q-btn-toggle-stub');

    await toggles[0]?.trigger('click');
    await toggles[1]?.trigger('click');

    expect(setStoredLocale).toHaveBeenCalledOnce();
    expect(setStoredThemeMode).toHaveBeenCalledOnce();
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
    expect(wrapper.html()).toContain('Recent logs (up to 20)');
    expect(readDebugLogs).toHaveBeenCalled();
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
