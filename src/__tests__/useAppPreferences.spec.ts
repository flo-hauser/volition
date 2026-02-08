import { beforeEach, describe, expect, it } from 'vitest';

import {
  getStoredLocale,
  getStoredThemeMode,
  setStoredLocale,
  setStoredThemeMode,
} from 'src/composables/useAppPreferences';

const THEME_MODE_KEY = 'volition.themeMode';
const LOCALE_KEY = 'volition.locale';

describe('useAppPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns system theme by default', () => {
    expect(getStoredThemeMode()).toBe('system');
  });

  it('returns stored theme modes when valid', () => {
    localStorage.setItem(THEME_MODE_KEY, 'light');
    expect(getStoredThemeMode()).toBe('light');

    localStorage.setItem(THEME_MODE_KEY, 'dark');
    expect(getStoredThemeMode()).toBe('dark');

    localStorage.setItem(THEME_MODE_KEY, 'system');
    expect(getStoredThemeMode()).toBe('system');
  });

  it('falls back to system theme for invalid stored value', () => {
    localStorage.setItem(THEME_MODE_KEY, 'invalid-mode');
    expect(getStoredThemeMode()).toBe('system');
  });

  it('persists theme mode', () => {
    setStoredThemeMode('dark');
    expect(localStorage.getItem(THEME_MODE_KEY)).toBe('dark');
  });

  it('returns null locale by default', () => {
    expect(getStoredLocale()).toBeNull();
  });

  it('returns stored locale when valid', () => {
    localStorage.setItem(LOCALE_KEY, 'en-US');
    expect(getStoredLocale()).toBe('en-US');

    localStorage.setItem(LOCALE_KEY, 'de-DE');
    expect(getStoredLocale()).toBe('de-DE');
  });

  it('returns null for invalid stored locale', () => {
    localStorage.setItem(LOCALE_KEY, 'fr-FR');
    expect(getStoredLocale()).toBeNull();
  });

  it('persists locale', () => {
    setStoredLocale('de-DE');
    expect(localStorage.getItem(LOCALE_KEY)).toBe('de-DE');
  });
});
