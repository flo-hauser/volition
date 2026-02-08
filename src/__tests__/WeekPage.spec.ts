import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

let mockStore: {
  activeTasks: Array<{ id: string; title: string; targetPerWeek: number }>;
  weekProgress: ReturnType<typeof vi.fn>;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('src/composables/useDay', () => ({
  getLocalDayISO: () => '2026-02-07',
  getIsoWeekId: () => '2026-W06',
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import WeekPage from 'src/pages/WeekPage.vue';

function mountPage() {
  return shallowMount(WeekPage, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-page': true,
        'q-card': true,
        'q-card-section': true,
        'q-separator': true,
        'q-list': true,
        'q-item': true,
        'q-item-section': true,
        'q-item-label': true,
      },
    },
  });
}

describe('WeekPage', () => {
  beforeEach(() => {
    mockStore = {
      activeTasks: [{ id: 'task-1', title: 'Sports', targetPerWeek: 3 }],
      weekProgress: vi.fn().mockReturnValue(2),
    };
  });

  it('renders stable markup', () => {
    const wrapper = mountPage();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('binds active week id and task list state', () => {
    const wrapper = mountPage();

    expect((wrapper.vm as unknown as { weekId: string }).weekId).toBe('2026-W06');
    expect((wrapper.vm as unknown as { tasks: Array<{ id: string }> }).tasks).toHaveLength(1);
  });

  it('computes progress fill style for week item background', () => {
    const wrapper = mountPage();

    const style = (
      wrapper.vm as unknown as {
        weekProgressStyle: (taskId: string, targetPerWeek: number) => Record<string, string>;
      }
    ).weekProgressStyle('task-1', 3);

    expect(style['--progress-fill']).toBe('66.67%');
  });

  it('renders empty-state branch', () => {
    mockStore.activeTasks = [];
    const wrapper = mountPage();

    expect(wrapper.html()).toContain('common.noTasksYet');
  });
});
