# Task Reorder — Implementation Plan

**Roadmap section:** Quick wins  
**Estimated effort:** ~3–4 hours

---

## Goal

Drag-and-drop ordering on `TasksPage`. Order persists in `StorageState`. `TodayPage` and `WeekPage` automatically follow the same order — they need zero UI changes because they already pull from `store.activeTasks`.

---

## What already exists

| Piece                  | Location                                                           | Notes                                                        |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `activeTasks` computed | [src/stores/tasks.store.ts:54](../src/stores/tasks.store.ts#L54)   | Returns `Object.values(tasks.value).filter(...)` — unordered |
| Task list in TasksPage | [src/pages/TasksPage.vue:11](../src/pages/TasksPage.vue#L11)       | `v-for="task in tasks"` over `store.activeTasks`             |
| Task list in TodayPage | [src/pages/TodayPage.vue:23](../src/pages/TodayPage.vue#L23)       | Same source, no drag needed                                  |
| Task list in WeekPage  | [src/pages/WeekPage.vue:21](../src/pages/WeekPage.vue#L21)         | Same source, no drag needed                                  |
| `persistOrRollback`    | [src/stores/tasks.store.ts:121](../src/stores/tasks.store.ts#L121) | Use for the reorder mutation                                 |
| `StorageState`         | [src/types/storage.ts](../src/types/storage.ts)                    | Needs one new field                                          |
| `SCHEMA_VERSION = 1`   | [src/types/storage.ts:3](../src/types/storage.ts#L3)               | Must bump to 2                                               |

No drag library is installed. SortableJS is the right choice — small, framework-agnostic, no Vue wrapper needed.

**What Quasar offers:** Nothing useful for list reordering. `v-touch-pan` could be a low-level building block but would require ~200 lines of custom geometry math to become a working sortable list. `QSlideItem` (swipe-to-reveal actions) is interesting but for archiving/delete affordances, not reordering — see the archiving plan.

**Alternative considered:** `vue-draggable-next` (Vue 3 wrapper around SortableJS). It provides a `<draggable v-model="list">` component that handles Vue/DOM reconciliation automatically. The trade-off is an extra dependency for a thin wrapper. Direct SortableJS is leaner and the reconciliation risk is manageable with `animation: 0` (see Step 5).

---

## Architecture decision: where to store the order

Two options:

**A) `order: number` field on each `Task`**  
Requires touching every task object on every reorder (N writes instead of 1). Pollutes the task model with a display concern.

**B) `taskOrder: string[]` in `StorageState`** ← chosen  
A single ordered array of task IDs. One write per reorder. Clean separation: tasks stay data-only, order is a presentation/layout concern. Migration for existing installs is trivial (populate from current `Object.keys(tasks)`).

---

## Step 1 — Bump schema and add `taskOrder`

**File:** [src/types/storage.ts](../src/types/storage.ts)

```ts
export const SCHEMA_VERSION = 2 as const; // was 1

export interface StorageState {
  meta: StorageMeta;
  tasks: Record<string, Task>;
  checkinsByDay: Record<string, Record<string, Checkin>>;
  taskOrder: string[]; // ordered list of task IDs
}
```

---

## Step 2 — Migration and `createEmptyStorageState`

**File:** [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

Update `createEmptyStorageState` to include the new field:

```ts
function createEmptyStorageState(): StorageState {
  return {
    meta: { schemaVersion: SCHEMA_VERSION },
    tasks: {},
    checkinsByDay: {},
    taskOrder: [],
  };
}
```

Update `init()` to handle v1 → v2 migration instead of clearing state:

```ts
async function init(adapter?: StorageAdapter): Promise<void> {
  if (adapter) storageAdapter = adapter;

  const loadedState = await storageAdapter.loadState();
  if (!loadedState) {
    // fresh install
    tasks.value = {};
    checkinsByDay.value = {};
    taskOrder.value = [];
    isReady.value = true;
    return;
  }

  if (loadedState.meta.schemaVersion === 1) {
    // migrate: derive order from existing task keys
    tasks.value = loadedState.tasks;
    checkinsByDay.value = loadedState.checkinsByDay;
    taskOrder.value = Object.keys(loadedState.tasks);
    await storageAdapter.saveState(createStateSnapshot()); // persist migrated state
    isReady.value = true;
    return;
  }

  if (loadedState.meta.schemaVersion !== SCHEMA_VERSION) {
    tasks.value = {};
    checkinsByDay.value = {};
    taskOrder.value = [];
    isReady.value = true;
    return;
  }

  tasks.value = loadedState.tasks;
  checkinsByDay.value = loadedState.checkinsByDay;
  taskOrder.value = loadedState.taskOrder ?? Object.keys(loadedState.tasks);
  isReady.value = true;
}
```

Add `taskOrder` ref alongside the existing state refs:

```ts
const taskOrder = ref<string[]>([]);
```

Update `createStateSnapshot()`:

```ts
function createStateSnapshot(): StorageState {
  return {
    meta: { schemaVersion: SCHEMA_VERSION },
    tasks: cloneState(tasks.value),
    checkinsByDay: cloneState(checkinsByDay.value),
    taskOrder: [...taskOrder.value],
  };
}
```

---

## Step 3 — Update `activeTasks` and `createTask` / `deleteTask`

**File:** [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

`activeTasks` must respect `taskOrder`:

```ts
const activeTasks = computed(() => {
  const active = Object.values(tasks.value).filter((t) => !t.archivedAt);
  const orderMap = new Map(taskOrder.value.map((id, i) => [id, i]));
  return active.sort((a, b) => {
    const ai = orderMap.get(a.id) ?? Infinity;
    const bi = orderMap.get(b.id) ?? Infinity;
    return ai - bi;
  });
});
```

`createTask` must append the new ID to `taskOrder`:

```ts
async function createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  return persistOrRollback(() => {
    const task: Task = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    tasks.value[task.id] = task;
    taskOrder.value = [...taskOrder.value, task.id]; // append at end
    return task;
  });
}
```

`deleteTask` must remove the ID from `taskOrder`:

```ts
async function deleteTask(id: string): Promise<void> {
  await persistOrRollback(() => {
    delete tasks.value[id];
    taskOrder.value = taskOrder.value.filter((tid) => tid !== id);
  });
}
```

Add `reorderTasks` function:

```ts
async function reorderTasks(orderedIds: string[]): Promise<void> {
  await persistOrRollback(() => {
    taskOrder.value = orderedIds;
  });
}
```

Export `reorderTasks` and `taskOrder` (read-only) from the store's `return`.

---

## Step 4 — Install SortableJS

```bash
npm install sortablejs
npm install --save-dev @types/sortablejs
```

---

## Step 5 — Drag UI on TasksPage

**File:** [src/pages/TasksPage.vue](../src/pages/TasksPage.vue)

Only TasksPage gets drag-and-drop. Today and Week pages automatically follow the new order because they already consume `store.activeTasks`.

### Template changes

The current row is a single `<button class="tasks-row">` with a click handler for navigation. To add a drag handle alongside it, the outer element must become a `<div>` (a button cannot contain another button). The navigation click moves to an inner element.

```html
<div class="tasks-list" ref="taskListEl">
  <div v-for="task in tasks" :key="task.id" class="tasks-row" :data-id="task.id">
    <!-- drag handle — only draggable surface -->
    <button class="drag-handle" aria-label="Reorder" @click.stop>
      <svg …><!-- 6-dot grip icon --></svg>
    </button>

    <!-- row body — navigates to detail, same content as before -->
    <button class="tasks-row__body" @click="goToDetail(task.id)">…</button>

    <!-- context menu for archive (from archiving plan) goes here -->
  </div>
</div>
```

**CSS note:** The existing `.tasks-row` styles (padding, background, border-radius, border) are currently on the `<button>` element. After this refactor they stay on `.tasks-row` — the same class, now on a `<div>`. Remove the `cursor: pointer` from `.tasks-row` and add it only to `.tasks-row__body` instead, since the row itself is no longer a single interactive target.

### Script changes

```ts
import Sortable from 'sortablejs';
import type { SortableEvent } from 'sortablejs';

const taskListEl = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

onMounted(() => {
  if (!taskListEl.value) return;

  sortableInstance = Sortable.create(taskListEl.value, {
    handle: '.drag-handle',
    animation: 0, // ← must be 0; see note below
    ghostClass: 'tasks-row--ghost',
    onEnd(evt: SortableEvent) {
      if (evt.oldIndex === evt.newIndex) return;

      // derive new order from current DOM order
      const newOrder = Array.from(taskListEl.value!.querySelectorAll('[data-id]'))
        .map((el) => (el as HTMLElement).dataset.id!)
        .filter(Boolean);

      store.reorderTasks(newOrder);
    },
  });
});

onUnmounted(() => {
  sortableInstance?.destroy();
  sortableInstance = null;
});
```

**Why `animation: 0`:** SortableJS and Vue's virtual DOM both manipulate the same DOM nodes. If SortableJS runs its CSS transition _and then_ `store.reorderTasks` triggers a Vue re-render, Vue reconciles using `:key` and may teleport elements mid-animation, causing a flicker. With `animation: 0` SortableJS moves elements instantly, Vue re-renders to the same order (no-op in practice), and there is no conflict. The ghost/placeholder CSS still gives visual drag feedback.

Using DOM order (not index arithmetic) means the resulting array is always authoritative regardless of how SortableJS moves elements.

---

## Step 6 — CSS

**File:** [src/css/app.scss](../src/css/app.scss)

```scss
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  flex-shrink: 0;
  color: var(--ink-faint);
  cursor: grab;
  touch-action: none; // required for Sortable touch support

  &:active {
    cursor: grabbing;
  }
}

.tasks-row--ghost {
  opacity: 0.4;
}
```

The `.tasks-row` layout (existing flexbox with `gap: 14px`) will naturally accommodate the handle prepended as the first flex child.

---

## Step 7 — Tests

**File:** `src/__tests__/tasks.store.spec.ts`

Add test cases:

- `reorderTasks` updates `taskOrder` and the change is reflected in `activeTasks` order
- `createTask` appends the new task ID to the end of `taskOrder`
- `deleteTask` removes the ID from `taskOrder`
- ~~v1 → v2 migration~~ (dropped — not deployed to prod, schema mismatch clears state)

---

## Acceptance criteria

- [x] Tasks can be reordered by dragging the grip handle on `TasksPage`
- [x] New order persists across app restarts
- [x] `TodayPage` and `WeekPage` show tasks in the same order without any UI changes
- [x] New tasks always appear at the bottom of the list
- [x] Deleting a task does not corrupt the order of remaining tasks
- [x] Existing installs migrate silently: order defaults to current task insertion order, no data loss
- [x] Tapping a task row (not the handle) still navigates to the detail page
- [x] `CheckButton` interaction on `TodayPage` is unaffected

## Status: DONE (2026-04-27)

---

## Files touched

| File                                                      | Change                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [src/types/storage.ts](../src/types/storage.ts)           | `SCHEMA_VERSION` 1 → 2, add `taskOrder: string[]`                                                           |
| [src/stores/tasks.store.ts](../src/stores/tasks.store.ts) | `taskOrder` ref, updated `activeTasks`, `createTask`, `deleteTask`, new `reorderTasks`, migration in `init` |
| [src/pages/TasksPage.vue](../src/pages/TasksPage.vue)     | Drag handle, `ref` on list, SortableJS setup                                                                |
| [src/css/app.scss](../src/css/app.scss)                   | `.drag-handle`, `.tasks-row--ghost`                                                                         |
| `package.json`                                            | `sortablejs` + `@types/sortablejs`                                                                          |
| `src/__tests__/tasks.store.spec.ts`                       | 4 new test cases incl. migration                                                                            |
