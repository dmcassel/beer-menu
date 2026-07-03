# Plan: Winery Filter on Wine Browse Page

## Summary

Add a winery filter to the public wine browse page (`WinePage`). The backend already supports `wineryIds` filtering via `wine.listAvailable`; this plan is purely frontend work. We extend `WineFilterControls` to accept and render a winery multi-select, then wire up state, badge display, and the tRPC query in `WinePage`.

## User Story

As a user browsing the public wine menu
I want to filter wines by winery
So that I can quickly see all wines from a specific producer

## Metadata

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| Type             | ENHANCEMENT                                  |
| Complexity       | LOW                                          |
| Systems Affected | Frontend only (WinePage, WineFilterControls) |
| GitHub Issue     | 107                                          |

---

## Patterns to Follow

### Location filter in WineFilterControls (the model to mirror)

```typescript
// SOURCE: client/src/components/WineFilterControls.tsx:3-17
interface WineFilterControlsProps {
  selectedLocations: string[];
  setSelectedLocations: (value: string[]) => void;
  locations: Array<{ locationId: number; fullPath: string }>;
}

const locationOptions: MultiSelectOption[] = locations.map(loc => ({
  label: loc.fullPath,
  value: loc.locationId.toString(),
}));

<MultiSelect
  options={locationOptions}
  selected={selectedLocations}
  onChange={setSelectedLocations}
  placeholder="All Locations"
/>
```

### Winery fetch in curation form (how to get winery list)

```typescript
// SOURCE: client/src/pages/ManageWinePage.tsx:33-44
const { data: wineries } = trpc.winery.list.useQuery();

const wineryOptions: SearchableSelectOption[] =
  wineries?.map((w: any) => ({
    label: w.name,
    value: w.wineryId.toString(),
  })) || [];
```

### Active filter badge pattern

```tsx
// SOURCE: client/src/pages/WinePage.tsx:133-152
{
  selectedLocations.map((id) => {
    const loc = locations.find((l) => l.locationId === parseInt(id));
    return loc ? (
      <Badge
        key={`loc-${id}`}
        variant="secondary"
        className="cursor-pointer"
        onClick={() => setSelectedLocations(selectedLocations.filter((locId) => locId !== id))}
      >
        {loc.fullPath}
        <X className="w-3 h-3 ml-1" />
      </Badge>
    ) : null;
  });
}
```

### Backend tRPC signature (no changes needed)

```typescript
// SOURCE: server/routers.ts (wine.listAvailable)
z.object({
  locationIds: z.array(z.number()).optional(),
  wineryIds: z.array(z.number()).optional(),
});
```

---

## Files to Change

| File                                           | Action | Purpose                                      |
| ---------------------------------------------- | ------ | -------------------------------------------- |
| `client/src/components/WineFilterControls.tsx` | UPDATE | Add winery props and MultiSelect             |
| `client/src/pages/WinePage.tsx`                | UPDATE | Add winery state, fetch, query param, badges |

---

## Tasks

### Task 1: Extend WineFilterControls with winery filter

- **File**: `client/src/components/WineFilterControls.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `selectedWineries`, `setSelectedWineries`, and `wineries: Array<{ wineryId: number; name: string }>` to props interface
  - Build `wineryOptions: MultiSelectOption[]` mapping `wineryId.toString()` → `name`
  - Render a second `<div>` block below Location, with label "Winery" and `<MultiSelect>` using the same pattern as Location
- **Mirror**: `client/src/components/WineFilterControls.tsx:3-31` — follow the exact same structure for the new block
- **Validate**: `npm run check`

### Task 2: Wire winery filter into WinePage

- **File**: `client/src/pages/WinePage.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add state: `const [selectedWineries, setSelectedWineries] = useState<string[]>([]);`
  2. Fetch wineries: `const { data: wineries = [] } = trpc.winery.list.useQuery();`
  3. Update the `wine.listAvailable` query to pass `wineryIds: selectedWineries.map(id => parseInt(id))`
  4. Update `hasActiveFilters` to include `selectedWineries.length > 0`
  5. Update `activeFilterCount` to sum both arrays: `selectedLocations.length + selectedWineries.length`
  6. Update `handleClearFilters` to also call `setSelectedWineries([])`
  7. Pass `selectedWineries`, `setSelectedWineries`, and `wineries` to both `<WineFilterControls>` usages (desktop grid and mobile Sheet)
  8. Add winery active-filter badges in the badge section, mirroring the location badge pattern (key prefix `winery-`, display `winery.name`)
  9. Update the "No wines match" helper text to reference "filters" generically instead of "location filter" only
- **Mirror**: `client/src/pages/WinePage.tsx:66-84,122-162` — mirror existing location filter state and badge patterns exactly
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Tests (no new tests needed — backend is already tested; this is UI wiring)
npm test
```

---

## Acceptance Criteria

- [ ] Winery filter visible in desktop filter grid and mobile drawer
- [ ] Selecting a winery shows only wines from that winery
- [ ] Selecting winery + location shows wines matching both filters
- [ ] Clearing a winery badge removes it; Clear All resets both filters
- [ ] Filter count badge on mobile button reflects total active filters (winery + location)
- [ ] Type check passes (`npm run check`)
