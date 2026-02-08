import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

import TaskFormDialog from 'src/components/TaskFormDialog.vue';

function mountDialog(props?: Record<string, unknown>) {
  return shallowMount(TaskFormDialog, {
    props: {
      modelValue: true,
      mode: 'create',
      ...props,
    },
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-dialog': true,
        'q-card': true,
        'q-card-section': true,
        'q-card-actions': true,
        'q-input': true,
        'q-select': true,
        'q-btn': true,
      },
    },
  });
}

describe('TaskFormDialog', () => {
  it('renders stable markup', () => {
    const wrapper = mountDialog();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('emits submit with payload when valid', () => {
    const wrapper = mountDialog({ initialTitle: 'Sports', initialTargetPerWeek: 3 });

    (wrapper.vm as unknown as { submit: () => void }).submit();

    expect(wrapper.emitted('submit')?.[0]).toEqual([{ title: 'Sports', targetPerWeek: 3 }]);
  });

  it('does not emit submit when title is empty', () => {
    const wrapper = mountDialog({ initialTitle: '   ' });

    (wrapper.vm as unknown as { submit: () => void }).submit();

    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('uses edit mode labels', () => {
    const wrapper = mountDialog({ mode: 'edit' });

    expect(wrapper.html()).toContain('pages.tasks.editTask');
    expect(wrapper.html()).toContain('common.save');
  });
});
