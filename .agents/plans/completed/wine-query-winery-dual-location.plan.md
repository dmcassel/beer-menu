# Plan: Wine Query — Winery Filter and Dual-Location Matching

## Summary

Add `wineryIds` as an optional filter parameter to `getAvailableWinesFiltered` and `wine.listAvailable`, and extend the location filter to match a wine if **either** the wine's own `locationId` or its winery's `locationId` falls within the selected location hierarchy. Also update `getAvailableLocations` to surface winery locations in the filter options, and add a dedicated wine query test file covering the new behavior.

## User Story

As a curator,
I want the wine backend to filter by winery and match wines against both the wine's location and the winery's location,
So that filter-based searches on the browse and curation pages return complete and accurate results.

## Metadata

| Field            | Value                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Type             | ENHANCEMENT                                                                        |
| Complexity       | MEDIUM                                                                             |
| Systems Affected | server/db_wine.ts, server/routers.ts, server/test-utils.ts, server/db_wine.test.ts |
| GitHub Issue     | 106                                                                                |

---

## Patterns to Follow

### Recursive CTE — current location descendant expansion

```typescript
// SOURCE: server/db_wine.ts:474-505
const result = await db.execute(sql`
  WITH RECURSIVE location_tree AS (
    SELECT location_id
    FROM location
    WHERE location_id IN (${sql.raw(locationIdList)})
    UNION ALL
    SELECT l.location_id
    FROM location l
    INNER JOIN location_tree lt ON l.parent_id = lt.location_id
  )
  SELECT ... FROM wine w
  LEFT JOIN winery wr ON w.winery_id = wr.winery_id
  LEFT JOIN location l  ON w.location_id = l.location_id
  WHERE (w.refrigerated > 0 OR w.cellared > 0)
    AND w.location_id IN (SELECT location_id FROM location_tree)
  ORDER BY w.label
`);
```

### Recursive CTE — current ancestor expansion (for filter options)

```typescript
// SOURCE: server/db_wine.ts:416-438
WITH RECURSIVE ancestor_tree AS (
  SELECT DISTINCT l.location_id
  FROM location l
  INNER JOIN wine w ON w.location_id = l.location_id
  WHERE (w.refrigerated > 0 OR w.cellared > 0)
  UNION
  SELECT l2.location_id FROM location l2
  INNER JOIN ancestor_tree at ON l2.location_id = (
    SELECT parent_id FROM location WHERE location_id = at.location_id
  )
  WHERE l2.location_id IS NOT NULL
)
```

### tRPC input schema with optional array

```typescript
// SOURCE: server/routers.ts:367-372
listAvailable: publicProcedure
  .input(
    z.object({
      locationIds: z.array(z.number()).optional(),
    })
  )
  .query(({ input }) => dbWine.getAvailableWinesFiltered(input.locationIds)),
```

### Drizzle path — no-filter wine query

```typescript
// SOURCE: server/db_wine.ts:520-538
const rows = await db
  .select({ ... })
  .from(wine)
  .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
  .leftJoin(location, eq(wine.locationId, location.locationId))
  .where(or(gt(wine.refrigerated, 0), gt(wine.cellared, 0)))
  .orderBy(wine.label);
```

### Test structure

```typescript
// SOURCE: server/db_additions.test.ts:1-24
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { seedDatabase, clearDatabase } from "./test-utils";

describe("...", () => {
  let seedData: Awaited<ReturnType<typeof seedDatabase>>;
  beforeAll(async () => { seedData = await seedDatabase({ id: "...", email: "..." }); });
  afterAll(async () => { await clearDatabase(); });
  ...
});
```

### clearDatabase pattern

```typescript
// SOURCE: server/test-utils.ts:20-32
await db.execute(sql`TRUNCATE TABLE menu_category_beer CASCADE;`);
await db.execute(sql`TRUNCATE TABLE beer CASCADE;`);
// ... one TRUNCATE per table, reverse dependency order
```

---

## Files to Change

| File                     | Action | Purpose                                                                                                                                             |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/test-utils.ts`   | UPDATE | Add wine table truncation to `clearDatabase`; add `seedWineDatabase` helper                                                                         |
| `server/db_wine.ts`      | UPDATE | Extend `getAvailableLocations` to include winery locations; extend `getAvailableWinesFiltered` to accept `wineryIds` and use dual-location OR logic |
| `server/routers.ts`      | UPDATE | Add `wineryIds` to `wine.listAvailable` input schema                                                                                                |
| `server/db_wine.test.ts` | CREATE | Tests for winery filter, dual-location matching, combined filters                                                                                   |

---

## Tasks

### Task 1: Extend `clearDatabase` in `server/test-utils.ts`

- **File**: `server/test-utils.ts`
- **Action**: UPDATE
- **Implement**: Add `TRUNCATE` statements for wine-related tables in reverse dependency order, inserted before the existing beer-related truncations:
  ```sql
  TRUNCATE TABLE wine_varietal CASCADE;
  TRUNCATE TABLE wine CASCADE;
  TRUNCATE TABLE varietal CASCADE;
  TRUNCATE TABLE winery CASCADE;
  TRUNCATE TABLE location CASCADE;
  ```
- **Mirror**: `server/test-utils.ts:25-31` — follow the same `db.execute(sql`TRUNCATE TABLE ... CASCADE;`)` pattern
- **Validate**: Existing tests still pass (`npm test`)

### Task 2: Add `seedWineDatabase` to `server/test-utils.ts`

- **File**: `server/test-utils.ts`
- **Action**: UPDATE
- **Implement**: Add a new exported async function `seedWineDatabase()` that inserts the following seed data and returns IDs for use in tests. Import `location`, `winery`, `wine`, `varietal`, `wineVarietal` from `../drizzle/schema`.

  Seed scenario (models the R5 / dual-location case):
  - **Locations**:
    - `usa` (country)
    - `pa` (area, parent: `usa`) — Pennsylvania
    - `chester_county` (vineyard, parent: `pa`) — Chester County, PA
    - `california` (area, parent: `usa`)
  - **Wineries**:
    - `r5` — name: "R5 Winery", `locationId: pa.locationId` (winery is in PA)
    - `napa_winery` — name: "Napa Valley Winery", `locationId: california.locationId`
  - **Varietals**:
    - `cab` — "Cabernet Sauvignon"
    - `chard` — "Chardonnay"
  - **Wines**:
    - `r5_cab` — label: "R5 Cab", `wineryId: r5.wineryId`, `locationId: california.locationId`, `refrigerated: 3`, `cellared: 0` (wine location is CA, winery is PA)
    - `r5_chard` — label: "R5 Chardonnay", `wineryId: r5.wineryId`, `locationId: california.locationId`, `refrigerated: 0`, `cellared: 5`
    - `napa_cab` — label: "Napa Cab", `wineryId: napa_winery.wineryId`, `locationId: california.locationId`, `refrigerated: 2`, `cellared: 0`
    - `out_of_stock` — label: "Out of Stock Wine", `wineryId: r5.wineryId`, `locationId: california.locationId`, `refrigerated: 0`, `cellared: 0`
  - **WineVarietals**: link `r5_cab` → `cab`, `r5_chard` → `chard`, `napa_cab` → `cab`

  Return all created entities as named properties.

- **Mirror**: `server/test-utils.ts:43-184` — follow the existing `seedDatabase` pattern (insert, `.returning()`, return named object)
- **Validate**: `npm run check`

### Task 3: Update `getAvailableLocations` in `server/db_wine.ts`

- **File**: `server/db_wine.ts`
- **Action**: UPDATE
- **Implement**: Replace the base case of the `ancestor_tree` CTE so it also seeds from winery locations. The base case becomes a subquery that unions wine locations and winery locations:

  ```sql
  WITH RECURSIVE ancestor_tree AS (
    SELECT DISTINCT wine_or_winery_loc.location_id
    FROM (
      -- Wine's own location
      SELECT w.location_id
      FROM wine w
      WHERE (w.refrigerated > 0 OR w.cellared > 0)
        AND w.location_id IS NOT NULL
      UNION
      -- Winery's location for wineries that have available wines
      SELECT wr.location_id
      FROM winery wr
      INNER JOIN wine w ON w.winery_id = wr.winery_id
      WHERE (w.refrigerated > 0 OR w.cellared > 0)
        AND wr.location_id IS NOT NULL
    ) wine_or_winery_loc

    UNION

    SELECT l2.location_id
    FROM location l2
    INNER JOIN ancestor_tree at ON l2.location_id = (
      SELECT parent_id FROM location WHERE location_id = at.location_id
    )
    WHERE l2.location_id IS NOT NULL
  )
  SELECT DISTINCT l.location_id as "locationId", l.name, l.type, l.parent_id as "parentId"
  FROM location l
  INNER JOIN ancestor_tree at ON l.location_id = at.location_id
  ORDER BY l.name
  ```

- **Mirror**: `server/db_wine.ts:416-438` — existing CTE structure
- **Validate**: `npm run check`

### Task 4: Update `getAvailableWinesFiltered` in `server/db_wine.ts`

- **File**: `server/db_wine.ts`
- **Action**: UPDATE
- **Implement**:
  1. Change function signature to:

     ```typescript
     export async function getAvailableWinesFiltered(locationIds?: number[], wineryIds?: number[]);
     ```

  2. **Raw SQL path** (when `locationIds` is non-empty): update the WHERE clause to use OR for dual-location matching, and append a winery ID filter if `wineryIds` is provided:

     ```sql
     WHERE (w.refrigerated > 0 OR w.cellared > 0)
       AND (
         w.location_id IN (SELECT location_id FROM location_tree)
         OR wr.location_id IN (SELECT location_id FROM location_tree)
       )
     ```

     If `wineryIds` is provided, append before `ORDER BY`:

     ```sql
       AND w.winery_id IN (${sql.raw(wineryIds.join(", "))})
     ```

  3. **Drizzle path** (no location filter): add winery filter when `wineryIds` is provided. Import `inArray` from `drizzle-orm`. Build the where condition:
     ```typescript
     const availabilityFilter = or(gt(wine.refrigerated, 0), gt(wine.cellared, 0));
     const wineryFilter = wineryIds && wineryIds.length > 0 ? inArray(wine.wineryId, wineryIds) : undefined;
     // combine: .where(wineryFilter ? and(availabilityFilter, wineryFilter) : availabilityFilter)
     ```

- **Mirror**: `server/db_wine.ts:465-557` — full function; `server/db.ts` for Drizzle `and`/`inArray` usage patterns
- **Validate**: `npm run check`

### Task 5: Update `wine.listAvailable` in `server/routers.ts`

- **File**: `server/routers.ts`
- **Action**: UPDATE
- **Implement**: Add `wineryIds` to the input schema and pass it to the DB function:
  ```typescript
  listAvailable: publicProcedure
    .input(
      z.object({
        locationIds: z.array(z.number()).optional(),
        wineryIds: z.array(z.number()).optional(),
      })
    )
    .query(({ input }) =>
      dbWine.getAvailableWinesFiltered(input.locationIds, input.wineryIds)
    ),
  ```
- **Mirror**: `server/routers.ts:364-372`
- **Validate**: `npm run check`

### Task 6: Create `server/db_wine.test.ts`

- **File**: `server/db_wine.test.ts`
- **Action**: CREATE
- **Implement**: Write a Vitest test file that:
  1. Calls `seedWineDatabase` in `beforeAll`, `clearDatabase` in `afterAll`
  2. Tests `getAvailableWinesFiltered`:
     - No filters → returns all 3 available wines (not the out-of-stock one)
     - Winery filter for R5 → returns `r5_cab` and `r5_chard` only
     - Winery filter for Napa → returns `napa_cab` only
     - Location filter for California → returns `r5_cab`, `r5_chard`, `napa_cab` (wine location matches)
     - Location filter for Pennsylvania → returns `r5_cab` and `r5_chard` (winery location matches; this is the dual-location case)
     - Location filter for USA (ancestor) → returns all 3 available wines (hierarchy expansion)
     - Location filter for California + winery filter for R5 → returns `r5_cab` and `r5_chard`
     - Winery filter for nonexistent ID → returns empty array
  3. Tests `getAvailableLocations`:
     - Returns California (wine location)
     - Returns Pennsylvania (winery location, even though no wine has PA as its own location)
     - Returns USA (ancestor of both CA and PA)

- **Mirror**: `server/db_additions.test.ts:1-57` — test structure, `beforeAll`/`afterAll` pattern
- **Validate**: `npm test`

---

## Validation

```bash
# Type check
npm run check

# Run tests (requires test DB)
npm run test:with-db
```

---

## Acceptance Criteria

- [ ] Given a winery ID filter, `wine.listAvailable` returns only wines from that winery
- [ ] Given a location filter, wines whose own `locationId` is in the hierarchy are included
- [ ] Given a location filter, wines whose winery's `locationId` is in the hierarchy are included (dual-location)
- [ ] Given no filters, all available wines are returned as before
- [ ] `getAvailableLocations` returns Pennsylvania when R5 Winery (based in PA) has wines with stock
- [ ] All tasks completed
- [ ] `npm run check` passes
- [ ] `npm test` passes
