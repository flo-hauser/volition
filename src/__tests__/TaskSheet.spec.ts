import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

import TaskSheet from 'src/components/TaskSheet.vue';

function mountSheet(props?: Record<string, unknown>) {
  return shallowMount(TaskSheet, {
    props: {
      modelValue: true,
      mode: 'create',
      ...props,
    },
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-dialog': {
          template: '<div><slot /></div>',
          props: ['modelValue'],
          emits: ['update:modelValue'],
        },
      },
    },
  });
}

describe('TaskSheet', () => {
  it('renders stable markup', () => {
    const wrapper = mountSheet();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('emits submit with payload when valid', () => {
    const wrapper = mountSheet({ initialTitle: 'Sports', initialTargetPerWeek: 3 });

    (wrapper.vm as unknown as { submit: () => void }).submit();

    expect(wrapper.emitted('submit')?.[0]).toEqual([{ title: 'Sports', targetPerWeek: 3 }]);
  });

  it('does not emit submit when title is empty', () => {
    const wrapper = mountSheet({ initialTitle: '   ' });

    (wrapper.vm as unknown as { submit: () => void }).submit();

    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('uses edit mode labels', () => {
    const wrapper = mountSheet({ mode: 'edit' });

    expect(wrapper.html()).toContain('pages.tasks.editTask');
    expect(wrapper.html()).toContain('common.save');
  });

  it('exposes a 7-button frequency picker', () => {
    const wrapper = mountSheet();
    const buttons = wrapper.findAll('.freq-picker button');
    expect(buttons).toHaveLength(7);
  });
});
