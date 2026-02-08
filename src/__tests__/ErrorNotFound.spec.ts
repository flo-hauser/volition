import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

import ErrorNotFound from 'src/pages/ErrorNotFound.vue';

describe('ErrorNotFound', () => {
  it('renders stable markup', () => {
    const wrapper = shallowMount(ErrorNotFound, {
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          'q-btn': true,
        },
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
