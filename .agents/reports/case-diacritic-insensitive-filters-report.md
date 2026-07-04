# Implementation Report

**Plan**: `.agents/plans/case-diacritic-insensitive-filters.plan.md`
**Branch**: `121/case-diacritic-insensitive-filters`
**Status**: COMPLETE

## Summary

Filters on both browse and curation pages now match regardless of case and diacritics (e.g. "rose" finds "Rosé", "troegs" finds "Tröegs"). Two layers were fixed: server-side text search (`getAllBeers`/`getAllWines`) now wraps comparisons in Postgres's `unaccent()` via a new `unaccentIlike()` helper, enabled by a new `unaccent` extension migration; client-side dropdown/inventory filters now share a `normalizeSearchText()` utility (extracted from the one place that already did this correctly, `searchable-select.tsx`) instead of doing case-only `.toLowerCase()` matching.

## Tasks Completed

| #   | Task                                                              | File                                              | Status |
| --- | ------------------------------------------------------------------ | -------------------------------------------------- | ------ |
| 1   | Add `unaccent` Postgres extension migration                      | `drizzle/migrations/0005_add_unaccent_extension.sql` | ✅     |
| 2   | Register migration in drizzle journal                            | `drizzle/migrations/meta/_journal.json`             | ✅     |
| 3   | Add `unaccentIlike()` helper; use in `getAllBeers` search         | `server/db.ts`                                      | ✅     |
| 4   | Use `unaccentIlike()` in both `getAllWines` code paths            | `server/db_wine.ts`                                 | ✅     |
| 5   | Add beer diacritic-insensitivity test                            | `server/db.test.ts`                                 | ✅     |
| 6   | Add wine diacritic-insensitivity tests (both query paths)        | `server/db_wine.test.ts`                            | ✅     |
| 7   | Extract shared `normalizeSearchText()` utility                   | `client/src/lib/utils.ts`                           | ✅     |
| 8   | Point `searchable-select.tsx` at the shared utility               | `client/src/components/ui/searchable-select.tsx`    | ✅     |
| 9   | Make `multi-select.tsx` diacritic-insensitive                    | `client/src/components/ui/multi-select.tsx`         | ✅     |
| 10  | Make `BeerInventory.tsx`/`WineInventory.tsx` diacritic-insensitive | `client/src/pages/BeerInventory.tsx`, `client/src/pages/WineInventory.tsx` | ✅     |

## Validation Results

| Check      | Result                       |
| ---------- | ----------------------------- |
| Format     | ✅                             |
| Type check | ✅                             |
| Build      | ✅                             |
| Tests      | ✅ (94 passed, 4 test files — up from 90 before this change) |

## Files Changed

| File                                                  | Action | Lines   |
| ------------------------------------------------------ | ------ | ------- |
| `drizzle/migrations/0005_add_unaccent_extension.sql`  | CREATE | +2      |
| `drizzle/migrations/meta/_journal.json`               | UPDATE | +7      |
| `server/db.ts`                                        | UPDATE | +8/-4   |
| `server/db_wine.ts`                                   | UPDATE | +8/-8   |
| `server/db.test.ts`                                   | UPDATE | +22     |
| `server/db_wine.test.ts`                              | UPDATE | +48/-1  |
| `client/src/lib/utils.ts`                             | UPDATE | +8      |
| `client/src/components/ui/searchable-select.tsx`      | UPDATE | +2/-11  |
| `client/src/components/ui/multi-select.tsx`           | UPDATE | +4/-1   |
| `client/src/pages/BeerInventory.tsx`                  | UPDATE | +7/-3   |
| `client/src/pages/WineInventory.tsx`                  | UPDATE | +7/-3   |

## Deviations from Plan

- Task 6 note about `deleteWine` possibly not existing was moot — it was already exported (`server/db_wine.ts:433`), so no new function was added, just an import.
- No other deviations. Implementation matched the plan's design exactly (helper signatures, SQL wrapping, file list).

## Tests Written

| Test File            | Test Cases                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `server/db.test.ts`   | `should match diacritic characters when searching without them` (beer name + brewery name, via `getAllBeers`) |
| `server/db_wine.test.ts` | `text search — diacritic-insensitive match, no location filter (Drizzle path)`, `text search — diacritic-insensitive match, with location filter (CTE path)` |

## End-to-End Verification

Started the dev server (`npm run dev`, port 3001) against the local Postgres dev DB (migration `0005_add_unaccent_extension` applied via `npm run db:migrate`). Created a temporary curator user and temporary accented test data (brewery "Tröegs Independent Brewing", beer "Rosé Ale", winery "Château Rosé", wine "Rosé Blend"), all deleted after verification.

**Server-side (curl against live tRPC endpoints):**
- `beer.list({ search: "rose" })` → found "Rosé Ale" ✅
- `beer.list({ search: "troegs" })` → found "Rosé Ale" via brewery name ✅
- `wine.list({ search: "chateau" })` (Drizzle path, no `locationIds`) → found "Rosé Blend" ✅
- `wine.list({ search: "rose", locationIds: [...] })` (raw-SQL CTE path) → found "Rosé Blend" ✅

**Client-side (Playwright driving a real Chromium browser, authenticated via a forged session cookie for a real curator test user):**
- Beer curation page (`/beer-management`) search "rose" → finds "Rosé Ale" ✅
- Beer curation page search "troegs" → finds "Rosé Ale" ✅
- Wine curation page (`/wine-management`) search "chateau" → finds "Rosé Blend" ✅
- Beer browse page (`/browser`) brewery multi-select dropdown, typed "troegs" → shows "Tröegs Independent Brewing" ✅
- Wine browse page (`/wine`) winery multi-select dropdown, typed "chateau" → shows "Château Rosé" ✅
- Beer Inventory page (`/beer/inventory`) search "rose" → finds "Rosé Ale" ✅
- Wine Inventory page (`/wine/inventory`) search "rose" → finds "Rosé Blend" ✅

All 7 real end-to-end checks passed. Test data and the temporary curator user were removed from the dev DB afterward; the dev server was stopped.
