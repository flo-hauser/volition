import { describe, expect, it } from 'vitest';

import { getIsoWeekId, getLocalDayISO, getWeekDays } from 'src/composables/useDay';

describe('useDay', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    const date = new Date(2026, 1, 7);
    expect(getLocalDayISO(date)).toBe('2026-02-07');
  });

  it('calculates ISO week ids across year boundaries', () => {
    expect(getIsoWeekId('2020-12-31')).toBe('2020-W53');
    expect(getIsoWeekId('2021-01-01')).toBe('2020-W53');
    expect(getIsoWeekId('2021-01-04')).toBe('2021-W01');
    expect(getIsoWeekId('2024-12-30')).toBe('2025-W01');
  });

  it('returns Monday through Sunday days for a given week', () => {
    const weekDays = getWeekDays('2020-W53');

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]).toBe('2020-12-28');
    expect(weekDays[6]).toBe('2021-01-03');
  });

  it('returns week days that all map back to the requested week id', () => {
    const weekId = '2025-W01';
    const weekDays = getWeekDays(weekId);

    for (const day of weekDays) {
      expect(getIsoWeekId(day)).toBe(weekId);
    }
  });

  it('throws for malformed week id', () => {
    expect(() => getWeekDays('2025-01')).toThrow('Invalid week id: 2025-01');
    expect(() => getWeekDays('2025-W54')).toThrow('Invalid week number: 54');
  });
});
