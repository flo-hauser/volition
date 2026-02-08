import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';

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
