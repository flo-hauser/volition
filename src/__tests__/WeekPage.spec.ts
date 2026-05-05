import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';

let mockStore: {
  activeTasks: Array<{ id: string; title: string; targetPerWeek: number }>;
  checkinsByDay: Record<string, Record<string, unknown>>;
  weekProgress: ReturnType<typeof vi.fn>;
  toggleForDay: ReturnType<typeof vi.fn>;
};

let mockQuasar: {
  notify: ReturnType<typeof vi.fn>;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('en-US'),
  }),
}));

vi.mock('src/composables/useDay', () => ({
  getLocalDayISO: () => '2026-02-07',
  getWeekId: () => '2026-W06',
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

vi.mock('src/composables/useAppPreferences', () => ({
  useAppPreferences: () => ({
    weekStartDay: ref('monday'),
    setWeekStartDay: vi.fn(),
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('quasar', () => ({
  useQuasar: () => mockQuasar,
}));

vi.mock('src/services/debug/runtimeDiagnostics', () => ({
  appendDebugLog: vi.fn(),
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
      toggleForDay: vi.fn().mockResolvedValue(undefined),
    };
    mockQuasar = {
      notify: vi.fn(),
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

  describe('toggleForDayInWeek', () => {
    it('calls store.toggleForDay with correct day ISO', async () => {
      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
      };

      await vm.toggleForDayInWeek('task-1', 0);

      expect(mockStore.toggleForDay).toHaveBeenCalledWith('task-1', '2026-02-02');
    });

    it('maps day index to correct day ISO', async () => {
      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
      };

      await vm.toggleForDayInWeek('task-1', 3);
      expect(mockStore.toggleForDay).toHaveBeenCalledWith('task-1', '2026-02-05');

      await vm.toggleForDayInWeek('task-1', 6);
      expect(mockStore.toggleForDay).toHaveBeenCalledWith('task-1', '2026-02-08');
    });

    it('handles toggle errors with notification', async () => {
      const error = new Error('Toggle failed');
      mockStore.toggleForDay = vi.fn().mockRejectedValue(error);
      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
      };

      await vm.toggleForDayInWeek('task-1', 0);

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        position: 'top',
        message: 'pages.toast.taskToggleFailed',
      });
    });

    it('tracks pending task IDs during toggle', async () => {
      let resolveToggle: () => void;
      const togglePromise = new Promise<void>((resolve) => {
        resolveToggle = resolve;
      });
      mockStore.toggleForDay = vi.fn().mockReturnValue(togglePromise);

      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
        pendingTaskIds: Set<string>;
      };

      const togglePromise2 = vm.toggleForDayInWeek('task-1', 0);
      expect(vm.pendingTaskIds.has('task-1')).toBe(true);

      resolveToggle!();
      await togglePromise2;
      expect(vm.pendingTaskIds.has('task-1')).toBe(false);
    });

    it('removes task from pending even on error', async () => {
      mockStore.toggleForDay = vi.fn().mockRejectedValue(new Error('Toggle failed'));
      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
        pendingTaskIds: Set<string>;
      };

      await vm.toggleForDayInWeek('task-1', 0);
      expect(vm.pendingTaskIds.has('task-1')).toBe(false);
    });

    it('does not call toggle if day index is out of range', async () => {
      const wrapper = mountPage();
      const vm = wrapper.vm as unknown as {
        toggleForDayInWeek: (taskId: string, dayIdx: number) => Promise<void>;
      };

      // Accessing an index beyond the week days array
      mockStore.toggleForDay.mockClear();
      await vm.toggleForDayInWeek('task-1', 10);

      // Should not be called since day index is invalid
      expect(mockStore.toggleForDay).not.toHaveBeenCalled();
    });
  });
});
