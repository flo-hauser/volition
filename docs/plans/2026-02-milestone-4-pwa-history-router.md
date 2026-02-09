# PLANS.md — Milestone 4 (PWA + History Router)

## Goal
Enable robust Progressive Web App support and migrate routing from hash mode to HTML5 history mode while preserving current behavior on mobile and desktop.

## Scope

### In
1. Enable and configure Quasar PWA mode for installable offline-capable app behavior.
2. Migrate router mode from `hash` to `history`.
3. Add service worker update UX and offline status UX.
4. Ensure existing pages (`/`, `/week`, `/tasks`, `/settings`) work after first load when offline.
5. Add tests/build checks and basic PWA docs.

### Out
- No backend/API integration.
- No push notifications in this milestone.
- No auth/account features.

## Success criteria
- App is installable as PWA on Android Chrome.
- Router uses clean URLs without `#`.
- Direct navigation and reload on deep links work in dev and production serve setup.
- After first online load, core routes render offline with persisted local state.
- User sees clear update prompt when a new service worker version is available.
- `npm test` and `quasar build -m pwa` pass.

## Data model impact
- No schema/data model changes.
- Existing IndexedDB/LocalStorage persistence remains source of truth for app state.

## File plan
- `PLANS.md`
- `quasar.config.ts`
- `src/router/index.ts`
- `src/router/routes.ts` (only if route metadata/guards need small adjustments)
- `src/layouts/MainLayout.vue`
- `src/css/app.scss` (if offline/update banners need style)
- `src-pwa/` files generated/updated by Quasar (service worker + register file)
- `public/` icons/manifest assets (as needed)
- `src/__tests__/MainLayout.spec.ts`
- `src/__tests__/router` tests (new if needed)
- `docs/pwa.md` (new)

## Step-by-step plan
1. Add/verify Quasar PWA mode (`quasar mode add pwa`) and baseline generated files.
2. Configure PWA manifest (`name`, `short_name`, `start_url`, `display`, `theme_color`, icons incl. maskable).
3. Configure Workbox strategy in `quasar.config.ts`:
   - precache app shell/static assets,
   - runtime strategy for navigation requests suitable for history mode,
   - avoid caching mutable store payloads beyond browser storage.
4. Migrate router to history mode:
   - switch Quasar `vueRouterMode` from `hash` to `history`,
   - confirm router base handling,
   - validate deep-link refresh behavior.
5. Add service-worker update UX in layout:
   - detect waiting SW,
   - prompt user to refresh/apply update.
6. Add offline indicator UX in layout:
   - display online/offline state,
   - keep non-blocking and mobile-first.
7. Validate installability + offline behavior on phone and desktop.
8. Add documentation (`docs/pwa.md`) for run/build/serve, install, update lifecycle, and history routing deployment notes.
9. Run full validation:
   - `npm test`
   - `quasar build -m pwa`

## Risks / open questions
- History routing requires server fallback to `index.html` for unknown paths in production hosting.
- Service worker + history mode can create confusing stale-route issues if caching strategy is too aggressive.
- Some local-network dev scenarios can differ from production secure-context behavior.

## Test plan
- Unit tests:
  - layout update/offline banner behavior,
  - router behavior assertions for history paths (if added).
- Manual checks:
  - install prompt appears,
  - standalone app launch,
  - deep-link reload on `/week`, `/tasks`, `/settings`,
  - offline reopen after first online visit,
  - update prompt appears after new build.
- Commands:
  - `npm test`
  - `quasar build -m pwa`
