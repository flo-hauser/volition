import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

type TestTask = {
  id: string;
  title: string;
  targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

const mockNotify = vi.fn();
const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockRoute = { query: {} as Record<string, string | undefined> };

let mockStore: {
  activeTasks: TestTask[];
  archivedTasks: TestTask[];
  getStreak: ReturnType<typeof vi.fn>;
  createTask: ReturnType<typeof vi.fn>;
  archiveTask: ReturnType<typeof vi.fn>;
  unarchiveTask: ReturnType<typeof vi.fn>;
};

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: mockNotify }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

vi.mock('src/services/debug/runtimeDiagnostics', () => ({
  appendDebugLog: vi.fn(),
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import TasksPage from 'src/pages/TasksPage.vue';

function mountPage() {
  return shallowMount(TasksPage, {
    global: {
      renderStubDefaultSlot: true,
      directives: {
        closePopup: {},
      },
      stubs: {
        'q-page': true,
        'q-icon': true,
        'q-menu': true,
        'q-list': true,
        'q-item': true,
        'q-item-section': true,
        'q-slide-transition': true,
        TaskSheet: {
          template: '<div />',
          props: ['modelValue', 'mode', 'submitting'],
          emits: ['update:modelValue', 'submit'],
        },
      },
    },
  });
}

describe('TasksPage', () => {
  beforeEach(() => {
    mockNotify.mockReset();
    mockReplace.mockReset();
    mockPush.mockReset();
    mockRoute.query = {};

    const task: TestTask = {
      id: 'task-1',
      title: 'Sports',
      targetPerWeek: 3,
    };

    mockStore = {
      activeTasks: [task],
      archivedTasks: [],
      getStreak: vi.fn().mockReturnValue(0),
      createTask: vi.fn().mockResolvedValue(undefined),
      archiveTask: vi.fn().mockResolvedValue(undefined),
      unarchiveTask: vi.fn().mockResolvedValue(undefined),
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

  it('opens create modal from query flag', () => {
    mockRoute.query = { new: '1' };
    const wrapper = mountPage();
    expect((wrapper.vm as unknown as { isTaskDialogOpen: boolean }).isTaskDialogOpen).toBe(true);
  });

  it('navigates to task detail on goToDetail', () => {
    const wrapper = mountPage();
    (wrapper.vm as unknown as { goToDetail: (id: string) => void }).goToDetail('task-1');
    expect(mockPush).toHaveBeenCalledWith('/tasks/task-1');
  });

  it('creates task and shows success toast', async () => {
    const wrapper = mountPage();

    await (
      wrapper.vm as unknown as {
        submitCreate: (payload: { title: string; targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) => Promise<void>;
      }
    ).submitCreate({ title: 'Walk', targetPerWeek: 5 });

    expect(mockStore.createTask).toHaveBeenCalledWith({ title: 'Walk', targetPerWeek: 5 });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive', message: 'pages.newTask.createdSuccess' }),
    );
  });

  it('shows negative toast when create fails', async () => {
    mockStore.createTask.mockRejectedValueOnce(new Error('create failed'));
    const wrapper = mountPage();

    await (
      wrapper.vm as unknown as {
        submitCreate: (payload: { title: string; targetPerWeek: 1 }) => Promise<void>;
      }
    ).submitCreate({ title: 'Walk', targetPerWeek: 1 });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', message: 'pages.newTask.createFailed' }),
    );
  });

  it('archives a task via store action', async () => {
    const wrapper = mountPage();

    await (wrapper.vm as unknown as { archive: (id: string) => Promise<void> }).archive('task-1');

    expect(mockStore.archiveTask).toHaveBeenCalledWith('task-1');
  });

  it('unarchives a task via store action', async () => {
    mockStore.archivedTasks = [{ id: 'task-2', title: 'Archived', targetPerWeek: 2 }];
    const wrapper = mountPage();

    await (wrapper.vm as unknown as { unarchive: (id: string) => Promise<void> }).unarchive('task-2');

    expect(mockStore.unarchiveTask).toHaveBeenCalledWith('task-2');
  });
});
