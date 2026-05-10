# Plan: Mobile Bottom Sheet Drawer for BeerPage Filter Controls

## Summary

Add a mobile-responsive bottom sheet drawer to `BeerPage.tsx` for the filter controls. On small screens (below `md` breakpoint), inline filters are hidden and replaced with a "Filter" button that opens a Sheet drawer. On desktop, the existing inline `grid grid-cols-3` filter layout remains. This mirrors the identical pattern already implemented in `BeerBrowser.tsx`.

## User Story

As a curator using a phone at the bar,
I want the filter controls to appear in a bottom sheet drawer on small screens,
So that I can use the filters without the dropdowns consuming the entire viewport.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | `client/src/pages/BeerPage.tsx` |
| GitHub Issue | 99 |

---

## Patterns to Follow

### Mobile Filter Button (mobile-only, with active filter count badge)

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:184-199
<Button
  variant="outline"
  size="sm"
  onClick={() => setIsFilterOpen(true)}
  className="md:hidden relative"
>
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

### Desktop Filters (hidden on mobile)

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:205-217
<div className="hidden md:grid md:grid-cols-3 gap-4">
  <FilterControls ... />
</div>
```

### Bottom Sheet Drawer

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:294-322
<Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen} modal={false}>
  <SheetContent side="bottom" className="h-[85vh]">
    <SheetHeader>
      <SheetTitle>Filter Beers</SheetTitle>
    </SheetHeader>
    <div className="space-y-4 mt-6">
      <FilterControls ... />
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  </SheetContent>
</Sheet>
```

### State

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:78
const [isFilterOpen, setIsFilterOpen] = useState(false);
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `client/src/pages/BeerPage.tsx` | UPDATE | Add mobile filter button, hide inline filters on mobile, add Sheet drawer |

---

## Tasks

### Task 1: Add Sheet imports and isFilterOpen state

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add Sheet component imports: `Sheet, SheetContent, SheetHeader, SheetTitle` from `@/components/ui/sheet`
  2. Add `Badge` import from `@/components/ui/badge`
  3. Add `Filter` to the existing lucide-react import (currently imports `Plus, Trash2, Edit2`)
  4. Add state: `const [isFilterOpen, setIsFilterOpen] = useState(false);` after line 32 (existing filter state)
- **Mirror**: `client/src/pages/BeerBrowser.tsx:13-17` for Sheet imports, `:78` for state
- **Validate**: `npm run check`

### Task 2: Add activeFilterCount derived value

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**: Add a derived count after the `isFilterOpen` state line:
  ```tsx
  const activeFilterCount = selectedMenuCategories.length + selectedStyles.length + selectedBreweries.length;
  ```
- **Mirror**: Implied by the badge display in BeerBrowser; computed inline
- **Validate**: `npm run check`

### Task 3: Add mobile Filter button to the filter section header

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**: In the filter section (currently lines 230-249), restructure:
  - Wrap the section in a container that shows a row with the search input and a mobile Filter button
  - Add a mobile-only `<Button>` with `Filter` icon and active filter count badge (same pattern as BeerBrowser lines 184-199, but inline with search rather than in the page header)
  - The search `<Input>` stays always visible
  - Example structure:
    ```tsx
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <div className="flex gap-2">
        <Input
          placeholder="Search beers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(true)}
          className="md:hidden relative shrink-0"
        >
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
      </div>
      {/* Desktop Filters */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <FilterControls ... />
      </div>
    </div>
    ```
- **Mirror**: `client/src/pages/BeerBrowser.tsx:183-217`
- **Validate**: `npm run check`

### Task 4: Add Sheet drawer at the bottom of the component

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**: Add the Sheet drawer just before the closing `</div>` of the component return, after the `<DeleteConfirmDialog>` element (currently line 303-308):
  ```tsx
  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen} modal={false}>
    <SheetContent side="bottom" className="h-[85vh]">
      <SheetHeader>
        <SheetTitle>Filter Beers</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-6">
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
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMenuCategories([]);
              setSelectedStyles([]);
              setSelectedBreweries([]);
            }}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </SheetContent>
  </Sheet>
  ```
- **Mirror**: `client/src/pages/BeerBrowser.tsx:293-322`
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Tests (optional — no test file for BeerPage currently)
npm test
```

---

## Acceptance Criteria

- [ ] On mobile (< 768px), inline filter controls are hidden; a Filter button is shown next to the search input
- [ ] Tapping the Filter button opens a bottom sheet drawer with all FilterControls
- [ ] Filters selected in the drawer update the beer list when the drawer is closed
- [ ] Active filter count badge appears on the Filter button when filters are active
- [ ] On desktop (≥ 768px), filter controls show inline in `grid-cols-3` layout; no Filter button shown
- [ ] "Clear All Filters" button appears in the drawer when filters are active
- [ ] Type check passes (`npm run check`)
