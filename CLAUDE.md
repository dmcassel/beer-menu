# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Beer Menu is a full-stack web application for managing a craft beverage catalog — beers and wines. It supports browsing the public menu, managing inventory (beers with status on_tap/bottle_can/out, wines with cellar/refrigerator counts), and organizing items by style, brewery, menu category, and location. Authentication is Google OAuth, with role-based access (user, curator, admin).

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | Frontend UI |
| Wouter | Client-side routing |
| tRPC v11 | End-to-end type-safe API (client ↔ server) |
| TanStack Query | Server state / caching |
| Tailwind CSS v4 | Styling |
| shadcn/ui (Radix UI) | Component library |
| Express | HTTP server |
| Drizzle ORM | Database access |
| PostgreSQL | Database |
| Zod | Input validation (tRPC inputs) |
| Vite | Frontend bundler |
| Vitest | Testing |
| Docker / docker-compose | Local dev database and production deployment |
| Google Auth Library | OAuth sign-in |

---

## Commands

```bash
# Development (starts Express + Vite HMR together)
npm run dev

# Build for production
npm run build

# Type check
npm run check

# Format code
npm run format

# Run tests (requires test DB running)
npm test

# Start test database
npm run test:db:start

# Run tests with DB lifecycle managed automatically
npm run test:with-db

# Apply DB migrations (local)
npm run db:migrate

# Generate + apply migrations
npm run db:push
```

---

## Architecture

```
beer-menu/
├── client/src/         # React frontend
│   ├── pages/          # Route-level components (BeerBrowser, WinePage, Dashboard, etc.)
│   ├── components/     # Shared UI components (+ shadcn/ui components in components/ui/)
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React context providers (ThemeContext)
│   ├── lib/            # Client utilities (trpc.ts wires up the tRPC client)
│   └── _core/          # Framework-generated client plumbing
├── server/             # Express backend
│   ├── routers.ts      # All tRPC routes (the appRouter)
│   ├── db.ts           # Beer/menu DB query functions
│   ├── db_wine.ts      # Wine DB query functions
│   ├── db_additions.ts # Composite/filtered queries
│   ├── auth/           # Google OAuth handler
│   ├── storage.ts      # File storage
│   └── _core/          # Framework server plumbing (tRPC setup, context, env, etc.)
├── drizzle/            # Drizzle schema, migrations, relations
│   ├── schema.ts       # Canonical DB schema + TypeScript types
│   └── migrations/     # SQL migration files
├── shared/             # Code shared between client and server
│   ├── types.ts        # Re-exports schema types for client use
│   └── const.ts        # Shared constants
└── scripts/            # DB migration helper scripts
```

Data flows: React page → tRPC hook (via `@/lib/trpc`) → tRPC router (`server/routers.ts`) → DB function (`server/db.ts` or `server/db_wine.ts`) → PostgreSQL via Drizzle.

---

## Code Patterns

### tRPC procedures

Three permission levels are defined in `server/_core/trpc.ts`:
- `publicProcedure` — no auth required
- `protectedProcedure` — any authenticated user
- `curatorProcedure` — curator or admin role only
- `adminProcedure` — admin only

Read operations use `publicProcedure`; all writes use `curatorProcedure`.

### DB functions

All DB functions in `server/db.ts` and `server/db_wine.ts` follow the same pattern: call `getDb()`, guard against null (return empty/undefined for reads, throw for writes), then run the Drizzle query.

### Types

Schema types are defined in `drizzle/schema.ts` using `$inferSelect` / `$inferInsert` and re-exported from `shared/types.ts`. Import shared types via `@shared/types` on the client.

### Path aliases

| Alias | Resolves to |
|-------|------------|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

### Naming

- Files: `PascalCase` for components, `camelCase` for utilities and DB modules
- DB entity IDs use the pattern `{entityName}Id` (e.g., `beerId`, `menuCatId`)
- tRPC router keys mirror DB entity names (`beer`, `brewery`, `style`, `wine`, etc.)

---

## Testing

- **Run tests**: `npm test` (requires the test DB to be running first)
- **Test location**: `server/**/*.test.ts`
- **DB for tests**: separate PostgreSQL instance via docker-compose on port 5433, configured by `.env.test`
- Tests run sequentially (`fileParallelism: false`) because multiple test files share the database

---

## Validation

```bash
npm run check   # TypeScript type check
npm run format  # Prettier formatting
npm test        # Run tests (needs test DB)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | Canonical DB schema — all tables, enums, relations, and inferred types |
| `server/routers.ts` | All tRPC endpoints; the single source of truth for the API surface |
| `server/db.ts` | Beer/menu/user query functions |
| `server/db_wine.ts` | Wine query functions |
| `server/_core/trpc.ts` | tRPC init + procedure middleware (auth guards) |
| `server/_core/context.ts` | tRPC request context (user session resolution) |
| `client/src/lib/trpc.ts` | tRPC client setup |
| `client/src/App.tsx` | Route definitions |
| `shared/const.ts` | Shared constants (cookie name, error messages) |
| `.env.example` | Documents all required environment variables |

---

## On-Demand Context

| Topic | File |
|-------|------|
| Deployment | `DEPLOYMENT.md` |
| Google OAuth setup | `GOOGLE_AUTH_SETUP.md` |
| PostgreSQL setup | `POSTGRESQL_SETUP.md` |
| Test DB setup | `TEST_SETUP.md` |
| Docker setup | `Docker Setup for Beer Menu Application.md` |

---

## Notes

- Branch names must start with the GitHub issue number: `{issue-number}/{name}`
- Use `npm` (not pnpm or bun)
- The test DB runs on port 5433; production DB on 5432
- Beer status values: `on_tap`, `bottle_can`, `out`; only `on_tap` and `bottle_can` beers appear on the public menu
- User roles: `user` (read-only), `curator` (can create/edit/delete catalog items), `admin` (full access)

---

## GitHub Project Workflow

GitHub project: https://github.com/users/dmcassel/projects/1/views/1

### Worktrees

Use the user's existing worktree via `EnterWorktree`. Do not create a new worktree with `isolation: "worktree"`.

### Creating Stories (`/create-stories`)

After creating GitHub issues:
1. Add each issue to the GitHub project with status **"Todo"**
2. If more than one issue is created, also create an **Epic** issue:
   - Title prefix: `EPIC: `
   - Body includes links to all sub-issues
   - Add the Epic to the project with status **"Todo"**

### Planning (`/plan`)

After creating the plan file, move the GitHub issue to **"In Progress"** in the project.
If the issue belongs to an Epic, also move the Epic to **"In Progress"** (when the first sub-issue moves).

### After Implementing (`/implement`)

After implementation is complete:
1. Create a PR with `gh pr create`
2. Do **not** close the issue — leave it open until the PR is merged/closed

### Epic Completion

When the last sub-issue in an Epic is closed, close the Epic issue.

### GitHub Project CLI

Add an issue to the project:
```bash
gh project item-add 1 --owner dmcassel --url <issue-url>
```

Update an item's status (requires project ID, item ID, field ID, and option ID — look these up with `gh project field-list 1 --owner dmcassel` and `gh project item-list 1 --owner dmcassel --format json`).
