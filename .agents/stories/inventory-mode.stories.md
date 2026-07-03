# Inventory Mode — User Stories

Source PRD: `.agents/PRDs/inventory-mode.prd.md`

Existing building blocks these stories reuse (no new backend endpoints required for MVP):

- `beer.listAvailable` (public, `server/routers.ts:192` → `getAllAvailableBeers`, `server/db.ts:296`) already returns only `on_tap`/`bottle_can` beers.
- `beer.update` (curatorProcedure, `server/routers.ts:~196-227` → `updateBeer`, `server/db.ts:323`) accepts a partial `status` update.
- `wine.listAvailable` (public, `server/routers.ts:375` → `getAvailableWines`, `server/db_wine.ts:321`) already returns only wines with `cellared > 0` or `refrigerated > 0`.
- `wine.update` (curatorProcedure, `server/routers.ts:~386-415` → `updateWine`, `server/db_wine.ts:429`) accepts partial `cellared`/`refrigerated`.

Because the "available" filter already lives server-side, an item disappearing from the inventory list after an edit is a client-side consequence of re-querying/re-filtering — not a new backend rule. Existing curation pages (`BeerPage.tsx`, `ManageWinePage.tsx`) edit via a shadcn `Dialog` modal, not a route change, so the "back to top" pain point comes from the list re-rendering from scratch after the mutation settles — the fix is keeping edits inline in the row and updating the query cache without a jarring re-render, not avoiding a route change.

Role gating on the client currently has no shared hook — `BeerManagement.tsx:22-30,54-56` and `WineManagement.tsx:21-29,53-55` each inline-check `trpc.auth.me` for `curator`/`admin` and redirect otherwise. New inventory routes should copy this pattern (or extract a shared hook if that's cheap — see INV-1 technical notes).

---

## INV-1: Beer Inventory Mode — list with inline status editing

**Type**: Feature
**Labels**: enhancement, Claude
**Priority**: High
**Complexity**: Medium
**Phase**: 1 — Beer Inventory Mode

### Description

As a curator, I want to see a list of currently-available beers and change a beer's status inline, so that I can reconcile physical stock quickly without leaving the list.

### Acceptance Criteria

- [ ] Given I am a curator or admin, when I navigate to the new beer inventory route, then I see every beer with status `on_tap` or `bottle_can` (via `beer.listAvailable`), and no others.
- [ ] Given I am logged in as a non-curator (or logged out), when I navigate to the beer inventory route, then I am redirected away, matching the guard pattern in `BeerManagement.tsx:22-30`.
- [ ] Given I am viewing the beer inventory list, when I change a beer's status inline (e.g., via a select/segmented control on the row), then `beer.update` is called with just the status change and no dialog/modal or route navigation occurs.
- [ ] Given I change a beer's status to `Out`, when the update succeeds, then that row is removed from the list in place, and my scroll position for the remaining rows is preserved (no jump to top).
- [ ] Given I am on a phone-width viewport, when I view the list, then rows and the status control are large enough to tap accurately (verify against existing Tailwind breakpoints used elsewhere in the app).

### Technical Notes

- New route, e.g. `/beer/inventory`, registered in `client/src/App.tsx` alongside the existing `/beer-management` route (`client/src/App.tsx:24`).
- New page component, e.g. `client/src/pages/BeerInventory.tsx`. Fetch via `trpc.beer.listAvailable.useQuery()`.
- Status control: reuse the same status values as the `<select>` in `BeerPage.tsx:230-231`, but rendered per-row for inline editing (e.g. a small `Select` or button group), not inside a `Dialog`.
- On successful `beer.update` mutation, update the TanStack Query cache directly (e.g. `setQueryData` to filter out the item, or rely on `invalidate` + a `getSnapshot`-preserving list key) rather than a full refetch-and-remount, to avoid the scroll-reset regression this feature is meant to fix.
- Role guard: copy the inline pattern from `BeerManagement.tsx:22-30,54-56`; if writing the same check twice (beer + wine inventory) feels redundant, consider extracting a small `useCuratorGuard()` hook — optional, not required for MVP.

### Dependencies

- Blocked by: none
- Blocks: INV-2

---

## INV-2: Beer Inventory Mode — "confirmed present" action

**Type**: Feature
**Labels**: enhancement, Claude
**Priority**: High
**Complexity**: Small
**Phase**: 1 — Beer Inventory Mode

### Description

As a curator, I want to mark a beer as "confirmed present" without changing any data, so that I can quickly clear items that are correct as-is and see what's left to review.

### Acceptance Criteria

- [ ] Given a beer row in the inventory list, when I tap "confirm", then the row is removed from the visible list and no `beer.update` mutation is called (no data changes).
- [ ] Given I have confirmed several items in this session, when I edit a different beer's status instead of confirming it, then that edited item is also removed from the list (per INV-1), and the two removal paths (confirm vs. edit) don't interfere with each other.
- [ ] Given I refresh the page or navigate away and back to beer inventory, when the page reloads, then previously confirmed items reappear (confirmation is session-only, not persisted) — matching the PRD's explicit choice not to persist confirmation state.
- [ ] Given the list, when some items are confirmed and others aren't, then there is a visible way to tell how many remain (e.g., a count or progress indicator) — nice-to-have if trivial, not required to pass.

### Technical Notes

- Purely client-side: track confirmed beer IDs in local component state (e.g. `useState<Set<number>>`), filter them out of the rendered list. No new tRPC procedure or DB column needed — this directly reflects the PRD's "session only" and "no last-checked timestamp" decisions.
- Depends on INV-1's list/page existing first.

### Dependencies

- Blocked by: INV-1
- Blocks: none

---

## INV-3: Wine Inventory Mode — list with inline cellar/fridge quantity editing

**Type**: Feature
**Labels**: enhancement, Claude
**Priority**: High
**Complexity**: Medium
**Phase**: 2 — Wine Inventory Mode

### Description

As a curator, I want to see a list of currently-available wines and adjust cellar/fridge counts inline, so that I can reconcile physical stock — including bottles moved between locations — quickly without leaving the list.

### Acceptance Criteria

- [ ] Given I am a curator or admin, when I navigate to the new wine inventory route, then I see every wine with `cellared > 0` or `refrigerated > 0` (via `wine.listAvailable`), and no others.
- [ ] Given I am logged in as a non-curator (or logged out), when I navigate to the wine inventory route, then I am redirected away, matching `WineManagement.tsx:21-29`.
- [ ] Given a wine row, when I increase or decrease either the cellar count or the fridge count independently, then `wine.update` is called with just the changed field(s), inline, with no dialog/modal or route navigation.
- [ ] Given a wine row, when I decrement the cellar count and increment the fridge count in the same edit (representing a bottle moved), then both values update correctly in one save.
- [ ] Given an edit brings both cellar and fridge counts to 0, when the update succeeds, then that row is removed from the list in place, preserving scroll position for the remaining rows.
- [ ] Given I am on a phone-width viewport, when I view the list, then the cellar/fridge controls are large enough to tap/adjust accurately.

### Technical Notes

- New route, e.g. `/wine/inventory`, registered in `client/src/App.tsx` alongside `/wine-management` (`client/src/App.tsx:25`).
- New page component, e.g. `client/src/pages/WineInventory.tsx`. Fetch via `trpc.wine.listAvailable.useQuery()`.
- Replace the plain number `<Input>` fields used in the edit dialog (`ManageWinePage.tsx:268-284`) with inline steppers or editable numbers per row, for both `cellared` and `refrigerated` independently.
- Same cache-update-without-full-remount approach as INV-1 to avoid scroll reset.
- Reuse or extract the same role-guard approach decided in INV-1.

### Dependencies

- Blocked by: none
- Blocks: INV-4

---

## INV-4: Wine Inventory Mode — "confirmed present" action

**Type**: Feature
**Labels**: enhancement, Claude
**Priority**: High
**Complexity**: Small
**Phase**: 2 — Wine Inventory Mode

### Description

As a curator, I want to mark a wine as "confirmed present" without changing any data, so that I can quickly clear items that are correct as-is and see what's left to review.

### Acceptance Criteria

- [ ] Given a wine row in the inventory list, when I tap "confirm", then the row is removed from the visible list and no `wine.update` mutation is called.
- [ ] Given I refresh the page or navigate away and back to wine inventory, when the page reloads, then previously confirmed items reappear (session-only, not persisted).
- [ ] Given some items are confirmed and others edited into unavailability, then both removal paths work independently without conflicting (same as INV-2's equivalent check for beer).

### Technical Notes

- Same approach as INV-2 (local component state, no backend changes) applied to the wine inventory page from INV-3.

### Dependencies

- Blocked by: INV-3
- Blocks: none

---

## INV-5: Search/filter within inventory lists

**Type**: Enhancement
**Labels**: enhancement, Claude
**Priority**: Medium
**Complexity**: Medium
**Phase**: 3 — Search/filter within inventory lists

### Description

As a curator, I want to search or filter the beer/wine inventory lists, so that reviewing stays fast as the catalog grows.

### Acceptance Criteria

- [ ] Given the beer inventory list, when I type into a search box, then the list filters to beers whose name/brewery matches (client-side filter over the already-fetched `listAvailable` result — no new query needed).
- [ ] Given the wine inventory list, when I type into a search box, then the list filters to wines whose name/winery matches, same approach.
- [ ] Given a search term that matches nothing, then the list shows an empty state rather than an error.
- [ ] Given I clear the search box, then the full (minus confirmed/edited-out) list reappears.

### Technical Notes

- Client-side filtering only — both `listAvailable` queries already return the full available set, and catalog size is small enough that a server round-trip isn't needed yet. Revisit if this stops being true.
- Consider reusing the `Sheet` filter pattern already used in `BeerPage.tsx:406-410`, or a simpler always-visible search input given the inventory page's different context (fast in-and-out use on a phone, not a persistent management view).

### Dependencies

- Blocked by: INV-1, INV-3
- Blocks: none

---

## Notes on scope

Phase 4 from the PRD ("Location-based organization") is explicitly marked **Won't (now)** / future in the PRD's MVP scope table — no story is created for it here. Revisit after INV-1 through INV-5 ship and get real use.
