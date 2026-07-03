# Plan: Inventory Mode — Search/Filter Within Inventory Lists

## Summary

Add an always-visible client-side search box to the top of both `BeerInventory.tsx` and `WineInventory.tsx`. Typing filters the already-fetched `listAvailable` result down to items whose name/brewery (beer) or label/winery (wine) match, case-insensitively. No new tRPC procedures or DB queries are needed — `wine.listAvailable` already returns `wineryName` per row; for beer, `beer.listAvailable` returns only bare `beer` columns (no brewery name), so the page will additionally fetch `trpc.brewery.list.useQuery()` and build a `breweryId → name` lookup map, mirroring the existing pattern in `BeerBrowser.tsx:145-148`. The search filter composes with (doesn't replace) the existing "confirmed" filter — both are just predicates applied to the fetched array before render.

## User Story

As a curator
I want to search or filter the beer/wine inventory lists
So that reviewing stays fast as the catalog grows

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | client (BeerInventory.tsx, WineInventory.tsx) |
| GitHub Issue | 130 |

---

## Patterns to Follow

### Naming / Search Input
```tsx
// SOURCE: client/src/pages/BeerPage.tsx:249-254
<Input
  placeholder="Search beers..."
  value={search}
  onChange={e => setSearch(e.target.value)}
  className="flex-1"
/>
```

### Brewery name lookup (client-side join by ID)
```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:145-148
const getBreweryName = (breweryId: number | null | undefined) => {
  return (
    breweries.find(b => b.breweryId === breweryId)?.name || "Unknown Brewery"
  );
};
```

### Existing derived-filter pattern already in BeerInventory/WineInventory (search will compose with this)
```tsx
// SOURCE: client/src/pages/BeerInventory.tsx:19-20
const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
const visibleBeers = beers?.filter((b) => !confirmedIds.has(b.beerId));
```

### Empty state
```tsx
// SOURCE: client/src/pages/BeerInventory.tsx:84-85
visibleBeers?.length === 0 ? (
  <div className="text-center py-8 text-gray-500">No beers currently available.</div>
) : ( ... )
```

### Wine row already carries the field needed for search (no backend change for wine)
```ts
// SOURCE: server/db_wine.ts:649-661 (getAvailableWinesFiltered, used by wine.listAvailable)
.select({
  wineId: wine.wineId,
  label: wine.label,
  ...
  wineryName: winery.name,
  ...
})
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `client/src/pages/BeerInventory.tsx` | UPDATE | Add search input, brewery-name lookup, and combined confirmed+search filter |
| `client/src/pages/WineInventory.tsx` | UPDATE | Add search input and combined confirmed+search filter using existing `wineryName` field |

No server, schema, or router changes — both `listAvailable` queries already return everything needed (wine directly; beer via an existing separate `brewery.list` query already used elsewhere in the app for the same purpose).

---

## Tasks

### Task 1: Add search to BeerInventory.tsx

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `import { Input } from "@/components/ui/input";` and `Search` icon import from `lucide-react` is optional (skip icon — match the plain `Input` style used in `BeerPage.tsx:249-254`, no icon).
  - Add `const { data: breweries } = trpc.brewery.list.useQuery();` (fetch alongside the existing `beers` query at line 16).
  - Add `const [search, setSearch] = useState("");` next to the existing `confirmedIds` state (line 19).
  - Add a `getBreweryName` helper mirroring `BeerBrowser.tsx:145-148`, but return `""` (not `"Unknown Brewery"`) when unmatched, since this is used for search matching, not display: `breweries?.find((b) => b.breweryId === breweryId)?.name ?? ""`.
  - Replace the `visibleBeers` derivation (line 20) with a combined filter:
    ```tsx
    const searchLower = search.trim().toLowerCase();
    const visibleBeers = beers?.filter((b) => {
      if (confirmedIds.has(b.beerId)) return false;
      if (!searchLower) return true;
      const breweryName = getBreweryName(b.breweryId);
      return (
        b.name.toLowerCase().includes(searchLower) ||
        breweryName.toLowerCase().includes(searchLower)
      );
    });
    ```
  - Render the search `Input` in `<main>`, above the list (before the `beersLoading ? ... : ...` block), always visible (not in a Sheet/dialog — this is a fast in-and-out phone workflow, not the persistent management page):
    ```tsx
    <Input
      placeholder="Search beers..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-11 text-base"
      aria-label="Search beers"
    />
    ```
  - Update the empty-state message (line 85) to distinguish "search matched nothing" from "nothing available at all":
    ```tsx
    {search ? "No beers match your search." : "No beers currently available."}
    ```
- **Mirror**: `client/src/pages/BeerPage.tsx:249-254` (Input pattern), `client/src/pages/BeerBrowser.tsx:145-148` (brewery lookup)
- **Validate**: `npm run check`

### Task 2: Add search to WineInventory.tsx

- **File**: `client/src/pages/WineInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `import { Input } from "@/components/ui/input";`.
  - Add `const [search, setSearch] = useState("");` next to the existing `confirmedIds` state (line 69).
  - Add `wineryName: string | null` to the local `WineRow` type (line 12-18) so it's available for search — the field already exists on the query result; the type just wasn't declared on this narrower local type before.
  - Replace the `visibleWines` derivation (line 70) with a combined filter:
    ```tsx
    const searchLower = search.trim().toLowerCase();
    const visibleWines = wines?.filter((w) => {
      if (confirmedIds.has(w.wineId)) return false;
      if (!searchLower) return true;
      return (
        w.label.toLowerCase().includes(searchLower) ||
        (w.wineryName ?? "").toLowerCase().includes(searchLower)
      );
    });
    ```
  - Render the search `Input` in `<main>`, above the list (before the `winesLoading ? ... : ...` block), same style as Task 1:
    ```tsx
    <Input
      placeholder="Search wines..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-11 text-base"
      aria-label="Search wines"
    />
    ```
  - Update the empty-state message (line 159):
    ```tsx
    {search ? "No wines match your search." : "No wines currently available."}
    ```
- **Mirror**: Task 1's pattern in `BeerInventory.tsx`; wine query already includes `wineryName` per `server/db_wine.ts:659`
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Build
npm run build
```

No `npm test` impact expected — this feature has no server-side changes and the project's Vitest suite covers `server/**/*.test.ts` only (no frontend test harness exists for these pages).

Manual verification (dev server, phone-width viewport):
1. Navigate to `/beer/inventory` as a curator. Type a brewery name that isn't in any beer's own name — confirm it still filters correctly (proves the brewery-name lookup path works, not just `beer.name`).
2. Type a search term matching nothing — confirm the "No beers match your search." empty state appears, not an error.
3. Clear the search box — confirm the full (minus any confirmed) list reappears.
4. Confirm an item, then search — confirm confirmed items stay hidden regardless of search term (the two filters compose).
5. Repeat 1-4 on `/wine/inventory`, searching by winery name.

---

## Acceptance Criteria

- [ ] Beer inventory list filters by name or brewery, client-side, no new query
- [ ] Wine inventory list filters by label or winery, client-side, no new query
- [ ] Search term matching nothing shows an empty state, not an error
- [ ] Clearing the search box restores the full (minus confirmed/edited-out) list
- [ ] `npm run check` passes
- [ ] Follows existing patterns (`Input` styling, client-side derived filtering, brewery-lookup convention)
