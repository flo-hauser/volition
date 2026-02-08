import { nextTick, ref } from 'vue';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRoute = { meta: { titleKey: 'nav.today' as unknown } };
const mockLocale = ref('en-US');

let mockStore: {
  isReady: boolean;
  init: ReturnType<typeof vi.fn>;
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: mockLocale,
  }),
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
        'q-toolbar': true,
        'q-toolbar-title': true,
        'q-btn-toggle': true,
        'q-btn': true,
        'q-banner': true,
        'q-page-container': true,
        'q-slide-transition': true,
        'q-spinner': true,
        'q-footer': true,
        'q-tabs': true,
        'q-route-tab': true,
        'router-view': true,
      },
    },
  });
}

describe('MainLayout', () => {
  beforeEach(() => {
    mockRoute.meta.titleKey = 'nav.today';
    mockLocale.value = 'en-US';

    mockStore = {
      isReady: true,
      init: vi.fn().mockResolvedValue(undefined),
    };
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

  it('falls back to app name when route has no title key', async () => {
    mockRoute.meta.titleKey = undefined;
    const wrapper = mountLayout();
    await flushPromises();

    expect(wrapper.html()).toContain('app.name');
  });

  it('switches current locale through computed setter', async () => {
    const wrapper = mountLayout();

    (wrapper.vm as unknown as { currentLocale: string }).currentLocale = 'de-DE';
    await nextTick();

    expect(mockLocale.value).toBe('de-DE');
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
