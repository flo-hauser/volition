# Onboarding Flow — Implementation Plan

**Roadmap section:** Medium scope  
**Estimated effort:** ~3–4 hours

---

## Goal

A three-screen intro shown only on first launch: what Volition is, how frequency targets work, and how to create a first task. Skippable. After completion (or skip) the flag is set and the flow never shows again.

---

## What already exists

| Piece               | Location                                                                        | Notes                                                     |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Router              | [src/router/index.ts](../src/router/index.ts)                                   | No guards yet — add `beforeEach` here                     |
| Routes              | [src/router/routes.ts](../src/router/routes.ts)                                 | All main routes are children of `MainLayout`              |
| `useAppPreferences` | [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts) | localStorage pattern — add flag here                      |
| `MainLayout`        | `src/layouts/MainLayout.vue`                                                    | Has header + bottom nav — must be bypassed for onboarding |
| i18n                | `src/i18n/en-US/index.ts`, `src/i18n/de-DE/index.ts`                            | Add `onboarding.*` namespace                              |

---

## Architecture decision: route vs overlay dialog

**Route** (`/onboarding`) is the right approach:

- Onboarding is a first-class app state, not a modal layered on top of content
- Doesn't need `MainLayout` — no nav tabs or header chrome to suppress
- Easy to test by navigating directly; easy to reset during development
- The router guard (`beforeEach`) is the natural place to enforce "must see onboarding first"

A persistent `q-dialog` would work but is semantically wrong for something that replaces the entire app on first boot.

---

## Step 1 — Onboarding completion flag in preferences

**File:** [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts)

Follow the exact localStorage pattern used for theme and locale:

```ts
const ONBOARDING_KEY = 'volition.onboardingDone';

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}
```

No reactive ref needed — this is read once at boot, not watched.

---

## Step 2 — Add the onboarding route

**File:** [src/router/routes.ts](../src/router/routes.ts)

Add a top-level route (not a child of `MainLayout`) so no nav chrome appears:

```ts
{
  path: '/onboarding',
  name: 'onboarding',
  component: () => import('pages/OnboardingPage.vue'),
  // no layout wrapper — full-screen blank canvas
},
```

Place it before the `MainLayout` children block so it is matched first.

---

## Step 3 — Navigation guard

**File:** [src/router/index.ts](../src/router/index.ts)

```ts
import { hasCompletedOnboarding } from 'src/composables/useAppPreferences';

router.beforeEach((to) => {
  if (to.name === 'onboarding') return true; // already going there
  if (hasCompletedOnboarding()) return true; // normal user
  return { name: 'onboarding' }; // first launch → redirect
});
```

Three lines. The guard runs before every navigation. Once the flag is set it becomes a permanent no-op.

---

## Step 4 — `OnboardingPage.vue`

**New file:** `src/pages/OnboardingPage.vue`

A single page that manages step state internally. No child routes — step URLs add complexity with no user value.

### Structure

```html
<template>
  <div class="onboarding">
    <!-- step indicator dots -->
    <div class="onboarding__dots">
      <span v-for="n in 3" :key="n" class="dot" :class="{ active: step === n }" />
    </div>

    <!-- screen content — swap with transition -->
    <transition name="slide" mode="out-in">
      <div :key="step" class="onboarding__screen">
        <div class="onboarding__illustration">
          <!-- per-step SVG or icon -->
        </div>
        <h1 class="onboarding__title">{{ screen.title }}</h1>
        <p class="onboarding__body">{{ screen.body }}</p>
      </div>
    </transition>

    <!-- actions -->
    <div class="onboarding__actions">
      <button class="ghost-btn" @click="finish">
        {{ step < 3 ? t('onboarding.skip') : t('onboarding.getStarted') }}
      </button>
      <button v-if="step < 3" class="primary-btn" @click="next">{{ t('onboarding.next') }}</button>
    </div>
  </div>
</template>
```

### Script

```ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setOnboardingCompleted } from 'src/composables/useAppPreferences';

const { t } = useI18n();
const router = useRouter();
const step = ref(1);

const screens = computed(() => [
  { title: t('onboarding.s1.title'), body: t('onboarding.s1.body') },
  { title: t('onboarding.s2.title'), body: t('onboarding.s2.body') },
  { title: t('onboarding.s3.title'), body: t('onboarding.s3.body') },
]);

const screen = computed(() => screens.value[step.value - 1]);

function next(): void {
  if (step.value < 3) step.value++;
}

function finish(): void {
  setOnboardingCompleted();
  router.replace({ name: 'today' });
}
```

`router.replace` (not `push`) so the onboarding screen isn't in the back-stack — the user can't swipe back into it.

### "Get started" lands on task creation

After `finish()`, optionally pass a query param that `TodayPage` or `TasksPage` reads to auto-open the task creation sheet:

```ts
router.replace({ name: 'tasks', query: { new: '1' } });
```

This route already exists (`/tasks/new` redirects to `/tasks?new=1`). The user immediately sees the task creation sheet, making the "how to create a first task" screen actionable.

---

## Step 5 — Screen content

**Screen 1 — What Volition is**

> Volition tracks how often you show up for the things that matter.  
> No streaks to lose, no pressure — just a clear picture of your habits over time.

**Screen 2 — Frequency targets**

> Each task has a target: how many times per week you want to do it.  
> Check in when you do. Volition shows you your pattern — nothing more.

**Screen 3 — Your first task**

> Add something you want to do regularly — exercise, reading, journaling.  
> Set a realistic weekly target and start tracking.

---

## Step 6 — i18n strings

**Files:** `src/i18n/en-US/index.ts`, `src/i18n/de-DE/index.ts`

```ts
// en-US
onboarding: {
  skip: 'Skip',
  next: 'Next',
  getStarted: 'Get started',
  s1: {
    title: 'Show up for what matters',
    body: 'Volition tracks how often you do the things that matter to you. No streaks to lose — just an honest picture of your habits.',
  },
  s2: {
    title: 'Set a weekly target',
    body: 'Each task has a target: how many times per week you want to do it. Check in when you do, skip when you don\'t.',
  },
  s3: {
    title: 'Add your first task',
    body: 'Start with one thing — exercise, reading, journaling. Set a realistic target and see your pattern build over time.',
  },
},
```

```ts
// de-DE
onboarding: {
  skip: 'Überspringen',
  next: 'Weiter',
  getStarted: 'Los geht\'s',
  s1: {
    title: 'Zeig dich für das, was zählt',
    body: 'Volition zeigt dir, wie oft du die Dinge tust, die dir wichtig sind. Keine Streaks, die du verlieren kannst — nur ein ehrliches Bild deiner Gewohnheiten.',
  },
  s2: {
    title: 'Wochenziel festlegen',
    body: 'Jede Aufgabe hat ein Ziel: wie oft du sie pro Woche erledigen möchtest. Check ein, wenn du es tust — kein Stress, wenn nicht.',
  },
  s3: {
    title: 'Erste Aufgabe hinzufügen',
    body: 'Fang mit einer Sache an — Sport, Lesen, Journaling. Setze ein realistisches Ziel und beobachte, wie sich dein Muster aufbaut.',
  },
},
```

---

## Step 7 — CSS

**File:** [src/css/app.scss](../src/css/app.scss)

```scss
.onboarding {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 100dvh;
  padding: 48px 24px 40px;
  background: var(--bg);
}

.onboarding__dots {
  display: flex;
  gap: 6px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--hairline);
    transition: background 240ms var(--ease);

    &.active {
      background: var(--accent);
    }
  }
}

.onboarding__screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  max-width: 320px;
}

.onboarding__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
}

.onboarding__body {
  color: var(--ink-muted);
  line-height: 1.6;
}

.onboarding__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

// slide transition between steps
.slide-enter-active,
.slide-leave-active {
  transition: all 240ms var(--ease);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
```

---

## Dev reset shortcut

Add a hidden gesture or a Settings debug button to clear the flag during development:

```ts
// Settings debug section (already exists)
function resetOnboarding(): void {
  localStorage.removeItem('volition.onboardingDone');
  router.push({ name: 'onboarding' });
}
```

---

## Acceptance criteria

- [ ] First launch (no `volition.onboardingDone` in localStorage) redirects to `/onboarding` before any other page loads
- [ ] Three screens with title + body; step dots update with each step
- [ ] "Next" advances to the next screen; "Skip" on any screen completes and redirects
- [ ] "Get started" on screen 3 completes and lands on task creation
- [ ] `router.replace` ensures back navigation cannot return to onboarding
- [ ] Flag is set before navigation — no loop on redirect
- [ ] Returning users (flag already set) see zero behaviour change
- [ ] Both locales (en-US, de-DE) display correctly

---

## Files touched

| File                                                                            | Change                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------- |
| [src/composables/useAppPreferences.ts](../src/composables/useAppPreferences.ts) | `hasCompletedOnboarding`, `setOnboardingCompleted` |
| [src/router/routes.ts](../src/router/routes.ts)                                 | Add `/onboarding` route outside `MainLayout`       |
| [src/router/index.ts](../src/router/index.ts)                                   | `beforeEach` guard                                 |
| `src/pages/OnboardingPage.vue`                                                  | New — three-step onboarding component              |
| [src/css/app.scss](../src/css/app.scss)                                         | `.onboarding*` styles, slide transition            |
| `src/i18n/en-US/index.ts`                                                       | `onboarding.*` strings                             |
| `src/i18n/de-DE/index.ts`                                                       | Same in German                                     |
