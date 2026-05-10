# Stories: Wine Curation Page Improvements

Source PRD: `.agents/PRDs/wine-curation-improvements.prd.md`

---

## STORY-1: Update wine query to support winery filter and dual-location matching

**Type**: Enhancement
**Labels**: enhancement, backend, database
**Priority**: High
**Complexity**: Medium
**Phase**: 1

### Description
As a curator, I want the wine backend to filter by winery and match a wine's location against both the wine's own location and the winery's location, so that filter-based searches on the browse and curation pages return accurate results.

### Acceptance Criteria
- [ ] Given a winery ID filter, when `wine.listAvailable` is called, then only wines from that winery are returned
- [ ] Given a location filter, when a wine's own location matches the hierarchy, then the wine is included
- [ ] Given a location filter, when a wine's winery location matches the hierarchy (but the wine's location does not), then the wine is still included (e.g., R5 Winery in PA with CA grapes returns for both PA and CA)
- [ ] Given no filters, when the endpoint is called, then all available wines are returned as before
- [ ] Existing tests pass; new tests cover the dual-location and winery filter cases

### Technical Notes
- Modify `server/db_wine.ts` — the function backing `wine.listAvailable`
- Update `server/routers.ts` to accept optional `wineryIds: number[]` on the `wine.listAvailable` input schema
- Location hierarchy matching already uses a recursive query — extend it with an OR clause joining through the winery's location
- The winery table has a `locationId` field; join through it for the winery-side location check
- The curation page will need a parallel query (`wine.list` or similar) that returns all wines regardless of stock — check whether that query also needs these filter parameters added

### Dependencies
- Blocks: STORY-2, STORY-3

---

## STORY-2: Add winery filter to wine browse page

**Type**: Enhancement
**Labels**: enhancement, frontend
**Priority**: High
**Complexity**: Small
**Phase**: 1

### Description
As a user browsing the public wine menu, I want to filter wines by winery, so that I can quickly see all wines from a specific producer.

### Acceptance Criteria
- [ ] Given the wine browse page, when I open the filter panel, then a winery filter is visible alongside the existing location filter
- [ ] Given the winery filter, when I select a winery, then only wines from that winery are shown
- [ ] Given multiple active filters (winery + location), when both are set, then wines matching all active filters are shown
- [ ] Given an active winery filter, when I clear it, then all wines (matching any remaining filters) are shown again
- [ ] Given a mobile viewport, when I open the filter drawer, then the winery filter is accessible and usable

### Technical Notes
- Update `client/src/components/WineFilterControls.tsx` to add a winery select/dropdown
- Update `client/src/pages/WinePage.tsx` to pass `wineryIds` to the `trpc.wine.listAvailable` query
- Fetch winery options via `trpc.winery.list` (already used in the curation form)
- Follow the existing location filter pattern for active badge display and clear behavior
- Mobile layout uses a bottom sheet drawer — add winery filter inside it

### Dependencies
- Blocked by: STORY-1

---

## STORY-3: Add filters to wine curation page

**Type**: Enhancement
**Labels**: enhancement, frontend
**Priority**: High
**Complexity**: Medium
**Phase**: 2

### Description
As a curator, I want to filter the wine curation page by winery, location, and a text search, so that I can quickly find specific wines when updating inventory after a new shipment arrives.

### Acceptance Criteria
- [ ] Given the curation page, when I select a winery filter, then only wines from that winery are shown
- [ ] Given the curation page, when I select a location filter, then wines where either the wine's location or the winery's location matches are shown
- [ ] Given the curation page, when I type in the text search field, then wines are filtered by label, winery name, or varietal name (case-insensitive)
- [ ] Given multiple active filters, when all are set, then results satisfy all active filters simultaneously
- [ ] Given any active filter, when I clear it, then the list updates immediately
- [ ] Given a mobile viewport, when the curation page loads, then filters are accessible and usable without horizontal scrolling

### Technical Notes
- Modify `client/src/pages/ManageWinePage.tsx`
- Winery and location filters can reuse or adapt `WineFilterControls` component — or apply filters client-side against the full wine list if the curation query returns all wines regardless of stock
- Text search is client-side: filter the loaded wine list by `label`, `winery.name`, and `varietal.name`
- Mobile layout: consider a collapsible filter section or drawer, consistent with the browse page pattern
- Fetch winery options via `trpc.winery.list`; location options via `trpc.location.listWithPaths`

### Dependencies
- Blocked by: STORY-1

---

## STORY-4: New Vintage action on wine curation page

**Type**: Feature
**Labels**: feature, frontend
**Priority**: High
**Complexity**: Small
**Phase**: 3

### Description
As a curator, I want a "New Vintage" action on each wine card, so that I can quickly create a new year's entry for an existing wine without re-entering all its details.

### Acceptance Criteria
- [ ] Given a wine card on the curation page, when I tap/click "New Vintage", then the add/edit dialog opens pre-populated with all fields from the source wine
- [ ] Given the pre-populated dialog, when it opens, then the vintage year is set to the source wine's vintage year + 1
- [ ] Given the pre-populated dialog, when it opens, then refrigerated and cellared inventory counts are both set to 0
- [ ] Given the pre-populated dialog, when I submit, then a new wine record is created (not an update to the original)
- [ ] Given a mobile viewport, when I tap "New Vintage", then the dialog opens and is usable on a small screen

### Technical Notes
- Modify `client/src/pages/ManageWinePage.tsx` — add a "New Vintage" button to each wine card alongside the existing Edit/Delete buttons
- Reuse the existing add/edit dialog; add a `newVintageSource` state that, when set, pre-populates the form
- Pre-populate all fields from the source wine except: vintage (source year + 1), refrigeratedCount (0), cellaredCount (0)
- Submit via the existing `trpc.wine.create` mutation (same as "Add Wine")
- If a wine has no vintage year recorded, the vintage field in the new dialog should be left blank

### Dependencies
- None (independent of STORY-1 through STORY-3)
