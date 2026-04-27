# Haptic Feedback & Swipe to Check In — Implementation Plan

**Roadmap section:** Quick wins (both)  
**Estimated effort:** ~2 hours combined

Both features touch the same files and the same user gesture — check-in on `TodayPage` — so they are planned and shipped together.

---

## What already exists

| Piece | Location | Notes |
|---|---|---|
| Task row | [src/pages/TodayPage.vue:24](../src/pages/TodayPage.vue#L24) | `.task-row` flex container; `@click` navigates to detail |
| Toggle handler | [src/pages/TodayPage.vue:137](../src/pages/TodayPage.vue#L137) | `toggleTask(id)` — already used by CheckButton |
| CheckButton pulse | [src/components/CheckButton.vue:51](../src/components/CheckButton.vue#L51) | Fires on check, not uncheck — haptic should match this |
| `.task-row.done` style | [src/css/app.scss:319](../src/css/app.scss#L319) | Background/border change, 260 ms transition — swipe completion lands here automatically |
| `@capacitor/haptics` | `src-capacitor/package.json` | **Not installed** |
| Quasar `TouchSwipe` directive | `quasar.config.ts:57` | **Not enabled** — just needs one line to activate |

---

## Feature 1 — Haptic feedback

### Install

```bash
npm install @capacitor/haptics
```

No native sync needed for the web fallback — Capacitor silently no-ops on platforms without haptics support.

### Where to call it

Call from `toggleTask()` in [src/pages/TodayPage.vue](../src/pages/TodayPage.vue), not inside `CheckButton`. The page already knows whether the action is a check-in or an uncheck, and the roadmap specifies "when checking in" (not on uncheck).

```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';

async function toggleTask(taskId: string): Promise<void> {
  const wasChecked = store.isTodayChecked(taskId);  // read BEFORE toggling
  pendingTaskIds.add(taskId);
  try {
    await store.toggleToday(taskId);
    if (!wasChecked) {
      // fire-and-forget — haptics must never block the UI
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  } finally {
    pendingTaskIds.delete(taskId);
  }
}
```

`ImpactStyle.Light` is the right weight — confirms an action without feeling heavy. `Medium` or `Heavy` would be disproportionate for a habitual tap.

The `.catch(() => {})` ensures the web build never throws (Capacitor throws on unsupported platforms instead of silently returning).

---

## Feature 2 — Swipe right to check in

### Why Quasar `v-touch-swipe` and not native touch events

Quasar's `TouchSwipe` directive:
- Is already in the installed Quasar package — zero extra dependency
- Requires a configurable minimum distance before firing (no accidental triggers)
- Does not fire a `click` when a swipe is detected — the navigate-to-detail `@click` stays safe
- Works identically on mouse (with `.mouse` modifier) for desktop testing

The alternative (raw `@touchstart`/`@touchend`) would need ~40 lines to handle the same edge cases.

### Step 1 — Enable the directive in `quasar.config.ts`

```ts
// quasar.config.ts — inside framework: {}
directives: ['TouchSwipe'],
```

That is the only config change needed.

### Step 2 — Add swipe handler to the task row

**File:** [src/pages/TodayPage.vue](../src/pages/TodayPage.vue)

```html
<div
  v-for="task in tasks"
  :key="task.id"
  class="task-row"
  :class="{ done: store.isTodayChecked(task.id), swiping: swipingTaskId === task.id }"
  v-touch-swipe.right.mouse="(details) => onSwipeRight(task.id, details)"
  @click="goToDetail(task.id)"
>
```

Handler in `<script setup>`:

```ts
import type { TouchSwipeValue } from 'quasar';

const swipingTaskId = ref<string | null>(null);

function onSwipeRight(taskId: string, details: TouchSwipeValue): void {
  if (pendingTaskIds.has(taskId)) return;
  // only fire on a confident rightward swipe (Quasar default is 300px/s + 10px)
  if (details.direction !== 'right') return;

  swipingTaskId.value = taskId;
  toggleTask(taskId).finally(() => {
    swipingTaskId.value = null;
  });
}
```

`swipingTaskId` drives a brief CSS class that gives tactile feedback during the gesture (see Step 3). It is cleared once the async toggle settles.

`toggleTask` already calls the haptics — swipe and tap share the exact same code path, so haptic fires on swipe too for free.

### Step 3 — CSS for swipe feedback

**File:** [src/css/app.scss](../src/css/app.scss)

Add after the existing `.task-row.done` block:

```scss
.task-row.swiping {
  transform: translateX(6px);
  transition: transform 120ms var(--ease-out);
}
```

This is a small nudge that confirms the swipe registered before the done-state animation takes over. It resets immediately when `swipingTaskId` clears.

The existing `.task-row` already has `transition: all 260ms var(--ease)`, so the background/border change to the done state animates automatically — no extra CSS needed for that part.

### What about swiping left (uncheck)?

The roadmap says "swipe right to toggle it done". For simplicity, the swipe right always calls `toggleTask` (which toggles, not just checks). So swiping right on an already-done task will uncheck it. This is consistent with what the CheckButton already does and avoids the complexity of directional semantics.

---

## Interaction summary after both features

| Action | Result |
|---|---|
| Tap task body | Navigate to detail (unchanged) |
| Tap CheckButton | Toggle done/undone + haptic on check-in + pulse animation |
| Swipe right on row | Toggle done/undone + haptic on check-in + row nudge animation |

All three paths share `toggleTask()` — haptics and state change are never duplicated.

---

## Acceptance criteria

- [ ] Checking in a task (tap or swipe) fires a light haptic on native Android/iOS
- [ ] No haptic fires on uncheck
- [ ] No error is thrown in the browser (web) build when haptics are unavailable
- [ ] Swiping right on a task row toggles its done state
- [ ] Tapping the task body after a swipe still navigates to the detail page (no interference)
- [ ] Row nudge animation is visible on swipe; done-state background animates in
- [ ] Pending state is respected — no double-toggle if the user swipes during a pending async call

---

## Files touched

| File | Change |
|---|---|
| `src-capacitor/package.json` + root `package.json` | Add `@capacitor/haptics` |
| `quasar.config.ts` | Add `TouchSwipe` to `directives` |
| [src/pages/TodayPage.vue](../src/pages/TodayPage.vue) | Haptics call in `toggleTask`, swipe handler, `v-touch-swipe` on row, `swipingTaskId` ref |
| [src/css/app.scss](../src/css/app.scss) | `.task-row.swiping` nudge style |
