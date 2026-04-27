import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockStore: {
  isReady: boolean;
  init: ReturnType<typeof vi.fn>;
};

const mockPush = vi.fn();

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('quasar', () => ({
  Platform: { is: { capacitor: false } },
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import MainLayout from 'src/layouts/MainLayout.vue';

function mountLayout() {
  return shallowMount(MainLayout, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-layout': true,
        'q-header': true,
        'q-icon': true,
        'q-page-container': true,
        'q-slide-transition': true,
        'q-spinner': true,
        'q-footer': true,
        'router-link': {
          template: '<a><slot :isActive="false" :href="to" :navigate="() => {}" /></a>',
          props: ['to', 'custom'],
        },
        'router-view': true,
      },
    },
  });
}

describe('MainLayout', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    mockPush.mockReset();
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator, onLine: true },
      configurable: true,
    });

    mockStore = {
      isReady: true,
      init: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('renders stable markup', async () => {
    const wrapper = mountLayout();
    await flushPromises();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('initializes store on mount', async () => {
    mountLayout();
    await flushPromises();

    expect(mockStore.init).toHaveBeenCalledTimes(1);
  });

  it('renders the brand mark and name in the header', async () => {
    const wrapper = mountLayout();
    await flushPromises();

    expect(wrapper.html()).toContain('brand-mark');
    expect(wrapper.html()).toContain('app.name');
  });

  it('renders a 4-tab bottom bar', async () => {
    const wrapper = mountLayout();
    await flushPromises();
    const html = wrapper.html();

    const tabMatches = html.match(/class="tab(?: active)?"/g) ?? [];
    expect(tabMatches).toHaveLength(4);
    expect(html).toContain('nav.today');
    expect(html).toContain('nav.week');
    expect(html).toContain('nav.tasks');
    expect(html).toContain('nav.settings');
  });

  it('shows offline banner when browser is offline', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator, onLine: false },
      configurable: true,
    });

    const wrapper = mountLayout();
    await flushPromises();

    expect(wrapper.html()).toContain('app.offlineBanner');
  });

  it('shows update banner when service worker update event fires', async () => {
    const wrapper = mountLayout();
    await flushPromises();

    window.dispatchEvent(
      new CustomEvent('volition-pwa-updated', {
        detail: { waiting: { postMessage: vi.fn() } },
      }),
    );
    await flushPromises();

    expect(wrapper.html()).toContain('app.updateAvailable');
    expect(wrapper.html()).toContain('app.updateAction');
  });

  it('handles init error and sets store ready', async () => {
    mockStore.init = vi.fn().mockRejectedValue(new Error('init failed'));
    mockStore.isReady = false;

    const wrapper = mountLayout();
    await flushPromises();

    expect(mockStore.isReady).toBe(true);
    expect(wrapper.html()).toContain('app.initError');
  });
});
