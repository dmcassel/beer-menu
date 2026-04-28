---
description: Learn how to build components in this codebase
argument-hint: [github-issues]
---

# Prime Components: How to Build Components

**Input**: $ARGUMENTS

## Objective

Understand the component patterns used in this codebase so you can build new components correctly.

## Process

### Step 0: Load External Context (if provided)

The argument is an optional GitHub issue number or comma-separated list of issue numbers (e.g., `42` or `42,43,44`).

If GitHub issue numbers are provided:
1. For each issue number, run `gh issue view {number} --json title,body,labels,assignees,comments`
2. Use the issue title, body, labels, and comments to inform your understanding of what work is expected

### Step 1: Analyze the Codebase

1. Study the UI primitives in `src/components/ui/` (shadcn/ui components)
2. Study `src/lib/utils.ts` for the `cn()` utility
3. Study feature components as examples:
   - `src/features/polls/components/create-poll-form.tsx` — Client Component using Server Action with `useActionState`
   - `src/features/polls/components/vote-form.tsx` — radio form with pending state via `useFormStatus`
   - `src/components/theme-toggle.tsx` — minimal Client Component example

## Output

Produce a scannable summary of what you learned:

- **UI Library**: Available shadcn/ui components and how they're composed
- **Styling**: How Tailwind 4 and `cn()` are used for conditional classes
- **Props Pattern**: How props interfaces are defined (inline types vs exported interfaces)
- **Server vs Client**: Which components are Server Components (default) vs Client Components (`"use client"`)
- **Forms**: How Server Actions + `useActionState` + `useFormStatus` work together for form state

Use bullet points. Keep it concise.
