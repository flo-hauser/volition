import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';

const mockNotify = vi.fn();

let mockStore: {
  activeTasks: Array<{ id: string; title: string; targetPerWeek: number }>;
  checkinsByDay: Record<string, Record<string, unknown>>;
  weekProgress: ReturnType<typeof vi.fn>;
  isDone: ReturnType<typeof vi.fn>;
  getStreak: ReturnType<typeof vi.fn>;
  toggleToday: ReturnType<typeof vi.fn>;
  createTask: ReturnType<typeof vi.fn>;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('en-US'),
  }),
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: mockNotify }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
  getWeekPattern: () => [0, 0, 0, 0, 0, 0, 0],
  countTaskCheckinsForWeek: () => 0,
}));

vi.mock('src/composables/useQuote', () => ({
  useQuote: () => ({ pickQuote: () => 'A quiet beginning.' }),
}));

vi.mock('src/services/debug/runtimeDiagnostics', () => ({
  appendDebugLog: vi.fn(),
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
        CheckButton: {
          template: '<button class="check-btn-stub" @click="$emit(\'update:modelValue\', !modelValue)" />',
          props: ['modelValue', 'disabled', 'ariaCheck', 'ariaUncheck'],
          emits: ['update:modelValue'],
        },
        TaskSheet: {
          template: '<div />',
          props: ['modelValue', 'mode', 'submitting', 'initialTitle', 'initialTargetPerWeek'],
          emits: ['update:modelValue', 'submit'],
        },
        TodayHero: true,
        WeekMini: true,
      },
    },
  });
}

describe('TodayPage', () => {
  beforeEach(() => {
    mockNotify.mockReset();

    mockStore = {
      activeTasks: [{ id: 'task-1', title: 'Sports', targetPerWeek: 3 }],
      checkinsByDay: {},
      weekProgress: vi.fn().mockReturnValue(1),
      isDone: vi.fn().mockReturnValue(false),
      getStreak: vi.fn().mockReturnValue(0),
      toggleToday: vi.fn().mockResolvedValue(undefined),
      createTask: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders stable markup', () => {
    const wrapper = mountPage();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('renders empty-state branch', () => {
    mockStore.activeTasks = [];
    const wrapper = mountPage();

    expect(wrapper.html()).toContain('pages.today.openTasks');
  });

  it('toggles a task for today', async () => {
    const wrapper = mountPage();
    await (wrapper.vm as unknown as { toggleTask: (id: string) => Promise<void> }).toggleTask('task-1');

    expect(mockStore.toggleToday).toHaveBeenCalledWith('task-1');
  });

  it('clears pending flag even if toggle fails', async () => {
    mockStore.toggleToday.mockRejectedValueOnce(new Error('toggle failed'));
    const wrapper = mountPage();

    await (wrapper.vm as unknown as { toggleTask: (id: string) => Promise<void> }).toggleTask(
      'task-1',
    );

    const pendingTaskIds = (wrapper.vm as unknown as { pendingTaskIds: Set<string> }).pendingTaskIds;
    expect(pendingTaskIds.has('task-1')).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'pages.toast.taskToggleFailed',
      }),
    );
  });
});
