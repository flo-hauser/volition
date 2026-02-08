# PLANS.md — Milestone 3 (IndexedDB Mobile Reliability)

## Goal
Make task creation and persistence reliable on mobile browsers opened via local-network dev URLs, where IndexedDB may be unavailable or blocked at runtime.

## Investigation findings
- Runtime persistence currently uses only `indexedDbAdapter` by default in `src/stores/tasks.store.ts`.
- `persistOrRollback` rolls back all CRUD changes if `saveState` fails, so UI creation fails when IndexedDB write fails.
- `indexedDbAdapter` handles `indexedDB === undefined`, but does not provide a runtime fallback path when:
  - `indexedDB.open(...)` throws/rejects (security/policy/context issues),
  - transactions fail after app startup.
- This matches the reported behavior: app renders, LocalStorage is available, but creating tasks fails on mobile.

## Scope

### In
1. Add robust storage adapter fallback chain: IndexedDB primary, LocalStorage fallback.
2. Add runtime degradation behavior if IndexedDB fails after init (switch adapter in-memory and continue).
3. Preserve existing state model (`StorageState`) and schema version handling.
4. Add tests for fallback and failover behavior.

### Out
- No changes to task/check-in domain model.
- No sync or remote persistence.
- No migration beyond existing `schemaVersion`.

## Success criteria
- On environments where IndexedDB cannot open/write, task CRUD still works via LocalStorage.
- Existing behavior remains IndexedDB-first when available.
- Failover happens automatically without breaking the session.
- Store tests cover fallback/failover paths and rollback correctness.

## Data model impact
- No schema changes.
- Same `StorageState` serialized in both adapters.

## File plan
- `src/services/storage/storageAdapter.ts`
- `src/services/storage/indexedDbAdapter.ts`
- `src/services/storage/localStorageAdapter.ts` (new)
- `src/services/storage/resilientStorageAdapter.ts` (new)
- `src/stores/tasks.store.ts`
- `src/__tests__/indexedDbAdapter.spec.ts`
- `src/__tests__/tasks.store.spec.ts`
- `src/__tests__/localStorageAdapter.spec.ts` (new)
- `src/__tests__/resilientStorageAdapter.spec.ts` (new)

## Step-by-step plan
1. Add `localStorageAdapter` implementing `StorageAdapter` with JSON serialization and schema-safe default loading.
2. Add `resilientStorageAdapter` that:
   - tries IndexedDB first for load/save,
   - falls back to LocalStorage on IndexedDB errors,
   - remembers degraded mode for subsequent operations in-session.
3. Wire store default adapter from `indexedDbAdapter` to `resilientStorageAdapter`.
4. Keep rollback behavior in store actions unchanged; ensure fallback prevents avoidable failures.
5. Expand tests:
   - adapter-level tests for fallback on load/save errors,
   - store-level tests verifying create/update/toggle succeed when IndexedDB path fails.
6. Run full test suite and coverage.

## Risks / open questions
- LocalStorage capacity can be lower than IndexedDB; large datasets may still fail eventually.
- If IndexedDB fails intermittently, we should prefer deterministic degraded mode for the session to avoid flapping.
- Need to verify behavior on at least one real mobile browser after implementation.

## Test plan
- Unit:
  - `indexedDbAdapter.spec.ts`: add open/write failure scenarios.
  - `localStorageAdapter.spec.ts`: read/write/default/invalid JSON cases.
  - `resilientStorageAdapter.spec.ts`: failover and degraded mode behavior.
  - `tasks.store.spec.ts`: CRUD/toggle succeed under adapter failover.
- Validation commands:
  - `npm test`
  - `npm run test:coverage`
