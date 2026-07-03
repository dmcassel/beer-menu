# Plan: BeerPage Active Filter Badges and Clear All

## Summary

Add dismissible filter badges and a Clear All button to BeerPage, mirroring the pattern already implemented in BeerBrowser. When any multiselect filter is active, a badge row appears below the filter controls showing each active filter value as a clickable badge; clicking × removes that filter. Clear All resets all four filter state vars (search + 3 multiselects). The badge row hides when no filters are active.

## User Story

As a curator
I want to see which filters are active as dismissible badges and clear them all at once
So that I can understand and reset my current filter state without reopening dropdowns

## Metadata

| Field            | Value                           |
| ---------------- | ------------------------------- |
| Type             | ENHANCEMENT                     |
| Complexity       | LOW                             |
| Systems Affected | `client/src/pages/BeerPage.tsx` |
| GitHub Issue     | 98                              |

---

## Patterns to Follow

### Badge Rendering

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:220-289
{
  hasActiveFilters && (
    <div className="mt-4 flex items-center gap-2 flex-wrap">
      {selectedMenuCategories.map((id) => {
        const category = menuCategories.find((c) => c.menu_cat_id === parseInt(id));
        return category ? (
          <Badge
            key={`cat-${id}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setSelectedMenuCategories(selectedMenuCategories.filter((catId) => catId !== id))}
          >
            {category.name}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        ) : null;
      })}
      {/* ...styles, breweries similarly... */}
      <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-amber-700 hover:text-amber-900">
        Clear All
      </Button>
    </div>
  );
}
```

### Clear Filters + hasActiveFilters

```tsx
// SOURCE: client/src/pages/BeerBrowser.tsx:152-166
const handleClearFilters = () => {
  setSelectedMenuCategories([]);
  setSelectedStyles([]);
  setSelectedBreweries([]);
};

const hasActiveFilters = selectedMenuCategories.length > 0 || selectedStyles.length > 0 || selectedBreweries.length > 0;
```

---

## Files to Change

| File                            | Action | Purpose                                                    |
| ------------------------------- | ------ | ---------------------------------------------------------- |
| `client/src/pages/BeerPage.tsx` | UPDATE | Add Badge import, X icon, computed vars, and badge row JSX |

---

## Tasks

### Task 1: Add missing imports

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `X` to the lucide-react import (line 8 currently: `{ Plus, Trash2, Edit2 }`)
  - Add `import { Badge } from "@/components/ui/badge";` after the existing ui imports
- **Mirror**: `client/src/pages/BeerBrowser.tsx` top-level imports (Badge, X)
- **Validate**: `npm run check`

### Task 2: Add computed vars before the return statement

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**: Add these two derived values after the existing state declarations (around line 32), before `return`:

  ```tsx
  const hasActiveFilters =
    search.length > 0 || selectedMenuCategories.length > 0 || selectedStyles.length > 0 || selectedBreweries.length > 0;

  const handleClearFilters = () => {
    setSearch("");
    setSelectedMenuCategories([]);
    setSelectedStyles([]);
    setSelectedBreweries([]);
  };
  ```

  Note: BeerPage includes `search` in `hasActiveFilters` and `handleClearFilters` (unlike BeerBrowser which has no search input). This is per the issue spec.

- **Mirror**: `client/src/pages/BeerBrowser.tsx:152-166`
- **Validate**: `npm run check`

### Task 3: Add badge row JSX inside the filter section

- **File**: `client/src/pages/BeerPage.tsx`
- **Action**: UPDATE
- **Implement**: After the closing `</div>` of the `grid grid-cols-3` filter controls div (currently line 248), but still inside the outer `bg-gray-50` container div, add:

  ```tsx
  {
    hasActiveFilters && (
      <div className="flex items-center gap-2 flex-wrap">
        {selectedMenuCategories.map((id) => {
          const category = menuCategories.find((c) => c.menu_cat_id === parseInt(id, 10));
          return category ? (
            <Badge
              key={`cat-${id}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedMenuCategories(selectedMenuCategories.filter((catId) => catId !== id))}
            >
              {category.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ) : null;
        })}
        {selectedStyles.map((id) => {
          const style = styles?.find((s) => s.styleId === parseInt(id, 10));
          return style ? (
            <Badge
              key={`style-${id}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedStyles(selectedStyles.filter((styleId) => styleId !== id))}
            >
              {style.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ) : null;
        })}
        {selectedBreweries.map((id) => {
          const brewery = breweries?.find((b) => b.breweryId === parseInt(id, 10));
          return brewery ? (
            <Badge
              key={`brewery-${id}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedBreweries(selectedBreweries.filter((breweryId) => breweryId !== id))}
            >
              {brewery.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ) : null;
        })}
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-amber-700 hover:text-amber-900">
          Clear All
        </Button>
      </div>
    );
  }
  ```

- **Mirror**: `client/src/pages/BeerBrowser.tsx:220-289`
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Format
npm run format
```

---

## Acceptance Criteria

- [ ] When any filter (category, style, brewery) is active, badges appear below the filter controls
- [ ] Clicking × on a badge removes only that filter
- [ ] Clear All button resets search, categories, styles, and breweries
- [ ] No badges or Clear All shown when no filters are active
- [ ] Styling matches BeerBrowser (Badge variant="secondary", Button variant="ghost" amber colors)
- [ ] Type check passes
