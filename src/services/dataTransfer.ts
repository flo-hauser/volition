import { SCHEMA_VERSION, type StorageState } from 'src/types/storage';
import type { Task, Checkin } from 'src/types/task';

export interface ExportEnvelope {
  exportedAt: string;
  schemaVersion: number;
  tasks: Record<string, Task>;
  checkinsByDay: Record<string, Record<string, Checkin>>;
  taskOrder: string[];
}

export interface ImportResult {
  ok: boolean;
  state?: StorageState;
  error?: string;
}

export function exportToJSON(state: StorageState): string {
  const envelope: ExportEnvelope = {
    exportedAt: new Date().toISOString(),
    schemaVersion: state.meta.schemaVersion,
    tasks: state.tasks,
    checkinsByDay: state.checkinsByDay,
    taskOrder: state.taskOrder,
  };
  return JSON.stringify(envelope, null, 2);
}

export function triggerDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'invalid_shape' };
  }

  const p = parsed as Record<string, unknown>;

  if (p.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: 'schema_mismatch' };
  }

  if (typeof p.tasks !== 'object' || p.tasks === null) {
    return { ok: false, error: 'missing_tasks' };
  }

  if (typeof p.checkinsByDay !== 'object' || p.checkinsByDay === null) {
    return { ok: false, error: 'missing_checkins' };
  }

  if (!Array.isArray(p.taskOrder)) {
    return { ok: false, error: 'missing_task_order' };
  }

  const state: StorageState = {
    meta: { schemaVersion: SCHEMA_VERSION },
    tasks: p.tasks as StorageState['tasks'],
    checkinsByDay: p.checkinsByDay as StorageState['checkinsByDay'],
    taskOrder: p.taskOrder as string[],
  };

  return { ok: true, state };
}
