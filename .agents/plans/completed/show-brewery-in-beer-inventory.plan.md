# Plan: Show Brewery in Beer Inventory View

## Summary

The beer inventory view (`BeerInventory.tsx`) already resolves each beer's brewery name client-side (via a separate `brewery.list` query + a `getBreweryName` lookup) to power search, but never displays it. We'll move brewery resolution into the server query — mirroring the exact pattern `db_wine.ts` already uses for wine/winery — so `beer.listAvailable` returns `breweryName` inline, then render it as a secondary line under the beer name in the inventory card, matching the existing `ManageWinePage.tsx` label/subtitle style. This also lets us delete the now-redundant client-side `brewery.list` query and lookup helper.

## User Story

As a curator managing beer inventory
I want to see which brewery each beer is from, not just its name
So that I can tell beers with duplicate/similar names apart while updating status

## Metadata

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| Type             | ENHANCEMENT                                 |
| Complexity       | LOW                                         |
| Systems Affected | Backend (one DB query), Frontend (one page) |
| GitHub Issue     | 144                                         |

---

## Patterns to Follow

### Server: join + explicit column select (mirror wine's pattern exactly)

```ts
// SOURCE: server/db_wine.ts:613-634 (getAvailableWinesFiltered, non-CTE branch)
wines = await db
  .select({
    wineId: wine.wineId,
    label: wine.label,
    vintage: wine.vintage,
    refrigerated: wine.refrigerated,
    cellared: wine.cellared,
    description: wine.description,
    wineryId: wine.wineryId,
    locationId: wine.locationId,
    wineryName: winery.name,
    locationName: location.name,
  })
  .from(wine)
  .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
  .leftJoin(location, eq(wine.locationId, location.locationId))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(wine.label);
```

The current beer function to change:

```ts
// SOURCE: server/db.ts:271-275 (getAllAvailableBeers)
export async function getAllAvailableBeers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(beer).where(ne(beer.status, "out")).orderBy(asc(beer.name));
}
```

`brewery`, `eq`, and `asc` are already imported in `server/db.ts` (used by `getAllBeers` just above), so no new imports are needed beyond what's already there.

### Client: local composite row type (mirror wine's local type exactly — no shared type exists for this)

```ts
// SOURCE: client/src/pages/WineInventory.tsx:13-20
type WineRow = {
  wineId: number;
  label: string;
  vintage: number | null;
  cellared: number | null;
  refrigerated: number | null;
  wineryName: string | null;
};
```

`shared/types.ts` only re-exports the bare Drizzle-inferred types (`export type * from "../drizzle/schema";`) — there is no existing composite "entity + related name" shared type anywhere in the codebase. Wine solves this with a local type in the consuming page, so beer should follow the same precedent rather than introducing a new shared type.

### Client: secondary subtitle line under the item name (mirror wine's curator-list pattern)

```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:379-382
<CardTitle className="text-lg font-medium">
  {wine.label} {wine.vintage && `(${wine.vintage})`}
</CardTitle>;
{
  wine.wineryName && <p className="text-sm text-gray-600 mt-1">{wine.wineryName}</p>;
}
```

`BeerInventory.tsx`'s card doesn't use `CardTitle`/`CardHeader` (it's a flat `CardContent` with a plain `<span>`), so we adapt this as a plain `<div>` wrapper with the existing `<span>` plus a new `<p>` underneath it — same text sizing/color (`text-sm text-gray-600`), no structural rework needed.

---

## Files to Change

| File                                 | Action | Purpose                                                                                                     |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| `server/db.ts`                       | UPDATE | Join `brewery` into `getAllAvailableBeers` and return `breweryName`                                         |
| `client/src/pages/BeerInventory.tsx` | UPDATE | Use the new `breweryName` field; drop the redundant client-side lookup; render brewery name under beer name |

---

## Tasks

### Task 1: Join brewery into `getAllAvailableBeers`

- **File**: `server/db.ts`
- **Action**: UPDATE
- **Implement**: Replace the body of `getAllAvailableBeers` (lines 271-275) with an explicit column select that left-joins `brewery` and includes `breweryName: brewery.name`:
  ```ts
  export async function getAllAvailableBeers() {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        beerId: beer.beerId,
        name: beer.name,
        description: beer.description,
        breweryId: beer.breweryId,
        styleId: beer.styleId,
        abv: beer.abv,
        ibu: beer.ibu,
        status: beer.status,
        breweryName: brewery.name,
      })
      .from(beer)
      .leftJoin(brewery, eq(beer.breweryId, brewery.breweryId))
      .where(ne(beer.status, "out"))
      .orderBy(asc(beer.name));
  }
  ```
  No new imports needed — `brewery`, `eq`, `asc`, `ne` are already imported at the top of `server/db.ts`.
- **Mirror**: `server/db_wine.ts:613-634` — same explicit-select + leftJoin shape.
- **Validate**: `npm run check`

### Task 2: Consume `breweryName` in `BeerInventory.tsx`, remove the now-redundant lookup

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add a local `BeerRow` type near the top of the file (after the `BeerStatus` type at line 12), mirroring `WineInventory.tsx:13-20`:
     ```ts
     type BeerRow = {
       beerId: number;
       name: string;
       breweryId: number | null;
       breweryName: string | null;
       status: BeerStatus | null;
     };
     ```
     (Only the fields actually used by this component need to be listed — matches the minimal-field style of `WineRow`.)
  2. Remove the `trpc.brewery.list.useQuery()` call (line 18) and the `getBreweryName` helper (lines 24-25) — no longer needed since `breweryName` now comes inline on each beer from the server.
  3. Update the search filter (lines 27-33) to read `b.breweryName` directly instead of calling `getBreweryName(b.breweryId)`:
     ```ts
     const searchLower = search.trim().toLowerCase();
     const visibleBeers = beers?.filter((b) => {
       if (confirmedIds.has(b.beerId)) return false;
       if (!searchLower) return true;
       return b.name.toLowerCase().includes(searchLower) || (b.breweryName ?? "").toLowerCase().includes(searchLower);
     });
     ```
     (Mirrors `WineInventory.tsx:78`'s `(w.wineryName ?? "").toLowerCase().includes(searchLower)` style exactly.)
  4. In the card rendering (around line 127), replace the single `<span>` with the name plus a subtitle line for brewery:
     ```tsx
     <div>
       <span className="text-lg font-medium">{beer.name}</span>
       {beer.breweryName && <p className="text-sm text-gray-600 mt-1">{beer.breweryName}</p>}
     </div>
     ```
- **Mirror**: `client/src/pages/WineInventory.tsx:13-20,78` for the type/filter pattern; `client/src/pages/ManageWinePage.tsx:379-382` for the subtitle rendering pattern.
- **Validate**: `npm run check`

---

## Validation

```bash
# Format (auto-fixes in place)
npm run format

# Type check
npm run check

# Production build (catches bundling issues npm run check won't)
npm run build

# Tests
npm test
```

Manual verification (no automated test coverage exists for this page — tests are server-only per `server/**/*.test.ts`):

1. Start `npm run dev`, log in as a curator, go to Beer Inventory.
2. Confirm each beer card now shows the brewery name under the beer name.
3. Confirm beers with no brewery (`breweryId` null) don't show a blank/empty subtitle line (the `{beer.breweryName && ...}` guard handles this).
4. Confirm search by brewery name still filters the list correctly (was already working before this change; must keep working after).

---

## Acceptance Criteria

- [ ] All tasks completed
- [ ] Type check passes
- [ ] Production build passes
- [ ] Beer inventory cards display the brewery name alongside the beer name
- [ ] Search by brewery name still works
- [ ] Follows existing patterns (mirrors `WineInventory.tsx`/`ManageWinePage.tsx`/`db_wine.ts`)

---

## Note: same latent gap exists on the wine side

`WineInventory.tsx` already fetches `wineryName` (used for search, `WineInventory.tsx:78`) but never renders it in its card either — the identical display gap as issue #144, just not yet reported. Out of scope for this plan since #144 only covers beer, but worth a follow-up issue if the user wants parity on the wine inventory view too.
