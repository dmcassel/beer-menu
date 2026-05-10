# Plan: BeerPage Filter Controls UI

## Summary

Add filter controls to the curator BeerPage tab so curators can quickly locate beers by text search, menu category, style, and brewery. The backend filter support already exists (`beer.list` accepts `search`, `menuCategoryIds`, `styleIds`, `breweryIds` as of PR #96). This plan wires up the existing `FilterControls` component and updates the `beer.list` query to pass live filter state — all changes are confined to a single file.

## User Story

As a curator  
I want to filter the beer list by text search, menu category, style, and brewery  
So that I can quickly locate the specific beer I need to update

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | Frontend only (`client/src/pages/BeerPage.tsx`) |
| GitHub Issue | 97 |

---

## Patterns to Follow

### Filter state + debounced search
```typescript
// SOURCE: client/src/pages/BeerBrowser.tsx:73-77
const [selectedMenuCategories, setSelectedMenuCategories] = useState<string[]>([]);
const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
const [selectedBreweries, setSelectedBreweries] = useState<string[]>([]);

// Debounce pattern (not in BeerBrowser, but standard React idiom for this codebase):
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
// useEffect with setTimeout/clearTimeout — no external debounce library needed
```

### FilterControls usage
```typescript
// SOURCE: client/src/pages/BeerBrowser.tsx:206-216
<div className="grid grid-cols-3 gap-4">
  <FilterControls
    selectedMenuCategories={selectedMenuCategories}
    setSelectedMenuCategories={setSelectedMenuCategories}
    selectedStyles={selectedStyles}
    setSelectedStyles={setSelectedStyles}
    selectedBreweries={selectedBreweries}
    setSelectedBreweries={setSelectedBreweries}
    menuCategories={menuCategories}
    styles={styles}
    breweries={breweries}
  />
</div>
```

### FilterControls expected prop shapes
```typescript
// SOURCE: client/src/components/FilterControls.tsx:3-13
// menuCategories must be Array<{ menu_cat_id: number; name: string }>
// styles must be Array<{ styleId: number; name: string }>
// breweries must be Array<{ breweryId: number; name: string }>

// IMPORTANT: trpc.menuCategory.listAvailable returns { menu_cat_id, name, description }
// (raw SQL snake_case) — matches FilterControls interface directly.
// trpc.menuCategory.list (Drizzle) returns { menuCatId, name } — would need mapping.
// Use listAvailable to avoid transformation.
```

### Passing filters to beer.list query
```typescript
// SOURCE: server/routers.ts:182-191
// beer.list accepts: { search?, menuCategoryIds?, styleIds?, breweryIds? }
// All optional; pass numeric arrays converted from string state
const { data: beers } = trpc.beer.list.useQuery({
  search: debouncedSearch || undefined,
  menuCategoryIds: selectedMenuCategories.map(id => parseInt(id)),
  styleIds: selectedStyles.map(id => parseInt(id)),
  breweryIds: selectedBreweries.map(id => parseInt(id)),
});
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `client/src/pages/BeerPage.tsx` | UPDATE | Add filter state, debounced search, filter UI, updated query |

---

## Tasks

### Task 1: Add filter state and debounced search

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `useEffect` to existing imports (already has `useState`)
  - Add four state vars after the existing `useState` declarations (around line 14):
    ```typescript
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedMenuCategories, setSelectedMenuCategories] = useState<string[]>([]);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedBreweries, setSelectedBreweries] = useState<string[]>([]);
    ```
  - Add debounce `useEffect` after the state declarations:
    ```typescript
    useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 300);
      return () => clearTimeout(timer);
    }, [search]);
    ```
- **Mirror**: `client/src/pages/BeerBrowser.tsx:73-77` for state shape
- **Validate**: `npm run check`

### Task 2: Add menuCategory query and update beer list query

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `trpc.menuCategory.listAvailable.useQuery()` alongside the existing `brewery` and `style` queries (around line 29):
    ```typescript
    const { data: menuCategories = [] } = trpc.menuCategory.listAvailable.useQuery();
    ```
  - Replace the existing `trpc.beer.list.useQuery({})` call (line 28) with:
    ```typescript
    const { data: beers, isLoading, refetch } = trpc.beer.list.useQuery({
      search: debouncedSearch || undefined,
      menuCategoryIds: selectedMenuCategories.map(id => parseInt(id)),
      styleIds: selectedStyles.map(id => parseInt(id)),
      breweryIds: selectedBreweries.map(id => parseInt(id)),
    });
    ```
- **Mirror**: `client/src/pages/BeerBrowser.tsx:83-94` for query patterns
- **Validate**: `npm run check`

### Task 3: Add filter UI above the beer list

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add import for `FilterControls` at the top of the file:
    ```typescript
    import { FilterControls } from "@/components/FilterControls";
    ```
  - Insert a filter section in the JSX between the header `<div>` (the "Add Beer" button row) and the loading/list section (around line 212, before `{isLoading ? ...}`):
    ```tsx
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <Input
        placeholder="Search beers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-4">
        <FilterControls
          selectedMenuCategories={selectedMenuCategories}
          setSelectedMenuCategories={setSelectedMenuCategories}
          selectedStyles={selectedStyles}
          setSelectedStyles={setSelectedStyles}
          selectedBreweries={selectedBreweries}
          setSelectedBreweries={setSelectedBreweries}
          menuCategories={menuCategories}
          styles={styles ?? []}
          breweries={breweries ?? []}
        />
      </div>
    </div>
    ```
  - `Input` is already imported. `styles` and `breweries` are already fetched. No new imports needed beyond `FilterControls`.
- **Mirror**: `client/src/pages/BeerBrowser.tsx:205-216` for FilterControls layout
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Tests (requires test DB)
npm test
```

---

## Acceptance Criteria

- [ ] Typing in the search input filters the beer list after ~300ms (debounced, server-side)
- [ ] Selecting menu categories from the multi-select filters the list
- [ ] Selecting styles from the multi-select filters the list
- [ ] Selecting breweries from the multi-select filters the list
- [ ] Multiple active filters apply AND logic (all conditions must match)
- [ ] Filters reset on page reload (no persistence)
- [ ] Filter controls are visible on the BeerPage curator tab in a 3-column layout
- [ ] `npm run check` passes with no type errors
