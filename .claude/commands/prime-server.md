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

1. Study the vertical feature slice (`src/features/polls/`) — models, schemas, repository, service, actions
2. Study the database setup (`src/core/database/`) — schema, client, migrations
3. Study the shared utilities (`src/shared/`)
4. Check `package.json` for backend dependencies (Drizzle, better-sqlite3, Zod, Pino)

## Output

Produce a scannable summary of what you learned:

- **Purpose**: What the data layer does
- **Tech Stack**: Next.js Server Actions, Drizzle ORM, SQLite (better-sqlite3), Zod, Pino
- **Data Model**: Core tables (polls, poll_options, votes) and their relationships
- **Patterns**: Vertical slice (models → schemas → repository → service → actions), error classes with HTTP status codes
- **Server Actions**: How mutations flow from UI → action → service → repository

Use bullet points. Keep it concise.
