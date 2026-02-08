import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

let mockStore: {
  activeTasks: Array<{ id: string; title: string; targetPerWeek: number }>;
  weekProgress: ReturnType<typeof vi.fn>;
  isDone: ReturnType<typeof vi.fn>;
  toggleToday: ReturnType<typeof vi.fn>;
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

import TodayPage from 'src/pages/TodayPage.vue';

function mountPage() {
  return shallowMount(TodayPage, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-page': true,
        'q-card': true,
        'q-card-section': true,
        'q-card-actions': true,
        'q-separator': true,
        'q-list': true,
        'q-item': true,
        'q-item-section': true,
        'q-item-label': true,
        'q-toggle': true,
        'q-btn': true,
      },
    },
  });
}

describe('TodayPage', () => {
  beforeEach(() => {
    mockStore = {
      activeTasks: [{ id: 'task-1', title: 'Sports', targetPerWeek: 3 }],
      weekProgress: vi.fn().mockReturnValue(1),
      isDone: vi.fn().mockReturnValue(false),
      toggleToday: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders stable markup', () => {
    const wrapper = mountPage();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('renders empty-state branch', () => {
    mockStore.activeTasks = [];
    const wrapper = mountPage();

    expect(wrapper.html()).toContain('common.noTasksYet');
  });

  it('toggles a task for today', async () => {
    const wrapper = mountPage();
    await (wrapper.vm as unknown as { toggleTask: (id: string) => Promise<void> }).toggleTask('task-1');

    expect(mockStore.toggleToday).toHaveBeenCalledWith('task-1');
  });

  it('clears pending flag even if toggle fails', async () => {
    mockStore.toggleToday.mockRejectedValueOnce(new Error('toggle failed'));
    const wrapper = mountPage();

    await expect(
      (wrapper.vm as unknown as { toggleTask: (id: string) => Promise<void> }).toggleTask('task-1'),
    ).rejects.toThrow('toggle failed');

    const pendingTaskIds = (wrapper.vm as unknown as { pendingTaskIds: Set<string> }).pendingTaskIds;
    expect(pendingTaskIds.has('task-1')).toBe(false);
  });
});
