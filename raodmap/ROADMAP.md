# Roadmap

Feature ideas, big and small. No priority order within sections.

Legend: **[plan]** = implementation plan written, ready to build

---

## Suggested build order

**1. Reorder** ✅ — bumps `SCHEMA_VERSION` 1→2 and introduces `taskOrder: string[]` into `StorageState`. Do this first so everything downstream builds on the stable schema.

**2. Archiving** — no schema change, but `archiveTask` / `unarchiveTask` need to also remove/re-append IDs in `taskOrder`. Must be written with reorder already in place, otherwise the store methods need patching afterwards.

**3. Data export** — serialises the full `StorageState`. Should land after the schema is finalised so the export format doesn't need a revision. The existing plan needs a small update to include `taskOrder` in the envelope.

**4–6. Haptics + swipe, Week start preference, Onboarding** — fully independent of storage and of each other. Ship in any order.

---

## Quick wins

**Task archiving UI** **[plan](task-archiving.md)**  
The `archivedAt` field exists on `Task` and the type is ready. Just needs a swipe action or menu option on `TasksPage` to archive/unarchive, and a toggle to show archived tasks.

**Reorder tasks** ✅ ~~**[plan](task-reorder.md)**~~  
Drag-and-drop ordering on `TasksPage`. Store order in `StorageState`. Today and Week views follow the same order.

**Haptic feedback** ✅ ~~**[plan](haptic-and-swipe.md)**~~  
On mobile (Capacitor), fire a light haptic tap when checking in a task. One line with `@capacitor/haptics`.

**Week start day preference** **[plan](week-start-preference.md)**  
Some users start their week on Sunday. Store preference in `useAppPreferences`, thread through `useDay` and all week calculations.

**Swipe to check in** ✅ ~~**[plan](haptic-and-swipe.md)**~~  
On `TodayPage`, swipe right on a task row to toggle it done — faster than tapping the checkbox.

---

## Medium scope

**Reminder notifications**  
Daily push notification at a user-chosen time: "You have X tasks left for today." Capacitor Local Notifications plugin, configured in Settings. Opt-in, no server needed.

**Data export** **[plan](data-export-import.md)**  
Export all tasks and check-ins as JSON or CSV from Settings. Lets users back up or migrate their data. Import counterpart optional.

**Notes on check-in**  
Optional one-line note when checking in a task. Stored alongside the `Checkin` record. Visible in the task detail history.

**Onboarding flow** **[plan](onboarding-flow.md)**  
A three-screen intro shown only on first launch: what Volition is, how frequency targets work, and how to create a first task. Skippable.

**Task detail history**  
Extend `TaskDetailPage` with a scrollable list of past check-ins by week, not just the 12-week rate heatmap.

---

## Bigger bets

**Statistics page**  
Dedicated page (or tab within task detail) showing completion rate over time, best streak, average days per week, and a bar chart per month. All computed client-side from existing data.

**Widget (Android / iOS)**  
A home-screen widget showing today's check-in count vs. total active tasks, powered by Capacitor community widget plugins. Tapping it opens the app to `TodayPage`.

**iCloud / Google Drive sync**  
Optional sync of the `StorageState` JSON blob to a user's own cloud storage. No backend, no account. Resolves conflicts by last-write-wins (acceptable for a habit tracker).

**Multiple profiles**  
Switch between named profiles (e.g. Work / Personal). Each has its own isolated `StorageState`. Useful for shared devices.

**Streak freeze / grace day**  
Let users protect a streak on one missed day per week. Declared explicitly in the UI, not automatic. Respects the "show up, don't cheat" philosophy.

---

## Polish & debt

- Remove hardcoded `archived: 0` eyebrow in `TasksPage` — wire to real archived count once archiving UI exists
- Clean up the three unknown npm config keys (`shamefully-hoist`, `strict-peer-dependencies`, `resolution-mode`) in `package.json`
- Consider replacing `ghost-btn` / `icon-btn` with a single shared component to reduce CSS duplication
- Add `lang="de"` / `lang="en"` to the `<html>` element based on active locale (accessibility + SEO)
