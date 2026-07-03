# Plan: Wine Inventory Mode — List with Inline Cellar/Fridge Quantity Editing

## Summary

Add a curator-only `/wine/inventory` route and `WineInventory.tsx` page that lists every currently-available wine (`wine.listAvailable`, already server-side filtered to `cellared > 0 OR refrigerated > 0`) with per-row +/- steppers for cellar and fridge counts, independently adjustable. Stepper taps only change local pending state; a per-row "Save" action commits the changed field(s) — one or both — via a single `wine.update` call, satisfying both the "just the changed field(s)" and "cellar decrement + fridge increment saved together" acceptance criteria. On success the row is patched or removed from the TanStack Query cache in place (mirroring the beer inventory page's `setData` approach from #126), so scroll position is preserved. No backend changes needed — `wine.listAvailable` and `wine.update` already support this exactly as required. The "confirmed present" action is explicitly out of scope for this issue (deferred to a follow-up, mirroring how #127 followed #126 for beer).

## User Story

As a curator
I want to see a list of currently-available wines and adjust cellar/fridge counts inline
So that I can reconcile physical stock — including bottles moved between locations — quickly without leaving the list

## Metadata

| Field            | Value                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                                    |
| Complexity       | LOW                                                               |
| Systems Affected | client routing (`App.tsx`), new client page (`WineInventory.tsx`) |
| GitHub Issue     | 128                                                               |

---

## Patterns to Follow

### Route registration

```typescript
// SOURCE: client/src/App.tsx:24-26
<Route path="/beer-management" component={BeerManagement} />
<Route path="/beer/inventory" component={BeerInventory} />
<Route path="/wine-management" component={WineManagement} />
```

### Curator/admin guard (redirect pattern) — identical for wine

```typescript
// SOURCE: client/src/pages/BeerInventory.tsx:14,23-27,60-62
const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
...
useEffect(() => {
  if (!userLoading && (!user || (user.role !== "curator" && user.role !== "admin"))) {
    setLocation("/browser");
  }
}, [user, userLoading, setLocation]);
...
if (!user || (user.role !== "curator" && user.role !== "admin")) {
  return null;
}
```

### Cache-patch-in-place on mutation success (no refetch/remount → preserves scroll)

```typescript
// SOURCE: client/src/pages/BeerInventory.tsx:29-43
const handleStatusChange = async (beerId: number, status: BeerStatus) => {
  try {
    await updateMutation.mutateAsync({ id: beerId, status });
    if (status === "out") {
      utils.beer.listAvailable.setData(undefined, (old) => old?.filter((b) => b.beerId !== beerId));
    } else {
      utils.beer.listAvailable.setData(undefined, (old) =>
        old?.map((b) => (b.beerId === beerId ? { ...b, status } : b))
      );
    }
    toast.success("Status updated");
  } catch (error) {
    toast.error("Error updating status");
  }
};
```

**Important difference from beer**: `wine.listAvailable` takes a required (but all-optional-fields) input object, not `undefined`. It must be queried and cache-patched with the same input shape:

```typescript
// SOURCE: server/routers.ts:375-382
listAvailable: publicProcedure
  .input(z.object({ locationIds: z.array(z.number()).optional(), wineryIds: z.array(z.number()).optional() }))
  .query(({ input }) => dbWine.getAvailableWinesFiltered(input.locationIds, input.wineryIds)),
```

So the page must call `trpc.wine.listAvailable.useQuery({})` (not `.useQuery()`), and cache patches must use `utils.wine.listAvailable.setData({}, ...)` to match the exact query key — using `undefined` here would target a different (non-existent) cache entry and silently no-op.

### `wine.update` mutation (partial update, exactly what per-field save needs)

```typescript
// SOURCE: server/routers.ts:400-414
update: curatorProcedure
  .input(
    z.object({
      id: z.number(),
      label: z.string().optional(),
      wineryId: z.number().optional(),
      vintage: z.number().optional(),
      locationId: z.number().optional(),
      refrigerated: z.number().optional(),
      cellared: z.number().optional(),
      description: z.string().optional(),
      varietalIds: z.array(z.number()).optional(),
    })
  )
  .mutation(({ input }) => dbWine.updateWine(input.id, input)),
```

### Existing numeric fields being replaced by inline steppers (reference only — not reused directly)

```typescript
// SOURCE: client/src/pages/ManageWinePage.tsx:266-287
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="refrigerated">Refrigerated</Label>
    <Input id="refrigerated" type="number" min="0" value={formData.refrigerated} onChange={...} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="cellared">Cellared</Label>
    <Input id="cellared" type="number" min="0" value={formData.cellared} onChange={...} />
  </div>
</div>
```

### Button sizes available for touch targets

```typescript
// SOURCE: client/src/components/ui/button.tsx:23-30
size: {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-9",
  "icon-sm": "size-8",
  "icon-lg": "size-10",
}
```

`icon-lg` (40px) is the largest built-in; BeerInventory's `Select` used a custom `h-12` override for its touch target, so the stepper buttons here should similarly use a custom class (e.g. `h-11 w-11`) on top of `icon-lg` to stay comfortably tappable.

### Types

```typescript
// SOURCE: drizzle/schema.ts (re-exported via shared/types.ts)
export type Wine = typeof wine.$inferSelect; // has cellared: number, refrigerated: number
```

---

## Files to Change

| File                                 | Action | Purpose                                                                 |
| ------------------------------------ | ------ | ----------------------------------------------------------------------- |
| `client/src/pages/WineInventory.tsx` | CREATE | New curator-only inventory list page with inline cellar/fridge steppers |
| `client/src/App.tsx`                 | UPDATE | Register `/wine/inventory` route                                        |

No server changes: `wine.listAvailable` (`server/routers.ts:375`) and `wine.update` (`server/routers.ts:400`) already provide exactly the data/mutation shape this page needs.

---

## Tasks

### Task 1: Create `WineInventory.tsx`

- **File**: `client/src/pages/WineInventory.tsx`
- **Action**: CREATE
- **Implement**:
  - Curator/admin guard and loading state identical in structure to `BeerInventory.tsx:14,23-27,49-62` (redirect to `/browser` if not curator/admin; render `null` while redirecting; show a loading state while `trpc.auth.me.useQuery()` is pending).
  - Fetch data with `const { data: wines, isLoading: winesLoading } = trpc.wine.listAvailable.useQuery({});` — must pass `{}`, not omit the argument (see Patterns section on the required-but-empty input shape).
  - `const updateMutation = trpc.wine.update.useMutation();` and `const utils = trpc.useUtils();`.
  - Local per-row pending-edit state: `const [pending, setPending] = useState<Record<number, { cellared: number; refrigerated: number }>>({});`
  - Helper `getCounts(wine)` returns `pending[wine.wineId] ?? { cellared: wine.cellared ?? 0, refrigerated: wine.refrigerated ?? 0 }`.
  - Helper `adjust(wine, field, delta)` computes `next = { ...getCounts(wine), [field]: Math.max(0, getCounts(wine)[field] + delta) }` and sets `pending[wine.wineId] = next`. Clamp at 0 (no negative counts) — steppers should disable the "-" button when the field is already 0.
  - Helper `isDirty(wine)` — true when `pending[wine.wineId]` exists and differs from the wine's server-side `cellared`/`refrigerated`.
  - `handleSave(wine)`:

    ```typescript
    const handleSave = async (wine: WineRow) => {
      const counts = getCounts(wine);
      const data: { cellared?: number; refrigerated?: number } = {};
      if (counts.cellared !== (wine.cellared ?? 0)) data.cellared = counts.cellared;
      if (counts.refrigerated !== (wine.refrigerated ?? 0)) data.refrigerated = counts.refrigerated;
      if (Object.keys(data).length === 0) return;

      try {
        await updateMutation.mutateAsync({ id: wine.wineId, ...data });
        setPending((prev) => {
          const { [wine.wineId]: _removed, ...rest } = prev;
          return rest;
        });
        if (counts.cellared === 0 && counts.refrigerated === 0) {
          utils.wine.listAvailable.setData({}, (old) => old?.filter((w) => w.wineId !== wine.wineId));
        } else {
          utils.wine.listAvailable.setData({}, (old) =>
            old?.map((w) => (w.wineId === wine.wineId ? { ...w, ...counts } : w))
          );
        }
        toast.success("Inventory updated");
      } catch (error) {
        toast.error("Error updating inventory");
      }
    };
    ```

    This single `mutateAsync` call carries both changed fields when both cellar and fridge were adjusted in the same row edit (the "bottle moved" acceptance criterion), or just one field when only one was touched. The cache patch uses `{}` as the query key to match how the query was fetched, and removes the row when both counts land on 0 — same in-place-patch mechanism as `BeerInventory.tsx` to avoid a refetch-triggered remount / scroll jump.

  - Render a focused single-purpose header (title "Wine Inventory", `Wine` icon from `lucide-react` in the purple tone WineManagement uses, a `Link` back to `/dashboard`), matching `BeerInventory.tsx:64-79` structurally. Show a count badge of the currently-listed wines (no "remaining" language — this page has no confirm-present concept yet).
  - Render each wine as a full-width `Card` (single column, not `md:grid-cols-N`, per the phone-first requirement): wine label + vintage, then two `QuantityStepper` groups ("Cellar" and "Fridge") side by side, plus a Save (`Check` icon, `lucide-react`) button that only renders when `isDirty(wine)` is true.
  - Define a small local (not exported) `QuantityStepper` component in the same file to avoid duplicating the cellar/fridge stepper JSX:
    ```typescript
    function QuantityStepper({
      label,
      value,
      onDecrement,
      onIncrement,
    }: {
      label: string;
      value: number;
      onDecrement: () => void;
      onIncrement: () => void;
    }) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="h-11 w-11"
              onClick={onDecrement}
              disabled={value === 0}
              aria-label={`Decrease ${label}`}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center text-lg font-semibold tabular-nums">{value}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="h-11 w-11"
              onClick={onIncrement}
              aria-label={`Increase ${label}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }
    ```
  - Empty state: when `wines?.length === 0`, show a centered message ("No wines currently available.") mirroring `BeerInventory.tsx:85`.
  - Loading state: mirror `BeerInventory.tsx:82-84`.

- **Mirror**: `client/src/pages/BeerInventory.tsx` (whole-file structure: guard, loading, header, cache-patch mutation handler, empty state), `client/src/pages/ManageWinePage.tsx:266-287` (the `cellared`/`refrigerated` fields being replaced), `client/src/components/ui/button.tsx:23-30` (size variants)
- **Validate**: `npm run check`

### Task 2: Register the `/wine/inventory` route

- **File**: `client/src/App.tsx`
- **Action**: UPDATE
- **Implement**: Add the import and route:
  ```typescript
  import WineInventory from "@/pages/WineInventory";
  ```
  ```typescript
  <Route path="/wine-management" component={WineManagement} />
  <Route path="/wine/inventory" component={WineInventory} />
  ```
- **Mirror**: `client/src/App.tsx:9-10,24-25` (existing `BeerManagement`/`BeerInventory` import/route pair — same adjacency pattern applied to wine)
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Format
npm run format

# Tests (no server logic changed, but run the suite to confirm nothing broke)
npm test
```

Manual check (no automated client tests exist in this repo — `server/**/*.test.ts` only):

1. Log in as a `user`-role account (or log out) → navigating to `/wine/inventory` redirects to `/browser`.
2. Log in as curator/admin → `/wine/inventory` shows only wines with `cellared > 0` or `refrigerated > 0`.
3. Tap "+" on a wine's Cellar stepper only → a Save button appears; tap Save → `wine.update` is called with only `{ cellared: N }`, row stays, no dialog/navigation occurs.
4. On a wine, decrement Cellar and increment Fridge before saving → tap Save once → `wine.update` is called with both `cellared` and `refrigerated` in a single call, and both values reflect correctly afterward.
5. Adjust a wine's counts down to 0/0 and Save → row disappears from the list; scroll position of the remaining rows is unaffected (test with enough wines to require scrolling).
6. View at a phone-width viewport (e.g. 375px) → stepper buttons are easily tappable and don't wrap awkwardly.

---

## Acceptance Criteria

- [ ] Curator/admin sees every wine with `cellared > 0` or `refrigerated > 0`, and no others, at `/wine/inventory`
- [ ] Non-curator (or logged-out) visitors are redirected away from `/wine/inventory`
- [ ] Adjusting cellar or fridge count independently calls `wine.update` with just the changed field(s) — no dialog/modal, no route navigation
- [ ] Decrementing cellar and incrementing fridge in the same edit saves both in one `wine.update` call
- [ ] Bringing both counts to 0 and saving removes the row in place with scroll position preserved (no refetch-triggered remount)
- [ ] Stepper controls are large enough to tap accurately on a phone-width viewport
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`)
- [ ] Follows existing patterns (guard, list/loading/empty states, cache-patch-on-mutation)
