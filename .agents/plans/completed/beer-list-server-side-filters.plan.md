# Plan: Server-Side Filters for beer.list

## Summary

Add optional filter parameters to `getAllBeers()` in `server/db.ts` and the `beer.list` tRPC procedure in `server/routers.ts`. Filtering uses Drizzle's `ilike` (text search across name, description, brewery name, style name) and `inArray` (ID filters for style, brewery, menu category). All filters are optional and ANDed together; no-arg calls continue to work unchanged.

## User Story

As a curator,
I want beer filtering to happen in the database,
So that the server only returns beers matching my filters, enabling fast and accurate results as the catalog grows.

## Metadata

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Type             | ENHANCEMENT                                              |
| Complexity       | MEDIUM                                                   |
| Systems Affected | `server/db.ts`, `server/routers.ts`, `server/db.test.ts` |
| GitHub Issue     | 96                                                       |

---

## Patterns to Follow

### Existing where clause pattern

```typescript
// SOURCE: server/db.ts:246-253
export async function getAllAvailableBeers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(beer).where(ne(beer.status, "out")).orderBy(asc(beer.name));
}
```

### Input procedure pattern

```typescript
// SOURCE: server/routers.ts:184-186
getById: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(({ input }) => db.getBeerById(input.id)),
```

### Tests — filtering with seed data

```typescript
// SOURCE: server/db.test.ts:251-262
describe("Beer Functions", () => {
  it("should get all beers", async () => {
    const beers = await getAllBeers();
    expect(Array.isArray(beers)).toBe(true);
    expect(beers.length).toBeGreaterThan(0);
  });

  it("should get beer by ID", async () => {
    const testBeer = seedData.beers[0];
    const beer = await getBeerById(testBeer.beerId);
    expect(beer).toBeDefined();
    expect(beer?.name).toBe("Hoppy Pale Ale");
  });
```

---

## Files to Change

| File                | Action | Purpose                                                                                            |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `server/db.ts`      | UPDATE | Add optional `filters` param to `getAllBeers()`, left-join brewery/style, build `where` conditions |
| `server/routers.ts` | UPDATE | Add Zod input schema to `beer.list` procedure and forward input to `getAllBeers()`                 |
| `server/db.test.ts` | UPDATE | Add integration tests for `getAllBeers()` with each filter type and combined filters               |

---

## Tasks

### Task 1: Update `getAllBeers()` in `server/db.ts`

- **File**: `server/db.ts`
- **Action**: UPDATE
- **Implement**:
  1. Add `ilike`, `inArray`, `or` to the `drizzle-orm` import on line 1 (keep existing `asc`, `eq`, `and`, `ne`)
  2. Define a `BeerFilters` interface above `getAllBeers()`:
     ```typescript
     interface BeerFilters {
       search?: string;
       menuCategoryIds?: number[];
       styleIds?: number[];
       breweryIds?: number[];
     }
     ```
  3. Replace `getAllBeers()` with a version that accepts `filters: BeerFilters = {}`:
     - Left-join `brewery` on `beer.breweryId = brewery.breweryId`
     - Left-join `style` on `beer.styleId = style.styleId`
     - Build a `conditions` array; push each clause only when the filter value is present and non-empty:
       - `search`: `or(ilike(beer.name, \`%${search}%\`), ilike(beer.description, \`%${search}%\`), ilike(brewery.name, \`%${search}%\`), ilike(style.name, \`%${search}%\`))`
       - `styleIds`: `inArray(beer.styleId, styleIds)`
       - `breweryIds`: `inArray(beer.breweryId, breweryIds)`
       - `menuCategoryIds`: `inArray(beer.beerId, db.select({ beerId: menuCategoryBeer.beerId }).from(menuCategoryBeer).where(inArray(menuCategoryBeer.menuCatId, menuCategoryIds)))`
     - Apply `.where(and(...conditions))` only when `conditions.length > 0`
     - Keep `.orderBy(asc(beer.name))`
- **Mirror**: `server/db.ts:246-253` — follow the same `getDb()` guard and query chain shape
- **Validate**: `npm run check`

### Task 2: Update `beer.list` in `server/routers.ts`

- **File**: `server/routers.ts`
- **Action**: UPDATE
- **Implement**:
  Replace line 182:
  ```typescript
  list: publicProcedure.query(() => db.getAllBeers()),
  ```
  with:
  ```typescript
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        menuCategoryIds: z.array(z.number()).optional(),
        styleIds: z.array(z.number()).optional(),
        breweryIds: z.array(z.number()).optional(),
      })
    )
    .query(({ input }) => db.getAllBeers(input)),
  ```
- **Mirror**: `server/routers.ts:184-186` (getById pattern)
- **Validate**: `npm run check`

### Task 3: Add integration tests in `server/db.test.ts`

- **File**: `server/db.test.ts`
- **Action**: UPDATE
- **Implement**:
  1. Add `getAllBeers` is already imported; no import changes needed.
  2. Inside the `"Beer Functions"` describe block (after the existing `"should get all beers"` test), add:
     - `"should return all beers when no filters provided"` — call `getAllBeers({})`, expect `length > 0`
     - `"should filter by text search on beer name"` — call `getAllBeers({ search: "Hoppy" })`, expect every result name to match (case-insensitive)
     - `"should filter by styleId"` — use `seedData.styles[0].styleId`, expect every result `styleId` to equal it
     - `"should filter by breweryId"` — use `seedData.breweries[0].breweryId`, expect every result `breweryId` to equal it
     - `"should filter by menuCategoryId"` — use `seedData.menuCategories[0].menuCatId`, expect at least one result
     - `"should return empty array when no beers match filter"` — call `getAllBeers({ search: "zzznomatch" })`, expect `length === 0`
     - `"should AND multiple filters together"` — pass both a valid `breweryId` and a matching `search`; expect non-empty results
- **Mirror**: `server/db.test.ts:251-262` — same `describe`/`it`/`expect` style with `seedData` IDs
- **Validate**: `npm run test:with-db`

---

## Validation

```bash
# Type check
npm run check

# Tests (manages DB lifecycle automatically)
npm run test:with-db
```

---

## Acceptance Criteria

- [ ] `getAllBeers()` with no args returns all beers (existing behavior)
- [ ] Text search matches on beer name, description, brewery name, and style name (case-insensitive, partial)
- [ ] `menuCategoryIds` filter returns only beers in those categories
- [ ] `styleIds` filter returns only beers with matching style
- [ ] `breweryIds` filter returns only beers from those breweries
- [ ] Multiple filters are ANDed together
- [ ] `BeerBrowser` page continues to work without changes (it calls `listAvailable`, not `list`)
- [ ] All new tests pass
- [ ] Type check passes
