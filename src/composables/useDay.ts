import {
  format,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  eachDayOfInterval,
} from 'date-fns';

export function toLocalDate(dayISO: string): Date {
  return parseISO(dayISO);
}

export function getLocalDayISO(date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getIsoWeekId(dayISO: string): string {
  const date = parseISO(dayISO);
  const weekYear = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

export function getWeekDays(weekId: string): string[] {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);

  if (!match) {
    throw new Error(`Invalid week id: ${weekId}`);
  }

  const weekYear = Number(match[1]);
  const weekNumber = Number(match[2]);

  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}`);
  }

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(weekYear, 0, 4);

  // Get Monday of week 1
  const week1Monday = startOfISOWeek(jan4);

  // Calculate the Monday of the target week by adding (weekNumber - 1) weeks
  const targetMonday = new Date(week1Monday);
  targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

  // Generate all 7 days starting from Monday
  return eachDayOfInterval({
    start: targetMonday,
    end: new Date(targetMonday.getFullYear(), targetMonday.getMonth(), targetMonday.getDate() + 6),
  }).map((day) => format(day, 'yyyy-MM-dd'));
}

export function getWeekdayIndex(weekId: string, dayISO: string): number {
  const days = getWeekDays(weekId);
  return days.indexOf(dayISO);
}
