import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

type TestTask = {
  id: string;
  title: string;
  targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

const mockNotify = vi.fn();
const mockReplace = vi.fn();
const mockRoute = { query: {} as Record<string, string | undefined> };

let mockStore: {
  activeTasks: TestTask[];
  tasks: Record<string, TestTask>;
  createTask: ReturnType<typeof vi.fn>;
  updateTask: ReturnType<typeof vi.fn>;
  deleteTask: ReturnType<typeof vi.fn>;
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
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import TasksPage from 'src/pages/TasksPage.vue';

function mountPage() {
  return shallowMount(TasksPage, {
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
        'q-btn': true,
        'q-dialog': true,
        TaskFormDialog: {
          template: '<div />',
          props: [
            'modelValue',
            'mode',
            'submitting',
            'initialTitle',
            'initialTargetPerWeek',
          ],
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
    mockRoute.query = {};

    const task: TestTask = {
      id: 'task-1',
      title: 'Sports',
      targetPerWeek: 3,
    };

    mockStore = {
      activeTasks: [task],
      tasks: { [task.id]: task },
      createTask: vi.fn().mockResolvedValue(undefined),
      updateTask: vi.fn().mockResolvedValue(undefined),
      deleteTask: vi.fn().mockResolvedValue(undefined),
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
    expect((wrapper.vm as unknown as { taskDialogMode: string }).taskDialogMode).toBe('create');
  });

  it('creates task and shows success toast', async () => {
    const wrapper = mountPage();

    await (
      wrapper.vm as unknown as {
        submitTaskForm: (payload: { title: string; targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) => Promise<void>;
      }
    ).submitTaskForm({ title: 'Walk', targetPerWeek: 5 });

    expect(mockStore.createTask).toHaveBeenCalledWith({ title: 'Walk', targetPerWeek: 5 });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'positive',
        message: 'pages.newTask.createdSuccess',
      }),
    );
  });

  it('updates task and shows success toast', async () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { openEditDialog: (id: string) => void }).openEditDialog('task-1');

    await (
      wrapper.vm as unknown as {
        submitTaskForm: (payload: { title: string; targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) => Promise<void>;
      }
    ).submitTaskForm({ title: 'Updated sports', targetPerWeek: 5 });

    expect(mockStore.updateTask).toHaveBeenCalledWith('task-1', {
      title: 'Updated sports',
      targetPerWeek: 5,
    });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'positive',
        message: 'pages.toast.taskUpdated',
      }),
    );
  });

  it('shows negative toast when update fails', async () => {
    mockStore.updateTask.mockRejectedValueOnce(new Error('update failed'));
    const wrapper = mountPage();

    (wrapper.vm as unknown as { openEditDialog: (id: string) => void }).openEditDialog('task-1');

    await (
      wrapper.vm as unknown as {
        submitTaskForm: (payload: { title: string; targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) => Promise<void>;
      }
    ).submitTaskForm({ title: 'Updated sports', targetPerWeek: 5 });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'pages.toast.taskUpdateFailed',
      }),
    );
  });

  it('deletes task and shows success toast', async () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { openDeleteDialog: (id: string) => void }).openDeleteDialog('task-1');
    await (wrapper.vm as unknown as { submitDelete: () => Promise<void> }).submitDelete();

    expect(mockStore.deleteTask).toHaveBeenCalledWith('task-1');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'positive',
        message: 'pages.toast.taskDeleted',
      }),
    );
  });

  it('shows negative toast when delete fails', async () => {
    mockStore.deleteTask.mockRejectedValueOnce(new Error('delete failed'));

    const wrapper = mountPage();
    (wrapper.vm as unknown as { openDeleteDialog: (id: string) => void }).openDeleteDialog('task-1');
    await (wrapper.vm as unknown as { submitDelete: () => Promise<void> }).submitDelete();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'pages.toast.taskDeleteFailed',
      }),
    );
  });
});
