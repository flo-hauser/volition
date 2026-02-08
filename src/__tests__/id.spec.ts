import { describe, expect, it } from 'vitest';

import { createId } from 'src/utils/id';

describe('createId', () => {
  it('returns a string id when randomUUID is available', () => {
    const id = createId();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('falls back when randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    if (!originalCrypto) {
      throw new Error('crypto API unavailable in test environment');
    }

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
      },
      configurable: true,
    });

    const id = createId();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);

    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('falls back when crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;

    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });

    const id = createId();

    expect(id).toMatch(/^id-/);

    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });
});
