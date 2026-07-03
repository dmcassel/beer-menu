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

1. Study the UI primitives in `client/src/components/ui/` (Radix UI / shadcn-style components)
2. Study `client/src/lib/utils.ts` for the `cn()` utility
3. Study feature components as examples:
   - `client/src/pages/BeerBrowser.tsx` — filterable list using tRPC queries and cascading filters
   - `client/src/pages/BeerPage.tsx` — CRUD admin page with create/edit/delete dialogs and tRPC mutations
   - `client/src/components/FilterControls.tsx` — reusable multi-select filter component

## Output

Produce a scannable summary of what you learned:

- **UI Library**: Available shadcn/Radix UI components and how they're composed
- **Styling**: How Tailwind and `cn()` are used for conditional classes
- **Props Pattern**: How props interfaces are defined (inline types vs exported interfaces)
- **Data Fetching**: How tRPC query hooks (`trpc.*.list.useQuery`) are used for reads
- **Forms**: How tRPC mutation hooks (`trpc.*.create.useMutation`) + React Hook Form + Zod handle form state and validation

Use bullet points. Keep it concise.
