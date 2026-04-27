import { readonly, ref } from 'vue';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppLocale = 'en-US' | 'de-DE';
export type WeekStartDay = 'monday' | 'sunday';

const THEME_MODE_KEY = 'volition.themeMode';
const LOCALE_KEY = 'volition.locale';
const WEEK_START_DAY_KEY = 'volition.weekStartDay';

const weekStartDayState = ref<WeekStartDay>(readStoredWeekStartDay());

export function getStoredThemeMode(): ThemeMode {
  if (typeof localStorage === 'undefined') {
    return 'system';
  }

  const value = localStorage.getItem(THEME_MODE_KEY);

  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return 'system';
}

export function setStoredThemeMode(mode: ThemeMode): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(THEME_MODE_KEY, mode);
}

export function getStoredLocale(): AppLocale | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(LOCALE_KEY);

  if (value === 'en-US' || value === 'de-DE') {
    return value;
  }

  return null;
}

export function setStoredLocale(locale: AppLocale): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(LOCALE_KEY, locale);
}

export function getStoredWeekStartDay(): WeekStartDay {
  const weekStartDay = readStoredWeekStartDay();
  weekStartDayState.value = weekStartDay;
  return weekStartDay;
}

export function setStoredWeekStartDay(weekStartDay: WeekStartDay): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(WEEK_START_DAY_KEY, weekStartDay);
  }

  weekStartDayState.value = weekStartDay;
}

export function useAppPreferences() {
  return {
    weekStartDay: readonly(weekStartDayState),
    setWeekStartDay: setStoredWeekStartDay,
  };
}

function readStoredWeekStartDay(): WeekStartDay {
  if (typeof localStorage === 'undefined') {
    return 'monday';
  }

  const value = localStorage.getItem(WEEK_START_DAY_KEY);

  if (value === 'monday' || value === 'sunday') {
    return value;
  }

  return 'monday';
}
