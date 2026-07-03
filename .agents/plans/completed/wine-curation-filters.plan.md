# Plan: Wine Curation Filters

## Summary

Add winery, location, and text search filters to `ManageWinePage.tsx` with filtering at the database level. `getAllWines()` in `db_wine.ts` is updated to accept optional filter params and build WHERE clauses in the DB (including a recursive CTE for location hierarchy, matching `getAvailableWinesFiltered`'s pattern). `wine.list` in `routers.ts` gains an input schema to pass those params through. `ManageWinePage.tsx` adds filter state and passes it directly to the tRPC query — no client-side `useMemo` filtering needed. The filter UI mirrors `WinePage`: desktop grid, mobile Sheet drawer, and active-filter badges.

## Filter Semantics

- **Within a dimension** (e.g., two wineries selected): OR — show wines from winery A **or** winery B. Implemented via `inArray(wine.wineryId, wineryIds)`.
- **Across dimensions** (e.g., winery + location both set): AND — show wines that satisfy **all** active filters simultaneously. Implemented by combining each dimension's condition with `and()`.
- Example: wineries [A, B] + location [France] + search "cab" → wines from (A or B) that are in France and match "cab".

## User Story

As a curator,
I want to filter the wine curation page by winery, location, and text search,
So that I can quickly find specific wines when updating inventory after a new shipment.

## Metadata

| Field            | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Type             | ENHANCEMENT                                                                     |
| Complexity       | MEDIUM                                                                          |
| Systems Affected | `server/db_wine.ts`, `server/routers.ts`, `client/src/pages/ManageWinePage.tsx` |
| GitHub Issue     | 108                                                                             |

---

## Patterns to Follow

### DB filter function with CTE (location hierarchy)

```typescript
// SOURCE: server/db_wine.ts:477-563
// getAvailableWinesFiltered — use same recursive CTE approach,
// but drop the stock check (refrigerated>0 / cellared>0).
// Add text search as ilike on label, winery name, and EXISTS on varietal name.
export async function getAllWines(filters?: { wineryIds?: number[]; locationIds?: number[]; search?: string });
```

### Router input schema

```typescript
// SOURCE: server/routers.ts:366-373  (listAvailable pattern)
list: publicProcedure
  .input(
    z.object({
      wineryIds: z.array(z.number()).optional(),
      locationIds: z.array(z.number()).optional(),
      search: z.string().optional(),
    })
  )
  .query(({ input }) => dbWine.getAllWines(input)),
```

### Filter state + query in page

```typescript
// SOURCE: client/src/pages/WinePage.tsx:66-75
const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
const [selectedWineries, setSelectedWineries] = useState<string[]>([]);
const [isFilterOpen, setIsFilterOpen] = useState(false);
const [textSearch, setTextSearch] = useState("");

const {
  data: wines,
  isLoading,
  refetch,
} = trpc.wine.list.useQuery({
  wineryIds: selectedWineries.map((id) => parseInt(id, 10)),
  locationIds: selectedLocations.map((id) => parseInt(id, 10)),
  search: textSearch.trim() || undefined,
});
```

### WineFilterControls usage + mobile Sheet

```typescript
// SOURCE: client/src/pages/WinePage.tsx:130-223
// Desktop: hidden md:grid md:grid-cols-3 gap-4
// Mobile: Sheet open={isFilterOpen} side="bottom" h-[85vh]
// Both use <WineFilterControls ... /> and the text search <Input />
```

### Active filter badges

```typescript
// SOURCE: client/src/pages/WinePage.tsx:142-193
// selectedLocations and selectedWineries render dismissible <Badge> per value.
// textSearch renders a quoted badge. Clear All resets all state.
```

---

## Files to Change

| File                                  | Action | Purpose                                       |
| ------------------------------------- | ------ | --------------------------------------------- |
| `server/db_wine.ts`                   | UPDATE | Add optional filter params to `getAllWines()` |
| `server/routers.ts`                   | UPDATE | Add input schema to `wine.list` procedure     |
| `client/src/pages/ManageWinePage.tsx` | UPDATE | Filter state, query params, filter UI         |

---

## Tasks

### Task 1: Update `getAllWines()` to accept and apply filters

- **File**: `server/db_wine.ts`
- **Action**: UPDATE
- **Implement**: Change the signature to `getAllWines(filters?: { wineryIds?: number[]; locationIds?: number[]; search?: string; })`. Build WHERE conditions at the DB level:

  **When `locationIds` is non-empty**: use a raw SQL recursive CTE (same structure as `getAvailableWinesFiltered` lines 490–525) but without the stock check. The CTE expands all selected location IDs to their descendants; the wine matches if its `location_id` OR its winery's `location_id` is in that set (OR within the location dimension). Append `wineryIds` and `search` as additional AND clauses in the raw SQL (cross-dimension AND semantics): `AND w.winery_id IN (...)` and `AND (w.label ILIKE '%…%' OR wr.name ILIKE '%…%' OR EXISTS (varietal subquery))`.

  **When `locationIds` is empty**: use Drizzle ORM. Build one condition per active dimension, then combine all dimensions with `and()` (cross-dimension AND semantics):
  - Winery: `wineryIds?.length ? inArray(wine.wineryId, wineryIds) : undefined` — `inArray` is OR across all selected winery IDs.
  - Search (label/winery name): `search ? or(ilike(wine.label, \`%${search}%\`), ilike(winery.name, \`%${search}%\`)) : undefined`
  - Search (varietal name): `search ? sql\`EXISTS (SELECT 1 FROM wine_varietal wv JOIN varietal v ON wv.varietal_id = v.varietal_id WHERE wv.wine_id = ${wine.wineId} AND v.name ILIKE ${search})\` : undefined`

  Combine the label/winery/varietal search sub-conditions with `or()` (a wine matches search if any field matches). Then wrap all active dimension conditions in `and()`. Filter out `undefined` values before passing to `where()`.

  The varietal attachment loop (N+1 queries at lines 195–211) remains unchanged.

- **Mirror**: `server/db_wine.ts:477-563` — follow the same two-path structure (CTE vs Drizzle ORM)
- **Validate**: `npm run check`

### Task 2: Add input schema to `wine.list` router procedure

- **File**: `server/routers.ts`
- **Action**: UPDATE
- **Implement**: Replace the current no-input `list` procedure:

  ```typescript
  // Before:
  list: publicProcedure.query(() => dbWine.getAllWines()),

  // After:
  list: publicProcedure
    .input(
      z.object({
        wineryIds: z.array(z.number()).optional(),
        locationIds: z.array(z.number()).optional(),
        search: z.string().optional(),
      })
    )
    .query(({ input }) => dbWine.getAllWines(input)),
  ```

- **Mirror**: `server/routers.ts:366-373` — exact same shape as `listAvailable`
- **Validate**: `npm run check`

### Task 3: Add filter state and wire query in ManageWinePage

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: After the existing `useState` declarations (around line 20), add:

  ```typescript
  const [selectedWineries, setSelectedWineries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [textSearch, setTextSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  ```

  Update the existing `trpc.wine.list.useQuery()` call (line 32) to pass filter params:

  ```typescript
  const {
    data: wines,
    isLoading,
    refetch,
  } = trpc.wine.list.useQuery({
    wineryIds: selectedWineries.map((id) => parseInt(id, 10)),
    locationIds: selectedLocations.map((id) => parseInt(id, 10)),
    search: textSearch.trim() || undefined,
  });
  ```

  Add derived values after the query:

  ```typescript
  const hasActiveFilters = selectedWineries.length > 0 || selectedLocations.length > 0 || textSearch.trim().length > 0;
  const activeFilterCount = selectedWineries.length + selectedLocations.length + (textSearch.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedWineries([]);
    setSelectedLocations([]);
    setTextSearch("");
  };
  ```

- **Mirror**: `client/src/pages/WinePage.tsx:66-91`
- **Validate**: `npm run check`

### Task 4: Add imports

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: Add to the existing import block:
  - From `"lucide-react"`: add `Filter`, `X`
  - From `"@/components/ui/badge"`: add `Badge`
  - From `"@/components/ui/sheet"`: add `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`
  - From `"@/components/WineFilterControls"`: add `WineFilterControls`
- **Mirror**: `client/src/pages/WinePage.tsx:1-15` — check which import lines to mirror
- **Validate**: `npm run check`

### Task 5: Add desktop filter row and active filter badges to the JSX

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: Between the existing header row (`<div className="flex justify-between items-center">`) and the loading/grid section, insert:
  1. **Mobile filter button** — add inside the header row next to the "Add Wine" Dialog trigger:

  ```tsx
  <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)} className="md:hidden relative">
    <Filter className="w-4 h-4" />
    {activeFilterCount > 0 && (
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        {activeFilterCount}
      </Badge>
    )}
  </Button>
  ```

  2. **Desktop filter grid** — after the header row div:

  ```tsx
  <div className="hidden md:grid md:grid-cols-3 gap-4 mt-4">
    <WineFilterControls
      selectedLocations={selectedLocations}
      setSelectedLocations={setSelectedLocations}
      locations={locations ?? []}
      selectedWineries={selectedWineries}
      setSelectedWineries={setSelectedWineries}
      wineries={wineries ?? []}
    />
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
      <Input
        placeholder="Label, winery, or varietal..."
        value={textSearch}
        onChange={(e) => setTextSearch(e.target.value)}
      />
    </div>
  </div>
  ```

  3. **Active filter badges** — after the desktop filter grid:

  ```tsx
  {
    hasActiveFilters && (
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {selectedLocations.map((id) => {
          const loc = (locations ?? []).find((l) => l.locationId === parseInt(id, 10));
          return loc ? (
            <Badge
              key={`loc-${id}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedLocations(selectedLocations.filter((x) => x !== id))}
            >
              {loc.fullPath}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ) : null;
        })}
        {selectedWineries.map((id) => {
          const w = (wineries ?? []).find((w) => w.wineryId === parseInt(id, 10));
          return w ? (
            <Badge
              key={`winery-${id}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedWineries(selectedWineries.filter((x) => x !== id))}
            >
              {w.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ) : null;
        })}
        {textSearch.trim() && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setTextSearch("")}>
            "{textSearch}"<X className="w-3 h-3 ml-1" />
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear All
        </Button>
      </div>
    );
  }
  ```

- **Mirror**: `client/src/pages/WinePage.tsx:107-193`
- **Validate**: `npm run check`

### Task 6: Add mobile Sheet drawer

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: Before the closing `</div>` of the page (after the `DeleteConfirmDialog`), add:
  ```tsx
  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen} modal={false}>
    <SheetContent side="bottom" className="h-[85vh]">
      <SheetHeader>
        <SheetTitle>Filter Wines</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-6">
        <WineFilterControls
          selectedLocations={selectedLocations}
          setSelectedLocations={setSelectedLocations}
          locations={locations ?? []}
          selectedWineries={selectedWineries}
          setSelectedWineries={setSelectedWineries}
          wineries={wineries ?? []}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
          <Input
            placeholder="Label, winery, or varietal..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters} className="w-full">
            Clear All Filters
          </Button>
        )}
      </div>
    </SheetContent>
  </Sheet>
  ```
- **Mirror**: `client/src/pages/WinePage.tsx:198-223`
- **Validate**: `npm run check`

### Task 7: Update the wine grid render to use filtered results

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: The `wines` array from the query now reflects filters, so no structural change is needed to the grid. Add an empty-state message when `!isLoading && wines?.length === 0`:
  ```tsx
  {
    !isLoading && wines?.length === 0 && (
      <p className="col-span-full text-center py-8 text-gray-500">
        {hasActiveFilters ? "No wines match your filters." : "No wines found."}
      </p>
    );
  }
  ```
  Place this inside the `<div className="grid ...">` before the `wines?.map(...)` call.
- **Mirror**: `client/src/pages/WinePage.tsx:231-238`
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Tests
npm test
```

---

## Acceptance Criteria

- [ ] Selecting a winery filter re-fetches and shows only wines from that winery
- [ ] Selecting a location filter re-fetches and shows wines where wine's location OR winery's location is within that hierarchy
- [ ] Text search re-fetches and filters by label, winery name, and varietal name (case-insensitive, DB-level)
- [ ] Multiple values within the same filter (e.g., two wineries) show wines matching any of them (OR)
- [ ] Multiple filter dimensions active simultaneously show only wines satisfying all of them (AND)
- [ ] Clearing any filter immediately re-fetches and updates the list
- [ ] On mobile, filters are accessible via the Sheet drawer without horizontal scrolling
- [ ] Active filters shown as removable badges
- [ ] Empty state message shown when no wines match
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`)
