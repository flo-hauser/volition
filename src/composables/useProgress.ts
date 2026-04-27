import { getWeekDays } from './useDay';
import type { WeekStartDay } from './useAppPreferences';

import type { Checkin } from 'src/types/task';

export function countTaskCheckinsForWeek(
  taskId: string,
  weekId: string,
  checkinsByDay: Record<string, Record<string, Checkin>>,
  weekStartDay: WeekStartDay = 'monday',
): number {
  return getWeekDays(weekId, weekStartDay).reduce((count, day) => {
    if (checkinsByDay[day]?.[taskId]) {
      return count + 1;
    }

    return count;
  }, 0);
}

export function getWeekPattern(
  taskId: string,
  weekId: string,
  checkinsByDay: Record<string, Record<string, Checkin>>,
  weekStartDay: WeekStartDay = 'monday',
): number[] {
  return getWeekDays(weekId, weekStartDay).map((day) => (checkinsByDay[day]?.[taskId] ? 1 : 0));
}
