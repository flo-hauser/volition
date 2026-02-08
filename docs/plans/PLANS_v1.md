# PLANS.md — Habit Tracker (Vue + Quasar) ExecPlan

## Goal

Ship a working **client-only** weekly-based behavior tracker MVP skeleton that:

- runs via Quasar CLI
- lets users create tasks with a **weekly frequency target**
- provides a **Daily overview** and a **Weekly overview**
- persists data locally (offline-first)
- has **fully tested logic** (Vitest + Vue Test Utils), especially week/progress/check-in logic

Success criteria:

- After refresh/restart, tasks and check-ins remain.
- Users can create “Sports 3x/week” and check/uncheck it for today.
- Weekly overview shows progress (e.g., `2 / 3`), and can exceed target (e.g., `4 / 3`).
- Unit tests cover core logic paths (week calc, counts, toggles).

---

## Scope (Milestone 1)

### In

0) Drop all quasar cli generated and not used starting scaffolds
1) App skeleton + routing (mobile-first)
2) Weekly-based domain model (tasks + check-ins)
3) Local persistence adapter (IndexedDB preferred)
4) Task CRUD (create + list; archive optional if easy)
5) **Daily overview shows all active tasks, every day**
6) Weekly overview: progress per task for current week
7) Logic test suite (Vitest + Vue Test Utils where appropriate)

### Out (explicitly later)

- Auth / sync / accounts
- Notifications / reminders
- Numeric tracking modes (true step counts, etc.)
- Advanced analytics, charts, streaks
- Heavy theming/polish

---

## Tooling / setup

- Use **Quasar CLI** workflows:
  - `quasar dev` for development
  - `quasar build` for build verification
- Testing via Vitest:
  - `pnpm test` (or repo-defined test script)

---

## Data model (v0, schemaVersion 1)

### Task

- `id: string` (UUID)
- `title: string`
- `targetPerWeek: number` (1..7)
- `createdAt: string` (ISO timestamp)
- `archivedAt?: string` (ISO timestamp)

### Check-in

A record that a task was done on a given day.

- `taskId: string`
- `day: string` (`YYYY-MM-DD` local date)
- `checkedAt: string` (ISO timestamp)

### App state

- `meta: { schemaVersion: 1 }`
- `tasks: Record<string, Task>`
- `checkinsByDay: Record<string, Record<string, Checkin>>`
  - keyed by `day` then `taskId` for fast Today lookup

Done semantics:

- A task is “done today” iff `checkinsByDay[todayISO][taskId]` exists.
- Unchecking removes that entry.

---

## Weekly logic definition

- Week boundaries: **ISO week** (Monday–Sunday).
- Helpers:
  - `getLocalDayISO(): YYYY-MM-DD`
  - `getIsoWeekId(dayISO): YYYY-Www`
  - `getWeekDays(weekId): YYYY-MM-DD[]` (7 days)

Weekly progress:

- count check-ins for `taskId` across the 7 days of the week
- display `count / targetPerWeek`
- allow `count` to exceed `targetPerWeek` (show `4 / 3`)

---

## Architecture & file layout

- `src/pages/`
  - `TodayPage.vue`
  - `WeekPage.vue`
  - `TasksPage.vue`
  - `TaskNewPage.vue`
- `src/stores/`
  - `tasks.store.ts` (tasks + check-ins + derived getters)
- `src/services/storage/`
  - `storageAdapter.ts`
  - `indexedDbAdapter.ts`
- `src/types/`
  - `task.ts` (Task, Checkin)
  - `storage.ts` (StorageState)
- `src/composables/`
  - `useDay.ts` (day/week helpers)
- Optional:
  - `src/components/TaskCheckItem.vue`

Testing:

- `src/__tests__/` (or `tests/`) for unit tests:
  - `useDay.spec.ts`
  - `progress.spec.ts` (aggregation helpers)
  - `tasks.store.spec.ts` (toggle + persistence mock)

---

## UX / screens (mobile-first)

### Today (default route)

- Always lists **all active tasks**.
- Each item:
  - title
  - checkbox/toggle for today
  - progress hint: `count / target this week` (recommended)
- Empty state: “No tasks yet” + create button

### Week (weekly overview)

- Shows current week label
- Lists tasks with progress `count / target`
- No week navigation in v0

### Tasks

- List tasks (title + target)
- “Add task” button

### New task

- Title input
- Target picker 1–7 with labels (7 = daily)

Desktop requirement:

- Must remain functional; layouts can widen gracefully (no broken navigation/overflow).

---

## Step-by-step implementation plan

1) **Routing + layout (mobile-first)**
   - Routes: `/` (Today), `/week`, `/tasks`, `/tasks/new`
   - Simple Quasar navigation (mobile-friendly)
2) **Types**
   - Task, Checkin, StorageState, schemaVersion
3) **Date/week helpers**
   - Local day ISO and ISO week helpers (+ tests)
4) **Progress aggregation helpers**
   - count check-ins by week for a task (+ tests)
5) **Storage adapter interface**
   - `loadState()` / `saveState()`
6) **IndexedDB adapter**
   - single store + single key (`appState`)
7) **Pinia store**
   - state: tasks, checkinsByDay, isReady
   - actions: `init()`, `createTask()`, `toggleToday()`, `toggleForDay()`
   - getters: `activeTasks`, `isDone()`, `weekProgress()`
   - persistence after each mutation
   - store tests with mocked storage adapter
8) **Pages**
   - Today + Week + Tasks + New Task
9) **Polish**
   - loading states, validation (non-empty title, target 1..7)
10) **i18n**

- Use i18n and add locals for en-US and de-DE

---

## Risks / open questions

- ISO week correctness at year boundaries (must be tested).
- Quasar template differences: router file locations may vary.

---

## Test plan

### Unit tests (required)

- `useDay`:
  - correct ISO week id around year boundary
  - correct week days list length = 7 and correct start/end
- Progress aggregation:
  - counts check-ins across week correctly
  - can exceed target
- Store:
  - `toggleToday` adds/removes check-in
  - `weekProgress` reflects changes
  - persistence called after mutations

### Manual smoke tests

1) `quasar dev`
2) Create tasks: “Sports (3)”, “Walk 1000 steps (5)”, “Smoke-free day (7)”
3) Today: toggle them done
4) Week: verify progress increments
5) Refresh/restart: verify persistence
6) Desktop browser width: verify navigation and lists remain usable

---

## Next milestones

- Edit + archive tasks
- Week navigation (prev/next)
- Export/import JSON backup
- Visual 7-day dots per task

---

## Implementation slice: Milestone 1 steps 0-3 (current task)

### Goal + success criteria

Implement only the project foundation slice:

- remove unused Quasar starter scaffolds
- mobile-first app routing/layout for `/`, `/week`, `/tasks`, `/tasks/new`
- add domain types (`Task`, `Checkin`, `StorageState`) in `src/types`
- add and test date/week helpers in `src/composables/useDay.ts`
- enable Vitest + Vue Test Utils and make `npm test` green

Success criteria:

- navigation between all four routes works via app layout
- no storage adapter/store implementation is added yet
- `useDay` unit tests cover ISO week year-boundary behavior
- `npm test` passes

### Scope / non-goals for this slice

In scope:

- Milestone step 0, 1, 2, 3 only
- test tooling setup required for `useDay` unit tests

Out of scope:

- Milestone steps 4+ (progress helpers, storage adapter, indexedDB, Pinia task store, CRUD logic)

### Data model changes

- Introduce typed domain models in `src/types/task.ts` and `src/types/storage.ts`
- Keep schema metadata at `schemaVersion: 1` in type form only (no persistence logic yet)

### File list (planned)

- `PLANS.md`
- `package.json`
- `src/layouts/MainLayout.vue`
- `src/router/routes.ts`
- `src/pages/TodayPage.vue`
- `src/pages/WeekPage.vue`
- `src/pages/TasksPage.vue`
- `src/pages/TaskNewPage.vue`
- `src/composables/useDay.ts`
- `src/types/task.ts`
- `src/types/storage.ts`
- `src/__tests__/useDay.spec.ts`
- `vitest.config.ts`

Cleanup targets (if unused after routing/layout update):

- `src/components/EssentialLink.vue`
- `src/components/ExampleComponent.vue`
- `src/components/models.ts`
- `src/stores/example-store.ts`
- `src/pages/IndexPage.vue`

### Steps

1. Replace starter layout navigation with a mobile-first app shell and route links.
2. Add explicit pages for Today/Week/Tasks/New Task and wire routes.
3. Add domain types under `src/types`.
4. Implement `useDay` helper functions with ISO week handling.
5. Add Vitest + Vue Test Utils config and write `useDay` tests including year-boundary cases.
6. Run tests and fix until green.

### Risks / open questions

- ISO week calculations around year change and week 53 handling.
- Quasar + Vitest path alias resolution in test environment.
- TypeScript test globals can be handled without a dedicated `tsconfig.vitest.json` because tests import from `vitest` directly.

### Test plan for this slice

- Run `npm test`.
- `useDay.spec.ts` assertions:
  - local day iso format
  - `getIsoWeekId` for boundary dates around Jan 1
  - `getWeekDays` returns Monday-Sunday, length 7, correct week id for each day

---

## Implementation slice: Milestone 1 steps 4-7 (current task)

### Goal + success criteria

Implement core logic and persistence plumbing only:

- weekly progress aggregation helper
- storage adapter interface
- IndexedDB adapter (`appState` single key)
- Pinia tasks store with actions/getters and persistence hooks
- full unit tests for progress helper and store behavior

Success criteria:

- store actions: `init`, `createTask`, `toggleToday`, `toggleForDay` exist and are tested
- getters: `activeTasks`, `isDone`, `weekProgress` exist and are tested
- persistence is called after mutations
- no additional UI flow beyond what already exists
- `npm test` is green

### Scope / non-goals

In scope:

- Milestone steps 4, 5, 6, 7
- test coverage for aggregation + store

Out of scope:

- task edit/archive UI
- full page wiring for CRUD interactions
- migration logic beyond schema version guard

### File list (planned)

- `PLANS.md`
- `src/composables/useProgress.ts`
- `src/services/storage/storageAdapter.ts`
- `src/services/storage/indexedDbAdapter.ts`
- `src/stores/tasks.store.ts`
- `src/__tests__/progress.spec.ts`
- `src/__tests__/tasks.store.spec.ts`

### Steps

1. Add week progress helper that counts check-ins by week days.
2. Add storage adapter interface and empty-state helper.
3. Implement IndexedDB adapter with one object store + key `appState`.
4. Implement Pinia store with required actions/getters and persistence calls.
5. Add unit tests for helper and store with mocked storage adapter.
6. Run `npm test` and fix until green.

### Risks / open questions

- IndexedDB unavailable in some environments (tests/SSR); adapter should fail safely.
- Race conditions if multiple actions persist concurrently; keep writes sequential per action call.

### Test plan for this slice

- `progress.spec.ts`:
  - counts only days of requested week
  - allows counts above `targetPerWeek`
- `tasks.store.spec.ts`:
  - `init` loads saved state + marks ready
  - `createTask` validates and persists
  - `toggleToday` and `toggleForDay` add/remove check-ins and persist
  - `activeTasks`, `isDone`, `weekProgress` match expected behavior

---

## Implementation slice: Milestone 1 steps 8-10 (current task)

### Goal + success criteria

Deliver the first end-to-end UI flow and localization:

- wire Today/Week/Tasks/New Task pages to the tasks store
- add loading and validation polish on app init and task creation
- apply vue-i18n across navigation/pages and add `en-US` + `de-DE` locales

Success criteria:

- users can create a task from `/tasks/new` and see it on `/tasks`, `/`, and `/week`
- today page toggles check-ins for today and shows weekly progress per task
- app shows loading state while store initializes
- task creation validates title and target bounds
- all user-facing strings on touched pages/layout come from i18n

### Scope / non-goals

In scope:

- Milestone steps 8, 9, 10
- page wiring to existing store actions/getters
- locale resources for `en-US` and `de-DE`

Out of scope:

- editing/archiving tasks in UI
- week navigation and advanced analytics
- notifications or remote sync

### File list (planned)

- `PLANS.md`
- `src/layouts/MainLayout.vue`
- `src/router/routes.ts`
- `src/pages/TodayPage.vue`
- `src/pages/WeekPage.vue`
- `src/pages/TasksPage.vue`
- `src/pages/TaskNewPage.vue`
- `src/i18n/index.ts`
- `src/i18n/en-US/index.ts`
- `src/i18n/de-DE/index.ts`
- `src/boot/i18n.ts`

### Steps

1. Initialize store in layout and add mobile-friendly loading state.
2. Wire all four pages to store data/actions.
3. Add task creation form validation and submit flow.
4. Add i18n keys for all touched UI labels/messages and route titles.
5. Add locale switch and support `de-DE`.
6. Run tests and adjust as needed.

### Risks / open questions

- Route meta title localization needs a stable key mapping.
- Locale switching persistence is optional in this slice and can remain session-only.

### Test plan for this slice

- `npm test` remains green.
- Manual smoke flow:
  - create task from `/tasks/new`
  - toggle it on `/`
  - verify `/week` progress changes
  - switch locale to `de-DE` and verify labels update

---

## Implementation slice: task creation error + basic task CRUD

### Goal + success criteria

Fix false error on task creation and provide full basic task CRUD:

- successful task creation from `/tasks/new` redirects to `/tasks`
- no false submit error when state update succeeded
- tasks can be created, listed, updated, and deleted in UI/store

Success criteria:

- creating a valid task shows no error and navigates to task overview
- tasks page allows editing title/target and deleting tasks
- deleting a task removes related check-ins
- tests cover update/delete and persistence failure tolerance

### Scope / non-goals

In scope:

- store persistence robustness
- update/delete store actions
- tasks page edit/delete UX

Out of scope:

- archive/restore model changes
- undo/redo flows

### File list (planned)

- `PLANS.md`
- `src/stores/tasks.store.ts`
- `src/pages/TasksPage.vue`
- `src/i18n/en-US/index.ts`
- `src/i18n/de-DE/index.ts`
- `src/__tests__/tasks.store.spec.ts`

### Test plan

- `npm test` green
- store tests:
  - update and delete behavior
  - create still succeeds even if save persistence fails

---

## Implementation slice: CRUD toast feedback

### Goal

Provide user feedback to confirm CRUD operations:

- success toast on create/update/delete
- error toast on create/update/delete failures

### File list

- `PLANS.md`
- `quasar.config.ts`
- `src/pages/TaskNewPage.vue`
- `src/pages/TasksPage.vue`
- `src/i18n/en-US/index.ts`
- `src/i18n/de-DE/index.ts`

---

## Implementation slice: test coverage expansion (logic + components)

### Goal + success criteria

Increase confidence for v1 by expanding tests and enabling coverage reporting:

- add component tests using Vue Test Utils for key pages
- add snapshot-style HTML regression checks for page structure
- configure Vitest coverage reporting so coverage is visible and repeatable

Success criteria:

- logic tests remain green
- component tests cover core create/update/delete/toggle page interactions
- `npm run test:coverage` generates console coverage and HTML report

### Scope / non-goals

In scope:

- `TodayPage`, `WeekPage`, `TasksPage`, `TaskNewPage` component tests
- Vitest coverage config and script

Out of scope:

- full visual diff tooling
- e2e/browser automation

### File list (planned)

- `PLANS.md`
- `package.json`
- `vitest.config.ts`
- `.gitignore`
- `src/__tests__/TaskNewPage.spec.ts`
- `src/__tests__/TasksPage.spec.ts`
- `src/__tests__/TodayPage.spec.ts`
- `src/__tests__/WeekPage.spec.ts`

### Test plan

- Run `npm test`
- Run `npm run test:coverage`
- Verify snapshots are created and stable for page-level markup regression checks

---

## Implementation slice: coverage gap closure

### Goal + success criteria

Close remaining high-impact coverage gaps in layout/pages/storage:

- render slot content in VTU shallow tests for realistic template coverage
- add tests for `MainLayout.vue`, `ErrorNotFound.vue`, and `indexedDbAdapter.ts`
- add missing branch tests for empty/loading/error states in key pages

Success criteria:

- `npm test` and `npm run test:coverage` pass
- coverage meaningfully improves for `src/layouts`, `src/pages`, and `src/services/storage`
- remaining low-coverage files are mainly framework/type boilerplate

### File list (planned)

- `PLANS.md`
- `vitest.config.ts`
- `src/__tests__/MainLayout.spec.ts`
- `src/__tests__/ErrorNotFound.spec.ts`
- `src/__tests__/indexedDbAdapter.spec.ts`
- `src/__tests__/TaskNewPage.spec.ts`
- `src/__tests__/TasksPage.spec.ts`
- `src/__tests__/TodayPage.spec.ts`
- `src/__tests__/WeekPage.spec.ts`

---

## Implementation slice: milestone audit findings closure

### Goal

Close the three milestone-audit findings:

- make persistence failures explicit and non-silent
- remove unused axios scaffold boot wiring
- localize `ErrorNotFound` page text

### Success criteria

- CRUD/check-in actions fail loudly when persistence fails and do not leave in-memory-only success state
- `axios` boot file is no longer wired in Quasar config
- 404 page strings use i18n in both locales

### File list

- `PLANS.md`
- `src/stores/tasks.store.ts`
- `src/pages/TodayPage.vue`
- `src/i18n/en-US/index.ts`
- `src/i18n/de-DE/index.ts`
- `src/pages/ErrorNotFound.vue`
- `src/__tests__/tasks.store.spec.ts`
- `src/__tests__/TodayPage.spec.ts`
- `src/__tests__/ErrorNotFound.spec.ts`
- `quasar.config.ts`

---

## Implementation slice: unify task create/edit UX with reusable modal form

### Goal

Replace dedicated new-task page with modal-based create/edit flow on `TasksPage`:

- reusable task form component for both create and edit modes
- create action opens modal from task list page
- remove `/tasks/new` dedicated page route and references

### Success criteria

- users create tasks in modal from `/tasks`
- users edit tasks in the same reusable modal component
- `/tasks?new=1` opens create modal to preserve quick-entry behavior from global add buttons
- no remaining route/page dependency on `TaskNewPage.vue`

### File list

- `PLANS.md`
- `src/components/TaskFormDialog.vue`
- `src/pages/TasksPage.vue`
- `src/router/routes.ts`
- `src/layouts/MainLayout.vue`
- `src/pages/TodayPage.vue`
- `src/pages/TaskNewPage.vue` (remove)
- `src/__tests__/TasksPage.spec.ts`
- `src/__tests__/TaskFormDialog.spec.ts`
- `src/__tests__/TaskNewPage.spec.ts` (remove)
