import { useI18n } from 'vue-i18n';

export function useQuote() {
  const i18n = useI18n({ useScope: 'global' });

  function pickQuote(progress: number, total: number, seed = new Date().getDate()): string {
    const pool = (key: string): string[] => {
      const raw: unknown = i18n.tm(key);
      return raw as string[];
    };
    if (total === 0) return pool('quotes.start')[0] ?? '';
    const ratio = progress / total;
    const phase =
      ratio === 1
        ? 'quotes.done'
        : ratio > 0.66
          ? 'quotes.near'
          : ratio > 0.3
            ? 'quotes.mid'
            : 'quotes.start';
    const quotes = pool(phase);
    return quotes[seed % quotes.length] ?? quotes[0] ?? '';
  }

  return { pickQuote };
}
