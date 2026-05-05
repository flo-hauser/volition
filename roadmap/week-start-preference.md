# Week Start Day Preference — Implementation Plan

**Roadmap section:** Quick wins  
**Estimated effort:** ~2–3 hours

---

## Goal

Let users choose whether their week starts on Monday (ISO default, current behaviour) or Sunday (US/many locales). The preference is stored in localStorage, threads through all week calculations, and is toggled in Settings.

---

## What already exists

| Piece                                                                 | Location                                                                        | Notes                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| All week logic                                                        | [src/composables/useDay.ts](../src/composables/useDay.ts)                       | Uses `startOfISOWeek` from date-fns — always Monday                   |
| `getIsoWeekId`, `getWeekDays`, `getWeekdayIndex`, `getPreviousWeekId` | [src/composables/useDay.ts](../src/composables/useDay.ts)                       | All 4 need to become week-start-aware                                 |
| `useProgress`                                                         | [src/composables/useProgress.ts](../src/composables/useProgress.ts)             | Calls `getWeekDays` — will inherit fix automatically                  |
| Store week calls                                                      | [src/stores/tasks.store.ts:73](../src/stores/tasks.store.ts#L73)                | `getStreak`, `getHeatmapDays` use `getIsoWeekId`, `getPreviousWeekId` |
| `WeekPage`                                                            | [src/pages/WeekPage.vue:78](../src/pages/WeekPage.vue#L78)                      | Calls `getIsoWeekId`, `getWeekdayIndex`                               |
| `TodayPage`                                                           | [src/pages/TodayPage.vue:101](../src/pages/TodayPage.vue#L101)                  | Same pattern                                                          |
| `useAppPreferences`                                                   | [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts) | Holds `themeMode` and `locale` — add `weekStartDay` here              |
| `SettingsPage`                                                        | [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue)                     | Add toggle here, following existing theme/locale button pattern       |
| date-fns v4                                                           | `package.json`                                                                  | `startOfWeek(date, { weekStartsOn })` handles both modes              |

The check-in data (`checkinsByDay`) is keyed by day ISO strings (`YYYY-MM-DD`), **not by week ID**. Changing the week start preference does not affect stored data at all — only how days are grouped for display and streak math.

---

## Step 1 — Add `weekStartDay` to preferences

**File:** [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts)

```ts
export type WeekStartDay = 'monday' | 'sunday';

const WEEK_START_KEY = 'volition.weekStartDay';
const VALID_WEEK_STARTS: WeekStartDay[] = ['monday', 'sunday'];

function getStoredWeekStartDay(): WeekStartDay {
  const raw = localStorage.getItem(WEEK_START_KEY);
  return VALID_WEEK_STARTS.includes(raw as WeekStartDay) ? (raw as WeekStartDay) : 'monday'; // default: ISO / Monday
}

function setStoredWeekStartDay(value: WeekStartDay): void {
  localStorage.setItem(WEEK_START_KEY, value);
}
```

Export both from `useAppPreferences()`.

---

## Step 2 — Make `useDay.ts` week-start-aware

**File:** [src/composables/useDay.ts](../src/composables/useDay.ts)

Add a `WeekStartDay` parameter (defaulting to `'monday'`) to each of the four exported functions. Internally switch between `startOfISOWeek` (Monday) and `startOfWeek(date, { weekStartsOn: 0 })` (Sunday) from date-fns.

```ts
import {
  startOfISOWeek,
  startOfWeek,
  getISOWeek,
  getWeek,
  getISOWeekYear,
  getWeekYear,
  addDays,
  parseISO,
  formatISO,
} from 'date-fns';
import type { WeekStartDay } from './useAppPreferences';

function weekStart(date: Date, mode: WeekStartDay): Date {
  return mode === 'sunday' ? startOfWeek(date, { weekStartsOn: 0 }) : startOfISOWeek(date);
}

function weekNumber(date: Date, mode: WeekStartDay): number {
  return mode === 'sunday' ? getWeek(date, { weekStartsOn: 0 }) : getISOWeek(date);
}

function weekYear(date: Date, mode: WeekStartDay): number {
  return mode === 'sunday' ? getWeekYear(date, { weekStartsOn: 0 }) : getISOWeekYear(date);
}

// replaces getIsoWeekId
export function getWeekId(dayISO: string, mode: WeekStartDay = 'monday'): string {
  const date = parseISO(dayISO);
  const year = weekYear(date, mode);
  const week = String(weekNumber(date, mode)).padStart(2, '0');
  return `${year}-W${week}`;
}

// replaces getWeekDays (signature stays compatible)
export function getWeekDays(weekId: string, mode: WeekStartDay = 'monday'): string[] {
  const [yearStr, weekStr] = weekId.split('-W');
  // reconstruct the start date of this week
  const jan4 = new Date(Number(yearStr), 0, 4); // Jan 4 is always in week 1
  const startOfFirstWeek = weekStart(jan4, mode);
  const targetWeekStart = addDays(startOfFirstWeek, (Number(weekStr) - 1) * 7);
  return Array.from({ length: 7 }, (_, i) =>
    formatISO(addDays(targetWeekStart, i), { representation: 'date' }),
  );
}

// replaces getWeekdayIndex
export function getWeekdayIndex(
  weekId: string,
  dayISO: string,
  mode: WeekStartDay = 'monday',
): number {
  const days = getWeekDays(weekId, mode);
  return days.indexOf(dayISO);
}

// replaces getPreviousWeekId
export function getPreviousWeekId(weekId: string, mode: WeekStartDay = 'monday'): string {
  const days = getWeekDays(weekId, mode);
  const dayBeforeWeek = addDays(parseISO(days[0]), -1);
  return getWeekId(formatISO(dayBeforeWeek, { representation: 'date' }), mode);
}
```

Keep the old names as re-exports with fixed `'monday'` default so existing code compiles without immediate changes:

```ts
// backwards-compat aliases — remove once all call sites are updated
export const getIsoWeekId = (d: string) => getWeekId(d, 'monday');
```

---

## Step 3 — Thread preference through call sites

There are exactly three call sites outside `useDay.ts` itself. Update each to read `weekStartDay` from preferences and pass it through.

### Store — [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

```ts
import { useAppPreferences } from '@/composables/useAppPreferences';
import { getWeekId, getWeekDays, getPreviousWeekId } from '@/composables/useDay';

// inside the store, get preference once:
const { getStoredWeekStartDay } = useAppPreferences();

// replace every getIsoWeekId(...) call with:
getWeekId(dayISO, getStoredWeekStartDay());

// replace every getPreviousWeekId(...) call with:
getPreviousWeekId(weekId, getStoredWeekStartDay());

// replace every getWeekDays(...) call with:
getWeekDays(weekId, getStoredWeekStartDay());
```

### WeekPage — [src/pages/WeekPage.vue:78](../src/pages/WeekPage.vue#L78)

```ts
const { getStoredWeekStartDay } = useAppPreferences();
const weekStartDay = computed(() => getStoredWeekStartDay());

// replace getIsoWeekId(today) with:
getWeekId(today, weekStartDay.value);
// replace getWeekdayIndex(...) with:
getWeekdayIndex(currentWeekId.value, today, weekStartDay.value);
```

### TodayPage — [src/pages/TodayPage.vue:101](../src/pages/TodayPage.vue#L101)

Same two replacements as WeekPage.

---

## Step 4 — Reactivity: re-render on preference change

The store's week functions are called lazily (in computed properties), so a page reload or navigation re-computes them with the new preference. That is acceptable.

If live reactivity is desired (the WeekPage updates the moment the toggle is flipped without navigation), convert `getStoredWeekStartDay` into a reactive `ref` inside `useAppPreferences`:

```ts
const weekStartDay = ref<WeekStartDay>(getStoredWeekStartDay());

function setWeekStartDay(value: WeekStartDay): void {
  weekStartDay.value = value;
  localStorage.setItem(WEEK_START_KEY, value);
}
```

Export `weekStartDay` (readonly) and `setWeekStartDay`. Call sites use `weekStartDay.value` instead of `getStoredWeekStartDay()`.

**Recommendation:** do this from the start — it's 3 extra lines and avoids a confusing "why didn't the page update?" moment.

---

## Step 5 — Settings UI

**File:** [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue)

Follow the exact same toggle-button pattern used for theme and locale. Add a new row:

```html
<div class="settings-row">
  <span class="settings-row__label">{{ t('settings.weekStart.label') }}</span>
  <div class="settings-toggle-group">
    <button
      class="ghost-btn"
      :class="{ active: weekStartDay === 'monday' }"
      @click="setWeekStartDay('monday')"
    >
      {{ t('settings.weekStart.monday') }}
    </button>
    <button
      class="ghost-btn"
      :class="{ active: weekStartDay === 'sunday' }"
      @click="setWeekStartDay('sunday')"
    >
      {{ t('settings.weekStart.sunday') }}
    </button>
  </div>
</div>
```

```ts
const { weekStartDay, setWeekStartDay } = useAppPreferences();
```

---

## Step 6 — i18n strings

**Files:** `src/i18n/en-US/index.ts`, `src/i18n/de-DE/index.ts`

```ts
// en-US — under settings namespace
weekStart: {
  label: 'Week starts on',
  monday: 'Monday',
  sunday: 'Sunday',
},
```

```ts
// de-DE
weekStart: {
  label: 'Woche beginnt am',
  monday: 'Montag',
  sunday: 'Sonntag',
},
```

---

## Step 7 — Tests

**File:** [src/**tests**/useDay.spec.ts](../src/__tests__/useDay.spec.ts)

Existing tests call `getIsoWeekId` — they continue to pass because the default is `'monday'`.

Add a parallel suite for Sunday mode:

- A known date (e.g. 2025-01-06, a Monday) is in week 2 ISO but week 1 Sunday-start (week started 2025-01-05 Sunday)
- `getWeekDays` with Sunday mode returns 7 days starting on Sunday
- `getWeekdayIndex` returns 0 for Sunday, 1 for Monday
- `getPreviousWeekId` steps back correctly across a year boundary (Dec/Jan)
- Round-trip: `getWeekId(getWeekDays(id, 'sunday')[3], 'sunday') === id`

---

## Acceptance criteria

- [ ] Default is Monday — no change for existing users
- [ ] Switching to Sunday immediately re-renders `WeekPage` header and day columns
- [ ] `TodayPage` week progress counts the correct 7-day window for the chosen start day
- [ ] Streak calculation respects the preference (a week boundary is at the chosen start day)
- [ ] Setting persists in localStorage across restarts
- [ ] Existing check-in data is not modified in any way

---

## Files touched

| File                                                                            | Change                                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts) | `WeekStartDay` type, reactive `weekStartDay` ref, `setWeekStartDay`                         |
| [src/composables/useDay.ts](../src/composables/useDay.ts)                       | All 4 functions accept `WeekStartDay` param; Sunday path via date-fns `{ weekStartsOn: 0 }` |
| [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)                       | Thread `weekStartDay` into all `useDay` calls                                               |
| [src/pages/WeekPage.vue](../src/pages/WeekPage.vue)                             | Thread `weekStartDay` into `useDay` calls                                                   |
| [src/pages/TodayPage.vue](../src/pages/TodayPage.vue)                           | Thread `weekStartDay` into `useDay` calls                                                   |
| [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue)                     | New toggle row                                                                              |
| `src/i18n/en-US/index.ts`                                                       | `settings.weekStart.*` strings                                                              |
| `src/i18n/de-DE/index.ts`                                                       | Same in German                                                                              |
| `src/__tests__/useDay.spec.ts`                                                  | Sunday-mode test suite                                                                      |
