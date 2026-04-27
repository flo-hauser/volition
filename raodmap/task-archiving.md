# Task Archiving UI — Implementation Plan

**Roadmap section:** Quick wins  
**Estimated effort:** ~3–4 hours

---

## Goal

Give users a way to archive tasks they no longer want active, without deleting history. Show archived tasks on demand via a toggle. Wire the currently hardcoded `archived: 0` eyebrow count to the real value.

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

## Step 1 — Add `archiveTask` / `unarchiveTask` to the store

**File:** [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

Add two functions using the existing `persistOrRollback` wrapper:

```ts
async function archiveTask(id: string): Promise<void> {
  await persistOrRollback(() => {
    const task = tasks.value[id];
    if (!task) throw new Error(`Task ${id} not found`);
    tasks.value[id] = { ...task, archivedAt: new Date().toISOString() };
  });
}

async function unarchiveTask(id: string): Promise<void> {
  await persistOrRollback(() => {
    const task = tasks.value[id];
    if (!task) throw new Error(`Task ${id} not found`);
    const { archivedAt: _, ...rest } = task;
    tasks.value[id] = rest as Task;
  });
}
```

Add a `archivedTasks` computed alongside `activeTasks`:

```ts
const archivedTasks = computed(() =>
  Object.values(tasks.value).filter((task) => !!task.archivedAt)
);
```

Export both functions and `archivedTasks` from the store's `return` object.

**Tests:** [tasks.store.spec.ts](../src/__tests__/tasks.store.spec.ts)

Add two test cases:

- `archiveTask` sets `archivedAt` to an ISO string and the task disappears from `activeTasks`
- `unarchiveTask` removes `archivedAt` and the task reappears in `activeTasks`

---

## Step 2 — Archive action on the task row

**File:** [src/pages/TasksPage.vue](../src/pages/TasksPage.vue)

### Option A (recommended): long-press context menu

Use Quasar's `q-menu` with `touch-position` and `context-menu` to show an action on long-press / right-click. This keeps the row tap for navigation and requires no new dependency.

```html
<!-- inside the task row button -->
<q-menu touch-position context-menu>
  <q-list dense>
    <q-item clickable v-close-popup @click="archive(task.id)">
      <q-item-section>{{ t('tasks.archive') }}</q-item-section>
    </q-item>
  </q-list>
</q-menu>
```

`archive(id)` calls `store.archiveTask(id)`. No confirmation dialog needed — archiving is reversible.

### Option B: `QSlideItem` (Quasar built-in, better mobile UX)

Quasar ships `QSlideItem` — a component specifically for swipe-to-reveal actions (left/right), exactly like iOS Mail. Replace the `<div class="tasks-row">` wrapper with `<q-slide-item>` and put the archive action in its `#right` slot. No external library, no manual touch math.

```html
<q-slide-item
  v-for="task in tasks"
  :key="task.id"
  right-color="warning"
  @right="archive(task.id)"
>
  <template #right>
    <q-icon name="archive" />
  </template>

  <!-- existing row content in default slot -->
</q-slide-item>
```

This is the better mobile interaction and less code than raw touch events. The trade-off: the row markup changes, so CSS may need adjusting. Consider doing Option A first (it's one afternoon) and upgrading to B when polishing mobile UX.

**Recommendation:** Ship Option A now (it's the quickest path and Quasar already provides it). Add Option B as a follow-up.

---

## Step 3 — Toggle to show archived tasks

**File:** [src/pages/TasksPage.vue](../src/pages/TasksPage.vue)

Add a local reactive boolean `showArchived` (default `false`). When `true`, render the archived list below the active list with a visual separator.

```ts
const showArchived = ref(false);
const archivedTasks = computed(() => store.archivedTasks);
```

In the template, replace the hardcoded eyebrow with:

```html
<button class="ghost-btn eyebrow" @click="showArchived = !showArchived">
  archived: {{ archivedTasks.length }}
</button>
```

Below the active task list:

```html
<q-slide-transition>
  <div v-if="showArchived && archivedTasks.length" class="archived-section">
    <div
      v-for="task in archivedTasks"
      :key="task.id"
      class="tasks-row tasks-row--archived"
      @click="goToDetail(task.id)"
    >
      <!-- same body markup as active rows -->
      <q-menu touch-position context-menu>
        <q-list dense>
          <q-item clickable v-close-popup @click="store.unarchiveTask(task.id)">
            <q-item-section>{{ t('tasks.unarchive') }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
  </div>
</q-slide-transition>
```

Hide the eyebrow button entirely when `archivedTasks.length === 0` (existing roadmap note).

---

## Step 4 — CSS for archived rows

**File:** [src/css/app.scss](../src/css/app.scss)

Add after the existing `.tasks-row` block (~line 960):

```scss
.tasks-row--archived {
  opacity: 0.5;

  .body .title {
    text-decoration: line-through;
  }
}
```

---

## Step 5 — i18n strings

**Files:** `src/i18n/en.json`, `src/i18n/de.json`

Add under a `tasks` namespace (or wherever existing task strings live):

```json
"tasks": {
  "archive": "Archive",
  "unarchive": "Unarchive"
}
```

---

## Step 6 — TaskDetailPage unarchive shortcut (optional but natural)

If a user navigates into an archived task, show an "Unarchive" button in the detail page header/actions area. This gives a second entry point and is a one-liner that calls `store.unarchiveTask(taskId)`.

---

## Acceptance criteria

- [ ] Tapping "Archive" on a task removes it from the active list immediately (optimistic UI via `persistOrRollback`)
- [ ] `archived: N` eyebrow reflects the real count; clicking toggles the archived section
- [ ] Archived tasks are visually distinct (strikethrough + opacity)
- [ ] Long-pressing an archived task shows "Unarchive"; it moves back to the active list
- [ ] No data is lost — check-in history is fully preserved for archived tasks
- [ ] Store tests cover both `archiveTask` and `unarchiveTask`
- [ ] Hardcoded `archived: 0` is gone

---

## Files touched

| File | Change |
| --- | --- |
| [src/stores/tasks.store.ts](../src/stores/tasks.store.ts) | Add `archiveTask`, `unarchiveTask`, `archivedTasks` |
| [src/pages/TasksPage.vue](../src/pages/TasksPage.vue) | Context menus, toggle, eyebrow fix |
| [src/css/app.scss](../src/css/app.scss) | `.tasks-row--archived` style |
| [src/i18n/en.json](../src/i18n/en.json) | `tasks.archive` / `tasks.unarchive` |
| [src/i18n/de.json](../src/i18n/de.json) | Same in German |
| [tasks.store.spec.ts](../src/__tests__/tasks.store.spec.ts) | 2 new test cases |
| [src/pages/TaskDetailPage.vue](../src/pages/TaskDetailPage.vue) | Optional: unarchive button |
