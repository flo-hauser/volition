# PLANS.md — Milestone 2 (Steps 5-8)

## Goal
Finish the remaining Milestone 2 UX polish items around theme/settings/backgrounds/animations while preserving existing habit-tracking behavior.

## Scope (remaining)

### In
5. Add dark/light mode toggle with system-derived option.
6. Move language + theme controls to a dedicated settings page.
7. Apply subtle multicolor gradients in light and dark mode using AGENTS palette.
8. Add subtle encouraging animation when weekly goals are achieved in list items.

### Out
- No changes to storage schema or task/check-in domain behavior.
- No notification/reminder features.

---

## Success criteria
- Users can choose `System`, `Light`, or `Dark` mode in settings.
- Language can be changed in settings and persists between reloads.
- Theme mode persists between reloads and supports system mode.
- Header no longer contains direct language/theme controls.
- Settings page is reachable from app navigation.
- Week overview items show subtle goal-achieved animation when `progress >= target`.
- Both light and dark modes use subtle multi-color gradient backgrounds.

---

## Data model impact
- No storage schema changes.
- Add lightweight preference persistence in `localStorage` for theme mode and locale.

---

## File plan
- `PLANS.md`
- `quasar.config.ts`
- `src/boot/i18n.ts`
- `src/boot/theme.ts`
- `src/composables/useAppPreferences.ts`
- `src/router/routes.ts`
- `src/layouts/MainLayout.vue`
- `src/pages/SettingsPage.vue`
- `src/pages/WeekPage.vue`
- `src/css/app.scss`
- `src/i18n/en-US/index.ts`
- `src/i18n/de-DE/index.ts`
- `src/__tests__/MainLayout.spec.ts`
- `src/__tests__/WeekPage.spec.ts`
- `src/__tests__/SettingsPage.spec.ts`
- snapshot updates under `src/__tests__/__snapshots__/`

---

## Implementation steps
1. Add preference helpers for theme/locale localStorage read-write.
2. Add `theme` boot file and wire it in Quasar config before app render.
3. Update i18n boot to honor persisted locale before browser detection fallback.
4. Add `/settings` page and route for language/theme controls.
5. Remove locale controls from header; keep title + quick actions + settings entry.
6. Add settings tab/button access in navigation.
7. Enhance gradients in `app.scss` for both modes using palette.
8. Add goal-achieved animation styling in Week page list items.
9. Update tests/snapshots and run full validation.

---

## Risks / open questions
- Quasar dark plugin behavior in tests may require mocks for static `Dark` plugin APIs.
- System mode can differ by environment; tests should assert intent (mode value + API calls), not OS behavior.

---

## Test plan
- `MainLayout.spec.ts`: no locale controls in header, app title/icon remain, settings nav visible.
- `WeekPage.spec.ts`: progress style + achieved animation class when target reached.
- `SettingsPage.spec.ts`: locale persistence and theme mode application calls.
- Run:
  - `npm test`
  - `npm run test:coverage`
  - `npm run build`
