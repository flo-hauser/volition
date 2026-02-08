export type ThemeMode = 'system' | 'light' | 'dark';
export type AppLocale = 'en-US' | 'de-DE';

const THEME_MODE_KEY = 'volition.themeMode';
const LOCALE_KEY = 'volition.locale';

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
