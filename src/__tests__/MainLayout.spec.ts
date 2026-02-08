import { ref } from 'vue';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDarkIsActive = ref(false);

let mockStore: {
  isReady: boolean;
  init: ReturnType<typeof vi.fn>;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({
    dark: {
      get isActive() {
        return mockDarkIsActive.value;
      },
    },
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
        'q-img': true,
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
    mockDarkIsActive.value = false;

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

  it('keeps app title visible in header', async () => {
    const wrapper = mountLayout();
    await flushPromises();

    expect(wrapper.html()).toContain('app.name');
    expect(wrapper.html()).not.toContain('text-caption ellipsis');
  });

  it('switches header icon based on dark mode state', async () => {
    mockDarkIsActive.value = false;
    const lightWrapper = mountLayout();
    await flushPromises();
    expect(lightWrapper.html()).toContain('/icons/icon-dark.svg');

    mockDarkIsActive.value = true;
    const darkWrapper = mountLayout();
    await flushPromises();
    expect(darkWrapper.html()).toContain('/icons/icon-light.svg');
  });

  it('shows settings action only in header', async () => {
    const wrapper = mountLayout();
    await flushPromises();
    const html = wrapper.html();
    expect(html.match(/to="\/settings"/g)).toHaveLength(1);
    expect(html).not.toContain('<q-route-tab-stub data-v-22686b16="" to="/settings"');
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
