import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportToJSON, parseImport, triggerDownload } from 'src/services/dataTransfer';
import type { StorageState } from 'src/types/storage';
import { SCHEMA_VERSION } from 'src/types/storage';

const {
  mockWriteFile,
  mockCanShare,
  mockShare,
} = vi.hoisted(() => ({
  mockWriteFile: vi.fn(),
  mockCanShare: vi.fn(),
  mockShare: vi.fn(),
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: mockWriteFile,
  },
  Directory: {
    Cache: 'CACHE',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    canShare: mockCanShare,
    share: mockShare,
  },
}));

describe('dataTransfer', () => {
  const mockState: StorageState = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
    },
    tasks: {
      'task-1': {
        id: 'task-1',
        title: 'Test Task',
        targetPerWeek: 3,
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
    checkinsByDay: {
      '2024-01-01': {
        'task-1': {
          taskId: 'task-1',
          day: '2024-01-01',
          checkedAt: '2024-01-01T10:00:00Z',
        },
      },
    },
    taskOrder: ['task-1'],
  };

  describe('exportToJSON', () => {
    it('produces valid JSON with correct structure', () => {
      const json = exportToJSON(mockState);
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('schemaVersion');
      expect(parsed).toHaveProperty('tasks');
      expect(parsed).toHaveProperty('checkinsByDay');
      expect(parsed).toHaveProperty('taskOrder');
    });

    it('includes all tasks', () => {
      const json = exportToJSON(mockState);
      const parsed = JSON.parse(json);
      expect(parsed.tasks).toEqual(mockState.tasks);
    });

    it('includes all check-ins', () => {
      const json = exportToJSON(mockState);
      const parsed = JSON.parse(json);
      expect(parsed.checkinsByDay).toEqual(mockState.checkinsByDay);
    });

    it('includes task order', () => {
      const json = exportToJSON(mockState);
      const parsed = JSON.parse(json);
      expect(parsed.taskOrder).toEqual(mockState.taskOrder);
    });

    it('includes correct schema version', () => {
      const json = exportToJSON(mockState);
      const parsed = JSON.parse(json);
      expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it('includes exportedAt timestamp', () => {
      const beforeExport = new Date();
      const json = exportToJSON(mockState);
      const afterExport = new Date();

      const parsed = JSON.parse(json);
      const exportedAt = new Date(parsed.exportedAt);

      expect(exportedAt.getTime()).toBeGreaterThanOrEqual(beforeExport.getTime());
      expect(exportedAt.getTime()).toBeLessThanOrEqual(afterExport.getTime());
    });
  });

  describe('parseImport', () => {
    it('returns ok: true for valid export', () => {
      const json = exportToJSON(mockState);
      const result = parseImport(json);

      expect(result.ok).toBe(true);
      expect(result.state).toBeDefined();
    });

    it('reconstructs state from valid export', () => {
      const json = exportToJSON(mockState);
      const result = parseImport(json);

      expect(result.state).toEqual(mockState);
    });

    it('returns error for invalid JSON', () => {
      const result = parseImport('not valid json');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid_json');
    });

    it('returns error for non-object JSON', () => {
      const result = parseImport('"string"');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid_shape');
    });

    it('returns error for null', () => {
      const result = parseImport('null');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid_shape');
    });

    it('returns error for mismatched schema version', () => {
      const invalidState = { ...mockState, schemaVersion: 999 };
      const json = JSON.stringify(invalidState);
      const result = parseImport(json);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('schema_mismatch');
    });

    it('returns error when tasks is missing', () => {
      const invalidState = {
        schemaVersion: SCHEMA_VERSION,
        checkinsByDay: {},
        taskOrder: [],
      };
      const json = JSON.stringify(invalidState);
      const result = parseImport(json);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('missing_tasks');
    });

    it('returns error when checkinsByDay is missing', () => {
      const invalidState = {
        schemaVersion: SCHEMA_VERSION,
        tasks: {},
        taskOrder: [],
      };
      const json = JSON.stringify(invalidState);
      const result = parseImport(json);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('missing_checkins');
    });

    it('returns error when taskOrder is missing', () => {
      const invalidState = {
        schemaVersion: SCHEMA_VERSION,
        tasks: {},
        checkinsByDay: {},
      };
      const json = JSON.stringify(invalidState);
      const result = parseImport(json);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('missing_task_order');
    });
  });

  describe('round-trip', () => {
    it('export followed by parse returns equivalent state', () => {
      const json = exportToJSON(mockState);
      const result = parseImport(json);

      expect(result.ok).toBe(true);
      expect(result.state).toEqual(mockState);
    });
  });

  describe('triggerDownload', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockWriteFile.mockResolvedValue({ uri: 'file:///tmp/test.json' });
      mockCanShare.mockResolvedValue({ value: true });
      mockShare.mockResolvedValue(undefined);
      delete (window as Window & { Capacitor?: unknown }).Capacitor;
    });

    it('creates blob and triggers download on web', async () => {
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = mockClick;
        }
        return el;
      });

      const json = '{}';
      const filename = 'test.json';

      await triggerDownload(json, filename);

      expect(mockClick).toHaveBeenCalled();
    });

    it('writes and shares a file on native platforms', async () => {
      (window as Window & {
        Capacitor?: { isNativePlatform: () => boolean };
      }).Capacitor = {
        isNativePlatform: () => true,
      };

      await triggerDownload('{}', 'test.json');

      expect(mockWriteFile).toHaveBeenCalledWith({
        path: 'test.json',
        data: '{}',
        directory: 'CACHE',
        encoding: 'utf8',
      });
      expect(mockCanShare).toHaveBeenCalled();
      expect(mockShare).toHaveBeenCalledWith({
        title: 'test.json',
        dialogTitle: 'test.json',
        url: 'file:///tmp/test.json',
      });
    });
  });
});
