# Plan: Beer Inventory Mode — List with Inline Status Editing

## Summary

Add a curator-only `/beer/inventory` route and `BeerInventory.tsx` page that lists every currently-available beer (`beer.listAvailable`, already server-side filtered to `on_tap`/`bottle_can`) with a per-row status control for inline editing. Changing a row's status calls `beer.update` directly (no dialog, no route change); on success the row is removed from the TanStack Query cache in place via `utils.beer.listAvailable.setData`, so the list re-renders without a refetch-triggered remount and scroll position is preserved. No backend changes are needed — both `beer.listAvailable` and `beer.update` already exist and support this exactly as required.

## User Story

As a curator
I want to see a list of currently-available beers and change a beer's status inline
So that I can reconcile physical stock quickly without leaving the list

## Metadata

| Field            | Value                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                                    |
| Complexity       | LOW                                                               |
| Systems Affected | client routing (`App.tsx`), new client page (`BeerInventory.tsx`) |
| GitHub Issue     | 126                                                               |

---

## Patterns to Follow

### Route registration

```typescript
// SOURCE: client/src/App.tsx:24
<Route path="/beer-management" component={BeerManagement} />
```

### Curator/admin guard (redirect pattern)

```typescript
// SOURCE: client/src/pages/BeerManagement.tsx:18,23-30,54-56
const { data: user, isLoading } = trpc.auth.me.useQuery();
...
useEffect(() => {
  if (
    !isLoading &&
    (!user || (user.role !== "curator" && user.role !== "admin"))
  ) {
    setLocation("/browser");
  }
}, [user, isLoading, setLocation]);
...
if (!user || (user.role !== "curator" && user.role !== "admin")) {
  return null;
}
```

### Status values (currently a plain `<select>`, this plan upgrades to shadcn `Select` for per-row use)

```typescript
// SOURCE: client/src/pages/BeerPage.tsx:228-238
<select
  value={formData.status}
  onChange={(e) => setFormData({ ...formData, status: e.target.value as "on_tap" | "bottle_can" | "out" })}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
>
  <option value="on_tap">On Tap</option>
  <option value="bottle_can">Bottle/Can</option>
  <option value="out">Out</option>
</select>
```

### shadcn Select component (target pattern for per-row control)

```typescript
// SOURCE: client/src/pages/LocationPage.tsx:11-17,151-163
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="country">Country</SelectItem>
  </SelectContent>
</Select>
```

### tRPC query/mutation + cache utils

```typescript
// SOURCE: server/routers.ts:192,209-225 (existing endpoints — no changes needed)
listAvailable: publicProcedure.query(() => db.getAllAvailableBeers()),
update: curatorProcedure
  .input(z.object({ id: z.number(), status: z.enum(["on_tap", "bottle_can", "out"]).optional(), /* ...other optional fields */ }))
  .mutation(({ input }) => {
    const { id, ...data } = input;
    return db.updateBeer(id, data);
  }),
```

```typescript
// SOURCE: client/src/pages/BeerManagement.tsx:20 (utils pattern; setData usage is new to this codebase but is standard @trpc/react-query v11 API)
const utils = trpc.useUtils();
```

### Types

```typescript
// SOURCE: drizzle/schema.ts:97 (re-exported via shared/types.ts:6)
export type Beer = typeof beer.$inferSelect;
```

---

## Files to Change

| File                                 | Action | Purpose                                                         |
| ------------------------------------ | ------ | --------------------------------------------------------------- |
| `client/src/pages/BeerInventory.tsx` | CREATE | New curator-only inventory list page with inline status editing |
| `client/src/App.tsx`                 | UPDATE | Register `/beer/inventory` route                                |

No server changes: `beer.listAvailable` (`server/routers.ts:192`) and `beer.update` (`server/routers.ts:209-225`) already provide exactly the data/mutation shape this page needs.

---

## Tasks

### Task 1: Create `BeerInventory.tsx`

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: CREATE
- **Implement**:
  - Curator/admin guard identical in behavior to `BeerManagement.tsx:18,23-30,54-56` (redirect to `/browser` if not curator/admin; render `null` while redirecting; show a loading state while `trpc.auth.me.useQuery()` is pending, mirroring `BeerManagement.tsx:43-52`).
  - Fetch data with `const { data: beers, isLoading } = trpc.beer.listAvailable.useQuery();`.
  - `const updateMutation = trpc.beer.update.useMutation();` and `const utils = trpc.useUtils();`.
  - Render a simple header (title "Beer Inventory", a `Link` back to `/dashboard` using the `Link`/`Button` pattern from `BeerManagement.tsx:63-74` — no need to duplicate the full tab/logout header, this is a focused single-purpose page).
  - Render each beer as a row (a `Card` per `BeerPage.tsx:358-395`, or a simpler flex row — either is acceptable, but keep it a single-column full-width list, not the `md:grid-cols-2` layout, since this page is optimized for one-handed phone use per the PRD) showing: beer name, and a `Select` (shadcn, from `client/src/components/ui/select.tsx`, per the `LocationPage.tsx:151-163` pattern) bound to the beer's current `status`, with the three `SelectItem`s `on_tap` / `bottle_can` / `out` (labels "On Tap" / "Bottle/Can" / "Out", matching `BeerPage.tsx:234-236`).
  - Give the `SelectTrigger` a larger touch target than the default (`h-10`) — e.g. `className="h-12 w-40 text-base"` — to satisfy the phone-tap-accuracy acceptance criterion.
  - On `onValueChange`, call:
    ```typescript
    const handleStatusChange = async (beerId: number, status: "on_tap" | "bottle_can" | "out") => {
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
    This is the key mechanism satisfying the "no jump to top / scroll position preserved" acceptance criterion: it patches the existing query's cached array in place (add/remove/update one item) rather than calling `refetch()` or `invalidate()`, so React only re-renders the changed/removed row instead of unmounting and remounting the whole list.
  - Empty state: when `beers?.length === 0`, show a centered message ("No beers currently available." ) mirroring `BeerPage.tsx:349-354`.
  - Loading state: mirror `BeerPage.tsx:347-348` (`isLoading ? <div className="text-center py-8">Loading...</div> : ...`).
- **Mirror**: `client/src/pages/BeerManagement.tsx:15-56` (guard + loading), `client/src/pages/BeerPage.tsx:228-238,347-397` (status values, list/loading/empty rendering), `client/src/pages/LocationPage.tsx:151-163` (shadcn `Select` usage)
- **Validate**: `npm run check`

### Task 2: Register the `/beer/inventory` route

- **File**: `client/src/App.tsx`
- **Action**: UPDATE
- **Implement**: Add the import and route:
  ```typescript
  import BeerInventory from "@/pages/BeerInventory";
  ```
  ```typescript
  <Route path="/beer-management" component={BeerManagement} />
  <Route path="/beer/inventory" component={BeerInventory} />
  <Route path="/wine-management" component={WineManagement} />
  ```
- **Mirror**: `client/src/App.tsx:9,24` (existing import/route pair for `BeerManagement`)
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

1. Log in as a `user`-role account (or log out) → navigating to `/beer/inventory` redirects to `/browser`.
2. Log in as curator/admin → `/beer/inventory` shows only beers with status `on_tap`/`bottle_can`.
3. Change a beer's status to `on_tap`/`bottle_can` → row stays, status control reflects the new value, no dialog/navigation occurs.
4. Change a beer's status to `Out` → row disappears from the list; scroll position of the remaining rows is unaffected (test with enough beers to require scrolling).
5. View at a phone-width viewport (e.g. 375px) → rows and the status `Select` are easily tappable.

---

## Acceptance Criteria

- [ ] Curator/admin sees every beer with status `on_tap` or `bottle_can`, and no others, at `/beer/inventory`
- [ ] Non-curator (or logged-out) visitors are redirected away from `/beer/inventory`
- [ ] Changing status inline calls `beer.update` with just the status change — no dialog/modal, no route navigation
- [ ] Setting status to `Out` removes the row in place with scroll position preserved (no refetch-triggered remount)
- [ ] Status control is large enough to tap accurately on a phone-width viewport
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`)
- [ ] Follows existing patterns (guard, list/loading/empty states, shadcn `Select`)
