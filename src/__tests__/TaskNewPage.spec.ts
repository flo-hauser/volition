import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const mockPush = vi.fn();
const mockNotify = vi.fn();
let mockStore: {
  createTask: ReturnType<typeof vi.fn>;
};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: mockNotify }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('src/stores/tasks.store', () => ({
  useTasksStore: () => mockStore,
}));

import TaskNewPage from 'src/pages/TaskNewPage.vue';

function mountPage() {
  return shallowMount(TaskNewPage, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        'q-page': true,
        'q-card': true,
        'q-card-section': true,
        'q-card-actions': true,
        'q-separator': true,
        'q-banner': true,
        'q-form': true,
        'q-input': true,
        'q-select': true,
        'q-btn': true,
      },
    },
  });
}

describe('TaskNewPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockNotify.mockReset();

    mockStore = {
      createTask: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders stable markup', () => {
    const wrapper = mountPage();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('does not submit when title is empty', async () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { title: string }).title = '   ';
    await (wrapper.vm as unknown as { onSubmit: () => Promise<void> }).onSubmit();

    expect(mockStore.createTask).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('validates title length upper bound', async () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { title: string }).title = 'a'.repeat(101);
    await (wrapper.vm as unknown as { onSubmit: () => Promise<void> }).onSubmit();

    expect(mockStore.createTask).not.toHaveBeenCalled();
  });

  it('creates task, shows positive toast and redirects', async () => {
    const wrapper = mountPage();

    (wrapper.vm as unknown as { title: string }).title = 'Sports';
    (wrapper.vm as unknown as { targetPerWeek: number }).targetPerWeek = 3;

    await (wrapper.vm as unknown as { onSubmit: () => Promise<void> }).onSubmit();

    expect(mockStore.createTask).toHaveBeenCalledWith({
      title: 'Sports',
      targetPerWeek: 3,
    });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'positive',
        message: 'pages.newTask.createdSuccess',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/tasks');
  });

  it('shows error state and negative toast on create failure', async () => {
    mockStore.createTask.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountPage();

    (wrapper.vm as unknown as { title: string }).title = 'Sports';
    await (wrapper.vm as unknown as { onSubmit: () => Promise<void> }).onSubmit();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'pages.newTask.createFailed',
      }),
    );
    expect((wrapper.vm as unknown as { submitError: boolean }).submitError).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
