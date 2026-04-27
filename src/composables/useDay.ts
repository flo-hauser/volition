import {
  addDays,
  eachDayOfInterval,
  format,
  getISOWeek,
  getISOWeekYear,
  getWeek,
  getWeekYear,
  parseISO,
  startOfISOWeek,
  startOfWeek,
} from 'date-fns';
import type { WeekStartDay } from './useAppPreferences';

export function toLocalDate(dayISO: string): Date {
  return parseISO(dayISO);
}

export function getLocalDayISO(date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekId(dayISO: string, weekStartDay: WeekStartDay = 'monday'): string {
  const date = parseISO(dayISO);
  const weekYear = getWeekYearForMode(date, weekStartDay);
  const week = getWeekNumberForMode(date, weekStartDay);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

export function getIsoWeekId(dayISO: string): string {
  return getWeekId(dayISO, 'monday');
}

export function getWeekDays(weekId: string, weekStartDay: WeekStartDay = 'monday'): string[] {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);

  if (!match) {
    throw new Error(`Invalid week id: ${weekId}`);
  }

  const weekYear = Number(match[1]);
  const weekNumber = Number(match[2]);

  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}`);
  }

  const targetWeekStart = getStartOfWeekForWeekId(weekYear, weekNumber, weekStartDay);

  return eachDayOfInterval({
    start: targetWeekStart,
    end: addDays(targetWeekStart, 6),
  }).map((day) => format(day, 'yyyy-MM-dd'));
}

export function getWeekdayIndex(
  weekId: string,
  dayISO: string,
  weekStartDay: WeekStartDay = 'monday',
): number {
  const days = getWeekDays(weekId, weekStartDay);
  return days.indexOf(dayISO);
}

export function getPreviousWeekId(weekId: string, weekStartDay: WeekStartDay = 'monday'): string {
  const days = getWeekDays(weekId, weekStartDay);
  const previousWeekStart = addDays(parseISO(days[0]!), -7);
  return getWeekId(format(previousWeekStart, 'yyyy-MM-dd'), weekStartDay);
}

function getWeekNumberForMode(date: Date, weekStartDay: WeekStartDay): number {
  return weekStartDay === 'sunday'
    ? getWeek(date, { weekStartsOn: 0, firstWeekContainsDate: 1 })
    : getISOWeek(date);
}

function getWeekYearForMode(date: Date, weekStartDay: WeekStartDay): number {
  return weekStartDay === 'sunday'
    ? getWeekYear(date, { weekStartsOn: 0, firstWeekContainsDate: 1 })
    : getISOWeekYear(date);
}

function getWeekStart(date: Date, weekStartDay: WeekStartDay): Date {
  return weekStartDay === 'sunday'
    ? startOfWeek(date, { weekStartsOn: 0 })
    : startOfISOWeek(date);
}

function getStartOfWeekForWeekId(
  weekYear: number,
  weekNumber: number,
  weekStartDay: WeekStartDay,
): Date {
  const anchor = weekStartDay === 'sunday'
    ? new Date(weekYear, 0, 1)
    : new Date(weekYear, 0, 4);
  const firstWeekStart = getWeekStart(anchor, weekStartDay);
  return addDays(firstWeekStart, (weekNumber - 1) * 7);
}
