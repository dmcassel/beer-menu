# Plan: Beer Inventory Mode — Confirmed Present Action

## Summary

Add a "confirmed present" button to each row in `client/src/pages/BeerInventory.tsx`, letting a curator mark a beer as reviewed without editing any data. Confirmation is tracked purely in local component state (`useState<Set<number>>`) and is used to filter the rendered list — no new tRPC procedure, no DB column, no persistence. Because it's a separate filter layered on top of the existing `beer.listAvailable` cache (which the status-edit path already mutates via `utils.beer.listAvailable.setData`), the confirm path and the edit path naturally don't interfere: one hides rows via local state, the other removes rows from the query cache. A small count badge in the header shows how many items remain unconfirmed.

## User Story

As a curator
I want to mark a beer as "confirmed present" without changing any data
So that I can quickly clear items that are correct as-is and see what's left to review

## Metadata

| Field            | Value                             |
| ---------------- | --------------------------------- |
| Type             | ENHANCEMENT                       |
| Complexity       | LOW                               |
| Systems Affected | client only (`BeerInventory.tsx`) |
| GitHub Issue     | 127                               |

---

## Patterns to Follow

### Existing status-edit removal path (must not be duplicated/broken)

```typescript
// SOURCE: client/src/pages/BeerInventory.tsx:26-40
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

This stays untouched. The confirm action must not call `updateMutation` or touch the query cache — it is a purely local, additive filter.

### Icon-only row button (closest structural analog — ghost variant, size sm, icon-only)

```tsx
// SOURCE: client/src/pages/LocationPage.tsx:207-216
<Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
  <Edit2 className="w-4 h-4" />
</Button>
```

No existing "confirm"/checkmark button exists anywhere in the app; `Check` from `lucide-react` is otherwise only used inside `components/ui/searchable-select.tsx` and `multi-select.tsx` for selected-option indicators — this plan introduces it fresh as a row action, following the same import style (`import { Beer, Check } from "lucide-react";`).

### Count badge (no "N remaining" pattern exists yet — reuse the generic `Badge` primitive)

```tsx
// SOURCE: client/src/components/ui/badge.tsx:28-44 (component signature)
import { Badge } from "@/components/ui/badge";
<Badge variant="secondary">{n}</Badge>;
```

`BeerPage.tsx:262-268` shows the closest existing usage (a count badge next to a header control), but for _filters_, not list progress — no direct copy applies beyond "use `<Badge>` for a small count pill."

### Guard / loading / empty-state structure (unchanged, just re-point at the filtered list)

```typescript
// SOURCE: client/src/pages/BeerInventory.tsx:74-99 (current render block)
{beersLoading ? (
  <div className="text-center py-8">Loading...</div>
) : beers?.length === 0 ? (
  <div className="text-center py-8 text-gray-500">No beers currently available.</div>
) : (
  beers?.map((beer) => ( ... ))
)}
```

---

## Files to Change

| File                                 | Action | Purpose                                                                                            |
| ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `client/src/pages/BeerInventory.tsx` | UPDATE | Add session-only confirm state, confirm button per row, filter rendered list, show remaining count |

No other files change. No server, schema, or route changes — this is entirely contained in the existing page component.

---

## Tasks

### Task 1: Add confirmed-IDs state and derive the visible list

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Change the React import to include `useState`: `import { useEffect, useState } from "react";`
  - Add local state directly below the existing hooks (after `const utils = trpc.useUtils();`):
    ```typescript
    const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
    ```
  - Derive the rendered list from both the query cache and the confirmed set:
    ```typescript
    const visibleBeers = beers?.filter((b) => !confirmedIds.has(b.beerId));
    ```
  - Add a confirm handler near `handleStatusChange`:
    ```typescript
    const handleConfirm = (beerId: number) => {
      setConfirmedIds((prev) => new Set(prev).add(beerId));
    };
    ```
  - This state is intentionally never persisted or reset except on remount (e.g. navigating away and back), which is what makes it "session-only" per the PRD/acceptance criteria — no additional reset logic is needed.
- **Mirror**: existing hook block at `client/src/pages/BeerInventory.tsx:13-17`
- **Validate**: `npm run check`

### Task 2: Render the confirm button per row and switch rendering to `visibleBeers`

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `Check` to the existing `lucide-react` import: `import { Beer, Check } from "lucide-react";`
  - Replace the `beers?.length === 0` / `beers?.map(...)` block (lines 76-99) to use `visibleBeers` instead of `beers` in both the empty-state check and the `.map`.
  - Inside each row's `CardContent` (currently: beer name + `Select`), add a confirm `Button` after the `Select`:
    ```tsx
    <Button variant="ghost" size="icon-sm" onClick={() => handleConfirm(beer.beerId)} aria-label="Confirm present">
      <Check className="w-4 h-4" />
    </Button>
    ```
  - Import `Button` is already present (`client/src/pages/BeerInventory.tsx:4`) — no new import needed for it.
  - Do not call `updateMutation` or `utils.beer.listAvailable.setData` from this handler — confirming must never trigger a `beer.update` mutation (per acceptance criteria).
- **Mirror**: `client/src/pages/LocationPage.tsx:207-216` (ghost icon button in a row), `client/src/components/ui/button.tsx:27-29` (`icon-sm` size variant)
- **Validate**: `npm run check`

### Task 3: Show a remaining-count indicator in the header

- **File**: `client/src/pages/BeerInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `import { Badge } from "@/components/ui/badge";`
  - In the header block (next to the "Beer Inventory" `h1`, inside the existing `flex items-center gap-3` div), add:
    ```tsx
    {
      !beersLoading && <Badge variant="secondary">{visibleBeers?.length ?? 0} remaining</Badge>;
    }
    ```
  - This is a nice-to-have per the acceptance criteria ("visible way to tell how many remain") — keep it to this one badge, no separate progress bar or "X of Y" fraction, since the total (Y) isn't otherwise displayed and computing/showing it isn't required.
- **Mirror**: `client/src/pages/BeerPage.tsx:262-268` (badge placed next to a header control)
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Format
npm run format

# Tests (no server logic changes, but confirm nothing broke)
npm test
```

Manual check (no automated client tests exist in this repo — `server/**/*.test.ts` only):

1. Navigate to `/beer/inventory` as curator/admin with several available beers listed.
2. Tap "Confirm" on a row → the row disappears immediately; no toast, no network request (verify in devtools Network tab that no `beer.update` call fires); the remaining-count badge decrements.
3. Change another row's status via the `Select` (e.g. to "Out") → that row disappears too (existing #126 behavior via cache update), independent of any confirms — confirming one row and editing another don't affect each other's item.
4. Refresh the page → all previously confirmed and status-available beers reappear (per current `on_tap`/`bottle_can` status) since confirmation state is not persisted.
5. Confirm every visible row → empty state message appears ("No beers currently available.").
6. Check phone-width viewport (375px) → confirm button is easily tappable alongside the status `Select`.

---

## Acceptance Criteria

- [ ] Tapping "confirm" on a beer row removes it from the visible list without calling `beer.update`
- [ ] Editing a different beer's status (e.g. to "Out") also removes that item from the list, and the two removal paths (confirm vs. edit) don't interfere with each other
- [ ] Refreshing or navigating away and back to `/beer/inventory` clears confirmation state (previously confirmed items reappear)
- [ ] A visible count of remaining (unconfirmed) items is shown in the header
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`)
- [ ] Follows existing patterns (ghost icon button, `Badge` primitive, in-place cache/state updates — no route or server changes)
