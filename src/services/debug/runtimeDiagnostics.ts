export interface RuntimeDiagnostics {
  isSecureContext: boolean;
  hasCrypto: boolean;
  hasRandomUUID: boolean;
  hasIndexedDB: boolean;
  hasLocalStorage: boolean;
  userAgent: string;
}

export interface DebugLogEntry {
  id: string;
  scope: string;
  message: string;
  at: string;
  diagnostics: RuntimeDiagnostics;
}

const DEBUG_LOGS_KEY = 'volition.debug.logs';
const MAX_DEBUG_LOGS = 20;

function generateLogId(): string {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getRuntimeDiagnostics(): RuntimeDiagnostics {
  return {
    isSecureContext: typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
    hasCrypto: typeof crypto !== 'undefined',
    hasRandomUUID: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
    hasIndexedDB: typeof indexedDB !== 'undefined',
    hasLocalStorage: typeof localStorage !== 'undefined',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

export function readDebugLogs(): DebugLogEntry[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(DEBUG_LOGS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed as DebugLogEntry[];
    }
  } catch {
    return [];
  }

  return [];
}

export function appendDebugLog(scope: string, error: unknown): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);

  const next = [
    {
      id: generateLogId(),
      scope,
      message,
      at: new Date().toISOString(),
      diagnostics: getRuntimeDiagnostics(),
    },
    ...readDebugLogs(),
  ].slice(0, MAX_DEBUG_LOGS);

  localStorage.setItem(DEBUG_LOGS_KEY, JSON.stringify(next));
}
