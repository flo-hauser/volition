# Volition

> Build habits that stick — one week at a time.

Volition is a lightweight, cross-platform **weekly habit tracker**. Define how many days per week you want to show up for each habit, check in daily, and watch your streaks grow. No subscriptions, no accounts, no noise — just you and your goals.

---

## Features

- **Weekly frequency targets** — set a goal of 1–7 days/week per habit, not an all-or-nothing daily streak
- **Daily check-in view** — see only today's habits and tick them off with a single tap
- **Weekly progress grid** — visualize the whole week at a glance and catch up on missed days
- **Offline-first** — works fully without a network connection; data lives on your device
- **PWA + mobile ready** — installable as a Progressive Web App and packaged for Android via Capacitor
- **Dark / light / system theme** — respects your OS preference out of the box
- **Localized** — English and German included; auto-detected from browser language
- **Private by design** — no server, no analytics, no account required

---

## Screenshots

> _Coming soon_

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

The app opens automatically in your browser with hot-reload enabled.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Quasar dev server |
| `npm run build` | Production build (web/PWA) |
| `npm run lint` | ESLint with flat config |
| `npm run format` | Prettier format |
| `npm run test` | Run test suite (single pass) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage report |

Run a single test file:

```bash
npx vitest run src/__tests__/tasks.store.spec.ts
```

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Vue 3 + Composition API |
| UI library | Quasar 2 |
| State | Pinia |
| Router | Vue Router 4 (history mode) |
| Language | TypeScript (strict) |
| Storage | IndexedDB (primary) + localStorage (fallback) |
| Mobile | Capacitor |
| PWA | Workbox (GenerateSW) |
| Testing | Vitest + @vue/test-utils |

---

## Project Structure

```text
src/
├── components/       # Shared UI components
├── composables/      # useDay, useProgress, useAppPreferences
├── i18n/             # en-US and de-DE translation files
├── pages/            # TodayPage, WeekPage, TasksPage, SettingsPage
├── services/         # Storage adapters (IndexedDB, localStorage, resilient)
├── stores/           # Pinia store (tasks + check-ins)
├── types/            # Task and Checkin type definitions
└── __tests__/        # Vitest test suite
```

### Data model

```ts
Task    { id, title, targetPerWeek, createdAt, archivedAt? }
Checkin { id, taskId, day (ISO date), createdAt }
```

All state is keyed to ISO dates and ISO week IDs — no time zones, no surprises.

---

## Contributing

Pull requests are welcome. For larger changes please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

Built with AI assistance using [Claude](https://claude.ai).
