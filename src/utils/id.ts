export function createId(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;

  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      cryptoApi.getRandomValues(bytes);

      // RFC 4122 v4 variant bits.
      const byte6 = bytes[6] ?? 0;
      const byte8 = bytes[8] ?? 0;
      bytes[6] = (byte6 & 0x0f) | 0x40;
      bytes[8] = (byte8 & 0x3f) | 0x80;

      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {
      // getRandomValues can throw SecurityError in non-secure contexts on some WebViews.
    }
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
