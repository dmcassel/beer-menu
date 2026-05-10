# Wine Curation Page Improvements

## Problem Statement

Administrative users managing wine inventory must use the browser's native find feature to locate wines on the curation page, which is slow and clunky — especially on mobile. When a new shipment arrives, there is no efficient way to filter by winery or other criteria to find existing wines that need inventory updates or confirm which wines are new to the catalog. The current process takes significantly longer than it should, causing frustration every time wine inventory needs to be updated.

## Key Hypothesis

We believe adding filters and a "new vintage" action to the wine curation page will reduce the time and effort required to update inventory when new wine shipments arrive.
We'll know we're right when recording a new batch of wines feels easy and fast, including on mobile.

## Users

**Primary User**: Curator/admin role (currently just the owner). Updates wine inventory from their phone when new shipments arrive, and occasionally from a laptop.

**Job to Be Done**: When we get new wines, I want to quickly filter and find relevant wines in the catalog, so I can update inventory or add new vintages without friction.

**Non-Users**: Regular (read-only) users and the general public browsing the menu — this is a curator-only workflow.

## Solution

Improve the wine curation page (`ManageWinePage`) with two capabilities: (1) filter controls matching those available on the public wine browse page — including a new winery filter and an expanded location filter added to both pages — plus a text search filter on the curation page only, so curators can quickly narrow the wine list; (2) a "New Vintage" action on each wine card that pre-populates the create form with all fields from the selected wine except the vintage year and inventory counts. The page must be fully mobile-friendly.

The location filter matches a wine if **either** the wine's own location **or** the winery's location falls within the selected location hierarchy. Example: R5 Winery is based in Chester County, PA but sources grapes from California — filtering by Pennsylvania or California should return R5 wines in both cases.

### MVP Scope

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Winery filter on wine browse page | Enables filtering by producer; added to both pages together |
| Must | Enhanced location filter on wine browse page | Matches wine if wine's location OR winery's location is within selected hierarchy |
| Must | Winery filter + location filter on curation page | Mirrors wine browse page filters; same dual-location matching logic |
| Must | Text search filter on curation page (by label, winery, or varietal) | User explicitly requested; not on browse page |
| Must | "New Vintage" action on each wine card | Core ask; eliminates manual re-entry for same wine, new year |
| Must | Mobile-friendly layout for filters and new vintage action | Primary use case is phone-based inventory updates |
| Won't | Additional filters beyond location and winery (except text search on curation) | Explicitly out of scope per user |

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Task ease | User describes updating a new shipment as "easy" | Direct feedback from primary user |
| Time on task | Noticeably faster than current process | Subjective — no baseline measurement exists |

## Open Questions

- [x] **Winery filter scope**: Add winery filter to both the public wine browse page and the curation page.
- [x] **Winery filter scope**: Add winery filter to both the public wine browse page and the curation page.
- [x] **"New Vintage" inventory defaults**: Refrigerated and cellared counts default to 0.
- [x] **New Vintage year**: Pre-populate with the source wine's vintage year + 1.
- [x] **Filter persistence**: Filters reset on each page visit (no URL param persistence needed).

## Implementation Phases

| # | Phase | Description | Status | Depends |
|---|-------|-------------|--------|---------|
| 1 | Winery filter + enhanced location filter on browse page | Add winery filter to WinePage/WineFilterControls; update location filter to match on wine location OR winery location; backend query changes | pending | - |
| 2 | Filters on curation page | Add winery filter, location filter (same dual-location logic), and text search to ManageWinePage; mobile-friendly layout | pending | 1 |
| 3 | New Vintage action | Add "New Vintage" button to each wine card; pre-populate with source wine data, vintage year+1, inventory at 0 | pending | - |

---

*Generated: 2026-05-10*
*Status: DRAFT - needs validation*
