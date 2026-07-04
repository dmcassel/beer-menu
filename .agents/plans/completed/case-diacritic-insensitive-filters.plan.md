# Plan: Case- and Diacritic-Insensitive Filters

## Summary

Filters on the beer/wine browse and curation pages must match regardless of case and diacritics (e.g. searching "rose" or "Rose" must find "Rosé"; "troegs" must find "Tröegs"). Two independent layers need the fix: (1) the server-side text search used by the curation pages (`beer.list` / `wine.list`, backed by Postgres `ILIKE` in `server/db.ts` and `server/db_wine.ts`) is case-insensitive but not diacritic-insensitive, and (2) several client-side dropdown/inventory filters (`multi-select.tsx`, `BeerInventory.tsx`, `WineInventory.tsx`) do their own `.toLowerCase().includes()` matching, also case-insensitive only. A third component, `searchable-select.tsx`, already solves this correctly on the client with an NFD-normalize-and-strip-diacritics helper — that helper becomes the shared client-side pattern, and its equivalent (Postgres `unaccent()`) becomes the server-side pattern.

## User Story

As a curator or menu visitor
I want to filter beers/wines by name, brewery, winery, varietal, etc. without worrying about accents or capitalization
So that I can find "Rosé" by typing "rose" and "Tröegs" by typing "troegs"

## Metadata

| Field            | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Type             | BUG_FIX                                                                   |
| Complexity       | LOW                                                                       |
| Systems Affected | Postgres (new extension), server DB query layer, client filter components |
| GitHub Issue     | 121                                                                       |

---

## Patterns to Follow

### Existing diacritic-insensitive pattern (client) — the reference implementation

```ts
// SOURCE: client/src/components/ui/searchable-select.tsx:23-28
const normalizeString = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
```

This is the _only_ place in the codebase that currently does this correctly. It's local to one file — Task 6 extracts it to `client/src/lib/utils.ts` so `multi-select.tsx`, `BeerInventory.tsx`, and `WineInventory.tsx` can reuse it instead of re-inventing case-only matching.

### Existing case-insensitive-only pattern (server) — what's being extended

```ts
// SOURCE: server/db.ts:231-240 (getAllBeers)
if (search) {
  conditions.push(
    or(
      ilike(beer.name, `%${search}%`),
      ilike(beer.description, `%${search}%`),
      ilike(brewery.name, `%${search}%`),
      ilike(style.name, `%${search}%`)
    )
  );
}
```

`ilike()` from drizzle-orm folds case but not diacritics. Task 2 replaces these calls with a new `unaccentIlike()` helper that wraps both sides in Postgres's `unaccent()`.

### Existing case-insensitive-only pattern (client) — what's being fixed

```ts
// SOURCE: client/src/components/ui/multi-select.tsx:49-52
const filteredOptions = React.useMemo(() => {
  if (!searchQuery) return options;
  return options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));
}, [options, searchQuery]);
```

### DB function pattern (error handling / null-db guard)

```ts
// SOURCE: server/db.ts:224-226
export async function getAllBeers(filters: BeerFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  ...
```

### Test pattern (server)

```ts
// SOURCE: server/db.test.ts:270-274
it("should filter by text search on beer name", async () => {
  const beers = await getAllBeers({ search: "Hoppy" });
  expect(beers.length).toBe(1);
  expect(beers[0].name).toBe("Hoppy Pale Ale");
});
```

```ts
// SOURCE: server/db.test.ts:362-380 ("should delete beer") — pattern for creating a
// throwaway entity inline in a test and cleaning it up so it doesn't pollute
// count-based assertions elsewhere in the same describe block.
it("should delete beer", async () => {
  const newBeer = await createBeer({ name: "Temporary Beer", ... });
  const allBeers = await getAllBeers();
  const tempBeer = allBeers.find((b) => b.name === "Temporary Beer");
  await deleteBeer(tempBeer!.beerId);
  ...
});
```

---

## Files to Change

| File                                                 | Action | Purpose                                                                         |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `drizzle/migrations/0005_add_unaccent_extension.sql` | CREATE | Enable Postgres `unaccent` extension used by the new search helper              |
| `drizzle/migrations/meta/_journal.json`              | UPDATE | Register the new migration so `drizzle-kit migrate` picks it up                 |
| `server/db.ts`                                       | UPDATE | Add shared `unaccentIlike()` helper; use it in `getAllBeers` search             |
| `server/db_wine.ts`                                  | UPDATE | Use `unaccentIlike()` in both `getAllWines` code paths (CTE + Drizzle)          |
| `server/db.test.ts`                                  | UPDATE | Add diacritic-insensitive search test(s) for beer/brewery name                  |
| `server/db_wine.test.ts`                             | UPDATE | Add diacritic-insensitive search test(s) for wine label/winery, both code paths |
| `client/src/lib/utils.ts`                            | UPDATE | Add shared `normalizeSearchText()` (NFD strip + lowercase)                      |
| `client/src/components/ui/searchable-select.tsx`     | UPDATE | Use shared `normalizeSearchText()` instead of local copy                        |
| `client/src/components/ui/multi-select.tsx`          | UPDATE | Filter options using `normalizeSearchText()` instead of `.toLowerCase()`        |
| `client/src/pages/BeerInventory.tsx`                 | UPDATE | Use `normalizeSearchText()` for the client-side name/brewery filter             |
| `client/src/pages/WineInventory.tsx`                 | UPDATE | Use `normalizeSearchText()` for the client-side label/winery filter             |

10 files touched (1 CREATE + 9 UPDATE), within the 10-file PR-size limit. This is a single concern (consistent diacritic/case-insensitive filtering) implemented in two small, low-risk layers — both mechanical/trivial in size — so it stays one plan/PR per the "trivially small" exception.

### Risks

| Risk                                                                                                                                                        | Mitigation                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unaccent` extension requires `CREATE EXTENSION` privilege                                                                                                  | Confirmed low risk: both `postgres` and `postgres-test` docker-compose services use the official `postgres:16.11` image with a superuser role (`POSTGRES_USER`), and `unaccent` ships in the standard `postgres-contrib` package bundled in that image.                                           |
| Test DB migrations run via `drizzle-kit migrate` (`npm run test:db:migrate`), which reads `_journal.json`, not just the file listing                        | Must add a journal entry for the new migration file, not just drop the `.sql` file in the folder (the local dev script `scripts/migrate-local.js` reads the directory directly and would work without it, but `drizzle-kit migrate` — used for the test DB and via `npm run db:push` — will not). |
| `unaccent()` wrapping every comparison could bypass an index on `name`/`label` columns                                                                      | No indexes currently exist on these text columns (only PK/FK indexes) and table sizes are small (single-establishment catalog), so this is a non-issue; not adding a functional index in this plan.                                                                                               |
| Editing shared seed fixtures (`seedDatabase` / `seedWineDatabase` in `server/test-utils.ts`) to add accented names could shift counts other tests assert on | Don't touch the shared fixtures — add throwaway accented-name entities inline within the new test(s) (mirroring the existing "should delete beer" pattern) and clean them up, or place assertions after existing count-based tests.                                                               |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add the `unaccent` Postgres extension migration

- **File**: `drizzle/migrations/0005_add_unaccent_extension.sql`
- **Action**: CREATE
- **Implement**:
  ```sql
  -- Enable case/diacritic-insensitive text search (used by unaccentIlike() in server/db.ts)
  CREATE EXTENSION IF NOT EXISTS unaccent;
  ```
- **Mirror**: `drizzle/migrations/0004_add_location_id_to_winery.sql` — plain hand-written SQL file, no `statement-breakpoint` needed since there's only one statement.
- **Validate**: `npm run db:migrate` applies it locally without error (or `docker exec` into `beer_menu_db` and run `\dx` to confirm `unaccent` is listed).

### Task 2: Register the migration in the drizzle journal

- **File**: `drizzle/migrations/meta/_journal.json`
- **Action**: UPDATE
- **Implement**: Append a new entry to the `entries` array so `drizzle-kit migrate` (used by `npm run test:db:migrate` and `npm run db:push`) applies it:
  ```json
  {
    "idx": 5,
    "version": "7",
    "when": 1783173478000,
    "tag": "0005_add_unaccent_extension",
    "breakpoints": true
  }
  ```
  (Use the actual current epoch-ms timestamp at implementation time instead of copying the value above verbatim.)
- **Mirror**: `drizzle/migrations/meta/_journal.json:24-30` (the `0004_add_location_id_to_winery` entry) — same shape.
- **Validate**: `npm run test:db:migrate` runs cleanly against the test DB (port 5433) and reports the new migration applied.

### Task 3: Add a shared `unaccentIlike()` helper and use it for beer search

- **File**: `server/db.ts`
- **Action**: UPDATE
- **Implement**:
  1. Extend the drizzle-orm import to bring in `sql` and the `AnyColumn`/`SQL` types:
     ```ts
     import { asc, eq, and, ne, ilike, inArray, or, sql, type SQL, type AnyColumn } from "drizzle-orm";
     ```
  2. Add an exported helper near the top of the file (after `getDb`, before the query functions):
     ```ts
     // Matches ignoring both case and diacritics, e.g. "rose" matches "Rosé".
     export function unaccentIlike(column: AnyColumn, term: string): SQL {
       return sql`unaccent(${column}) ILIKE unaccent(${`%${term}%`})`;
     }
     ```
  3. In `getAllBeers` (currently `server/db.ts:231-240`), replace the four `ilike(...)` calls with `unaccentIlike(...)`:
     ```ts
     if (search) {
       conditions.push(
         or(
           unaccentIlike(beer.name, search),
           unaccentIlike(beer.description, search),
           unaccentIlike(brewery.name, search),
           unaccentIlike(style.name, search)
         )
       );
     }
     ```
  4. Leave every other `ilike`/`eq` usage in the file untouched — this issue is only about text search matching, not exact-match filters.
- **Mirror**: `server/db.ts:231-240` (existing search block) for structure; `server/db_additions.ts:1-6` for the "raw SQL needs care" comment style, though this helper uses Drizzle's `sql` tag (auto-parameterized, not raw string interpolation) so no injection risk.
- **Validate**: `npm run check`

### Task 4: Use `unaccentIlike()` in wine search (both code paths)

- **File**: `server/db_wine.ts`
- **Action**: UPDATE
- **Implement**:
  1. Import the helper:
     ```ts
     import { unaccentIlike } from "./db";
     ```
  2. Drizzle-path branch in `getAllWines` (currently `server/db_wine.ts:245-257`, the `else` branch with no `locationIds`):
     ```ts
     if (searchTerm) {
       conditions.push(
         or(
           unaccentIlike(wine.label, searchTerm),
           unaccentIlike(winery.name, searchTerm),
           sql`EXISTS (
             SELECT 1 FROM wine_varietal wv
             JOIN varietal v ON wv.varietal_id = v.varietal_id
             WHERE wv.wine_id = ${wine.wineId} AND unaccent(v.name) ILIKE unaccent(${`%${searchTerm}%`})
           )`
         )!
       );
     }
     ```
  3. Raw-SQL CTE branch (currently `server/db_wine.ts:220-232`, used when `locationIds` is set):
     ```ts
     ${
       searchTerm
         ? sql`AND (
           unaccent(w.label) ILIKE unaccent(${"%" + searchTerm + "%"})
           OR unaccent(wr.name) ILIKE unaccent(${"%" + searchTerm + "%"})
           OR EXISTS (
             SELECT 1 FROM wine_varietal wv
             JOIN varietal v ON wv.varietal_id = v.varietal_id
             WHERE wv.wine_id = w.wine_id AND unaccent(v.name) ILIKE unaccent(${"%" + searchTerm + "%"})
           )
         )`
         : sql``
     }
     ```
- **Mirror**: `server/db_wine.ts:220-257` (current search clauses in both branches).
- **Validate**: `npm run check`

### Task 5: Add server-side diacritic-insensitivity tests

- **File**: `server/db.test.ts`
- **Action**: UPDATE
- **Implement**: In the `describe("Beer Functions", ...)` (or equivalent) block, after the existing search tests (`server/db.test.ts:270-282`), add a test that creates a throwaway brewery/beer with a diacritic in the name and confirms an unaccented search term matches it, then cleans up:

  ```ts
  it("should match diacritic characters when searching without them", async () => {
    const testStyle = seedData.styles[0];
    const accentedBrewery = await createBrewery({ name: "Tröegs Independent Brewing" });
    const accentedBeer = await createBeer({
      name: "Rosé Ale",
      breweryId: accentedBrewery.breweryId,
      styleId: testStyle.styleId,
      status: "on_tap",
    });

    const byBeerName = await getAllBeers({ search: "rose" });
    expect(byBeerName.some((b) => b.name === "Rosé Ale")).toBe(true);

    const byBreweryName = await getAllBeers({ search: "troegs" });
    expect(byBreweryName.some((b) => b.name === "Rosé Ale")).toBe(true);

    await deleteBeer(accentedBeer.beerId);
    await deleteBrewery(accentedBrewery.breweryId);
  });
  ```

  Place this test _after_ `"should return all beers when no filters provided"` (`server/db.test.ts:265-268`) so its throwaway rows don't affect that count assertion; delete the rows at the end of the test so later tests in the same `describe` aren't affected either.

- **Mirror**: `server/db.test.ts:270-282` (search tests) and `server/db.test.ts:362-381` (create-then-delete cleanup pattern).
- **Validate**: `npm run test:db:start` then `npm test` (or `npm run test:with-db`)

### Task 6: Add wine diacritic-insensitivity tests (both query paths)

- **File**: `server/db_wine.test.ts`
- **Action**: UPDATE
- **Implement**: After the existing text-search tests (`server/db_wine.test.ts:54-73`), add two tests: one exercising the Drizzle path (no `locationIds`) and one exercising the raw-SQL CTE path (`locationIds` set), each creating and cleaning up a throwaway accented winery/wine:

  ```ts
  it("text search — diacritic-insensitive match, no location filter (Drizzle path)", async () => {
    const accentedWinery = await createWinery({ name: "Château Rosé" });
    const accentedWine = await createWine({
      label: "Rosé Blend",
      wineryId: accentedWinery.wineryId,
      refrigerated: 1,
      cellared: 0,
    });

    const wines = await getAllWines({ search: "chateau" });
    expect(wines.some((w) => w.label === "Rosé Blend")).toBe(true);

    await deleteWine(accentedWine.wineId);
    await deleteWinery(accentedWinery.wineryId);
  });

  it("text search — diacritic-insensitive match, with location filter (CTE path)", async () => {
    const accentedWinery = await createWinery({
      name: "Château Rosé",
      locationId: seedData.locations.california.locationId,
    });
    const accentedWine = await createWine({
      label: "Rosé Blend",
      wineryId: accentedWinery.wineryId,
      refrigerated: 1,
      cellared: 0,
    });

    const wines = await getAllWines({
      search: "rose",
      locationIds: [seedData.locations.california.locationId],
    });
    expect(wines.some((w) => w.label === "Rosé Blend")).toBe(true);

    await deleteWine(accentedWine.wineId);
    await deleteWinery(accentedWinery.wineryId);
  });
  ```

  Import `createWinery`, `createWine`, `deleteWinery`, `deleteWine` from `./db_wine` at the top of the file alongside the existing imports (`server/db_wine.test.ts:2`). Both are already exported (`server/db_wine.ts:47`, `server/db_wine.ts:433`), so this is just adding them to the import list.

- **Mirror**: `server/db_wine.test.ts:54-73` (search tests), `server/db_wine.test.ts:236-260` region (existing seed for `locationIds` in this file) for how `california`/`pa` location IDs are referenced.
- **Validate**: `npm test`

### Task 7: Extract shared `normalizeSearchText()` client utility

- **File**: `client/src/lib/utils.ts`
- **Action**: UPDATE
- **Implement**: Add an exported helper next to `cn()`:
  ```ts
  // Normalizes for case- and diacritic-insensitive comparisons, e.g. "Rosé" -> "rose".
  export function normalizeSearchText(str: string) {
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  ```
- **Mirror**: `client/src/components/ui/searchable-select.tsx:23-28` (the function being extracted, verbatim logic).
- **Validate**: `npm run check`

### Task 8: Point `searchable-select.tsx` at the shared utility

- **File**: `client/src/components/ui/searchable-select.tsx`
- **Action**: UPDATE
- **Implement**: Remove the local `normalizeString` function (lines 23-28) and import `normalizeSearchText` from `@/lib/utils` instead, updating the two call sites (`normalizedOptionsMap` build and the `Command` `filter` callback) to use the imported name.
- **Mirror**: existing `import { cn } from "@/lib/utils";` at `client/src/components/ui/searchable-select.tsx:3` — add `normalizeSearchText` to that same import line.
- **Validate**: `npm run check`

### Task 9: Make `multi-select.tsx` diacritic-insensitive

- **File**: `client/src/components/ui/multi-select.tsx`
- **Action**: UPDATE
- **Implement**: Import `normalizeSearchText` from `@/lib/utils` and use it in the `filteredOptions` memo (currently `client/src/components/ui/multi-select.tsx:49-52`):
  ```ts
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const normalizedQuery = normalizeSearchText(searchQuery);
    return options.filter((option) => normalizeSearchText(option.label).includes(normalizedQuery));
  }, [options, searchQuery]);
  ```
- **Mirror**: `client/src/components/ui/searchable-select.tsx:41-48` (pre-normalizing a map before filtering) — not strictly required here since `multi-select.tsx`'s option lists are small (menu categories/styles/breweries/wineries/locations), so re-normalizing on every keystroke is fine and matches the existing inline style of this file.
- **Validate**: `npm run check`; manually test in the browser (see Verification below).

### Task 10: Make `BeerInventory.tsx` and `WineInventory.tsx` diacritic-insensitive

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**: Import `normalizeSearchText` from `@/lib/utils` and update the filter (currently `client/src/pages/BeerInventory.tsx:23-27`):
  ```ts
  const searchNormalized = normalizeSearchText(search.trim());
  const visibleBeers = beers?.filter((b) => {
    if (confirmedIds.has(b.beerId)) return false;
    if (!searchNormalized) return true;
    return (
      normalizeSearchText(b.name).includes(searchNormalized) ||
      normalizeSearchText(b.breweryName ?? "").includes(searchNormalized)
    );
  });
  ```
- **Mirror**: `client/src/pages/WineInventory.tsx:74-79` (identical pattern, updated the same way in this same task).
- **Validate**: `npm run check`

  Repeat the equivalent change in `client/src/pages/WineInventory.tsx:74-79` (`label`/`wineryName` instead of `name`/`breweryName`).

---

## Validation

```bash
# Format (auto-fixes in place)
npm run format

# Type check
npm run check

# Production build (catches bundling issues npm run check won't)
npm run build

# Start/refresh the test DB and apply the new migration, then run tests
npm run test:db:start
npm test
```

### Manual verification (UI)

1. `npm run dev`
2. On the beer curation page (`BeerPage.tsx`), type an unaccented search term that should match an accented brewery/beer name (or temporarily add one via the admin UI) and confirm it's found.
3. On the wine curation page (`ManageWinePage.tsx`), same check for wine label/winery.
4. On the beer/wine browse pages, open a dropdown filter (menu category, style, brewery, winery, location) and type an unaccented query against an accented option label; confirm it's still found after the `multi-select.tsx` change.
5. On the Beer/Wine Inventory ("confirm present") pages, type an unaccented query against an accented beer/wine or brewery/winery name; confirm it's still found.

---

## Acceptance Criteria

- [ ] All tasks completed
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`), including new diacritic-insensitivity tests in `db.test.ts` and `db_wine.test.ts`
- [ ] Manual UI verification (5 steps above) confirms accent-insensitive matching on both browse and curation pages
- [ ] Follows existing patterns (`unaccentIlike` mirrors `ilike` usage; `normalizeSearchText` replaces the one-off `normalizeString` in `searchable-select.tsx` and is reused, not duplicated)
