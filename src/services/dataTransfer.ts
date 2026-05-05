import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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

function isNativePlatform(): boolean {
  const maybeCapacitor = (
    window as Window & {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
      };
    }
  ).Capacitor;

  if (typeof maybeCapacitor?.isNativePlatform === 'function') {
    return maybeCapacitor.isNativePlatform();
  }

  if (typeof maybeCapacitor?.getPlatform === 'function') {
    return maybeCapacitor.getPlatform() !== 'web';
  }

  return false;
}

async function triggerNativeExport(json: string, filename: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  const { value: canShare } = await Share.canShare();
  if (!canShare) {
    throw new Error('native_share_unavailable');
  }

  await Share.share({
    title: filename,
    dialogTitle: filename,
    url: uri,
  });
}

export async function triggerDownload(json: string, filename: string): Promise<void> {
  if (isNativePlatform()) {
    await triggerNativeExport(json, filename);
    return;
  }

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
