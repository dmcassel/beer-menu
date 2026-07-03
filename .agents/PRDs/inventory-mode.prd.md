# Inventory Mode

## Problem Statement

Curators (currently David and Dawn) periodically walk the physical stock to confirm what beer and wine is actually on hand. Today that means opening the management page, scrolling to find items marked available, editing one, getting kicked back to the top of the list, and re-scrolling to find the next item. This is already slow and gets worse as the catalog grows — a recent inventory pass was described as an unpleasant experience.

## Key Hypothesis

We believe a dedicated Inventory Mode — one for beer, one for wine — that lists only currently-available items with inline quantity/status editing will let curators reconcile stock much faster than the current edit-and-lose-your-place workflow.

We'll know we're right when a full inventory pass feels noticeably faster and less tedious to David and Dawn, and they no longer avoid doing it because of the process itself. (No hard usage metrics — this is a 2-person internal tool, so the signal is direct feedback after use.)

## Users

**Primary User**: Curators — David and Dawn — who walk the cellar/cooler with a phone and reconcile physical stock against the catalog.

**Job to Be Done**: When I'm checking the inventory, I want to quickly update the list, so I can know what we really have.

**Non-Users**: The `user` role (read-only public menu viewers) — no access to Inventory Mode.

## Solution

Two new curator-only views, Beer Inventory and Wine Inventory, each showing only items currently considered available (beer: `on_tap` / `bottle_can`; wine: cellar count > 0 or refrigerator count > 0). Each row supports inline editing directly in the list — no navigating to a separate edit page, no scroll-position loss.

Wine rows expose both cellar and fridge counts independently, since an update might increase or decrease either one, or represent a bottle moving from cellar to fridge (decrement one, increment the other). If a wine's cellar and fridge counts both reach 0 after an edit, it drops out of the current list — it's no longer available stock.

Beer rows expose the status control; if a beer's status is changed to `Out`, it drops out of the current list for the same reason.

Each row also has a "confirmed present" action, separate from editing, that marks an item as reviewed this session and removes it from the list. This is the path for the common case where the count is already correct — no edit needed, just a quick tap to confirm and move on. It's session-only state (not persisted) and distinct from an edit: making a data edit does not itself confirm the item, and confirming does not change any data. This lets a curator distinguish what's left to check from what's already been handled, so the list visibly shrinks as they work through it — items are cleared either by editing them into unavailability or by explicitly confirming them as-is.

Layout is optimized for one-handed phone use while walking stock.

### MVP Scope

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Beer Inventory list: available beers only (`on_tap`/`bottle_can`), inline status change | Core workflow this PRD exists to fix |
| Must | Beer: changing status to `Out` removes the item from the current list | Item is no longer available stock |
| Must | Wine Inventory list: wines with cellar or fridge count > 0, inline editing of both counts independently | Supports increases, decreases, and cellar↔fridge moves |
| Must | Wine: item drops off the list once both cellar and fridge counts reach 0 | Item is no longer available stock |
| Must | "Confirmed present" action per item (session-only, not persisted), distinct from editing, that removes it from the current list | Handles the common case where the count is already correct — no edit needed, just confirm and move on |
| Must | Inline edits apply without navigating away or resetting scroll position | This is the specific pain point being solved |
| Must | Mobile-browser-friendly layout and touch targets | Explicitly used while walking cellar/cooler with a phone |
| Should | Search/filter within the inventory list | Helps as catalog grows, per stated concern about list length |
| Won't (now) | Organize/group list by physical location | Explicitly deferred as a future feature |
| Won't | Barcode scanning | Not requested; adds scope beyond the core fix |
| Won't | Historical inventory audit log / change tracking over time | Not requested; out of scope for MVP |
| Won't | "Last checked" timestamp per item | Explicitly not needed |

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Time to complete a full inventory pass | Noticeably shorter than current process | Informal before/after comparison by David/Dawn |
| Curator sentiment after use | "Quicker, less painful" | Direct feedback after first real use |

*Note: no baseline timing exists yet — TBD whether it's worth instrumenting later.*

## Open Questions

None outstanding for MVP.

## Implementation Phases

| # | Phase | Description | Status | Depends |
|---|-------|-------------|--------|---------|
| 1 | Beer Inventory Mode | Filtered list of available beers with inline status editing, no scroll reset | pending | - |
| 2 | Wine Inventory Mode | Filtered list of available wines with inline quantity editing, no scroll reset | pending | - |
| 3 | Search/filter within inventory lists | Add lightweight filtering as catalog grows | pending | 1, 2 |
| 4 | Location-based organization (future) | Group/sort inventory items by physical location | pending | 1, 2 |

---

*Generated: 2026-07-02T18:19:47-04:00*
*Status: DRAFT - needs validation*
