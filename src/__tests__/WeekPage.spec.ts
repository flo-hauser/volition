import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';

let mockStore: {
  activeTasks: Array<{ id: string; title: string; targetPerWeek: number }>;
  checkinsByDay: Record<string, Record<string, unknown>>;
  weekProgress: ReturnType<typeof vi.fn>;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('en-US'),
  }),
}));

vi.mock('src/composables/useDay', () => ({
  getLocalDayISO: () => '2026-02-07',
  getIsoWeekId: () => '2026-W06',
  getWeekdayIndex: () => 5,
  getWeekDays: () => [
    '2026-02-02',
    '2026-02-03',
    '2026-02-04',
    '2026-02-05',
    '2026-02-06',
    '2026-02-07',
    '2026-02-08',
  ],
  toLocalDate: (dateISO: string) => {
    const [year, month, day] = dateISO.split('-').map(Number) as [number, number, number];
    return new Date(year, month - 1, day);
  },
}));

vi.mock('src/composables/useProgress', () => ({
  getWeekPattern: () => [1, 1, 0, 0, 0, 0, 0],
  countTaskCheckinsForWeek: () => 0,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
        VizDots: true,
        WeekStrip: true,
      },
    },
  });
}

describe('WeekPage', () => {
  beforeEach(() => {
    mockStore = {
      activeTasks: [{ id: 'task-1', title: 'Sports', targetPerWeek: 3 }],
      checkinsByDay: {},
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

  it('marks a task as achieved when progress meets the target', () => {
    mockStore.weekProgress = vi.fn().mockReturnValue(3);
    const wrapper = mountPage();

    expect(wrapper.html()).toContain('achieved');
    expect(wrapper.html()).toContain('pages.week.goalReached');
  });

  it('renders empty-state branch', () => {
    mockStore.activeTasks = [];
    const wrapper = mountPage();

    expect(wrapper.html()).toContain('common.noTasksYet');
  });
});
