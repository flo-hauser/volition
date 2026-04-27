import { describe, expect, it } from 'vitest';

import {
  getIsoWeekId,
  getLocalDayISO,
  getPreviousWeekId,
  getWeekDays,
  getWeekId,
  getWeekdayIndex,
} from 'src/composables/useDay';

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

  it('calculates Sunday-start week ids', () => {
    expect(getWeekId('2025-01-04', 'sunday')).toBe('2025-W01');
    expect(getWeekId('2025-01-05', 'sunday')).toBe('2025-W02');
    expect(getWeekId('2025-01-06', 'sunday')).toBe('2025-W02');
  });

  it('returns Sunday through Saturday days for a Sunday-start week', () => {
    const weekDays = getWeekDays('2025-W02', 'sunday');

    expect(weekDays).toEqual([
      '2025-01-05',
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
    ]);
  });

  it('uses Sunday-based weekday indices when requested', () => {
    expect(getWeekdayIndex('2025-W02', '2025-01-05', 'sunday')).toBe(0);
    expect(getWeekdayIndex('2025-W02', '2025-01-06', 'sunday')).toBe(1);
  });

  it('steps back one Sunday-start week across year boundaries', () => {
    expect(getPreviousWeekId('2025-W01', 'sunday')).toBe('2024-W52');
  });

  it('round-trips Sunday-start week ids through their days', () => {
    const weekId = '2025-W02';
    const weekDays = getWeekDays(weekId, 'sunday');

    expect(getWeekId(weekDays[3]!, 'sunday')).toBe(weekId);
  });
});
