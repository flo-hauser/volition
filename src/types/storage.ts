import type { Checkin, Task } from './task';

export const SCHEMA_VERSION = 1 as const;

export interface StorageMeta {
  schemaVersion: typeof SCHEMA_VERSION;
}

export interface StorageState {
  meta: StorageMeta;
  tasks: Record<string, Task>;
  checkinsByDay: Record<string, Record<string, Checkin>>;
}
