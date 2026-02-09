# PWA Setup (Milestone 4)

## Current state
- Quasar PWA mode is configured in `quasar.config.ts`.
- Router mode is set to `history` (clean URLs, no hash).
- Service worker registration is in `src-pwa/register-service-worker.ts`.
- Manifest is in `src-pwa/manifest.json`.
- PWA icons are in `public/icons/`.

## Build and test
- Run tests: `npm test`
- Build PWA: `quasar build -m pwa`

## Runtime UX
- App shows an offline banner when `navigator.onLine === false`.
- App shows an update banner when a new service worker is waiting.
- User can apply update from the banner (reload).

## History routing deployment note
Because we use HTML5 history mode, production hosting must rewrite unknown paths to `index.html`.

Examples:
- `/week`
- `/tasks`
- `/settings`

If this rewrite is missing, direct reload on deep links will return 404 from the web server.
