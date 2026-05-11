# Plan: New Vintage Action on Wine Curation Page

## Summary

Add a "New Vintage" button to each wine card on the curation page. Clicking it opens the existing add/edit dialog pre-populated with all fields from the source wine, but with vintage incremented by one and both inventory counts reset to zero. Submission creates a new wine record via the existing `trpc.wine.create` mutation. All changes are confined to a single file.

## User Story

As a curator
I want a "New Vintage" action on each wine card
So that I can quickly create a new year's entry for an existing wine without re-entering all its details

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | client/src/pages/ManageWinePage.tsx |
| GitHub Issue | 109 |

---

## Patterns to Follow

### Existing handleEdit handler
```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:119-132
const handleEdit = (wine: any) => {
  setFormData({
    label: wine.label,
    wineryId: wine.wineryId?.toString() || "",
    vintage: wine.vintage?.toString() || "",
    locationId: wine.locationId || null,
    refrigerated: wine.refrigerated?.toString() || "0",
    cellared: wine.cellared?.toString() || "0",
    description: wine.description || "",
    varietalIds: wine.varietals?.map((v: any) => v.varietalId.toString()) || [],
  });
  setEditingId(wine.wineId);
  setOpen(true);
};
```

### Wine card button row
```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:378-389
<div className="flex gap-2">
  <Button variant="ghost" size="sm" onClick={() => handleEdit(wine)}>
    <Edit2 className="w-4 h-4" />
  </Button>
  <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(wine.wineId, wine.label)}>
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

### Dialog title based on editingId
```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:197
<DialogTitle>{editingId ? "Edit Wine" : "Add Wine"}</DialogTitle>
```

### lucide-react icon import
```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:10
import { Plus, Trash2, Edit2, Filter, X } from "lucide-react";
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `client/src/pages/ManageWinePage.tsx` | UPDATE | Add icon import, handler function, and button to each wine card |

---

## Tasks

### Task 1: Add `CopyPlus` to the lucide-react import

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: Add `CopyPlus` to the existing lucide-react import on line 10
- **Mirror**: `client/src/pages/ManageWinePage.tsx:10`
- **Before**:
  ```tsx
  import { Plus, Trash2, Edit2, Filter, X } from "lucide-react";
  ```
- **After**:
  ```tsx
  import { Plus, Trash2, Edit2, Filter, X, CopyPlus } from "lucide-react";
  ```
- **Validate**: `npm run check`

### Task 2: Add `handleNewVintage` function

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: Add the function immediately after the `handleEdit` function (after line ~132). It should:
  1. Pre-populate `formData` with all fields from the source wine
  2. Set `vintage` to `(wine.vintage + 1).toString()` if source has a vintage, otherwise `""`
  3. Set `refrigerated` to `"0"` and `cellared` to `"0"`
  4. Set `editingId` to `null` (so the submit path calls `createMutation`)
  5. Call `setOpen(true)`
- **Mirror**: `client/src/pages/ManageWinePage.tsx:119-132` — follow the exact same shape as `handleEdit`
- **Code**:
  ```tsx
  const handleNewVintage = (wine: any) => {
    setFormData({
      label: wine.label,
      wineryId: wine.wineryId?.toString() || "",
      vintage: wine.vintage != null ? (wine.vintage + 1).toString() : "",
      locationId: wine.locationId || null,
      refrigerated: "0",
      cellared: "0",
      description: wine.description || "",
      varietalIds: wine.varietals?.map((v: any) => v.varietalId.toString()) || [],
    });
    setEditingId(null);
    setOpen(true);
  };
  ```
- **Validate**: `npm run check`

### Task 3: Add "New Vintage" button to each wine card

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: In the card header button row (lines 378-389), add a new ghost button before the Edit button that calls `handleNewVintage(wine)`. Add a `title` attribute for accessibility/tooltip.
- **Mirror**: `client/src/pages/ManageWinePage.tsx:379-381` — match the ghost/sm button pattern
- **Before**:
  ```tsx
  <div className="flex gap-2">
    <Button variant="ghost" size="sm" onClick={() => handleEdit(wine)}>
      <Edit2 className="w-4 h-4" />
    </Button>
  ```
- **After**:
  ```tsx
  <div className="flex gap-2">
    <Button variant="ghost" size="sm" title="New Vintage" onClick={() => handleNewVintage(wine)}>
      <CopyPlus className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" onClick={() => handleEdit(wine)}>
      <Edit2 className="w-4 h-4" />
    </Button>
  ```
- **Validate**: `npm run check`

---

## Validation

```bash
# Type check
npm run check

# Tests
npm test
```

---

## Acceptance Criteria

- [ ] "New Vintage" button appears on each wine card alongside Edit/Delete
- [ ] Clicking it opens the dialog pre-populated with all source wine fields
- [ ] Vintage is set to source vintage + 1 (or blank if source has no vintage)
- [ ] Refrigerated and cellared are both 0
- [ ] Submitting creates a new wine record (not an update to the original)
- [ ] Type check passes
- [ ] Tests pass
