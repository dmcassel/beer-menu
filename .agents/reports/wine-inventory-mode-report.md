# Implementation Report

**Plan**: `.agents/plans/wine-inventory-mode.plan.md`
**Branch**: `128/wine-inventory-mode`
**Status**: COMPLETE

## Summary

Added a curator-only `/wine/inventory` route (`WineInventory.tsx`) listing every currently-available wine (`wine.listAvailable`) with independent +/- steppers for cellar and fridge counts per row. Stepper taps only change local pending state; a per-row "Save changes" button appears once a row is dirty and commits just the changed field(s) — one or both — via a single `wine.update` call. On success the row is patched or removed in the TanStack Query cache in place (`utils.wine.listAvailable.setData({}, ...)`), avoiding a refetch-triggered remount. No backend changes were required. The "confirmed present" action is intentionally out of scope (tracked as a follow-up issue, mirroring how #127 followed #126 for beer).

## Tasks Completed

| #   | Task                                                                  | File                                 | Status |
| --- | --------------------------------------------------------------------- | ------------------------------------ | ------ |
| 1   | Create curator-only inventory page with inline cellar/fridge steppers | `client/src/pages/WineInventory.tsx` | ✅     |
| 2   | Register `/wine/inventory` route                                      | `client/src/App.tsx`                 | ✅     |

## Validation Results

| Check                        | Result                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type check (`npm run check`) | ✅ Zero new errors (confirmed identical pre-existing baseline errors via `git stash` comparison, all in unrelated files: `Map.tsx`, `BeerBrowser.tsx`, `Login.tsx`, `server/_core/oauth.ts`, `server/_core/sdk.ts`)                                                                         |
| Format (`npm run format`)    | ⚠️ Ran once; the repo is not currently Prettier-clean and `prettier --write .` reformatted ~165 unrelated tracked files. Reverted all of those via `git checkout --` (same issue as #126's report) and kept only the intended `App.tsx` change. Did not re-run repo-wide format after that. |
| Tests (`npm test`)           | ✅ 90 passed (90)                                                                                                                                                                                                                                                                           |
| Manual E2E (see below)       | ✅                                                                                                                                                                                                                                                                                          |

## Files Changed

| File                                 | Action | Lines                                                                                                                                                                                            |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `client/src/pages/WineInventory.tsx` | CREATE | +192                                                                                                                                                                                             |
| `client/src/App.tsx`                 | UPDATE | +2                                                                                                                                                                                               |
| `CLAUDE.md`                          | UPDATE | +2 (documented that only Postgres runs in Docker for local dev; the middle tier runs directly via `npm run dev`, per user instruction encountered while starting the dev server for E2E testing) |

## Deviations from Plan

None in implementation approach — the pending-state-plus-explicit-save design, cache-key handling (`{}` instead of `undefined`), and touch-target sizing all matched the plan as written.

One unplanned addition: updated `CLAUDE.md`'s Commands section to clarify that local dev only containerizes Postgres (the `app` service in `docker-compose.yml` is for production deployment, not dev). This was requested mid-implementation while setting up the dev server for E2E verification and is unrelated to the wine inventory feature itself, but is a small, durable documentation fix bundled into this branch.

## Tests Written

No new automated tests: this repo's test suite is server-only (`server/**/*.test.ts`, per `CLAUDE.md`), and this feature required no server changes — both `wine.listAvailable` and `wine.update` already have existing coverage. Verification was manual/E2E per the plan.

## End-to-End Verification

Verified with a live dev server (`npm run dev`, against the local `beerdb` Postgres container) and the `agent-browser` CLI, authenticated via a forged session cookie for the existing seeded curator account (same technique used for #126, where browser automation wasn't available — it is now).

1. **Non-curator/logged-out redirected** — opened `/wine/inventory` with no session cookie → redirected to `/browser`. ✅
2. **Curator sees only wines with stock** — with the seeded curator session, `/wine/inventory` rendered exactly the 2 wines with `cellared > 0 OR refrigerated > 0` (Sauvignon Blanc, Sylvan Riesling), badge showed "2 in stock". ✅
3. **Independent field edit, single field sent** — tapped only Cellar +/- on a row; no request fired until Save was tapped (pending-state design, not per-tap firing). ✅
4. **Combined cellar-decrement + fridge-increment in one save** — on Sauvignon Blanc, decremented Cellar (2→1) and incremented Fridge (2→3), then tapped Save once. Captured the network request: a single `POST /api/trpc/wine.update` with body `{"id":2,"cellared":1,"refrigerated":3}` — both changed fields in one call, matching the "bottle moved" acceptance criterion exactly. ✅
5. **Row removed at 0/0, no refetch** — on Sylvan Riesling (Cellar already 0), decremented Fridge 2→0 and saved. The row disappeared, the badge updated to "1 in stock", and a toast confirmed "Inventory updated" — with zero additional `wine.listAvailable` network calls after the mutation (confirmed via `agent-browser network requests`), proving the cache-patch-in-place mechanism is working (no remount, scroll position preserved). ✅
6. **Touch targets on phone viewport (375×700)** — stepper buttons (`h-11 w-11`, 44px) render clearly separated and easily tappable. ✅ Noted: the page header (title + badge + "Back to Dashboard" button) visually overlaps at 375px width — this is a pre-existing layout issue in the `BeerInventory.tsx` pattern this page mirrors (confirmed by screenshotting `/beer/inventory` at the same viewport, which has the identical overlap), not a regression introduced here. Left unfixed as out of scope for this issue; flagged for a possible follow-up affecting both inventory pages.

Dev database values were restored to their original state (`Sauvignon Blanc`: cellared=2, refrigerated=2; `Sylvan Riesling`: cellared=0, refrigerated=2) after testing.
