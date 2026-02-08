import { beforeEach, describe, expect, it } from 'vitest';

import {
  appendDebugLog,
  getRuntimeDiagnostics,
  readDebugLogs,
} from 'src/services/debug/runtimeDiagnostics';

describe('runtimeDiagnostics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns runtime diagnostics flags', () => {
    const diagnostics = getRuntimeDiagnostics();

    expect(typeof diagnostics.isSecureContext).toBe('boolean');
    expect(typeof diagnostics.hasCrypto).toBe('boolean');
    expect(typeof diagnostics.hasRandomUUID).toBe('boolean');
    expect(typeof diagnostics.hasIndexedDB).toBe('boolean');
    expect(typeof diagnostics.hasLocalStorage).toBe('boolean');
    expect(typeof diagnostics.userAgent).toBe('string');
  });

  it('appends log entries and retains newest first', () => {
    appendDebugLog('tasks.createTask', new Error('first'));
    appendDebugLog('tasks.createTask', new Error('second'));

    const logs = readDebugLogs();

    expect(logs).toHaveLength(2);
    expect(logs[0]?.message).toBe('second');
    expect(logs[1]?.message).toBe('first');
  });

  it('caps stored logs to 20 entries', () => {
    for (let i = 0; i < 25; i += 1) {
      appendDebugLog('tasks.createTask', new Error(`entry-${i}`));
    }

    const logs = readDebugLogs();
    expect(logs).toHaveLength(20);
    expect(logs[0]?.message).toBe('entry-24');
    expect(logs[19]?.message).toBe('entry-5');
  });

  it('returns empty list for invalid stored payload', () => {
    localStorage.setItem('volition.debug.logs', '{invalid-json');

    expect(readDebugLogs()).toEqual([]);
  });
});
