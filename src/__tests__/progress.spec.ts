import { describe, expect, it } from 'vitest';

import { countTaskCheckinsForWeek } from 'src/composables/useProgress';
import type { Checkin } from 'src/types/task';

describe('countTaskCheckinsForWeek', () => {
  it('counts only checkins inside requested ISO week', () => {
    const checkinsByDay: Record<string, Record<string, Checkin>> = {
      '2026-02-02': {
        sport: { taskId: 'sport', day: '2026-02-02', checkedAt: '2026-02-02T07:00:00.000Z' },
      },
      '2026-02-04': {
        sport: { taskId: 'sport', day: '2026-02-04', checkedAt: '2026-02-04T07:00:00.000Z' },
      },
      '2026-02-09': {
        sport: { taskId: 'sport', day: '2026-02-09', checkedAt: '2026-02-09T07:00:00.000Z' },
      },
    };

    expect(countTaskCheckinsForWeek('sport', '2026-W06', checkinsByDay)).toBe(2);
  });

  it('can exceed a weekly target by counting all check-ins', () => {
    const checkinsByDay: Record<string, Record<string, Checkin>> = {
      '2026-02-02': {
        walk: { taskId: 'walk', day: '2026-02-02', checkedAt: '2026-02-02T07:00:00.000Z' },
      },
      '2026-02-03': {
        walk: { taskId: 'walk', day: '2026-02-03', checkedAt: '2026-02-03T07:00:00.000Z' },
      },
      '2026-02-04': {
        walk: { taskId: 'walk', day: '2026-02-04', checkedAt: '2026-02-04T07:00:00.000Z' },
      },
      '2026-02-05': {
        walk: { taskId: 'walk', day: '2026-02-05', checkedAt: '2026-02-05T07:00:00.000Z' },
      },
    };

    expect(countTaskCheckinsForWeek('walk', '2026-W06', checkinsByDay)).toBe(4);
  });
});
