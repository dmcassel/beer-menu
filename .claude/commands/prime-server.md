---
description: Prime agent with server/backend codebase understanding
argument-hint: [github-issues]
---

# Prime Server: Load Backend Context

**Input**: $ARGUMENTS

## Objective

Build comprehensive understanding of the server codebase by analyzing structure and key files.

## Process

### Step 0: Load External Context (if provided)

The argument is an optional GitHub issue number or comma-separated list of issue numbers (e.g., `42` or `42,43,44`).

If GitHub issue numbers are provided:
1. For each issue number, run `gh issue view {number} --json title,body,labels,assignees,comments`
2. Use the issue title, body, labels, and comments to inform your understanding of what work is expected

### Step 1: Analyze the Codebase

1. Study the tRPC router assembly (`server/routers.ts`) — all procedures for every resource
2. Study the database schema (`drizzle/schema.ts`) — tables, columns, and relations
3. Study a data-access module (`server/db.ts`) — Drizzle query functions for the beer catalog
4. Study the tRPC + Express setup (`server/_core/trpc.ts`, `server/_core/index.ts`, `server/_core/context.ts`)
5. Check `package.json` for backend dependencies (tRPC, Drizzle, PostgreSQL, Zod, jose)

## Output

Produce a scannable summary of what you learned:

- **Purpose**: What the data layer does
- **Tech Stack**: Express, tRPC, Drizzle ORM, PostgreSQL, Zod, jose (JWT), Google OAuth
- **Data Model**: Core tables (beer, style, brewery, menuCategory, wine, winery, varietal, location, user) and their relationships
- **Patterns**: Flat resource-based routers in `routers.ts`; query functions in `db.ts` / `db_wine.ts`; procedure types (publicProcedure, protectedProcedure, curatorProcedure, adminProcedure)
- **Mutations**: How writes flow from tRPC mutation → db function → Drizzle → PostgreSQL

Use bullet points. Keep it concise.
