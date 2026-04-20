import type { StorageState } from 'src/types/storage';

import { getStorageDebugLabel, type StorageAdapter } from './storageAdapter';

interface ResilientStorageOptions {
  isPrimaryAvailable?: () => boolean;
}

export function createResilientStorageAdapter(
  primary: StorageAdapter,
  fallback: StorageAdapter,
  options: ResilientStorageOptions = {},
): StorageAdapter {
  let useFallbackOnly = false;

  function getActiveAdapter(): StorageAdapter {
    return useFallbackOnly ? fallback : primary;
  }

  function primaryUsable(): boolean {
    if (useFallbackOnly) {
      return false;
    }

    if (options.isPrimaryAvailable && !options.isPrimaryAvailable()) {
      useFallbackOnly = true;
      return false;
    }

    return true;
  }

  return {
    getDebugLabel() {
      return getStorageDebugLabel(getActiveAdapter());
    },

    async loadState(): Promise<StorageState | null> {
      if (!primaryUsable()) {
        return fallback.loadState();
      }

      try {
        const state = await primary.loadState();

        if (state === null) {
          useFallbackOnly = true;
          return fallback.loadState();
        }

        return state;
      } catch {
        useFallbackOnly = true;
        return fallback.loadState();
      }
    },

    async saveState(state: StorageState): Promise<void> {
      if (!primaryUsable()) {
        await fallback.saveState(state);
        return;
      }

      try {
        await primary.saveState(state);
      } catch {
        useFallbackOnly = true;
        await fallback.saveState(state);
      }
    },
  };
}
