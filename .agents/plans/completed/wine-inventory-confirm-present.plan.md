# Plan: Wine Inventory Mode — Confirmed Present Action

## Summary

Add a "confirm present" button to each row in `client/src/pages/WineInventory.tsx`, letting a curator mark a wine as reviewed without editing any data. Confirmation is tracked purely in local component state (`useState<Set<number>>`) and used to filter the rendered list — no new tRPC procedure, no DB column, no persistence. This mirrors #127's implementation for `BeerInventory.tsx` exactly. Because the confirm filter is layered on top of the existing `wine.listAvailable` query cache (which the quantity-edit path already mutates via `utils.wine.listAvailable.setData` when both counts hit zero), the confirm path and the edit-to-zero path naturally don't interfere: one hides rows via local state, the other removes rows from the query cache.

## User Story

As a curator
I want to mark a wine as "confirmed present" without changing any data
So that I can quickly clear items that are correct as-is and see what's left to review

## Metadata

| Field            | Value                             |
| ---------------- | --------------------------------- |
| Type             | ENHANCEMENT                       |
| Complexity       | LOW                               |
| Systems Affected | client only (`WineInventory.tsx`) |
| GitHub Issue     | 129                               |

---

## Patterns to Follow

### Precedent: identical feature already shipped for beer (#127)

```tsx
// SOURCE: client/src/pages/BeerInventory.tsx (merged in 55d37d0, PR #133)
const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
const visibleBeers = beers?.filter((b) => !confirmedIds.has(b.beerId));

const handleConfirm = (beerId: number) => {
  setConfirmedIds((prev) => new Set(prev).add(beerId));
};
```

This is the exact pattern to replicate for wine, swapping `beerId` for `wineId` and `beers`/`beer.listAvailable` for `wines`/`wine.listAvailable`. The confirm handler must never call `updateMutation` or touch `utils.wine.listAvailable` — it is a purely local, additive filter.

### Existing quantity-edit removal path (must not be duplicated/broken)

```typescript
// SOURCE: client/src/pages/WineInventory.tsx:91-115
const handleSave = async (wine: WineRow) => {
  const counts = getCounts(wine);
  const data: Partial<WineCounts> = {};
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

This stays untouched. It already removes a row from the query cache when both counts hit zero — that removal path is independent of and must keep working alongside the new confirm-based local-state removal.

### Row header already has a conditional icon-only button (Save) — confirm button sits alongside it

```tsx
// SOURCE: client/src/pages/WineInventory.tsx:160-169
<div className="flex items-center justify-between gap-2">
  <span className="text-lg font-medium">
    {wine.label} {wine.vintage ? `(${wine.vintage})` : ""}
  </span>
  {isDirty(wine) && (
    <Button variant="ghost" size="icon-sm" onClick={() => handleSave(wine)} aria-label="Save changes">
      <Check className="w-4 h-4" />
    </Button>
  )}
</div>
```

The existing Save button uses the plain `Check` icon and only appears when the row has unsaved stepper edits (`isDirty`). The new Confirm button must be visually distinct from Save (to avoid two identical checkmarks appearing side by side) and must always render, regardless of `isDirty` state — use `CircleCheck` from `lucide-react` (confirmed present in the installed `lucide-react@0.453.0` package) rather than reusing `Check`.

### Guard / loading / empty-state structure (unchanged, just re-point at the filtered list)

```tsx
// SOURCE: client/src/pages/WineInventory.tsx:150-154
{winesLoading ? (
  <div className="text-center py-8">Loading...</div>
) : wines?.length === 0 ? (
  <div className="text-center py-8 text-gray-500">No wines currently available.</div>
) : (
  wines?.map((wine) => { ... })
)}
```

---

## Files to Change

| File                                 | Action | Purpose                                                                      |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `client/src/pages/WineInventory.tsx` | UPDATE | Add session-only confirm state, confirm button per row, filter rendered list |

No other files change. No server, schema, or route changes — entirely contained in the existing page component, matching #127's scope for beer.

Note: unlike #127, this plan does **not** touch the header count badge. `WineInventory.tsx` already shows `{wines?.length ?? 0} in stock` (added in #128) describing total available wines, a different concept from "remaining to review." The wine issue's acceptance criteria don't request a remaining-count indicator, so it's left as-is to avoid scope creep.

---

## Tasks

### Task 1: Add confirmed-IDs state, derived visible list, and confirm handler

- **File**: `client/src/pages/WineInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add `CircleCheck` to the existing `lucide-react` import (line 7): `import { Wine as WineIcon, Minus, Plus, Check, CircleCheck } from "lucide-react";`
  - Add local state directly below `const [pending, setPending] = useState<Record<number, WineCounts>>({});` (line 68):
    ```typescript
    const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
    ```
  - Derive the rendered list from both the query cache and the confirmed set, right after that:
    ```typescript
    const visibleWines = wines?.filter((w) => !confirmedIds.has(w.wineId));
    ```
  - Add a confirm handler after `handleSave` (after line 115):
    ```typescript
    const handleConfirm = (wineId: number) => {
      setConfirmedIds((prev) => new Set(prev).add(wineId));
    };
    ```
  - This state is intentionally never persisted or reset except on remount (navigating away and back), which is what makes it "session-only" per the acceptance criteria — no additional reset logic is needed.
- **Mirror**: `client/src/pages/BeerInventory.tsx` confirm state pattern from #127 (identical shape, `beerId` → `wineId`)
- **Validate**: `npm run check`

### Task 2: Render the confirm button per row and switch rendering to `visibleWines`

- **File**: `client/src/pages/WineInventory.tsx`
- **Action**: UPDATE
- **Implement**:
  - Replace `wines?.length === 0` (line 152) with `visibleWines?.length === 0`.
  - Replace `wines?.map((wine) => {` (line 155) with `visibleWines?.map((wine) => {`.
  - Update the row header block (lines 160-169) to wrap the existing conditional Save button and the new always-visible Confirm button in a shared `flex items-center gap-1` container:
    ```tsx
    <div className="flex items-center justify-between gap-2">
      <span className="text-lg font-medium">
        {wine.label} {wine.vintage ? `(${wine.vintage})` : ""}
      </span>
      <div className="flex items-center gap-1">
        {isDirty(wine) && (
          <Button variant="ghost" size="icon-sm" onClick={() => handleSave(wine)} aria-label="Save changes">
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => handleConfirm(wine.wineId)} aria-label="Confirm present">
          <CircleCheck className="w-4 h-4" />
        </Button>
      </div>
    </div>
    ```
  - `Button` is already imported (line 4) — no new import needed for it.
  - Do not call `updateMutation` or `utils.wine.listAvailable.setData` from `handleConfirm` — confirming must never trigger a `wine.update` mutation (per acceptance criteria).
- **Mirror**: `client/src/pages/BeerInventory.tsx` confirm button from #127 (same `variant="ghost" size="icon-sm"` icon-only pattern, same `aria-label="Confirm present"`)
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

1. Navigate to `/wine/inventory` as curator/admin with several available wines listed.
2. Tap "Confirm present" on a row → the row disappears immediately; no toast, no network request (verify in devtools Network tab that no `wine.update` call fires).
3. On a different row, adjust cellar/fridge steppers down to 0/0 and tap "Save changes" → that row disappears too (existing #128 behavior via cache update), independent of any confirms — confirming one row and zeroing-out another don't affect each other's item.
4. On a third row, adjust a stepper (making it dirty) then tap "Confirm present" instead of "Save changes" → row disappears without any `wine.update` call; the unsaved stepper edit is simply discarded along with the row.
5. Refresh the page → all previously confirmed and still-in-stock wines reappear, since confirmation state is not persisted.
6. Confirm every visible row → empty state message appears ("No wines currently available.").
7. Check phone-width viewport (375px) → the Save (when present) and Confirm buttons are both easily tappable side by side.

---

## Acceptance Criteria

- [ ] Tapping "confirm" on a wine row removes it from the visible list without calling `wine.update`
- [ ] Refreshing or navigating away and back to `/wine/inventory` clears confirmation state (previously confirmed items reappear)
- [ ] Confirming a row and editing another row's quantities to zero (existing #128 removal path) work independently without conflicting
- [ ] Type check passes (`npm run check`)
- [ ] Tests pass (`npm test`)
- [ ] Follows existing patterns (ghost icon button, session-only local state, no route or server changes) — matches #127's implementation for beer
