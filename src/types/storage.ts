import type { Checkin, Task } from './task';

export const SCHEMA_VERSION = 2 as const;

export interface StorageMeta {
  schemaVersion: number;
}

export interface StorageState {
  meta: StorageMeta;
  tasks: Record<string, Task>;
  checkinsByDay: Record<string, Record<string, Checkin>>;
  taskOrder: string[];
}
