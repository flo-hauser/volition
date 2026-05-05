# Data Export / Import — Implementation Plan

**Roadmap section:** Medium scope  
**Estimated effort:** ~3–4 hours

---

## Goal

Let users download their full dataset as a JSON file and restore it from a previously exported file. Everything runs client-side — no server, no account. Entry point is Settings.

---

## What already exists

| Piece                   | Location                                                           | Notes                                                          |
| ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `StorageState` shape    | [src/types/storage.ts](../src/types/storage.ts)                    | `{ meta, tasks, checkinsByDay }`                               |
| `createStateSnapshot()` | [src/stores/tasks.store.ts:111](../src/stores/tasks.store.ts#L111) | Already serializes full state — reuse directly                 |
| `persistOrRollback`     | [src/stores/tasks.store.ts:121](../src/stores/tasks.store.ts#L121) | Safe mutation with rollback on error                           |
| `SCHEMA_VERSION = 1`    | [src/types/storage.ts:3](../src/types/storage.ts#L3)               | Must be checked on import                                      |
| Settings page           | [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue)        | Add new section here                                           |
| Debug "Data" section    | [src/pages/SettingsPage.vue:87](../src/pages/SettingsPage.vue#L87) | Shows raw data — keep separate from user-facing backup section |

No Capacitor Filesystem plugin is installed. The browser File API is sufficient and already works in both web and Capacitor WebView.

---

## Step 1 — Export helper

**New file:** `src/services/dataTransfer.ts`

```ts
import type { StorageState } from '@/types/storage';
import { SCHEMA_VERSION } from '@/types/storage';
import type { Task } from '@/types/task';
import type { Checkin } from '@/types/task';

export interface ExportEnvelope {
  exportedAt: string; // ISO timestamp
  schemaVersion: number;
  tasks: Record<string, Task>;
  checkinsByDay: Record<string, Record<string, Checkin>>;
}

export function exportToJSON(state: StorageState): string {
  const envelope: ExportEnvelope = {
    exportedAt: new Date().toISOString(),
    schemaVersion: state.meta.schemaVersion,
    tasks: state.tasks,
    checkinsByDay: state.checkinsByDay,
  };
  return JSON.stringify(envelope, null, 2);
}

export function triggerDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Step 2 — Import validation

Add to `src/services/dataTransfer.ts`:

```ts
export interface ImportResult {
  ok: boolean;
  state?: StorageState;
  error?: string;
}

export function parseImport(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'invalid_shape' };
  }

  const p = parsed as Record<string, unknown>;

  if (p.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: 'schema_mismatch' };
  }

  if (typeof p.tasks !== 'object' || p.tasks === null) {
    return { ok: false, error: 'missing_tasks' };
  }

  if (typeof p.checkinsByDay !== 'object' || p.checkinsByDay === null) {
    return { ok: false, error: 'missing_checkins' };
  }

  const state: StorageState = {
    meta: { schemaVersion: SCHEMA_VERSION },
    tasks: p.tasks as StorageState['tasks'],
    checkinsByDay: p.checkinsByDay as StorageState['checkinsByDay'],
  };

  return { ok: true, state };
}
```

Validation is intentionally loose (shape only, not deep field-by-field) — enough to catch obviously wrong files without brittleness.

---

## Step 3 — Store methods

**File:** [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)

Add two methods:

```ts
function exportState(): string {
  return exportToJSON(createStateSnapshot());
}

async function importState(incoming: StorageState): Promise<void> {
  await persistOrRollback(() => {
    tasks.value = cloneState(incoming.tasks);
    checkinsByDay.value = cloneState(incoming.checkinsByDay);
  });
}
```

Export both from the store's `return` object.

`importState` fully replaces the local dataset. This is intentional: the export file is a complete backup, not a diff.

---

## Step 4 — Settings UI

**File:** [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue)

Add a "Backup" section above (or below) the existing debug section. Keep it clearly user-facing, not debug-looking.

```html
<section class="settings-section">
  <h2 class="settings-section__title">{{ t('settings.backup.title') }}</h2>

  <!-- Export -->
  <div class="settings-row">
    <div class="settings-row__body">
      <span class="settings-row__label">{{ t('settings.backup.exportLabel') }}</span>
      <span class="settings-row__hint">{{ t('settings.backup.exportHint') }}</span>
    </div>
    <button class="ghost-btn" @click="handleExport">{{ t('settings.backup.exportBtn') }}</button>
  </div>

  <!-- Import -->
  <div class="settings-row">
    <div class="settings-row__body">
      <span class="settings-row__label">{{ t('settings.backup.importLabel') }}</span>
      <span class="settings-row__hint">{{ t('settings.backup.importHint') }}</span>
    </div>
    <label class="ghost-btn">
      {{ t('settings.backup.importBtn') }}
      <input type="file" accept=".json,application/json" hidden @change="handleImport" />
    </label>
  </div>
</section>
```

Script logic:

```ts
import { triggerDownload, parseImport } from '@/services/dataTransfer';

function handleExport(): void {
  const json = store.exportState();
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(json, `volition-backup-${date}.json`);
}

async function handleImport(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const raw = await file.text();
  const result = parseImport(raw);

  if (!result.ok || !result.state) {
    // show error dialog (see Step 5)
    importError.value = result.error ?? 'unknown';
    return;
  }

  // show confirmation dialog before overwriting (see Step 5)
  pendingImport.value = result.state;
  confirmDialogOpen.value = true;

  // reset the input so the same file can be re-selected
  (event.target as HTMLInputElement).value = '';
}
```

---

## Step 5 — Confirmation dialog before import

Importing overwrites all local data. Gate it behind a `q-dialog` confirm — same pattern as the delete confirmation in [src/pages/TaskDetailPage.vue:87](../src/pages/TaskDetailPage.vue#L87).

```html
<q-dialog v-model="confirmDialogOpen">
  <div class="dialog-card">
    <p>{{ t('settings.backup.importConfirm') }}</p>
    <div class="dialog-actions">
      <button class="ghost-btn" @click="confirmDialogOpen = false">{{ t('common.cancel') }}</button>
      <button class="primary-btn" :disabled="importing" @click="confirmImport">
        {{ t('common.confirm') }}
      </button>
    </div>
  </div>
</q-dialog>
```

```ts
async function confirmImport(): Promise<void> {
  if (!pendingImport.value) return;
  importing.value = true;
  try {
    await store.importState(pendingImport.value);
    confirmDialogOpen.value = false;
    // optional: show a brief success toast/banner
  } finally {
    importing.value = false;
    pendingImport.value = null;
  }
}
```

---

## Step 6 — i18n strings

**Files:** `src/i18n/en-US/index.ts`, `src/i18n/de-DE/index.ts`

Under `pages.settings` (or `settings` if the namespace is flat — match existing key structure):

```ts
// en-US
backup: {
  title: 'Backup',
  exportLabel: 'Export data',
  exportHint: 'Download all tasks and check-ins as JSON.',
  exportBtn: 'Export',
  importLabel: 'Import data',
  importHint: 'Restore from a previously exported file. This replaces all current data.',
  importBtn: 'Choose file',
  importConfirm: 'This will replace all your current tasks and check-ins. Continue?',
  importErrorJson: 'The file could not be read.',
  importErrorSchema: 'This file was exported from an incompatible version.',
  importErrorShape: 'The file does not look like a Volition backup.',
},
```

```ts
// de-DE
backup: {
  title: 'Datensicherung',
  exportLabel: 'Daten exportieren',
  exportHint: 'Alle Aufgaben und Check-ins als JSON herunterladen.',
  exportBtn: 'Exportieren',
  importLabel: 'Daten importieren',
  importHint: 'Aus einer zuvor exportierten Datei wiederherstellen. Ersetzt alle aktuellen Daten.',
  importBtn: 'Datei auswählen',
  importConfirm: 'Das ersetzt alle deine aktuellen Aufgaben und Check-ins. Fortfahren?',
  importErrorJson: 'Die Datei konnte nicht gelesen werden.',
  importErrorSchema: 'Diese Datei stammt aus einer inkompatiblen Version.',
  importErrorShape: 'Die Datei sieht nicht wie ein Volition-Backup aus.',
},
```

---

## Step 7 — Tests

**File:** `src/__tests__/dataTransfer.spec.ts` (new)

Cases to cover:

- `exportToJSON` produces valid JSON with correct `schemaVersion`, all tasks, all check-ins
- `parseImport` on a valid export returns `ok: true` with reconstructed `StorageState`
- `parseImport` on malformed JSON returns `ok: false, error: 'invalid_json'`
- `parseImport` with wrong `schemaVersion` returns `ok: false, error: 'schema_mismatch'`
- `parseImport` missing `tasks` key returns `ok: false, error: 'missing_tasks'`

Round-trip test: `parseImport(exportToJSON(state)).state` deep-equals the original state.

---

## Acceptance criteria

- [ ] Export button downloads a `.json` file named `volition-backup-YYYY-MM-DD.json`
- [ ] File contains all tasks (including archived), all check-ins, `schemaVersion`, and `exportedAt`
- [ ] Importing a valid export file prompts a confirmation dialog before replacing data
- [ ] After confirming, all tasks and check-ins from the file are live in the app
- [ ] Importing a non-JSON file shows a localized error (no crash)
- [ ] Importing a file with the wrong schema version shows a localized error
- [ ] Works in the browser; works in the Capacitor WebView without extra plugins

---

## Files touched

| File                                                        | Change                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `src/services/dataTransfer.ts`                              | New — `exportToJSON`, `triggerDownload`, `parseImport` |
| [src/stores/tasks.store.ts](../src/stores/tasks.store.ts)   | Add `exportState`, `importState`                       |
| [src/pages/SettingsPage.vue](../src/pages/SettingsPage.vue) | New "Backup" section, dialogs, handlers                |
| `src/i18n/en-US/index.ts`                                   | `backup.*` strings                                     |
| `src/i18n/de-DE/index.ts`                                   | `backup.*` strings (German)                            |
| `src/__tests__/dataTransfer.spec.ts`                        | New — unit tests incl. round-trip                      |
