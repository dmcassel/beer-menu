# Implementation Report

**Plan**: `.agents/plans/show-brewery-in-beer-inventory.plan.md`
**Branch**: `144/show-brewery-in-beer-inventory`
**Status**: COMPLETE

## Summary

Beer inventory cards now show the brewery name under the beer name. Moved brewery resolution server-side: `getAllAvailableBeers` (`server/db.ts`) now left-joins `brewery` and returns an explicit `breweryName` column, mirroring the existing wine/winery pattern in `server/db_wine.ts`. On the client, `BeerInventory.tsx` was simplified to drop its separate `brewery.list` query and `getBreweryName` lookup helper (no longer needed now that `breweryName` comes inline on each beer), and a subtitle line was added under the beer name in each card, matching `ManageWinePage.tsx`'s existing label/subtitle style.

## Tasks Completed

| #   | Task                                                        | File                                 | Status |
| --- | ------------------------------------------------------------ | ------------------------------------- | ------ |
| 1   | Join `brewery` into `getAllAvailableBeers`, return `breweryName` | `server/db.ts`                      | ✅     |
| 2   | Consume `breweryName` in `BeerInventory.tsx`, drop redundant lookup, render subtitle | `client/src/pages/BeerInventory.tsx` | ✅     |

## Validation Results

| Check      | Result                       |
| ---------- | ----------------------------- |
| Format     | ✅                            |
| Type check | ✅                            |
| Build      | ✅                            |
| Tests      | ✅ (91 passed, 4 test files)  |

## Files Changed

| File                                  | Action | Lines  |
| -------------------------------------- | ------ | ------ |
| `server/db.ts`                        | UPDATE | +16/-1 |
| `client/src/pages/BeerInventory.tsx`  | UPDATE | +5/-8  |
| `server/db.test.ts`                   | UPDATE | +8/-0 (new test) |

## Deviations from Plan

The plan suggested adding a local `BeerRow` type in `BeerInventory.tsx` (mirroring `WineInventory.tsx`'s `WineRow`). Implemented it initially, but removed it — unlike `WineRow`, which is used to type extracted helper functions (`getCounts`, `isDirty`, etc.) outside the render, `BeerInventory.tsx` has no such helpers; the map callback's `beer` parameter is already correctly inferred from the tRPC query, so the type would have been unused dead code. No functional impact — `npm run check` confirms the inferred types are correct without it.

## Tests Written

| Test File       | Test Cases |
| ---------------- | ---------- |
| `server/db.test.ts` | `should get available beers with brewery name, excluding out-of-stock beers` — verifies `getAllAvailableBeers()` returns 4 beers (excluding the seeded "out"-status beer) and that `breweryName` is correctly joined (e.g., "Hoppy Pale Ale" → "Test Brewery A") |

## End-to-End Verification

The app requires real Google OAuth login with no dev-mode bypass, so driving the actual curator-authenticated Beer Inventory page in an automated browser wasn't feasible (same constraint noted in the prior mobile-dialogs implementation report). Since `beer.listAvailable` is a `publicProcedure`, verified the live endpoint directly against the dev database instead:

```
GET /api/trpc/beer.listAvailable
→ [
    { "name": "Golden Monkey", "breweryId": 2, "breweryName": "Victory Brewing", ... },
    { "name": "Gordon Strong's Burton Ale", "breweryId": 1, "breweryName": "Cassel Brewing", ... },
    { "name": "Hoppily Ever After", "breweryId": 1, "breweryName": "Cassel Brewing", ... }
  ]
```

This confirms the join produces the correct `breweryName` for each beer against real data (not just seeded test fixtures). The client-side rendering (`{beer.breweryName && <p>...}`) was verified via `npm run check` (type-correct against the new nullable `breweryName: string | null` field) and by the existing/added server-side tests confirming the data contract. Manual verification in a logged-in browser session is recommended before merge to visually confirm the subtitle styling, consistent with the plan's noted testing gap for this page.
