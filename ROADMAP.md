# Roadmap

Feature ideas, big and small. No priority order within sections.

---

## Quick wins

**Task archiving UI**
The `archivedAt` field exists on `Task` and the type is ready. Just needs a swipe action or menu option on `TasksPage` to archive/unarchive, and a toggle to show archived tasks.

**Reorder tasks**
Drag-and-drop ordering on `TasksPage`. Store order in `StorageState`. Today and Week views follow the same order.

**Haptic feedback**
On mobile (Capacitor), fire a light haptic tap when checking in a task. One line with `@capacitor/haptics`.

**Week start day preference**
Some users start their week on Sunday. Store preference in `useAppPreferences`, thread through `useDay` and all week calculations.

**Swipe to check in**
On `TodayPage`, swipe right on a task row to toggle it done — faster than tapping the checkbox.

---

## Medium scope

**Reminder notifications**
Daily push notification at a user-chosen time: "You have X tasks left for today." Capacitor Local Notifications plugin, configured in Settings. Opt-in, no server needed.

**Data export**
Export all tasks and check-ins as JSON or CSV from Settings. Lets users back up or migrate their data. Import counterpart optional.

**Notes on check-in**
Optional one-line note when checking in a task. Stored alongside the `Checkin` record. Visible in the task detail history.

**Onboarding flow**
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
