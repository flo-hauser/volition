const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalDate(dayISO: string): Date {
  const [year, month, day] = dayISO.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid day ISO string: ${dayISO}`);
  }

  return new Date(year, month - 1, day);
}

function toDayISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDayISO(date = new Date()): string {
  return toDayISO(date);
}

export function getIsoWeekId(dayISO: string): string {
  const date = toLocalDate(dayISO);
  const dayOfWeek = date.getDay() || 7;

  date.setDate(date.getDate() + 4 - dayOfWeek);

  const weekYear = date.getFullYear();
  const yearStart = new Date(weekYear, 0, 1);
  const dayDiff = Math.floor((date.getTime() - yearStart.getTime()) / DAY_MS);
  const week = Math.ceil((dayDiff + 1) / 7);

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

  const jan4 = new Date(weekYear, 0, 4);
  const jan4DayOfWeek = jan4.getDay() || 7;
  const firstWeekMonday = new Date(jan4);
  firstWeekMonday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

  const monday = new Date(firstWeekMonday);
  monday.setDate(firstWeekMonday.getDate() + (weekNumber - 1) * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return toDayISO(day);
  });
}
