---
description: Learn how to build new API endpoints end-to-end
argument-hint: [github-issues]
---

# Prime Endpoint: How to Build New Endpoints

**Input**: $ARGUMENTS

## Objective

Understand the full endpoint pattern from database to UI so you can build new endpoints correctly.

## Process

### Step 0: Load External Context (if provided)

The argument is an optional GitHub issue number or comma-separated list of issue numbers (e.g., `42` or `42,43,44`).

If GitHub issue numbers are provided:

1. For each issue number, run `gh issue view {number} --json title,body,labels,assignees,comments`
2. Use the issue title, body, labels, and comments to inform your understanding of what work is expected

### Step 1: Analyze the Codebase

Study these files in order (this is the full data flow for the beer feature — use it as the reference pattern):

1. **Schema**: `drizzle/schema.ts` — Drizzle table definitions; TypeScript types are inferred from these
2. **DB functions**: `server/db.ts` — Drizzle query functions (e.g. `getAllBeers`, `createBeer`, `updateBeer`, `deleteBeer`); no business logic, just queries
3. **tRPC procedures**: `server/routers.ts` (beer router, ~lines 181–220) — Zod input validation inline on each procedure; calls db functions; uses procedure types for auth (`curatorProcedure`, `adminProcedure`, etc.)
4. **tRPC setup**: `server/_core/trpc.ts` — defines `publicProcedure`, `protectedProcedure`, `curatorProcedure`, `adminProcedure` with middleware
5. **Client page**: `client/src/pages/BeerPage.tsx` — uses `trpc.beer.list.useQuery` for reads and `trpc.beer.create.useMutation` for writes; React Hook Form + Zod for form validation

## Output

Produce a scannable summary of what you learned:

- **Type Flow**: Types inferred from Drizzle schema → used in db functions → passed through tRPC to components
- **Validation**: Zod schemas defined inline on tRPC procedure `.input()` calls in `routers.ts`
- **DB Pattern**: Query functions in `db.ts` / `db_wine.ts` are plain async functions; routers call them directly
- **tRPC Procedure Pattern**: `.input(z.object({...})).query(({ input, ctx }) => ...)` for reads; `.mutation(...)` for writes; `ctx.user` available for auth
- **Component Pattern**: Pages use `trpc.*.useQuery` for reads and `trpc.*.useMutation` + `onSuccess` cache invalidation for writes

Use bullet points. Keep it concise.
