# Task Archiving UI — Implemented

**Roadmap section:** Quick wins  
**Status:** Shipped

---

## Goal

Give users a way to archive tasks they no longer want active, without deleting history. Show archived tasks on demand via a toggle and keep archived counts/order accurate.

---

## Dependency note

If the **reorder** feature lands first (recommended), `archiveTask` and `unarchiveTask` must also update `taskOrder`:

- `archiveTask` → remove the ID from `taskOrder`
- `unarchiveTask` → append the ID back at the end of `taskOrder`

Without this, the task silently lingers in `taskOrder` as a stale entry. The store's `activeTasks` computed already filters by `!archivedAt` so it won't show up in the active list, but the orphan ID is noise and could cause subtle bugs in future. Handle it inside `persistOrRollback` alongside the `archivedAt` mutation.

---

## What already exists

| Piece | Location | Status |
| --- | --- | --- |
| `archivedAt?: string` field on `Task` | [src/types/task.ts](../src/types/task.ts) | Ready, no schema change needed |
| `activeTasks` filter (`!task.archivedAt`) | [src/stores/tasks.store.ts:54](../src/stores/tasks.store.ts#L54) | Ready |
| `persistOrRollback` helper | [src/stores/tasks.store.ts:121](../src/stores/tasks.store.ts#L121) | Use the same pattern as `updateTask` / `deleteTask` |
| Hardcoded `archived: 0` eyebrow | [src/pages/TasksPage.vue:5](../src/pages/TasksPage.vue#L5) | Must be replaced |
| `q-dialog` confirm pattern | [src/pages/TaskDetailPage.vue:87](../src/pages/TaskDetailPage.vue#L87) | Follow for any destructive confirm |

---

## Implemented

### Store

**File:** [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

- Added `archiveTask`, `unarchiveTask`, and `archivedTasks` in [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)
- Archiving removes the task ID from `taskOrder`
- Unarchiving appends the task ID back to the end of `taskOrder`
- Added store tests in [src/__tests__/tasks.store.spec.ts](../src/__tests__/tasks.store.spec.ts)

### Tasks list UI

**File:** [src/pages/TasksPage.vue](../src/pages/TasksPage.vue)

- Kept the long-press / right-click `q-menu` pattern on task rows
- Added a real archived count in the eyebrow
- Added a toggle to reveal archived tasks below the active list
- Archived rows use the same long-press menu for restore

### Detail page UI

- Added an archive action for active tasks in [src/pages/TaskDetailPage.vue](../src/pages/TaskDetailPage.vue)
- Added an unarchive action for archived tasks in the same header action area
- Archiving from detail returns to the tasks list

### Styling and copy

- Added archived row styling in [src/css/app.scss](../src/css/app.scss)
- Added archive/unarchive strings and toasts in the locale files
- Replaced hardcoded `archived: 0` behavior with live data

---

## Acceptance criteria

- [x] Tapping "Archive" on a task removes it from the active list immediately (optimistic UI via `persistOrRollback`)
- [x] `archived: N` eyebrow reflects the real count; clicking toggles the archived section
- [x] Archived tasks are visually distinct (strikethrough + opacity)
- [x] Long-pressing an archived task shows "Unarchive"; it moves back to the active list
- [x] No data is lost — check-in history is fully preserved for archived tasks
- [x] Store tests cover both `archiveTask` and `unarchiveTask`
- [x] Hardcoded `archived: 0` is gone

---

## Files touched

| File | Change |
| --- | --- |
| [src/stores/tasks.store.ts](../src/stores/tasks.store.ts) | Add `archiveTask`, `unarchiveTask`, `archivedTasks` |
| [src/pages/TasksPage.vue](../src/pages/TasksPage.vue) | Context menus, toggle, eyebrow fix |
| [src/css/app.scss](../src/css/app.scss) | `.tasks-row--archived` style |
| [src/i18n/en-US/index.ts](../src/i18n/en-US/index.ts) | Archive / unarchive labels and toasts |
| [src/i18n/de-DE/index.ts](../src/i18n/de-DE/index.ts) | Same in German |
| [tasks.store.spec.ts](../src/__tests__/tasks.store.spec.ts) | 2 new test cases |
| [src/pages/TaskDetailPage.vue](../src/pages/TaskDetailPage.vue) | Archive and unarchive actions in the header |
