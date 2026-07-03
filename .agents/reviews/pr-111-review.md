# Code Review: PR #111

**Scope**: PR #111 — feat: wine query winery filter and dual-location matching
**Recommendation**: APPROVE

## Summary

This PR adds winery filtering and dual-location matching to the wine query backend. The core logic is correct: the recursive CTE correctly expands location hierarchies downward, and the dual-location OR clause correctly matches wines where either the wine's or the winery's location falls within the selected hierarchy. Test coverage is thorough and the journal fix is sound. One security-class concern with `sql.raw()` warrants attention, though it is mitigated by Zod input validation.

## Issues Found

### Critical

None.

### High Priority

**`sql.raw()` used to inject winery IDs into SQL (`db_wine.ts:487-488, 522`)**

```typescript
const wineryClause = wineryIds && wineryIds.length > 0
  ? `AND w.winery_id IN (${wineryIds.join(", ")})`
  : "";
// ...
${sql.raw(wineryClause)}
```

This constructs a raw SQL fragment from user-supplied data. In practice there is no injection risk because Zod validates `wineryIds` as `z.array(z.number())` before it reaches this function — non-numbers are rejected at the tRPC boundary. However, `getAvailableWinesFiltered` is a plain exported function with no type-enforced guard at its own call site; a future direct caller bypassing tRPC could pass arbitrary values.

The same pattern exists pre-PR for `locationIdList` (line 485, `sql.raw(locationIdList)`), so this is consistent with existing code. Recommend tracking as tech debt: both raw-injection patterns should eventually be replaced with Drizzle's parameterized `inArray` or a `sql` tagged template with proper binding. Not blocking for this PR given the Zod guard, but worth a follow-up issue.

### Medium Priority

**Docstring for `getAvailableWinesFiltered` is outdated (`db_wine.ts:469-475`)**

The JSDoc still describes only location filtering. It doesn't mention the new `wineryIds` parameter or the dual-location OR behaviour. A future reader won't understand the function's full contract without reading the implementation.

Suggested update:

```
* Get available wines (with stock), optionally filtered by location IDs and/or winery IDs.
* Location filter expands downward through the hierarchy and matches wines where either
* the wine's own locationId OR its winery's locationId is within the selected locations.
* Winery filter restricts results to wines from the specified wineries.
```

### Suggestions

**Missing edge case tests for empty arrays**

`getAvailableWinesFiltered([], undefined)` and `getAvailableWinesFiltered(undefined, [])` both fall through to the no-filter Drizzle path (correct behaviour — the code checks `length > 0`). The tests don't cover this explicitly. Low risk given the logic is simple, but worth adding to prevent regressions if the branching condition changes.

**`chesterCounty` is seeded but only tested negatively**

`seedWineDatabase` inserts Chester County (a vineyard under PA) to verify it doesn't appear in `getAvailableLocations`. The negative assertion is valuable, but consider adding a positive counterpart: a wine or winery at Chester County that confirms it _does_ appear when there's stock there. Current coverage is sufficient for the stated requirements.

## Validation Results

| Check                     | Status                                               |
| ------------------------- | ---------------------------------------------------- |
| Type check (server files) | ✅ (pre-existing client errors unrelated to this PR) |
| esbuild syntax            | ✅                                                   |
| Tests (74 total)          | ✅ All pass with test DB running                     |

## What's Good

- **Dual-location logic is correct.** The OR clause (`w.location_id IN ... OR wr.location_id IN ...`) on the same `location_tree` CTE is the right approach — no separate query needed.
- **`getAvailableLocations` update is correct and necessary.** Without it, winery-only locations would never appear in the filter UI, breaking the feature before it's built.
- **Test coverage is strong.** The R5 scenario (PA winery, CA grapes) precisely models the stated requirement and catches the dual-location case explicitly.
- **Journal fix is correct.** Timestamps are properly scaled (git `%at` × 1000 to milliseconds), idx values are sequential, and the production database was verified to already have these migrations applied before the fix was committed.
- **`clearDatabase` ordering is correct.** Wine tables are truncated in reverse dependency order (junction table first) before beer tables.

## Recommendation

Approve. The high-priority `sql.raw()` concern is pre-existing tech debt mitigated by Zod validation — not introduced by this PR and not blocking. Open a follow-up issue to replace both raw-injection patterns with parameterized queries. Fix the docstring before or immediately after merge (one-line change).
