# Plan: Improve Mobile View for Beer Management Dialogs

## Summary

On mobile, the "Add Brewery" and "Add Beer" dialogs are unusable: the base `DialogContent` component has no max-height or scroll behavior, so a dialog taller than the viewport (like the 8-field Add Beer form) gets clipped with no way to scroll to the rest of it. Separately, the on-screen keyboard hides the Add Brewery dialog because the viewport meta tag doesn't tell modern Android Chrome to resize the layout viewport when the keyboard opens, so the fixed, vertically-centered dialog doesn't reflow. The fix is a small, global change to the base Dialog component (matching a pattern already proven in `ManageWinePage.tsx`) plus a viewport meta tag addition — no page-specific hacks needed, and every dialog in the app benefits.

## User Story

As a mobile user
I want to fully see and interact with the Add Beer and Add Brewery dialogs
So that I can add catalog items from my phone without content being cut off or hidden by the keyboard

## Metadata

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| Type             | BUG_FIX                                                      |
| Complexity       | LOW                                                          |
| Systems Affected | Frontend (shared UI component, one page cleanup, HTML shell) |
| GitHub Issue     | 145                                                          |

---

## Patterns to Follow

### Existing proven fix for dialog height/scroll (copy this into the base component)

```tsx
// SOURCE: client/src/pages/ManageWinePage.tsx:206
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
```

This is currently the _only_ dialog in the app with mobile-safe height handling. Every other dialog (`BreweryPage.tsx:84`, `BeerPage.tsx:159`, `WineryPage.tsx:110`, `VarietalPage.tsx:84`, `StylePage.tsx:107`, `MenuCategoryPage.tsx:129`, `BJCPCategoryPage.tsx:83`, `LocationPage.tsx:134`) lacks it. Rather than patching each page, fix it once in the base component.

### Base Dialog component (where the fix goes)

```tsx
// SOURCE: client/src/components/ui/dialog.tsx:112-120
<DialogPrimitive.Content
  data-slot="dialog-content"
  className={cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
    className
  )}
  ...
```

`cn()` uses `tailwind-merge` (`client/src/lib/utils.ts:1-5`), so adding `max-h-[90vh] overflow-y-auto` here is additive — it won't conflict with per-page `className` overrides like `BeerPage.tsx`'s `max-w-md`, since those only touch width, not height/overflow.

### Class merging behavior (why this is safe)

```tsx
// SOURCE: client/src/lib/utils.ts:1-5
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Files to Change

| File                                  | Action | Purpose                                                                                  |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `client/index.html`                   | UPDATE | Add `interactive-widget=resizes-content` to the viewport meta tag for keyboard avoidance |
| `client/src/components/ui/dialog.tsx` | UPDATE | Add `max-h-[90vh] overflow-y-auto` to the base `DialogContent` classes                   |
| `client/src/pages/ManageWinePage.tsx` | UPDATE | Remove now-redundant `max-h-[90vh] overflow-y-auto` from its `DialogContent` override    |

---

## Tasks

### Task 1: Add keyboard-avoidance viewport meta option

- **File**: `client/index.html`
- **Action**: UPDATE
- **Implement**: Change the viewport meta tag at line 5 from
  `content="width=device-width, initial-scale=1.0, maximum-scale=1"`
  to
  `content="width=device-width, initial-scale=1.0, maximum-scale=1, interactive-widget=resizes-content"`.
  This tells modern Chrome/Android to resize the layout viewport (not just the visual viewport) when the on-screen keyboard opens, so a `fixed`, vertically-centered dialog reflows instead of being pushed/hidden behind the keyboard. It's a progressive enhancement — unsupported browsers (e.g. Safari) simply ignore the unknown token with no downside.
- **Mirror**: N/A — no existing example in this codebase; this is a one-line meta tag addition.
- **Validate**: `npm run check`

### Task 2: Make the base Dialog scrollable on all viewports

- **File**: `client/src/components/ui/dialog.tsx`
- **Action**: UPDATE
- **Implement**: In `DialogContent` (around line 115), add `max-h-[90vh] overflow-y-auto` to the class string passed to `cn(...)`, so it reads (order within the string doesn't matter, but keep it readable):
  `"... fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"`.
  This is a global fix: it resolves the Add Beer "cut off" bug (8-field form now scrolls within the dialog instead of overflowing off-screen) and also benefits every other dialog in the app (Add Brewery, Style, Menu Category, Location, etc.) without touching each page individually.
- **Mirror**: `client/src/pages/ManageWinePage.tsx:206` — same class values, proven pattern.
- **Validate**: `npm run check`

### Task 3: Remove now-redundant override in ManageWinePage

- **File**: `client/src/pages/ManageWinePage.tsx`
- **Action**: UPDATE
- **Implement**: At line 206, since the base `DialogContent` now provides `max-h-[90vh] overflow-y-auto` by default, simplify `className="max-w-2xl max-h-[90vh] overflow-y-auto"` to `className="max-w-2xl"` to avoid duplicating a class that's now inherited.
- **Mirror**: N/A — straightforward cleanup following Task 2's change.
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

Manual verification (no automated test coverage exists for base UI components in this repo — tests are server-only per `server/**/*.test.ts`):

1. In Chrome DevTools, emulate a Pixel 9 Pro XL (or similar tall/narrow device) viewport.
2. Open Beer management → "Add Beer" → confirm the dialog no longer clips content; the form scrolls internally and the submit button is reachable.
3. Open Brewery management → "Add Brewery" → focus the name/location inputs and confirm the on-screen keyboard (or its DevTools equivalent — toggle device toolbar's viewport resize) doesn't hide the dialog; the dialog reflows/stays visible.
4. Spot-check one or two other dialogs (e.g. Style, Location) to confirm the global change didn't break their layout on both desktop and mobile widths.

---

## Acceptance Criteria

- [ ] All tasks completed
- [ ] Type check passes
- [ ] Production build passes
- [ ] Add Beer dialog is fully scrollable and usable on a narrow/tall mobile viewport
- [ ] Add Brewery dialog remains visible/usable when the on-screen keyboard is open on Android Chrome
- [ ] No regression in other dialogs (Style, Location, Menu Category, Wine, etc.) at desktop and mobile widths
- [ ] Follows existing patterns (base component fix mirrors `ManageWinePage.tsx`'s already-proven approach)
