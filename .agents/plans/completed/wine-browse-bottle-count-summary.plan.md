# Plan: Wine Browse Page Bottle Count Summary

## Summary

The wine browse page (`WinePage.tsx`) currently shows only a wine count ("Showing N wines"). We'll add a total bottle count to the same summary line, computed client-side by summing each wine's `refrigerated` + `cellared` fields, which are already present on every object returned by `trpc.wine.listAvailable`. No schema, router, or DB changes are needed — this is a pure client-side rendering change.

## User Story

As a visitor browsing the wine menu
I want to see the total number of bottles available, not just the number of distinct wines
So that I get a quick sense of overall stock, not just variety

## Metadata

| Field            | Value                 |
| ---------------- | --------------------- |
| Type             | ENHANCEMENT           |
| Complexity       | LOW                   |
| Systems Affected | client (WinePage.tsx) |
| GitHub Issue     | 142                   |

---

## Patterns to Follow

### Naming / existing summary text

```tsx
// SOURCE: client/src/pages/WinePage.tsx:213-216
<p className="text-sm text-gray-600 mb-6">
  Showing {availableWines.length} wine
  {availableWines.length !== 1 ? "s" : ""}
</p>
```

### Per-wine bottle fields already available

```tsx
// SOURCE: client/src/pages/WinePage.tsx:250-255
<div className="flex gap-4 text-sm text-gray-700 pt-2">
  {wine.refrigerated > 0 && <span className="font-medium">🧊 Refrigerated: {wine.refrigerated}</span>}
  {wine.cellared > 0 && <span className="font-medium">🍷 Cellared: {wine.cellared}</span>}
</div>
```

### Data source

```tsx
// SOURCE: client/src/pages/WinePage.tsx:57-61
const { data: availableWines = [], isLoading } = trpc.wine.listAvailable.useQuery({
  locationIds: selectedLocations.map((id) => parseInt(id, 10)),
  wineryIds: selectedWineries.map((id) => parseInt(id, 10)),
});
```

Each item in `availableWines` includes `refrigerated: number` and `cellared: number` (from `server/db_wine.ts:getAvailableWinesFiltered`, `drizzle/schema.ts:211-212`).

### Tests

No client-side test files exist in this repo (`client/src` has none) — this change will not add a new test, consistent with the rest of the client codebase's coverage pattern. Server-side logic is unchanged, so no server test additions are needed either.

---

## Files to Change

| File                            | Action | Purpose                                                                                              |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `client/src/pages/WinePage.tsx` | UPDATE | Compute total bottle count and update the summary paragraph to show both wine count and bottle count |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Compute total bottle count

- **File**: `client/src/pages/WinePage.tsx`
- **Action**: UPDATE
- **Implement**: Add a derived `totalBottles` value just after the `availableWines` query (near line 61), summing `refrigerated + cellared` across `availableWines`:
  ```ts
  const totalBottles = availableWines.reduce((sum, wine) => sum + wine.refrigerated + wine.cellared, 0);
  ```
- **Mirror**: `client/src/pages/WinePage.tsx:57-61` (existing query destructuring style, same component scope)
- **Validate**: `npm run check`

### Task 2: Update the summary paragraph to show bottle count

- **File**: `client/src/pages/WinePage.tsx`
- **Action**: UPDATE
- **Implement**: Replace the summary text at lines 213-216 to include both counts, keeping the existing singular/plural handling for "wine(s)" and adding equivalent handling for "bottle(s)":
  ```tsx
  <p className="text-sm text-gray-600 mb-6">
    Showing {availableWines.length} wine
    {availableWines.length !== 1 ? "s" : ""} ({totalBottles} bottle
    {totalBottles !== 1 ? "s" : ""})
  </p>
  ```
- **Mirror**: `client/src/pages/WinePage.tsx:213-216` (existing pluralization pattern)
- **Validate**: `npm run check`

---

## Validation

```bash
# Format (auto-fixes in place)
npm run format

# Type check
npm run check

# Production build (catches bundling issues npm run check won't)
npm run build

# Tests (no wine-page-specific tests exist; run full suite to confirm no regressions)
npm test
```

Manual check: run `npm run dev`, visit `/wine`, confirm the summary line shows both the wine count and total bottle count, and that the number matches the sum of each card's Refrigerated/Cellared badges.

---

## Acceptance Criteria

- [ ] Wine browse page summary shows both number of wines and total number of bottles
- [ ] Singular/plural wording is correct for both counts (1 wine / N wines, 1 bottle / N bottles)
- [ ] Type check passes
- [ ] No regressions in existing tests
- [ ] Follows existing patterns (no new schema/router/DB changes)
